const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const MicrosoftStrategy = require("passport-microsoft").Strategy;
const User = require("../models/User");

// Google OAuth Strategy
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:
        process.env.GOOGLE_CALLBACK_URL ||
        (process.env.BACKEND_URL || "") + "/auth/google/callback",
      scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google OAuth callback triggered");

      const configured = {
        clientId: !!process.env.GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
      };
      console.log("Client ID:", configured.clientId ? "Configured" : "Missing");
      console.log(
        "Client Secret:",
        configured.clientSecret ? "Configured" : "Missing"
      );

      if (!configured.clientId || !configured.clientSecret) {
        console.error("Google OAuth credentials are missing!");
        return done(
          new Error("Google OAuth credentials are not configured properly"),
          null
        );
      }

      // Normalize email to avoid duplicate-key issues due to case sensitivity
      const email =
        profile.emails && profile.emails[0] && profile.emails[0].value
          ? profile.emails[0].value.toLowerCase()
          : null;

      console.log("Google OAuth: Looking for user with googleId:", profile.id, "or email:", email);

      try {
        // Try to find existing user by googleId OR by email (if provided).
        // This avoids creating a new user when an account with the same email
        // already exists (e.g., user registered via email/password earlier).
        let user = null;
        if (profile.id) {
          user = await User.findOne({
            $or: [{ googleId: profile.id }, { email }],
          });
          if (user) {
            console.log("Google OAuth: Found existing user:", {
              _id: user._id,
              email: user.email,
              googleId: user.googleId,
              matchedBy: user.googleId === profile.id ? 'googleId' : 'email'
            });
          }
        } else if (email) {
          user = await User.findOne({ email });
        }

        if (user) {
          // Attach Google identifiers/tokens to the existing account if missing
          user.googleId = user.googleId || profile.id;
          if (accessToken) user.googleAccessToken = accessToken;
          if (refreshToken) user.googleRefreshToken = refreshToken;
          // Ensure email and name are populated
          if (email && !user.email) user.email = email;
          if (profile.displayName && !user.name)
            user.name = profile.displayName;

          await user.save();
          console.log("Google OAuth: Existing user updated, returning user with _id:", user._id);
          return done(null, user);
        }

        // No existing user found — create a new user record
        const newUserData = {
          googleId: profile.id,
          email: email,
          name: profile.displayName,
        };
        if (accessToken) newUserData.googleAccessToken = accessToken;
        if (refreshToken) newUserData.googleRefreshToken = refreshToken;

        try {
          const newUser = new User(newUserData);
          await newUser.save();
          console.log("Google OAuth: New user created with _id:", newUser._id);
          return done(null, newUser);
        } catch (createErr) {
          // Handle race condition / duplicate-key (E11000) where another process
          // created the user with the same email between the find and create steps.
          if (createErr && createErr.code === 11000 && email) {
            console.warn(
              "Duplicate key on user create, retrying update for email:",
              email
            );
            const existing = await User.findOne({ email });
            if (existing) {
              existing.googleId = existing.googleId || profile.id;
              if (accessToken) existing.googleAccessToken = accessToken;
              if (refreshToken) existing.googleRefreshToken = refreshToken;
              await existing.save();
              return done(null, existing);
            }
          }
          throw createErr;
        }
      } catch (err) {
        console.error("Error in GoogleStrategy callback:", err);
        return done(err, null);
      }
    }
  )
);

// Microsoft OAuth Strategy
passport.use(
  new MicrosoftStrategy(
    {
      clientID: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      callbackURL:
        process.env.MICROSOFT_CALLBACK_URL ||
        (process.env.BACKEND_URL || "") + "/auth/microsoft/callback",
      scope: ["user.read", "calendars.read", "calendars.readwrite"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email =
          profile.emails && profile.emails[0] && profile.emails[0].value
            ? profile.emails[0].value.toLowerCase()
            : null;

        let user = null;
        if (profile.id) {
          user = await User.findOne({
            $or: [{ microsoftId: profile.id }, { email }],
          });
        } else if (email) {
          user = await User.findOne({ email });
        }

        if (user) {
          user.microsoftId = user.microsoftId || profile.id;
          if (accessToken) user.microsoftAccessToken = accessToken;
          if (refreshToken) user.microsoftRefreshToken = refreshToken;
          if (email && !user.email) user.email = email;
          if (profile.displayName && !user.name)
            user.name = profile.displayName;
          await user.save();
          return done(null, user);
        }

        const newUserData = {
          microsoftId: profile.id,
          email: email,
          name: profile.displayName,
        };
        if (accessToken) newUserData.microsoftAccessToken = accessToken;
        if (refreshToken) newUserData.microsoftRefreshToken = refreshToken;

        try {
          const newUser = new User(newUserData);
          await newUser.save();
          return done(null, newUser);
        } catch (createErr) {
          if (createErr && createErr.code === 11000 && email) {
            console.warn(
              "Duplicate key on user create (microsoft), retrying update for email:",
              email
            );
            const existing = await User.findOne({ email });
            if (existing) {
              existing.microsoftId = existing.microsoftId || profile.id;
              if (accessToken) existing.microsoftAccessToken = accessToken;
              if (refreshToken) existing.microsoftRefreshToken = refreshToken;
              await existing.save();
              return done(null, existing);
            }
          }
          throw createErr;
        }
      } catch (err) {
        console.error("Error in MicrosoftStrategy callback:", err);
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
