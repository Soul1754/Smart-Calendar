const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const dotenv = require("dotenv");
// serverless handler for Vercel
const serverless = require("serverless-http");

// Load environment variables
dotenv.config();
if (!process.env.FRONTEND_URL) {
   console.error('FRONTEND_URL must be set');
   process.exit(1);
}

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());

// Debug logging flag and helper
const debugEnabled = (process.env.DEBUG_LOGS === 'true') || (process.env.DEBUG_REQUESTS === 'true');
const logDebug = (...args) => {
  if (debugEnabled) console.log(...args);
};

// CORS Configuration - Must come before routes
const corsOptions = {
  origin: process.env.FRONTEND_URL,
  credentials: true,
  optionsSuccessStatus: 200, // Changed from 204 to 200 to ensure proper response
  allowedHeaders: ["Content-Type", "x-auth-token", "Authorization", "ngrok-skip-browser-warning"],
  exposedHeaders: ["x-auth-token"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
};

app.use(cors(corsOptions));

// Request logging middleware - install always but only emit sensitive details when debug is enabled
app.use((req, res, next) => {
  // Basic request line is safe to always log at info level; sensitive details (auth presence, CORS headers) are guarded
  console.log(`${req.method} ${req.path}`);

  // Only log origin/auth/CORS debugging details when explicitly enabled
  if (debugEnabled) {
    logDebug('Origin:', req.get('origin'));
    // Optionally log whether an auth token header is present (non-PII boolean)
    logDebug('Auth token present:', !!req.header('x-auth-token'));

    if (req.method === 'OPTIONS') {
      logDebug('CORS Preflight:', {
        origin: req.get('origin'),
        method: req.get('Access-Control-Request-Method'),
        headers: req.get('Access-Control-Request-Headers'),
      });
    }
  }

  next();
});
app.use(passport.initialize());

// Configure Passport
// Ensure passport config picks up callback URLs from env
// Prefer an NGROK_URL (public tunnel) for testing, then BACKEND_URL, then localhost
const rawNgrok =
  process.env.NGROK_URL && process.env.NGROK_URL.trim()
    ? process.env.NGROK_URL.trim()
    : null;
const rawBackend =
  process.env.BACKEND_URL && process.env.BACKEND_URL.trim()
    ? process.env.BACKEND_URL.trim()
    : null;
let backendBaseUrl = rawNgrok || rawBackend || "http://localhost:5001";
// Strip trailing slashes for consistency
backendBaseUrl = backendBaseUrl.replace(/\/+$/, "");

// Export canonical BACKEND_URL for use in other modules
process.env.BACKEND_URL = process.env.BACKEND_URL || backendBaseUrl;

process.env.GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL || `${backendBaseUrl}/auth/google/callback`;

process.env.MICROSOFT_CALLBACK_URL =
  process.env.MICROSOFT_CALLBACK_URL ||
  `${backendBaseUrl}/auth/microsoft/callback`;
require("./config/passport");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes
app.use("/auth", require("./routes/auth"));
app.use("/api/calendar", require("./routes/calendar"));
app.use("/api/chatbot", require("./routes/chatbot"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("ERROR DETAILS:", err);
  console.error("ERROR STACK:", err.stack);
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : `Something broke! ${err.message}`;
  res.status(500).send(message);
});

app.get("/health", (req, res) => {
  // You can add logic here to check DB connection if needed
  res.status(200).send("OK");
});


// Export handler for serverless platforms (Vercel)
if (process.env.NODE_ENV === "production" && process.env.VERCEL) {
  module.exports = serverless(app);
} else {
  const PORT = process.env.PORT || 5001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
