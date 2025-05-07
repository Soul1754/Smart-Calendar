import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../App";
import api, { chatbotService } from "../services/api";

const Chatbot = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      setMessages([
        {
          text: "Hello! I'm your calendar assistant. I can help you schedule meetings and check your calendar. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message to chat
    const userMessage = {
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      // Send message to backend
      const response = await chatbotService.sendMessage(input);

      // Add bot response to chat
      const botMessage = {
        text: response.message,
        sender: "bot",
        timestamp: new Date(),
        data: response.data,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage = {
        text: "Sorry, I encountered an error. Please try again.",
        sender: "bot",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format message text with line breaks
  const formatMessage = (text) => {
    return text.split("\n").map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i !== text.split("\n").length - 1 && <br />}
      </React.Fragment>
    ));
  };

  // Render calendar events if present in bot response
  const renderEvents = (data) => {
    if (!data || !data.events || data.events.length === 0) return null;

    return (
      <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-gray-50">
        <h4 className="text-sm font-semibold mb-1">Events:</h4>
        <ul className="text-sm">
          {data.events.map((event, index) => (
            <li
              key={index}
              className="mb-1 pb-1 border-b border-gray-100 last:border-0"
            >
              <div className="font-medium">{event.title}</div>
              <div className="text-xs text-gray-600">{event.time}</div>
              {event.attendees > 0 && (
                <div className="text-xs text-gray-500">
                  {event.attendees} attendee{event.attendees !== 1 ? "s" : ""}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-semibold">AI Calendar Assistant</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-3 ${
                message.sender === "user"
                  ? "bg-blue-500 text-white"
                  : message.isError
                  ? "bg-red-100 text-red-800"
                  : "bg-gray-200 text-gray-800"
              }`}
            >
              <div className="text-sm">{formatMessage(message.text)}</div>
              {message.data && renderEvents(message.data)}
              <div className="text-xs mt-1 opacity-70 text-right">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-200 rounded-xl p-3 flex items-center space-x-1">
              <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-4 border-t border-gray-200 bg-white"
      >
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
