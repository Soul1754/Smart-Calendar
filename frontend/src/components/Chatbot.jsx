import React, { useState, useEffect, useRef, useContext } from "react";
import { AuthContext } from "../App";
import api, { chatbotService } from "../services/api";
import { useTheme } from "../contexts/ThemeContext";
import { useChatModel } from "../contexts/ChatModelContext";
import { gsap } from "gsap";

const Chatbot = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { isDarkMode } = useTheme();
  const { selectedModel, selectModel, availableModels } = useChatModel();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const chatboxRef = useRef(null);
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
        followUp: response.followUp,
        pending: response.pending,
  collectedParams: response.collectedParams,
  availableSlots: response.availableSlots
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

  // Handle selecting an alternative slot via button
  const handleSelectSlot = async (slotIndex, slot) => {
    if (loading) return;
    const choice = String(slotIndex + 1); // backend expects simple number or time
    const userMessage = { text: choice, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMessage]);
    setLoading(true);
    try {
      const response = await chatbotService.sendMessage(choice);
      const botMessage = {
        text: response.message,
        sender: 'bot',
        timestamp: new Date(),
        data: response.data,
        followUp: response.followUp,
        pending: response.pending,
        collectedParams: response.collectedParams,
        availableSlots: response.availableSlots
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (err) {
      console.error('Slot selection error', err);
      setMessages(prev => [...prev, { text: 'Failed to select slot. Try again.', sender: 'bot', timestamp: new Date(), isError: true }]);
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

  // Animation for chatbox
  useEffect(() => {
    if (isOpen && chatboxRef.current) {
      gsap.fromTo(
        chatboxRef.current,
        { scale: 0.8, opacity: 0 },
        { 
          scale: 1, 
          opacity: 1, 
          duration: 0.3, 
          ease: "back.out(1.7)" 
        }
      );
    }
  }, [isOpen]);

  return (
    <div className="relative z-50">
      {/* Chat toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-colors duration-200
          ${isDarkMode 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-blue-600 hover:bg-blue-700'} 
          ${isOpen ? 'scale-90' : 'scale-100'}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 text-white transition-transform duration-300 ${
            isOpen ? 'rotate-90' : 'rotate-0'
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          {isOpen ? (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          ) : (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
            />
          )}
        </svg>
      </button>

      {/* Chatbox */}
      {isOpen && (
        <div
          ref={chatboxRef}
          className={`fixed bottom-20 right-0 w-96 h-[32rem] rounded-lg shadow-xl overflow-hidden
            ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            sm:right-0 md:right-4`}
        >
          {/* Header */}
          <div className={`p-4 shadow-md flex justify-between items-center
            ${isDarkMode ? 'bg-gray-700 text-white' : 'bg-blue-600 text-white'}`}>
            <h1 className="text-xl font-semibold">AI Calendar Assistant</h1>
            
            {/* Model selector */}
            <select
              value={selectedModel.id}
              onChange={(e) => selectModel(availableModels.find(m => m.id === e.target.value))}
              className={`ml-2 px-2 py-1 rounded text-sm
                ${isDarkMode 
                  ? 'bg-gray-600 text-white border-gray-500' 
                  : 'bg-blue-500 text-white border-blue-400'}`}
            >
              {availableModels.map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>

          {/* Messages area */}
          <div className={`flex-1 overflow-y-auto p-4 space-y-4 h-[calc(32rem-8rem)] 
            ${isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}`}>
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
                      ? isDarkMode 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-blue-500 text-white'
                      : message.isError
                      ? isDarkMode
                        ? 'bg-red-900 text-red-100'
                        : 'bg-red-100 text-red-800'
                      : isDarkMode
                        ? 'bg-gray-700 text-gray-100'
                        : 'bg-gray-200 text-gray-800'
                  }`}
                >
                  <div className="text-sm">{formatMessage(message.text)}</div>
                  {message.followUp && message.pending && (
                    <div className={`mt-2 text-xs rounded p-2 ${
                      isDarkMode
                        ? 'bg-yellow-900 text-yellow-100'
                        : 'bg-yellow-100 text-yellow-700'
                    }`}>
                      Awaiting: {message.pending.join(', ')}
                    </div>
                  )}
                  {message.collectedParams && message.followUp && (
                    <div className="mt-2 text-[10px] text-gray-400">
                      Collected so far: {['title','date','time']
                        .filter(k => message.collectedParams[k])
                        .map(k => `${k}: ${message.collectedParams[k]}`)
                        .join(' | ')}
                    </div>
                  )}
                  {message.availableSlots && message.availableSlots.length > 0 && message.followUp && (
                    <div className="mt-3 space-y-2">
                      <div className={`text-xs font-semibold ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>Available Slots</div>
                      <div className="flex flex-wrap gap-2">
                        {message.availableSlots.map(slot => (
                          <button
                            key={slot.index}
                            disabled={loading}
                            onClick={() => handleSelectSlot(slot.index - 1, slot)}
                            className={`text-xs rounded px-2 py-1 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm
                              ${isDarkMode
                                ? 'bg-blue-700 text-white border border-blue-600'
                                : 'bg-white border border-blue-500 text-blue-600 hover:bg-blue-50'
                              }`}
                            title={`Score: ${slot.score}`}
                          >
                            {slot.index}. {slot.label}
                          </button>
                        ))}
                      </div>
                      <div className={`text-[10px] ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>Click a slot or type number / time (e.g. 14:30) or 'cancel'</div>
                    </div>
                  )}
                  {message.data && renderEvents(message.data)}
                  <div className={`text-xs mt-1 opacity-70 text-right ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-600'
                  }`}>
                    {formatTime(message.timestamp)}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className={`rounded-xl p-3 flex items-center space-x-1
                  ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div className={`w-2 h-2 rounded-full animate-bounce 
                    ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce
                    ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}
                    style={{ animationDelay: "0.2s" }}></div>
                  <div className={`w-2 h-2 rounded-full animate-bounce
                    ${isDarkMode ? 'bg-gray-400' : 'bg-gray-500'}`}
                    style={{ animationDelay: "0.4s" }}></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form
            onSubmit={handleSubmit}
            className={`p-4 border-t ${
              isDarkMode 
                ? 'border-gray-700 bg-gray-800' 
                : 'border-gray-200 bg-white'
            }`}
          >
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                className={`flex-1 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 
                  ${isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'border border-gray-300 text-gray-800'
                  }`}
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className={`px-4 py-2 rounded-lg transition-colors duration-200 
                  ${isDarkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500`}
              >
                Send
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default Chatbot;
