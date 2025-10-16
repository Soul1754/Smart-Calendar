const express = require("express");
const router = express.Router();
const passport = require("passport");
const jwt = require("jsonwebtoken");
const bcryptjs = require("bcryptjs");
const User = require("../models/User");

// Helper function to generate JWT token
const generateToken = (user) => {
  const id = (user && (user._id || user.id))
    ? String(user._id || user.id)
    : undefined;
  return jwt.sign(
    { id, email: user && user.email },
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
    const salt = await bcryptjs.genSalt(10);
    const hashedPassword = await bcryptjs.hash(password, salt);

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
        _id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        connectedCalendars: [], // New user has no connected calendars
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
    const isMatch = await bcryptjs.compare(password, user.password || "");
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = generateToken(user);

    // Build connectedCalendars array
    const connectedCalendars = [];

    if (user.googleAccessToken) {
      connectedCalendars.push({
        provider: "google",
        email: user.email,
        connectedAt: user.createdAt || new Date().toISOString(),
      });
    }

    if (user.microsoftAccessToken) {
      connectedCalendars.push({
        provider: "microsoft",
        email: user.email,
        connectedAt: user.createdAt || new Date().toISOString(),
      });
    }

    res.json({
      token,
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        connectedCalendars: connectedCalendars,
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
    try {
      if (!req.user) {
        console.error("Google callback: req.user missing");
        return res.redirect(
          `${(process.env.FRONTEND_URL || "http://localhost:3000").replace(/\/$/, "")}/login?error=${encodeURIComponent(
            "Missing user in OAuth callback"
          )}`
        );
      }
      // Redact PII: only emit non-identifying information and an anonymized id
      const rawUserId = req.user && (req.user._id || req.user.id) ? String(req.user._id || req.user.id) : undefined;
      const anonUserId = rawUserId ? `...${rawUserId.slice(-6)}` : 'unknown';
      console.log("Google callback: user authenticated", {
        provider: 'google',
        anonId: anonUserId,
        hasGoogleToken: !!(req.user && req.user.googleAccessToken),
      });
      const token = generateToken(req.user);
      // Log token generation without PII
      console.log("Token generated for authenticated user", { anonId: anonUserId });

      // Redirect to frontend with token
      const base = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(`${base.replace(/\/$/, "")}/auth/callback?token=${token}`);
    } catch (e) {
      console.error("Error building Google callback response:", e);
      const base = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${base.replace(/\/$/, "")}/login?error=${encodeURIComponent("OAuth processing failed")}`
      );
    }
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
    const base = process.env.FRONTEND_URL || "http://localhost:3000";
    res.redirect(`${base.replace(/\/$/, "")}/auth/callback?token=${token}`);
  }
);

// Get current user
router.get("/me", async (req, res) => {
  console.log("/auth/me: Request received");
  console.log("/auth/me: Headers:", req.headers);
  
  try {
    // Get token from header
    const token = req.header("x-auth-token");
    console.log("/auth/me: Token present:", !!token);
    
    if (!token) {
      console.log("/auth/me: No token provided");
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your_jwt_secret"
      );
      console.log("/auth/me: decoded token:", { id: decoded.id, email: decoded.email });
    } catch (verifyErr) {
      console.error("JWT verify failed:", verifyErr && verifyErr.message);
      return res.status(401).json({ message: "Invalid token" });
    }

    // Get user by id, fallback to email if needed
    let user = null;
    if (decoded && decoded.id) {
      console.log("/auth/me: searching by id:", decoded.id);
      user = await User.findById(decoded.id).select("-password");
      console.log("/auth/me: user found by id:", !!user);
      if (!user) {
        console.warn(`/auth/me: No user found with _id: ${decoded.id}`);
        // Check if user exists with this email instead
        console.log("/auth/me: Checking if any users exist with email:", decoded.email);
        const allUsersWithEmail = await User.find({ email: decoded.email });
        console.log("/auth/me: Users with this email:", allUsersWithEmail.map(u => ({ _id: u._id, email: u.email })));
      }
    }
    if (!user && decoded && decoded.email) {
      console.log("/auth/me: searching by email:", decoded.email);
      user = await User.findOne({ email: decoded.email.toLowerCase() }).select(
        "-password"
      );
      console.log("/auth/me: user found by email:", !!user);
      if (user) {
        console.log("/auth/me: User found by email has _id:", user._id);
      }
    }
    if (!user) {
      console.warn("/auth/me: user not found for decoded:", JSON.stringify(decoded));
      return res.status(404).json({ message: "User not found" });
    }

    console.log("/auth/me: found user", {
      _id: user._id,
      id: user.id,
      email: user.email,
      hasGoogleToken: !!user.googleAccessToken,
      hasMicrosoftToken: !!user.microsoftAccessToken,
    });

    // Build connectedCalendars array
    const connectedCalendars = [];

    if (user.googleAccessToken) {
      connectedCalendars.push({
        provider: "google",
        email: user.email,
        connectedAt: user.createdAt || new Date().toISOString(),
      });
    }

    if (user.microsoftAccessToken) {
      connectedCalendars.push({
        provider: "microsoft",
        email: user.email,
        connectedAt: user.createdAt || new Date().toISOString(),
      });
    }

    const responseData = {
      user: {
        _id: String(user._id || user.id),
        name: user.name,
        email: user.email,
        connectedCalendars: connectedCalendars,
      },
    };

    console.log("/auth/me: sending response", JSON.stringify(responseData));
    res.json(responseData);
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Disconnect calendar
router.post("/disconnect", async (req, res) => {
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
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { provider } = req.body;

    if (provider === "google") {
      user.googleAccessToken = undefined;
      user.googleRefreshToken = undefined;
      user.googleId = undefined;
    } else if (provider === "microsoft") {
      user.microsoftAccessToken = undefined;
      user.microsoftRefreshToken = undefined;
      user.microsoftId = undefined;
    } else {
      return res.status(400).json({ message: "Invalid provider" });
    }

    await user.save();

    res.json({ message: `${provider} calendar disconnected successfully` });
  } catch (error) {
    console.error("Disconnect error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Update user preferences
router.put("/preferences", async (req, res) => {
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
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user fields (only name for now)
    if (req.body.name) {
      user.name = req.body.name;
    }

    await user.save();

    // Build connectedCalendars array
    const connectedCalendars = [];

    if (user.googleAccessToken) {
      connectedCalendars.push({
        provider: "google",
        email: user.email,
        connectedAt: user.createdAt || new Date().toISOString(),
      });
    }

    if (user.microsoftAccessToken) {
      connectedCalendars.push({
        provider: "microsoft",
        email: user.email,
        connectedAt: user.createdAt || new Date().toISOString(),
      });
    }

    res.json({
      user: {
        _id: user.id,
        name: user.name,
        email: user.email,
        connectedCalendars: connectedCalendars,
      },
    });
  } catch (error) {
    console.error("Update preferences error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
