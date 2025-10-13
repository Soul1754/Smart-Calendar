const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const dotenv = require("dotenv");
// serverless handler for Vercel
const serverless = require("serverless-http");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Configure Passport
// Ensure passport config picks up callback URLs from env
process.env.GOOGLE_CALLBACK_URL =
  process.env.GOOGLE_CALLBACK_URL ||
  process.env.BACKEND_URL + "/auth/google/callback";
process.env.MICROSOFT_CALLBACK_URL =
  process.env.MICROSOFT_CALLBACK_URL ||
  process.env.BACKEND_URL + "/auth/microsoft/callback";
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
  res.status(500).send("Something broke!");
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
