const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const chatbotService = require("../services/chatbot");

/**
 * @route   POST /api/chatbot/message
 * @desc    Process a chatbot message
 * @access  Private
 */
router.post("/message", auth, async (req, res) => {
  try {
  const { message, timezone } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    // Process the message using the chatbot service
  const response = await chatbotService.processMessage(req.user.id, message, { timezone });

    res.json(response);
  } catch (error) {
    console.error("Error in chatbot message route:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
