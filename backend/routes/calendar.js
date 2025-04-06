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

    // Get events from primary calendar
    const { timeMin, timeMax } = req.query;
    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: timeMin || new Date().toISOString(),
      timeMax: timeMax,
      maxResults: 50,
      singleEvents: true,
      orderBy: "startTime",
    });

    // If we get here, the token is valid

    const events = response.data.items;
    res.json({ events });
  } catch (error) {
    console.error("Google Calendar error:", error);

    // Check if it's an authentication error
    if (error.response && error.response.status === 401) {
      return res.status(401).json({
        message:
          "Authentication failed. Please reconnect your Google Calendar.",
      });
    }

    res.status(500).json({ message: "Server error" });
  }
});

// Get Microsoft Calendar events
router.get("/microsoft/events", auth, async (req, res) => {
  try {
    const user = req.user;

    if (!user.microsoftAccessToken) {
      return res
        .status(400)
        .json({ message: "Microsoft Calendar not connected" });
    }

    // Get events from Microsoft Graph API
    const response = await axios.get(
      "https://graph.microsoft.com/v1.0/me/events",
      {
        headers: {
          Authorization: `Bearer ${user.microsoftAccessToken}`,
        },
        params: {
          $top: 10,
          $orderby: "start/dateTime",
          $select: "subject,organizer,start,end,location",
        },
      }
    );

    const events = response.data.value;
    res.json({ events });
  } catch (error) {
    console.error("Microsoft Calendar error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Create event in Google Calendar
router.post("/google/events", auth, async (req, res) => {
  try {
    const user = req.user;
    const { summary, description, start, end, attendees } = req.body;

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

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    // Create event
    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: "UTC",
      },
      end: {
        dateTime: end,
        timeZone: "UTC",
      },
      attendees: attendees?.map((email) => ({ email })) || [],
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
      sendUpdates: "all",
    });

    res.status(201).json({ event: response.data });
  } catch (error) {
    console.error("Google Calendar create event error:", error);
    res.status(500).json({ message: "Server error" });
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

module.exports = router;
