import axios from "axios";

const API_URL = "http://localhost:5001";

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token in requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["x-auth-token"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Authentication service
export const authService = {
  // Register a new user
  register: async (userData) => {
    const response = await api.post("/auth/register", userData);
    return response.data;
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login", credentials);
    return response.data;
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await api.get("/auth/me");
    return response.data;
  },

  // OAuth URLs
  getGoogleAuthUrl: () => `${API_URL}/auth/google`,
  getMicrosoftAuthUrl: () => `${API_URL}/auth/microsoft`,

  // Disconnect calendar
  disconnectCalendar: async (calendarId) => {
    const response = await api.post("/auth/disconnect", { calendarId });
    return response.data;
  },

  // Update user preferences
  updateUserPreferences: async (preferences) => {
    const response = await api.put("/auth/preferences", preferences);
    return response.data;
  },
};

// Calendar service
export const calendarService = {
  // Get Google Calendar events
  getGoogleEvents: async () => {
    const response = await api.get("/api/calendar/google/events");
    return response.data;
  },

  // Get Microsoft Calendar events
  getMicrosoftEvents: async () => {
    const response = await api.get("/api/calendar/microsoft/events");
    return response.data;
  },

  // Create Google Calendar event
  createGoogleEvent: async (eventData) => {
    const response = await api.post("/api/calendar/google/events", eventData);
    return response.data;
  },

  // Create Microsoft Calendar event
  createMicrosoftEvent: async (eventData) => {
    const response = await api.post(
      "/api/calendar/microsoft/events",
      eventData
    );
    return response.data;
  },
};

// Chatbot service
export const chatbotService = {
  // Send message to chatbot
  sendMessage: async (message) => {
    const response = await api.post("/api/chatbot/message", { message });
    return response.data;
  },
};

export default api;
