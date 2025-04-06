import api from "./api";

// Google Calendar service for handling Google Calendar API operations
const googleCalendarService = {
  // Get all events from Google Calendar
  getEvents: async (params = {}) => {
    try {
      const response = await api.get("/calendar/google/events", { params });
      return response.data.events;
    } catch (error) {
      console.error("Error fetching Google Calendar events:", error);
      throw error;
    }
  },

  // Get events for a specific date range
  getEventsByDateRange: async (startDate, endDate) => {
    try {
      const params = {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
      };
      const response = await api.get("/calendar/google/events", { params });
      return response.data.events;
    } catch (error) {
      console.error(
        "Error fetching Google Calendar events by date range:",
        error
      );
      throw error;
    }
  },

  // Create a new event in Google Calendar
  createEvent: async (eventData) => {
    try {
      const response = await api.post("/calendar/google/events", eventData);
      return response.data;
    } catch (error) {
      console.error("Error creating Google Calendar event:", error);
      throw error;
    }
  },

  // Update an existing event in Google Calendar
  updateEvent: async (eventId, eventData) => {
    try {
      const response = await api.put(
        `/calendar/google/events/${eventId}`,
        eventData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating Google Calendar event:", error);
      throw error;
    }
  },

  // Delete an event from Google Calendar
  deleteEvent: async (eventId) => {
    try {
      const response = await api.delete(`/calendar/google/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting Google Calendar event:", error);
      throw error;
    }
  },
};

export default googleCalendarService;
