# Chatbot Quick Start Guide

## 🚀 Getting Started

The chatbot functionality is now fully integrated into the Next.js application as a floating assistant! Here's how to use it:

## 📍 How to Access the Chatbot

### **Floating Chatbot** (Always Available)
- Available on ALL dashboard pages automatically
- Look for the chat bubble icon in the **bottom-right corner**
- Click to open/close the chat window
- Stays accessible while you navigate
- No page navigation required!

**Where it appears:**
- `/calendar` - Calendar page
- `/meetings` - Meetings page
- `/profile` - Profile page
- Any other dashboard route

## 💬 Example Usage

### Schedule a Meeting
```
You: "Schedule a meeting with john@example.com tomorrow at 2pm for 1 hour"
Bot: "I'll help you schedule that meeting. Let me check for conflicts..."
```

### Check Calendar
```
You: "Show me my meetings this week"
Bot: [Lists all your upcoming events]
```

### Find Available Times
```
You: "Find a time to meet with sarah@example.com and mike@example.com next week"
Bot: [Analyzes calendars and suggests available slots]
```

### Select from Suggested Times
When the bot suggests multiple time slots, you can:
- Click on any suggested slot button
- Or type the number (e.g., "1" for first slot)
- Or type a specific time (e.g., "14:30")
- Or type "cancel" to abort

## 🤖 AI Model Selection

Change the AI model anytime:
1. Click the **dropdown** in the chat header
2. Choose from 5 available models:
   - Llama 3.1 8B Instant (Fast, lightweight)
   - Llama 3.3 70B Versatile (Powerful, balanced)
   - Llama Guard 4 12B (Safety-focused)
   - GPT OSS 120B (Large model)
   - GPT OSS 20B (Smaller alternative)

Your selection is saved automatically!

## ✨ Features

- **Natural Language** - Talk naturally, no special syntax needed
- **Multi-Calendar Support** - Works with Google & Microsoft calendars
- **Conflict Detection** - Automatically checks for scheduling conflicts
- **Smart Suggestions** - Offers alternative times when conflicts exist
- **Dark Mode** - Automatically matches your theme preference
- **Persistent** - Chat history stays during your session

## 🎨 UI Features

### Messages
- User messages appear on the **right** (blue)
- Bot messages appear on the **left** (gray)
- Timestamps show on each message
- Line breaks are preserved

### Loading States
- Animated dots show when bot is thinking
- Input disabled while processing
- Send button grays out when loading

### Interactive Elements
- Click slot buttons for quick selection
- Model selector in header
- Close button (X) to dismiss floating chat

## 🔧 Technical Details

### Backend Integration
- Endpoint: `POST /api/chatbot/message`
- Automatic timezone detection
- Zod validation for type safety
- Error handling with user-friendly messages

### State Management
- React Context for model selection
- Local state for message history
- Auth context for user identity
- Theme context for dark/light mode

## 📱 Responsive Design

The chatbot works on all screen sizes:
- **Desktop**: Full-featured chat window
- **Tablet**: Optimized layout
- **Mobile**: Touch-friendly buttons and inputs

## 🐛 Troubleshooting

### Chat not appearing?
1. Make sure you're logged in
2. Check you're on a dashboard page
3. Look for the chat bubble in bottom-right corner

### Bot not responding?
1. Check your internet connection
2. Verify backend is running
3. Check browser console for errors
4. Try refreshing the page

### Model selection not working?
1. Try a different model from the dropdown
2. Check if GROQ_API_KEY is set in backend env
3. Verify backend logs for API errors

## 🚧 Known Limitations

- Chat history resets on page refresh (can be enhanced)
- No message editing after sending
- No file attachments yet
- Single conversation thread (no multiple chats)

## 🎯 Next Steps

Want to enhance the chatbot? Consider:
1. **Persistent History** - Save chats to database
2. **Voice Input** - Add speech recognition
3. **Rich Media** - Support images/GIFs in chat
4. **Chat Export** - Download conversation as PDF
5. **Multi-threading** - Support multiple chat sessions

## 📚 Related Documentation

- [Full Migration Details](./CHATBOT_MIGRATION.md)
- [API Documentation](../docs/api-documentation.md)
- [Backend Chatbot Service](../backend/services/chatbot.js)
- [Frontend Chatbot API Client](./lib/api/chatbot.ts)

## 💡 Tips

- Start with simple queries to get familiar
- The bot remembers context within a conversation
- Use natural language - be conversational
- Check suggested slots before typing manually
- Switch models if one isn't performing well

---

**Ready to try it?** Log in and look for the chat bubble! 🎉
