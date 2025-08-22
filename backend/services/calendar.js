const { google } = require("googleapis");
const axios = require("axios");

class CalendarService {
  /**
   * Get events from Google Calendar
   * @param {Object} user - The user object with Google OAuth tokens
   * @param {Object} options - Options for fetching events
   * @returns {Promise<Array>} - Array of events
   */
  async getGoogleEvents(user, options = {}) {
    try {
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
      const response = await calendar.events.list({
        calendarId: "primary",
        timeMin: options.timeMin || new Date().toISOString(),
        timeMax: options.timeMax,
        maxResults: options.maxResults || 50,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items;
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      throw error;
    }
  }

  /**
   * Get events from Microsoft Calendar
   * @param {Object} user - The user object with Microsoft OAuth tokens
   * @returns {Promise<Array>} - Array of events
   */
  async getMicrosoftEvents(user) {
    try {
      // Get events from Microsoft Graph API
      const response = await axios.get(
        "https://graph.microsoft.com/v1.0/me/events",
        {
          headers: {
            Authorization: `Bearer ${user.microsoftAccessToken}`,
          },
          params: {
            $top: 50,
            $orderby: "start/dateTime",
            $select: "subject,organizer,start,end,location,attendees",
          },
        }
      );

      return response.data.value;
    } catch (error) {
      console.error("Error fetching Microsoft Calendar events:", error);
      throw error;
    }
  }

  /**
   * Create an event in Google Calendar
   * @param {Object} user - The user object with Google OAuth tokens
   * @param {Object} eventData - The event data
   * @returns {Promise<Object>} - The created event
   */
  async createGoogleEvent(user, eventData) {
    try {
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

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Create event
      // Accept either ISO strings or structured {dateTime,timeZone}
      const startObj = typeof eventData.start === 'string' ? { dateTime: eventData.start, timeZone: eventData.timeZone || 'UTC' } : eventData.start;
      const endObj = typeof eventData.end === 'string' ? { dateTime: eventData.end, timeZone: eventData.timeZone || 'UTC' } : eventData.end;
      // Ensure end is after start (Google rejects empty/negative ranges)
      try {
        const s = new Date(startObj.dateTime);
        const e = new Date(endObj.dateTime);
        if (!(e > s)) {
          // Default to +30m if invalid
          const fixedEnd = new Date(s.getTime() + 30*60000);
          endObj.dateTime = fixedEnd.toISOString().substring(0,19);
        }
      } catch(_) {}
      const event = {
        summary: eventData.summary,
        description: eventData.description,
        start: startObj,
        end: endObj,
        attendees: eventData.attendees?.map((email) => ({ email })) || [],
      };

      const response = await calendar.events.insert({
        calendarId: "primary",
        resource: event,
        sendUpdates: "all",
      });

      return response.data;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  }

  /**
   * Create an event in Microsoft Calendar
   * @param {Object} user - The user object with Microsoft OAuth tokens
   * @param {Object} eventData - The event data
   * @returns {Promise<Object>} - The created event
   */
  async createMicrosoftEvent(user, eventData) {
    try {
      // Create event using Microsoft Graph API
      const startObj = typeof eventData.start === 'string' ? { dateTime: eventData.start, timeZone: eventData.timeZone || 'UTC' } : eventData.start;
      const endObj = typeof eventData.end === 'string' ? { dateTime: eventData.end, timeZone: eventData.timeZone || 'UTC' } : eventData.end;
      // Validate chronological order
      try {
        const s = new Date(startObj.dateTime);
        const e = new Date(endObj.dateTime);
        if (!(e > s)) {
          const fixedEnd = new Date(s.getTime() + 30*60000);
          endObj.dateTime = fixedEnd.toISOString().substring(0,19);
        }
      } catch(_) {}
      const event = {
        subject: eventData.subject,
        body: {
          contentType: "HTML",
          content: eventData.body,
        },
        start: startObj,
        end: endObj,
        attendees:
          eventData.attendees?.map((email) => ({
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

      return response.data;
    } catch (error) {
      console.error("Error creating Microsoft Calendar event:", error);
      throw error;
    }
  }
}

module.exports = CalendarService;
