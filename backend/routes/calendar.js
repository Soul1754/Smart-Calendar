const express = require("express");
const router = express.Router();
const { google } = require("googleapis");
const axios = require("axios");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware to verify JWT token
const auth = async (req, res, next) => {
  try {
    // Get token from header
    const token = req.header("x-auth-token");
    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your_jwt_secret"
    );

    // Add user to request
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return res.status(404).json({ message: "User not found" });
    }

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(401).json({ message: "Token is not valid" });
  }
};

// Get Google Calendar events
router.get("/google/events", auth, async (req, res) => {
  try {
    const user = req.user;

    console.log("Google events request from user:", user.email);
    console.log("Has Google token:", !!user.googleAccessToken);

    if (!user.googleAccessToken) {
      console.log("Google Calendar not connected for user:", user.email);
      return res
        .status(400)
        .json({ message: "Google Calendar not connected", events: [] });
    }

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "/auth/google/callback"
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Set up token refresh handler
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.refresh_token) {
        // Store the new refresh token
        user.googleRefreshToken = tokens.refresh_token;
      }
      // Always update the access token
      if (tokens.access_token) {
        user.googleAccessToken = tokens.access_token;
        await user.save();
        console.log("Google tokens refreshed and saved to user account");
      }
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Get events from primary calendar
    const { timeMin, timeMax } = req.query;
    const queryTimeMin = timeMin || new Date().toISOString();
    const queryTimeMax = timeMax;

    console.log("Fetching Google events with params:", {
      timeMin: queryTimeMin,
      timeMax: queryTimeMax,
    });

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: queryTimeMin,
      timeMax: queryTimeMax,
      maxResults: 100,
      singleEvents: true,
      orderBy: "startTime",
    });

    // If we get here, the token is valid

    const events = response.data.items || [];
    console.log("Google Calendar API returned", events.length, "events");
    res.json({ events });
  } catch (error) {
    console.error("Google Calendar error:", error);
    console.error("Error details:", error.message);

    // Check if it's an authentication error
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        message:
          "Authentication failed. Please reconnect your Google Calendar.",
        events: [],
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Get Microsoft Calendar events
router.get("/microsoft/events", auth, async (req, res) => {
  try {
    const user = req.user;

    console.log("Microsoft events request from user:", user.email);
    console.log("Has Microsoft token:", !!user.microsoftAccessToken);

    if (!user.microsoftAccessToken) {
      console.log("Microsoft Calendar not connected for user:", user.email);
      return res
        .status(400)
        .json({ message: "Microsoft Calendar not connected", events: [] });
    }

    // Get events from Microsoft Graph API
    const { timeMin, timeMax } = req.query;

    const params = {
      $top: 100,
      $orderby: "start/dateTime",
      $select: "subject,organizer,start,end,location,attendees",
    };

    if (timeMin) {
      params.$filter = `start/dateTime ge '${timeMin}'`;
      if (timeMax) {
        params.$filter += ` and start/dateTime le '${timeMax}'`;
      }
    }

    console.log("Fetching Microsoft events with params:", params);

    const response = await axios.get(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        headers: {
          Authorization: `Bearer ${user.microsoftAccessToken}`,
        },
        params,
      }
    );

    const events = response.data.value || [];
    console.log("Microsoft Graph API returned", events.length, "events");
    res.json({ events });
  } catch (error) {
    console.error("Microsoft Calendar error:", error);
    console.error("Error details:", error.message);
    res.status(500).json({ message: "Server error", events: [] });
  }
});

// Create event in Google Calendar
router.post("/google/events", auth, async (req, res) => {
  try {
    const user = req.user;
    const { summary, description, location, start, end, attendees } = req.body;

    console.log("Create Google event request:", {
      user: user.email,
      summary,
      hasToken: !!user.googleAccessToken,
      startData: start,
      endData: end,
    });

    if (!user.googleAccessToken) {
      return res.status(400).json({ message: "Google Calendar not connected" });
    }

    // Set up Google Calendar API
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "/auth/google/callback"
    );

    oauth2Client.setCredentials({
      access_token: user.googleAccessToken,
      refresh_token: user.googleRefreshToken,
    });

    // Set up token refresh handler
    oauth2Client.on("tokens", async (tokens) => {
      if (tokens.refresh_token) {
        // Store the new refresh token
        user.googleRefreshToken = tokens.refresh_token;
      }
      // Always update the access token
      if (tokens.access_token) {
        user.googleAccessToken = tokens.access_token;
        await user.save();
        console.log("Google tokens refreshed and saved to user account");
      }
    });

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Extract dateTime strings properly
    const startDateTime =
      typeof start === "string" ? start : start?.dateTime || start;
    const endDateTime = typeof end === "string" ? end : end?.dateTime || end;

    // Create event
    const event = {
      summary,
      description,
      location,
      start: {
        dateTime: startDateTime,
        timeZone: start?.timeZone || "UTC",
      },
      end: {
        dateTime: endDateTime,
        timeZone: end?.timeZone || "UTC",
      },
      attendees: attendees?.map((email) => ({ email })) || [],
    };

    console.log(
      "Sending event to Google Calendar API:",
      JSON.stringify(event, null, 2)
    );

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

    console.log("Event created successfully:", response.data.id);
    res.status(201).json({ event: response.data });
  } catch (error) {
    console.error("Google Calendar create event error:", error);
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        message:
          "Authentication failed. Please reconnect your Google Calendar.",
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Create event in Microsoft Calendar
router.post("/microsoft/events", auth, async (req, res) => {
  try {
    const user = req.user;
    const { subject, body, start, end, attendees } = req.body;

    if (!user.microsoftAccessToken) {
      return res
        .status(400)
        .json({ message: "Microsoft Calendar not connected" });
    }

    // Create event using Microsoft Graph API
    const event = {
      subject,
      body: {
        contentType: "HTML",
        content: body,
      },
      start: {
        dateTime: start,
        timeZone: "UTC",
      },
      end: {
        dateTime: end,
        timeZone: "UTC",
      },
      attendees:
        attendees?.map((email) => ({
          emailAddress: {
            address: email,
          },
          type: "required",
        })) || [],
    };

    const response = await axios.post(
      "https://graph.microsoft.com/v1.0/me/events",
      event,
      {
        headers: {
          Authorization: `Bearer ${user.microsoftAccessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    res.status(201).json({ event: response.data });
  } catch (error) {
    console.error("Microsoft Calendar create event error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Unified availability finder (Google + Microsoft)
// POST /unified/findAvailableSlots
// Body: { date: ISODateString, duration: minutes, attendees: [string|{email,provider}], businessHours?: {start,end}, incrementMinutes?: number, maxResults?: number }
router.post("/unified/findAvailableSlots", auth, async (req, res) => {
  try {
    const user = req.user;
    const {
      date,
      duration,
      attendees = [],
      businessHours = { start: 9, end: 17 },
      incrementMinutes = 30,
      maxResults = 6,
    } = req.body;

    if (!date || !duration) {
      return res.status(400).json({ message: "date and duration required" });
    }
    const durationMs = parseInt(duration, 10) * 60000;
    if (isNaN(durationMs) || durationMs <= 0) {
      return res.status(400).json({ message: "Invalid duration" });
    }

    // Normalize attendees into { email, provider }
    const normAttendees = attendees
      .map((a) => {
        if (typeof a === "string")
          return { email: a.trim(), provider: detectProvider(a.trim()) };
        const email = a.email?.trim();
        const prov =
          !a.provider || a.provider === "auto"
            ? detectProvider(email)
            : a.provider;
        return { email, provider: prov };
      })
      .filter((a) => a.email);

    const targetDate = new Date(date);
    if (isNaN(targetDate))
      return res.status(400).json({ message: "Invalid date" });

    const dayStart = new Date(targetDate);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(targetDate);
    dayEnd.setHours(23, 59, 59, 999);

    const bizStart = new Date(targetDate);
    bizStart.setHours(businessHours.start ?? 9, 0, 0, 0);
    const bizEnd = new Date(targetDate);
    bizEnd.setHours(businessHours.end ?? 17, 0, 0, 0);
    if (bizEnd <= bizStart)
      return res.status(400).json({ message: "businessHours invalid" });

    const busySlots = [];
    const inaccessible = { google: [], microsoft: [] };
    const unreachable = []; // detailed reasons

    // GOOGLE free/busy for organizer + google attendees
    if (user.googleAccessToken) {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        "/auth/google/callback"
      );
      oauth2Client.setCredentials({
        access_token: user.googleAccessToken,
        refresh_token: user.googleRefreshToken,
      });
      const calendar = google.calendar({ version: "v3", auth: oauth2Client });
      // Only include explicit google provider emails; skip unknown to avoid 400 errors
      const googleEmails = normAttendees
        .filter((a) => a.provider === "google")
        .map((a) => a.email);
      const items = [
        { id: "primary" },
        ...googleEmails.map((e) => ({ id: e })),
      ];
      try {
        const fb = await calendar.freebusy.query({
          requestBody: {
            timeMin: dayStart.toISOString(),
            timeMax: dayEnd.toISOString(),
            items,
          },
        });
        const calendars = fb.data.calendars || {};
        for (const [calId, data] of Object.entries(calendars)) {
          if (data.errors) {
            if (calId !== "primary") inaccessible.google.push(calId);
            if (calId !== "primary")
              unreachable.push({
                email: calId,
                attempted: ["google"],
                reason: "Google freeBusy error",
              });
            continue;
          }
          (data.busy || []).forEach((b) =>
            busySlots.push({ start: b.start, end: b.end })
          );
        }
      } catch (e) {
        console.error(
          "Google freeBusy error (gracefully continuing):",
          e?.response?.data || e?.message || e
        );
        // mark all attempted google emails as unreachable instead of failing entire request
        googleEmails.forEach((email) => {
          inaccessible.google.push(email);
          unreachable.push({
            email,
            attempted: ["google"],
            reason: "freeBusy request failed",
          });
        });
      }
    } else if (normAttendees.some((a) => a.provider === "google")) {
      // Organizer lacks Google token but google attendees listed
      normAttendees
        .filter((a) => a.provider === "google")
        .forEach((a) => {
          inaccessible.google.push(a.email);
          unreachable.push({
            email: a.email,
            attempted: ["google"],
            reason: "Organizer missing Google token",
          });
        });
    }

    // MICROSOFT organizer events (cannot read other MS attendees without extra permissions)
    if (user.microsoftAccessToken) {
      try {
        const msEventsResp = await axios.get(
          "https://graph.microsoft.com/v1.0/me/calendarView",
          {
            params: {
              startDateTime: dayStart.toISOString(),
              endDateTime: dayEnd.toISOString(),
              $top: 200,
              $select: "start,end",
            },
            headers: { Authorization: `Bearer ${user.microsoftAccessToken}` },
          }
        );
        (msEventsResp.data.value || []).forEach((ev) => {
          if (ev.start?.dateTime && ev.end?.dateTime) {
            busySlots.push({ start: ev.start.dateTime, end: ev.end.dateTime });
          }
        });
      } catch (e) {
        console.error("Microsoft events fetch error:", e?.message || e);
      }
      // Attempt getSchedule for microsoft + unknown attendees
      const msSchedEmails = normAttendees
        .filter((a) => a.provider === "microsoft" || a.provider === "unknown")
        .map((a) => a.email);
      if (msSchedEmails.length) {
        try {
          const scheduleResp = await axios.post(
            "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
            {
              schedules: msSchedEmails,
              startTime: { dateTime: dayStart.toISOString(), timeZone: "UTC" },
              endTime: { dateTime: dayEnd.toISOString(), timeZone: "UTC" },
              availabilityViewInterval: incrementMinutes,
            },
            {
              headers: { Authorization: `Bearer ${user.microsoftAccessToken}` },
            }
          );
          const value = scheduleResp.data.value || [];
          value.forEach((v) => {
            if (v.scheduleItems) {
              v.scheduleItems.forEach((item) => {
                if (item.start?.dateTime && item.end?.dateTime) {
                  busySlots.push({
                    start: item.start.dateTime,
                    end: item.end.dateTime,
                  });
                }
              });
            } else {
              unreachable.push({
                email: v.scheduleId,
                attempted: ["microsoft"],
                reason: "No schedule items returned",
              });
            }
          });
          // Mark those without any scheduleItems as inaccessible
          msSchedEmails.forEach((email) => {
            if (
              !value.find(
                (v) =>
                  v.scheduleId === email &&
                  v.scheduleItems &&
                  v.scheduleItems.length
              )
            ) {
              inaccessible.microsoft.push(email);
            }
          });
        } catch (e) {
          console.error(
            "Microsoft getSchedule error:",
            e?.response?.data || e?.message || e
          );
          msSchedEmails.forEach((email) => {
            inaccessible.microsoft.push(email);
            unreachable.push({
              email,
              attempted: ["microsoft"],
              reason: "getSchedule failed",
            });
          });
        }
      }
    } else if (normAttendees.some((a) => a.provider === "microsoft")) {
      normAttendees
        .filter((a) => a.provider === "microsoft")
        .forEach((a) => {
          inaccessible.microsoft.push(a.email);
          unreachable.push({
            email: a.email,
            attempted: ["microsoft"],
            reason: "Organizer missing Microsoft token",
          });
        });
    }

    if (!user.googleAccessToken && !user.microsoftAccessToken) {
      return res.status(400).json({
        message: "No connected calendar (Google or Microsoft) for organizer",
      });
    }

    // Normalize and merge busy slots
    const normalizedBusy = busySlots
      .map((b) => ({
        start: new Date(b.start),
        end: new Date(b.end),
      }))
      .filter((b) => !isNaN(b.start) && !isNaN(b.end) && b.end > b.start);

    const mergedBusy = mergeBusy(normalizedBusy);
    const availableRaw = computeAvailable(
      bizStart,
      bizEnd,
      mergedBusy,
      durationMs,
      incrementMinutes * 60000
    );

    // Score: prefer slots centered near 13:00 (1 PM)
    const scored = availableRaw
      .map((slot) => {
        const midpoint = new Date(
          (slot.start.getTime() + slot.end.getTime()) / 2
        );
        const hour = midpoint.getHours() + midpoint.getMinutes() / 60;
        const distance = Math.abs(hour - 13);
        const score = Math.max(0, 1 - distance / 8); // linear decay over 8h
        return {
          startTimeISO: slot.start.toISOString(),
          endTimeISO: slot.end.toISOString(),
          startTime: formatFriendly(slot.start),
          endTime: formatFriendly(slot.end),
          score: Number(score.toFixed(3)),
        };
      })
      .sort(
        (a, b) =>
          b.score - a.score ||
          new Date(a.startTimeISO) - new Date(b.startTimeISO)
      )
      .slice(0, maxResults);

    res.json({
      date: targetDate.toISOString().split("T")[0],
      durationMinutes: duration,
      availableSlots: scored,
      unavailableAttendees: {
        google: inaccessible.google.length ? inaccessible.google : undefined,
        microsoft: inaccessible.microsoft.length
          ? inaccessible.microsoft
          : undefined,
      },
      unreachable: unreachable.length ? unreachable : undefined,
    });
  } catch (error) {
    console.error("Unified availability error:", error);
    res.status(500).json({ message: "Failed to compute availability" });
  }
});

// Helper: detect provider from email
function detectProvider(email) {
  const lower = (email || "").toLowerCase();
  if (/@(gmail\.com|googlemail\.com)$/.test(lower)) return "google";
  if (
    /@(outlook\.com|hotmail\.com|live\.com|office365\.com|microsoft\.com)$/.test(
      lower
    )
  )
    return "microsoft";
  return "unknown";
}

// Merge overlapping busy intervals
function mergeBusy(busy) {
  if (!busy.length) return [];
  const sorted = [...busy].sort((a, b) => a.start - b.start);
  const merged = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const curr = sorted[i];
    const last = merged[merged.length - 1];
    if (curr.start <= last.end) {
      if (curr.end > last.end) last.end = curr.end;
    } else {
      merged.push(curr);
    }
  }
  return merged;
}

// Compute available slots given merged busy intervals
function computeAvailable(
  windowStart,
  windowEnd,
  busyMerged,
  durationMs,
  stepMs
) {
  const freeBlocks = [];
  let cursor = new Date(windowStart);
  for (const b of busyMerged) {
    if (b.end <= windowStart || b.start >= windowEnd) continue;
    if (b.start > cursor) {
      freeBlocks.push({
        start: new Date(cursor),
        end: new Date(Math.min(b.start.getTime(), windowEnd.getTime())),
      });
    }
    if (b.end > cursor)
      cursor = new Date(Math.max(b.end.getTime(), cursor.getTime()));
    if (cursor >= windowEnd) break;
  }
  if (cursor < windowEnd)
    freeBlocks.push({ start: new Date(cursor), end: new Date(windowEnd) });

  const slots = [];
  for (const block of freeBlocks) {
    let slotStart = new Date(block.start);
    while (slotStart.getTime() + durationMs <= block.end.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + durationMs);
      slots.push({ start: new Date(slotStart), end: slotEnd });
      slotStart = new Date(slotStart.getTime() + stepMs);
    }
  }
  return slots;
}

// Format time friendly string
function formatFriendly(d) {
  let h = d.getHours();
  const m = d.getMinutes();
  const am = h < 12;
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${am ? "AM" : "PM"}`;
}

module.exports = router;
