const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  googleId: {
    type: String,
    sparse: true,
  },
  microsoftId: {
    type: String,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    // Not required because OAuth users won't have a password
  },
  googleAccessToken: String,
  googleRefreshToken: String,
  microsoftAccessToken: String,
  microsoftRefreshToken: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("User", UserSchema);
