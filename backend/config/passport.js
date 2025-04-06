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
      callbackURL: "/auth/google/callback",
      scope: ["profile", "email", "https://www.googleapis.com/auth/calendar"],
    },
    async (accessToken, refreshToken, profile, done) => {
      console.log("Google OAuth callback triggered");
      console.log(
        "Client ID:",
        process.env.GOOGLE_CLIENT_ID ? "Configured" : "Missing"
      );
      console.log(
        "Client Secret:",
        process.env.GOOGLE_CLIENT_SECRET ? "Configured" : "Missing"
      );

      if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
        console.error("Google OAuth credentials are missing!");
        return done(
          new Error("Google OAuth credentials are not configured properly"),
          null
        );
      }
      try {
        // Check if user already exists
        let user = await User.findOne({ googleId: profile.id });

        if (user) {
          // Update tokens
          user.googleAccessToken = accessToken;
          user.googleRefreshToken = refreshToken;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new User({
          googleId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken,
        });

        await user.save();
        return done(null, user);
      } catch (err) {
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
      callbackURL: "/auth/microsoft/callback",
      scope: ["user.read", "calendars.read", "calendars.readwrite"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user already exists
        let user = await User.findOne({ microsoftId: profile.id });

        if (user) {
          // Update tokens
          user.microsoftAccessToken = accessToken;
          user.microsoftRefreshToken = refreshToken;
          await user.save();
          return done(null, user);
        }

        // Create new user
        user = new User({
          microsoftId: profile.id,
          email: profile.emails[0].value,
          name: profile.displayName,
          microsoftAccessToken: accessToken,
          microsoftRefreshToken: refreshToken,
        });

        await user.save();
        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

module.exports = passport;
