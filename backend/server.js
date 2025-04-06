const express = require("express");
const mongoose = require("mongoose");
const passport = require("passport");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(express.json());
app.use(cors());
app.use(passport.initialize());

// Configure Passport
require("./config/passport");

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Routes (to be implemented)
app.use("/auth", require("./routes/auth"));
app.use("/calendar", require("./routes/calendar"));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("ERROR DETAILS:", err);
  console.error("ERROR STACK:", err.stack);
  res.status(500).send("Something broke!");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
