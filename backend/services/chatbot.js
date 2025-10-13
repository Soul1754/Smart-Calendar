const { Groq } = require("groq-sdk");
const User = require("../models/User");
const CalendarService = require("./calendar");

class ChatbotService {
  constructor() {
    // lazy GROQ client; created on first use so requiring the module won't fail when env vars are missing
    this.groq = null;
    this.calendarService = new CalendarService();
    // Model to use for GROQ requests. Can be overridden with env var GROQ_MODEL or per-request
    this.groqModel = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
    // In-memory session state: { intentType, params, createdAt, updatedAt }
    // NOTE: This resets on server restart; move to DB for persistence if needed.
    this.sessions = new Map();
    // Required meeting fields collected in order
    this.requiredMeetingFields = ["title", "date", "time", "attendees"];
  }

  // Returns a Groq client instance. If GROQ_API_KEY is missing, returns a proxy that throws with a clear message when used.
  getGroqClient() {
    if (this.groq) return this.groq;
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      this.groq = new Proxy(
        {},
        {
          get: () => {
            throw new Error(
              "GROQ_API_KEY is not set. Set GROQ_API_KEY in your environment to use chatbot features."
            );
          },
        }
      );
      return this.groq;
    }
    this.groq = new Groq({ apiKey });
    return this.groq;
  }

  /**
   * Process a user message and determine the appropriate action
   * @param {string} userId - The ID of the user sending the message
   * @param {string} message - The message from the user
   * @returns {Promise<Object>} - The response to the user
   */
  async processMessage(userId, message, options = {}) {
    try {
      // Get user from database
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Existing session (if any)
      const existingSession = this.sessions.get(userId);

      // Handle cancellation
      if (/^cancel$/i.test(message.trim())) {
        if (existingSession) this.sessions.delete(userId);
        return {
          success: true,
          message: "Meeting scheduling cancelled.",
          followUp: false,
        };
      }

      // If awaiting slot choice (alternative suggestions after conflict)
      if (
        existingSession &&
        existingSession.intentType === "create_meeting" &&
        existingSession.stage === "awaiting_slot_choice"
      ) {
        const choice = this.parseSlotChoice(
          message,
          existingSession.availableSlots || []
        );
        if (!choice) {
          return {
            success: true,
            followUp: true,
            message:
              "Please choose a slot by number (e.g. 1) or provide a time like 14:30.",
            availableSlots: existingSession.availableSlots,
          };
        }
        // Use local date/time components (avoid UTC shift in toISOString)
        const d = choice.start;
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const min = String(d.getMinutes()).padStart(2, "0");
        existingSession.params.date = `${yyyy}-${mm}-${dd}`;
        existingSession.params.time = `${hh}:${min}`;
        existingSession.stage = "collecting";
        const finalize = await this.finalizeMeetingCreation(
          user,
          existingSession,
          userId,
          { timezone: options.timezone }
        );
        return finalize;
      }

      // Analyze intent of current message (stateless extraction)
      const intent = await this.analyzeIntent(message, options.model);

      // Existing scheduling session follow-up (ignore reclassification unless user clearly asks schedule check)
      if (
        existingSession &&
        existingSession.intentType === "create_meeting" &&
        (intent.type !== "check_schedule" || existingSession.expected)
      ) {
        // Heuristic extraction for date/time
        const heuristic = this.heuristicExtractDateTime(message);
        if (heuristic.date && !intent.params?.date)
          intent.params = { ...(intent.params || {}), date: heuristic.date };
        if (heuristic.time && !intent.params?.time)
          intent.params = { ...(intent.params || {}), time: heuristic.time };
        // Interpret raw answer for expected field
        if (existingSession.expected) {
          const interpreted = this.interpretField(
            existingSession.expected,
            message
          );
          if (
            interpreted !== undefined &&
            interpreted !== null &&
            interpreted !== ""
          ) {
            intent.params = intent.params || {};
            intent.params[existingSession.expected] = interpreted;
          }
        }
        // Merge
        existingSession.params = this.mergeMeetingParams(
          existingSession.params,
          intent.params || {}
        );
        existingSession.updatedAt = Date.now();
        const { missing, normalized } = this.normalizeAndValidateMeetingParams(
          existingSession.params
        );
        existingSession.params = normalized;
        if (missing.length === 0) {
          const finalize = await this.finalizeMeetingCreation(
            user,
            existingSession,
            userId,
            { timezone: options.timezone }
          );
          return finalize;
        }
        const nextParam = missing[0];
        existingSession.expected = nextParam;
        const currentDate = new Date().toISOString().split("T")[0];
        const promptMap = {
          title: "What should the meeting be called?",
          date: `On which date? (e.g. ${currentDate} or "tomorrow")`,
          time: "What start time? (HH:MM, 24h or am/pm)",
          attendees: "Who should attend? Provide emails separated by commas.",
        };
        return {
          success: true,
          followUp: true,
          message: promptMap[nextParam] || `Please provide ${nextParam}.`,
          pending: missing,
          collectedParams: normalized,
        };
      }

      // Start of a new create_meeting intent
      if (intent.type === "create_meeting") {
        const initialParams = this.mergeMeetingParams({}, intent.params || {});
        const { missing, normalized } =
          this.normalizeAndValidateMeetingParams(initialParams);
        if (missing.length === 0) {
          // All provided – finalize (conflict check)
          const tempSession = {
            intentType: "create_meeting",
            params: normalized,
          };
          const result = await this.finalizeMeetingCreation(
            user,
            tempSession,
            userId,
            { transient: true, timezone: options.timezone }
          );
          return result;
        }
        // Store session for follow-up
        this.sessions.set(userId, {
          intentType: "create_meeting",
          params: normalized,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          stage: "collecting",
        });
        const nextParam = missing[0];
        const promptMap = {
          title: "What should the meeting be called?",
          date: 'On which date? (e.g. 2025-08-22 or "tomorrow")',
          time: "What start time? (HH:MM, 24h or am/pm)",
          attendees: "Who should attend? Provide emails separated by commas.",
        };
        const session = this.sessions.get(userId);
        if (session) session.expected = nextParam;
        return {
          success: true,
          followUp: true,
          message: promptMap[nextParam] || `Please provide ${nextParam}.`,
          pending: missing,
          collectedParams: normalized,
        };
      }

      // Check schedule intents are stateless
      if (intent.type === "check_schedule") {
        // Clear any stale meeting session
        if (existingSession) this.sessions.delete(userId);
        return await this.checkSchedule(user, intent.params);
      }

      // General query -> clear session if any
      if (existingSession) this.sessions.delete(userId);
      return await this.generateResponse(message, options.model);
    } catch (error) {
      console.error("Error processing message:", error);
      return {
        success: false,
        message: "Sorry, I encountered an error processing your request.",
      };
    }
  }

  /**
   * Analyze the intent of a user message using GROQ
   * @param {string} message - The message from the user
   * @returns {Promise<Object>} - The intent and parameters
   */
  async analyzeIntent(message, model = null) {
    try {
      const groqClient = this.getGroqClient();
      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are an AI assistant that helps users manage their calendar. 
            Analyze the user's message and determine if they want to:
            1. Create a meeting (create_meeting)
            2. Check their schedule (check_schedule)
            3. Ask a general question (general_query)
            
            For create_meeting, extract these parameters if present:
            - title: The title of the meeting
            - date: The date of the meeting (in YYYY-MM-DD format)
            - time: The time of the meeting (in HH:MM format)
            - duration: The duration in minutes (default to 30 if not specified)
            - attendees: Array of email addresses of attendees
            - description: Description of the meeting
            
            For check_schedule, extract these parameters if present:
            - date: The date to check (in YYYY-MM-DD format, default to today if not specified)
            - timeRange: The time range to check (e.g., "morning", "afternoon", "all day")
            
            Return your analysis as a JSON object with the following structure:
            {
              "type": "create_meeting" | "check_schedule" | "general_query",
              "params": {
                // Parameters based on the type
              }
            }
              Today's date is ${new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: model || this.groqModel,
        response_format: { type: "json_object" },
      }); // Parse the JSON response
      const content = response.choices[0].message.content;
      return JSON.parse(content);
    } catch (error) {
      console.error("Error analyzing intent:", error);
      // Default to general query if intent analysis fails
      return { type: "general_query", params: {} };
    }
  }

  /**
   * Create a meeting based on the extracted parameters
   * @param {Object} user - The user object
   * @param {Object} params - The parameters for the meeting
   * @returns {Promise<Object>} - The response to the user
   */
  async createMeeting(user, params, options = {}) {
    try {
      // Validate required parameters
      if (!params.title) {
        return {
          success: false,
          message: "Please provide a title for the meeting.",
        };
      }

      if (!params.date) {
        return {
          success: false,
          message: "Please provide a date for the meeting.",
        };
      }

      if (!params.time) {
        return {
          success: false,
          message: "Please provide a time for the meeting.",
        };
      }

      // Build local (naive) start/end strings without converting to UTC to avoid shifting
      const tz =
        options.timezone ||
        params.timezone ||
        Intl.DateTimeFormat().resolvedOptions().timeZone ||
        "UTC";
      const duration = params.duration || 30; // minutes
      const startLocal = `${params.date}T${params.time}:00`;
      // Derive end time by manual arithmetic on HH:MM to preserve local wall time
      const [sh, sm] = params.time.split(":").map((n) => parseInt(n, 10));
      const startTotal = sh * 60 + sm;
      const endTotal = startTotal + duration;
      const endDayOffset = Math.floor(endTotal / (24 * 60));
      const endMinutesInDay = endTotal % (24 * 60);
      const eh = Math.floor(endMinutesInDay / 60)
        .toString()
        .padStart(2, "0");
      const em = (endMinutesInDay % 60).toString().padStart(2, "0");
      let endDate = params.date;
      if (endDayOffset > 0) {
        // Simple next-day increment (rare for short meetings but handled)
        const dObj = new Date(params.date);
        dObj.setDate(dObj.getDate() + endDayOffset);
        endDate = dObj.toISOString().split("T")[0];
      }
      const endLocal = `${endDate}T${eh}:${em}:00`;

      // Format event data based on calendar type
      let result;
      if (user.googleAccessToken) {
        // Create event in Google Calendar
        const eventData = {
          summary: params.title,
          description: params.description || "",
          start: { dateTime: startLocal, timeZone: tz },
          end: { dateTime: endLocal, timeZone: tz },
          attendees: params.attendees || [],
        };

        result = await this.calendarService.createGoogleEvent(user, eventData);
      } else if (user.microsoftAccessToken) {
        // Create event in Microsoft Calendar
        const eventData = {
          subject: params.title,
          body: params.description || "",
          start: { dateTime: startLocal, timeZone: tz },
          end: { dateTime: endLocal, timeZone: tz },
          attendees: params.attendees || [],
        };

        result = await this.calendarService.createMicrosoftEvent(
          user,
          eventData
        );
      } else {
        return {
          success: false,
          message:
            "You need to connect a calendar service first. Please connect Google or Microsoft Calendar in your profile.",
        };
      }

      return {
        success: true,
        message: `Meeting "${params.title}" has been scheduled for ${params.date} at ${params.time} (${tz}).`,
        data: result,
      };
    } catch (error) {
      console.error("Error creating meeting:", error);
      return {
        success: false,
        message:
          "Sorry, I encountered an error creating the meeting. Please try again.",
      };
    }
  }

  /**
   * Check the user's schedule based on the extracted parameters
   * @param {Object} user - The user object
   * @param {Object} params - The parameters for checking the schedule
   * @returns {Promise<Object>} - The response to the user
   */
  async checkSchedule(user, params) {
    try {
      // Set default date to today if not provided
      const date = params.date || new Date().toISOString().split("T")[0];

      // Convert date to Date objects for API
      let startDate, endDate;
      try {
        startDate = new Date(`${date}T00:00:00`);
        endDate = new Date(`${date}T23:59:59`);

        // Validate that the dates are valid before proceeding
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          throw new Error("Invalid date format");
        }
      } catch (error) {
        console.error("Error parsing date:", error, "Date string:", date);
        // Use current date as fallback
        const today = new Date();
        const todayStr = today.toISOString().split("T")[0];
        startDate = new Date(`${todayStr}T00:00:00`);
        endDate = new Date(`${todayStr}T23:59:59`);
      }

      // Get events based on calendar type
      let events = [];
      if (user.googleAccessToken) {
        // Get events from Google Calendar
        events = await this.calendarService.getGoogleEvents(user, {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
        });
      } else if (user.microsoftAccessToken) {
        // Get events from Microsoft Calendar
        events = await this.calendarService.getMicrosoftEvents(user);

        // Filter events for the specified date
        events = events.filter((event) => {
          const eventDate = new Date(event.start.dateTime || event.start.date);
          return eventDate >= startDate && eventDate <= endDate;
        });
      } else {
        return {
          success: false,
          message:
            "You need to connect a calendar service first. Please connect Google or Microsoft Calendar in your profile.",
        };
      }

      // Filter events by time range if specified
      if (params.timeRange) {
        const timeRanges = {
          morning: { start: 0, end: 12 },
          afternoon: { start: 12, end: 17 },
          evening: { start: 17, end: 24 },
        };

        const range = timeRanges[params.timeRange.toLowerCase()];
        if (range) {
          events = events.filter((event) => {
            const eventTime = new Date(
              event.start.dateTime || event.start.date
            ).getHours();
            return eventTime >= range.start && eventTime < range.end;
          });
        }
      }

      // Format response
      if (events.length === 0) {
        // Use a properly formatted date for display
        const displayDate = new Date(startDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return {
          success: true,
          message: `You have no events scheduled for ${displayDate}${
            params.timeRange ? ` in the ${params.timeRange}` : ""
          }.`,
          data: { events },
        };
      } else {
        // Format events for display
        const formattedEvents = events.map((event) => {
          const startTime = new Date(event.start.dateTime || event.start.date);
          const endTime = new Date(event.end.dateTime || event.end.date);

          return {
            title: event.summary || event.subject,
            time: `${startTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })} - ${endTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}`,
            attendees: (event.attendees || []).length,
          };
        });

        // Use a properly formatted date for display
        const displayDate = new Date(startDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

        return {
          success: true,
          message: `You have ${events.length} event${
            events.length === 1 ? "" : "s"
          } scheduled for ${displayDate}${
            params.timeRange ? ` in the ${params.timeRange}` : ""
          }.`,
          data: { events: formattedEvents },
        };
      }
    } catch (error) {
      console.error("Error checking schedule:", error);
      return {
        success: false,
        message:
          "Sorry, I encountered an error checking your schedule. Please try again.",
      };
    }
  }

  /**
   * Generate a response for general queries
   * @param {string} message - The message from the user
   * @param {string} model - The model to use (optional)
   * @returns {Promise<Object>} - The response to the user
   */
  async generateResponse(message, model = null) {
    try {
      const groqClient = this.getGroqClient();
      const response = await groqClient.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful calendar assistant. You help users manage their schedule and answer questions about calendar functionality. 
      Keep your responses concise and focused on calendar-related topics. If you don't know something, say so.
      For creating meetings or checking schedules, ask for specific details like date, time, and attendees.
      Today's date is ${new Date().toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: model || this.groqModel,
        max_completion_tokens: 300,
      });

      return {
        success: true,
        message: response.choices[0].message.content,
      };
    } catch (error) {
      console.error("Error generating response:", error);
      return {
        success: false,
        message:
          "Sorry, I encountered an error generating a response. Please try again.",
      };
    }
  }

  // Merge meeting params giving precedence to newly extracted values
  mergeMeetingParams(existing, incoming) {
    return {
      ...existing,
      ...incoming,
      // Merge attendees array if both present
      attendees: this.mergeAttendees(existing.attendees, incoming.attendees),
    };
  }

  mergeAttendees(a, b) {
    const listA = Array.isArray(a) ? a : [];
    const listB = Array.isArray(b) ? b : [];
    const set = new Set([...listA, ...listB].filter(Boolean));
    return Array.from(set);
  }

  // Normalize params (parse time formats like '2pm') and identify missing required fields
  normalizeAndValidateMeetingParams(params) {
    const normalized = { ...params };
    // Normalize date (YYYY-MM-DD) if possible
    if (normalized.date) {
      const d = new Date(normalized.date);
      if (!isNaN(d.getTime())) {
        normalized.date = d.toISOString().split("T")[0];
      }
    }
    // Normalize time: allow '2pm', '2:30 pm', '14:00'
    if (normalized.time) {
      const timeStr = String(normalized.time).trim().toLowerCase();
      const time24 = this.to24Hour(timeStr);
      if (time24) normalized.time = time24; // HH:MM
    }
    // Normalize attendees (string -> array)
    if (normalized.attendees && !Array.isArray(normalized.attendees)) {
      if (typeof normalized.attendees === "string") {
        normalized.attendees = this.extractEmails(normalized.attendees);
      } else {
        normalized.attendees = [];
      }
    }
    // Ensure duration int
    if (normalized.duration) {
      const dur = parseInt(normalized.duration, 10);
      if (!isNaN(dur) && dur > 0 && dur < 24 * 60) normalized.duration = dur;
      else delete normalized.duration;
    }
    const required = this.requiredMeetingFields;
    const missing = required.filter(
      (r) =>
        !normalized[r] ||
        (r === "attendees" &&
          (!normalized.attendees || normalized.attendees.length === 0))
    );
    return { missing, normalized };
  }

  to24Hour(t) {
    // Already HH:MM 24h
    if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(t)) return t;
    // H or H:MM with am/pm
    const m = t.match(/^(\d{1,2})(:(\d{2}))?\s*(am|pm)?$/);
    if (!m) return null;
    let hour = parseInt(m[1], 10);
    let minute = m[3] ? parseInt(m[3], 10) : 0;
    const suffix = m[4];
    if (suffix === "pm" && hour < 12) hour += 12;
    if (suffix === "am" && hour === 12) hour = 0;
    if (hour > 23 || minute > 59) return null;
    return `${hour.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}`;
  }

  // Attempt to parse natural date/time expressions from free-form follow-up
  heuristicExtractDateTime(text) {
    const lower = text.trim().toLowerCase();
    const out = {};
    // Relative keywords
    const now = new Date();
    if (/^today$/.test(lower)) out.date = now.toISOString().split("T")[0];
    else if (/^tomorrow$/.test(lower)) {
      const d = new Date(now.getTime() + 86400000);
      out.date = d.toISOString().split("T")[0];
    } else {
      // Weekday names (next occurrence)
      const weekdays = [
        "sunday",
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
      ];
      if (weekdays.includes(lower)) {
        const target = weekdays.indexOf(lower);
        const diff = (target - now.getDay() + 7) % 7 || 7; // next occurrence (not today)
        const d = new Date(now.getTime() + diff * 86400000);
        out.date = d.toISOString().split("T")[0];
      }
    }
    // Date patterns like 2025-08-23, 23-08-2025, 23/08/2025, 23 Aug, Aug 23, August 23 2025
    if (!out.date) {
      const isoMatch = text.match(/(\d{4}-\d{2}-\d{2})/);
      if (isoMatch) out.date = isoMatch[1];
    }
    if (!out.date) {
      const dmy = text.match(/\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{2,4})\b/);
      if (dmy) {
        let [, dd, mm, yyyy] = dmy;
        if (yyyy.length === 2) yyyy = "20" + yyyy; // naive
        const day = dd.padStart(2, "0");
        const month = mm.padStart(2, "0");
        if (parseInt(day) <= 31 && parseInt(month) <= 12)
          out.date = `${yyyy}-${month}-${day}`;
      }
    }
    if (!out.date) {
      const monthNames = [
        "january",
        "february",
        "march",
        "april",
        "may",
        "june",
        "july",
        "august",
        "september",
        "october",
        "november",
        "december",
      ];
      const monthRegex = new RegExp(`\\b(${monthNames.join("|")})\\b`, "i");
      const mMatch = text.match(monthRegex);
      if (mMatch) {
        const monthIndex = monthNames.indexOf(mMatch[1].toLowerCase());
        const dayMatch = text.match(/\b(\d{1,2})(st|nd|rd|th)?\b/);
        let yearMatch = text.match(/\b(20\d{2})\b/);
        if (dayMatch) {
          const day = dayMatch[1].padStart(2, "0");
          const year = yearMatch ? yearMatch[1] : String(now.getFullYear());
          const month = String(monthIndex + 1).padStart(2, "0");
          out.date = `${year}-${month}-${day}`;
        }
      }
    }
    // Time extraction if message contains time
    const timeMatch =
      text.match(/\b(\d{1,2})(:(\d{2}))?\s*(am|pm)\b/i) ||
      text.match(/\b([01]?\d|2[0-3]):[0-5]\d\b/);
    if (timeMatch) {
      const timeRaw = timeMatch[0];
      const t24 = this.to24Hour(timeRaw.toLowerCase());
      if (t24) out.time = t24;
    }
    return out;
  }
  interpretField(field, raw) {
    const value = raw.trim();
    switch (field) {
      case "title":
        return value;
      case "date": {
        const h = this.heuristicExtractDateTime(value);
        return h.date || value;
      }
      case "time": {
        const h = this.heuristicExtractDateTime(value);
        return h.time || value;
      }
      case "attendees":
        return this.extractEmails(value);
      default:
        return value;
    }
  }
  extractEmails(text) {
    const emails = (
      text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || []
    ).map((e) => e.toLowerCase());
    return Array.from(new Set(emails));
  }
  async finalizeMeetingCreation(user, session, userId, options = {}) {
    const params = session.params;
    // Construct start as Date in local timezone context but also retain original components
    const startLocalString = `${params.date}T${params.time}:00`;
    const start = new Date(startLocalString);
    if (isNaN(start.getTime())) {
      session.stage = "collecting";
      session.expected = "date";
      return {
        success: true,
        followUp: true,
        message:
          "I could not parse that date/time. Please provide date (YYYY-MM-DD).",
        pending: ["date", "time"],
      };
    }
    const duration = params.duration || 30;
    const end = new Date(start.getTime() + duration * 60000);
    const conflicts = await this.detectConflicts(user, start, end);
    if (conflicts.length) {
      const alternatives = this.generateAlternativeSlots(
        conflicts,
        start,
        duration
      );
      if (alternatives.length) {
        session.stage = "awaiting_slot_choice";
        session.availableSlots = alternatives.map((slot, idx) => ({
          index: idx + 1,
          start: slot.start,
          end: slot.end,
          label: this.friendlySlotLabel(slot.start, slot.end),
          score: slot.score,
        }));
        return {
          success: true,
          followUp: true,
          message: `That time conflicts. Choose a slot: ${session.availableSlots
            .map((s) => `${s.index}) ${s.label}`)
            .join("  ")}`,
          availableSlots: session.availableSlots,
        };
      }
      return {
        success: false,
        message:
          "Requested time conflicts and no alternatives found (business hours 09:00-17:00).",
      };
    }
    const creationResult = await this.createMeeting(user, params, {
      timezone: options.timezone,
    });
    if (!options.transient) this.sessions.delete(userId);
    return { ...creationResult, followUp: false };
  }
  async detectConflicts(user, start, end) {
    try {
      let events = [];
      if (user.googleAccessToken) {
        events = await this.calendarService.getGoogleEvents(user, {
          timeMin: new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate()
          ).toISOString(),
          timeMax: new Date(
            start.getFullYear(),
            start.getMonth(),
            start.getDate(),
            23,
            59,
            59
          ).toISOString(),
        });
      } else if (user.microsoftAccessToken) {
        events = await this.calendarService.getMicrosoftEvents(user);
      }
      return events.filter((ev) => {
        const evStart = new Date(ev.start?.dateTime || ev.start?.date);
        const evEnd = new Date(ev.end?.dateTime || ev.end?.date);
        return evStart < end && evEnd > start;
      });
    } catch (e) {
      console.error("Conflict detection failed", e);
      return [];
    }
  }
  generateAlternativeSlots(conflicts, desiredStart, duration) {
    const dayStart = new Date(desiredStart);
    dayStart.setHours(9, 0, 0, 0);
    const dayEnd = new Date(desiredStart);
    dayEnd.setHours(17, 0, 0, 0);
    const busy = conflicts.map((ev) => ({
      start: new Date(ev.start?.dateTime || ev.start?.date),
      end: new Date(ev.end?.dateTime || ev.end?.date),
    }));
    busy.push({
      start: desiredStart,
      end: new Date(desiredStart.getTime() + duration * 60000),
    });
    busy.sort((a, b) => a.start - b.start);
    const merged = [];
    for (const slot of busy) {
      if (!merged.length) {
        merged.push(slot);
        continue;
      }
      const last = merged[merged.length - 1];
      if (slot.start <= last.end) {
        if (slot.end > last.end) last.end = slot.end;
      } else merged.push(slot);
    }
    const free = [];
    let cursor = dayStart;
    for (const b of merged) {
      if (b.end <= dayStart || b.start >= dayEnd) continue;
      if (b.start > cursor)
        free.push({
          start: new Date(cursor),
          end: new Date(Math.min(b.start, dayEnd)),
        });
      if (b.end > cursor) cursor = new Date(Math.max(b.end, cursor));
      if (cursor >= dayEnd) break;
    }
    if (cursor < dayEnd)
      free.push({ start: new Date(cursor), end: new Date(dayEnd) });
    const candidates = [];
    const step = 30 * 60000;
    for (const f of free) {
      let s = new Date(f.start);
      while (s.getTime() + duration * 60000 <= f.end.getTime()) {
        const e = new Date(s.getTime() + duration * 60000);
        candidates.push({ start: new Date(s), end: e });
        s = new Date(s.getTime() + step);
      }
    }
    const midday = 13;
    return candidates
      .map((c) => {
        const diff = Math.abs(c.start - desiredStart) / 3600000;
        const midDiff = Math.abs(
          c.start.getHours() + c.start.getMinutes() / 60 - midday
        );
        const score =
          (1 / (1 + diff)) * 0.6 + (1 - Math.min(midDiff / 8, 1)) * 0.4;
        return { ...c, score: Number(score.toFixed(3)) };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
  }
  parseSlotChoice(message, slots) {
    if (!slots.length) return null;
    const num = message.trim().match(/^([1-9])$/);
    if (num) {
      const idx = parseInt(num[1], 10) - 1;
      return slots[idx];
    }
    const h = this.heuristicExtractDateTime(message);
    if (h.time) {
      return (
        slots.find((s) => s.start.toISOString().substring(11, 16) === h.time) ||
        null
      );
    }
    return null;
  }
  friendlySlotLabel(start, end) {
    return `${start.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}-${end.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  }
}

module.exports = new ChatbotService();
