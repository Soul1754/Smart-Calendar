const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const chatbotService = require("../services/chatbot");

/**
 * @route   GET /api/chatbot/models
 * @desc    Get available AI models
 * @access  Public
 */
router.get("/models", (req, res) => {
  const models = [
    {
      id: "llama-3.1-8b-instant",
      name: "Llama 3.1 8B Instant",
      provider: "Meta",
      contextWindow: 131072,
    },
    {
      id: "llama-3.3-70b-versatile",
      name: "Llama 3.3 70B Versatile",
      provider: "Meta",
      contextWindow: 131072,
    },
    {
      id: "meta-llama/llama-guard-4-12b",
      name: "Llama Guard 4 12B",
      provider: "Meta",
      contextWindow: 131072,
    },
    {
      id: "openai/gpt-oss-120b",
      name: "GPT OSS 120B",
      provider: "OpenAI",
      contextWindow: 131072,
    },
    {
      id: "openai/gpt-oss-20b",
      name: "GPT OSS 20B",
      provider: "OpenAI",
      contextWindow: 131072,
    },
  ];
  res.json({ success: true, models });
});

/**
 * @route   POST /api/chatbot/message
 * @desc    Process a chatbot message
 * @access  Private
 */
router.post("/message", auth, async (req, res) => {
  try {
    const { message, timezone, model } = req.body;

    if (!message) {
      return res
        .status(400)
        .json({ success: false, message: "Message is required" });
    }

    // Process the message using the chatbot service
    const response = await chatbotService.processMessage(req.user.id, message, {
      timezone,
      model,
    });

    res.json(response);
  } catch (error) {
    console.error("Error in chatbot message route:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

module.exports = router;
