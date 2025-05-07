const { Groq } = require("groq-sdk");
const User = require("../models/User");
const CalendarService = require("./calendar");

class ChatbotService {
  constructor() {
    this.groq = new Groq();
    this.calendarService = new CalendarService();
  }

  /**
   * Process a user message and determine the appropriate action
   * @param {string} userId - The ID of the user sending the message
   * @param {string} message - The message from the user
   * @returns {Promise<Object>} - The response to the user
   */
  async processMessage(userId, message) {
    try {
      // Get user from database
      const user = await User.findById(userId).select("-password");
      if (!user) {
        return { success: false, message: "User not found" };
      }

      // Analyze the intent of the message
      const intent = await this.analyzeIntent(message);

      // Process based on intent
      switch (intent.type) {
        case "create_meeting":
          return await this.createMeeting(user, intent.params);
        case "check_schedule":
          return await this.checkSchedule(user, intent.params);
        case "general_query":
        default:
          return await this.generateResponse(message);
      }
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
  async analyzeIntent(message) {
    try {
      const response = await this.groq.chat.completions.create({
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
            }`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "llama3-8b-8192",
        response_format: { type: "json_object" },
      });

      // Parse the JSON response
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
  async createMeeting(user, params) {
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

      // Format date and time for calendar API
      const startDateTime = new Date(`${params.date}T${params.time}:00`);
      const duration = params.duration || 30; // Default to 30 minutes
      const endDateTime = new Date(startDateTime.getTime() + duration * 60000);

      // Format event data based on calendar type
      let result;
      if (user.googleAccessToken) {
        // Create event in Google Calendar
        const eventData = {
          summary: params.title,
          description: params.description || "",
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          attendees: params.attendees || [],
        };

        result = await this.calendarService.createGoogleEvent(user, eventData);
      } else if (user.microsoftAccessToken) {
        // Create event in Microsoft Calendar
        const eventData = {
          subject: params.title,
          body: params.description || "",
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
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
        message: `Meeting "${params.title}" has been scheduled for ${params.date} at ${params.time}.`,
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
   * @returns {Promise<Object>} - The response to the user
   */
  async generateResponse(message) {
    try {
      const response = await this.groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are a helpful calendar assistant. You help users manage their schedule and answer questions about calendar functionality. 
            Keep your responses concise and focused on calendar-related topics. If you don't know something, say so.
            For creating meetings or checking schedules, ask for specific details like date, time, and attendees.`,
          },
          {
            role: "user",
            content: message,
          },
        ],
        model: "llama3-8b-8192",
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
}

module.exports = new ChatbotService();
