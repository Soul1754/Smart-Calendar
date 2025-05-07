const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const User = require("../models/User");

// Helper function to generate JWT token
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET || "your_jwt_secret",
    { expiresIn: "7d" }
  );
};

// Register a new user
router.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    // Generate JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    print(error);
    res.status(500).json({ message: "Server error" });
  }
});

// `Login` user
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Check if password is correct
    const isMatch = await bcrypt.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasGoogleCalendar: !!user.googleAccessToken,
        hasMicrosoftCalendar: !!user.microsoftAccessToken,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Google OAuth routes
router.get("/google", (req, res, next) => {
  console.log("Google OAuth route accessed");
  try {
    passport.authenticate("google", {
      scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    })(req, res, next);
  } catch (error) {
    console.error("Google OAuth authentication error:", error);
    next(error);
  }
});

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user);

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}`
    );
  }
);

// Microsoft OAuth routes
router.get(
  "/microsoft",
  passport.authenticate("microsoft", {
    scope: ["user.read", "calendars.read", "calendars.readwrite"],
  })
);

router.get(
  "/microsoft/callback",
  passport.authenticate("microsoft", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    // Generate JWT token
    const token = generateToken(req.user);

    // Redirect to frontend with token
    res.redirect(
      `${process.env.FRONTEND_URL || "http://localhost:5173"}?token=${token}`
    );
  }
);

// Get current user
router.get("/me", async (req, res) => {
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

    // Get user
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        hasGoogleCalendar: !!user.googleAccessToken,
        hasMicrosoftCalendar: !!user.microsoftAccessToken,
      },
    });
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
