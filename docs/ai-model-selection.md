# AI Model Selection Feature

## Overview

The Smart Calendar application now supports multiple AI models from Groq for the chatbot assistant. Users can select their preferred model from the frontend interface, allowing them to choose between different models based on their needs for speed, capability, and context window size.

## Available Models

The following models are available for selection:

### 1. **Llama 3.1 8B Instant** (Default)

- **ID**: `llama-3.1-8b-instant`
- **Provider**: Meta
- **Context Window**: 131,072 tokens
- **Best for**: Fast responses, general queries, quick interactions

### 2. **Llama 3.3 70B Versatile**

- **ID**: `llama-3.3-70b-versatile`
- **Provider**: Meta
- **Context Window**: 131,072 tokens
- **Output Tokens**: 32,768 tokens
- **Best for**: Complex reasoning, detailed analysis, versatile tasks

### 3. **Llama Guard 4 12B**

- **ID**: `meta-llama/llama-guard-4-12b`
- **Provider**: Meta
- **Context Window**: 131,072 tokens
- **Output Tokens**: 1,024 tokens
- **Max File Size**: 20 MB
- **Best for**: Content moderation, safety-focused tasks

### 4. **GPT OSS 120B**

- **ID**: `openai/gpt-oss-120b`
- **Provider**: OpenAI
- **Context Window**: 131,072 tokens
- **Output Tokens**: 65,536 tokens
- **Best for**: Large-scale reasoning, complex problem-solving

### 5. **GPT OSS 20B**

- **ID**: `openai/gpt-oss-20b`
- **Provider**: OpenAI
- **Context Window**: 131,072 tokens
- **Output Tokens**: 65,536 tokens
- **Best for**: Balanced performance and speed

## How It Works

### Frontend

1. **Model Context Provider** (`ChatModelContext.jsx`)

   - Manages the list of available models
   - Stores user's selected model in localStorage
   - Provides `selectedModel`, `selectModel()`, and `availableModels` to components

2. **Chatbot Component** (`Chatbot.jsx`)

   - Displays a dropdown selector in the chat header
   - Passes the selected model ID with every message request
   - Model selection persists across sessions

3. **API Service** (`api.js`)
   - Includes the selected model in the request payload
   - Sends model information to the backend for processing

### Backend

1. **Chatbot Service** (`services/chatbot.js`)

   - Accepts optional `model` parameter in `processMessage()`
   - Uses provided model or falls back to `GROQ_MODEL` env variable
   - Passes model to both `analyzeIntent()` and `generateResponse()` methods
   - Lazy initialization of Groq client prevents startup failures

2. **Chatbot Route** (`routes/chatbot.js`)

   - Extracts `model` from request body
   - Passes model to chatbot service
   - Provides `/api/chatbot/models` endpoint to list available models

3. **Environment Configuration** (`.env`)
   - `GROQ_API_KEY`: Your Groq API key (required)
   - `GROQ_MODEL`: Default model if not specified (optional, defaults to `llama-3.1-8b-instant`)

## Configuration

### Backend Setup

1. Ensure your `.env` file has the Groq API key:

```env
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

2. The backend will use the selected model from the frontend, or fall back to the `GROQ_MODEL` environment variable, or finally use the hardcoded default (`llama-3.1-8b-instant`).

### Frontend Setup

No additional configuration needed. The model selector is automatically available in the chatbot interface.

## User Experience

1. **Model Selection**

   - Open the chatbot by clicking the chat button
   - Use the dropdown in the chat header to select a model
   - Selection is saved and persists across sessions

2. **Visual Feedback**

   - The currently selected model is displayed in the dropdown
   - Model name shows provider and capability information

3. **Seamless Switching**
   - Change models at any time during a conversation
   - New messages will use the newly selected model
   - Previous messages remain unchanged

## API Reference

### Get Available Models

```
GET /api/chatbot/models
```

**Response:**

```json
{
  "success": true,
  "models": [
    {
      "id": "llama-3.1-8b-instant",
      "name": "Llama 3.1 8B Instant",
      "provider": "Meta",
      "contextWindow": 131072
    },
    ...
  ]
}
```

### Send Message with Model

```
POST /api/chatbot/message
```

**Request Body:**

```json
{
  "message": "Schedule a meeting tomorrow at 2pm",
  "timezone": "America/New_York",
  "model": "llama-3.3-70b-versatile"
}
```

**Response:**

```json
{
  "success": true,
  "message": "I'll help you schedule that meeting...",
  "followUp": true,
  "pending": ["attendees"],
  ...
}
```

## Benefits

1. **Flexibility**: Users can choose the model that best fits their needs
2. **Performance**: Lighter models provide faster responses
3. **Capability**: Heavier models offer more sophisticated reasoning
4. **Cost Optimization**: Use appropriate models for different tasks
5. **User Control**: Empowers users to customize their experience

## Technical Implementation Details

### Flow Diagram

```
User selects model in UI
    ↓
Frontend stores selection in localStorage
    ↓
Frontend sends message with model ID
    ↓
Backend receives model parameter
    ↓
Chatbot service uses specified model (or fallback)
    ↓
Groq API processes with selected model
    ↓
Response returned to user
```

### Error Handling

- If an invalid model is specified, the system falls back to the default model
- If the Groq API key is missing, a clear error message is shown
- Model selection errors are logged for debugging

## Future Enhancements

Possible improvements for future versions:

1. **Model Performance Metrics**: Show response time and token usage per model
2. **Smart Model Selection**: Auto-suggest models based on query complexity
3. **Cost Tracking**: Display usage costs for different models
4. **Model Comparison**: Side-by-side comparison of model responses
5. **Custom Model Preferences**: Per-task model preferences (e.g., always use X for meeting scheduling)

## Troubleshooting

### Model Not Working

- Verify `GROQ_API_KEY` is set in backend `.env`
- Check Groq API status and model availability
- Ensure model ID matches exactly (case-sensitive)

### Model Selection Not Persisting

- Check browser localStorage is enabled
- Clear browser cache and try again
- Verify ChatModelContext is properly wrapped around App

### Slow Responses

- Try switching to a lighter model (e.g., Llama 3.1 8B Instant)
- Check network connectivity
- Verify Groq API rate limits aren't exceeded

## References

- [Groq API Documentation](https://console.groq.com/docs)
- [Groq Model Deprecations](https://console.groq.com/docs/deprecations)
- [Groq Model Comparison](https://console.groq.com/docs/models)
