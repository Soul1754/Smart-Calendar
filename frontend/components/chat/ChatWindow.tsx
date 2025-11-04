"use client";

import { useState, useEffect, useRef, ReactNode } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useChatModel } from "@/providers/ChatModelProvider";
import { sendMessage, ChatMessage } from "@/lib/api/chatbot";
import { XMarkIcon, ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";

interface ChatWindowProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Render the AI Calendar Assistant chat window with message history, model selection, slot selection, and message input.
 *
 * @param isOpen - Whether the chat window is visible.
 * @param onClose - Callback invoked when the user requests to close the chat window.
 * @returns The chat window element, or `null` when `isOpen` is false.
 */
export function ChatWindow({ isOpen, onClose }: ChatWindowProps) {
  const { user } = useAuth();
  const { selectedModel, selectModel, availableModels } = useChatModel();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Add welcome message when component mounts
  useEffect(() => {
    if (user && messages.length === 0) {
      setMessages([
        {
          text: "Hello! I'm your calendar assistant. I can help you schedule meetings and check your calendar. How can I help you today?",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    }
  }, [user, messages.length]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || !selectedModel) return;

    const userMessage: ChatMessage = {
      text: input,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await sendMessage(input, selectedModel?.id);

      const botMessage: ChatMessage = {
        text: response.message,
        sender: "bot",
        timestamp: new Date(),
        data: response.data,
        followUp: response.followUp,
        pending: response.pending,
        collectedParams: response.collectedParams,
        availableSlots: response.availableSlots,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Sorry, I encountered an error. Please try again.",
          sender: "bot",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Handle selecting an alternative slot via button
  const handleSelectSlot = async (slotIndex: number) => {
    if (loading || !selectedModel) return;
    const choice = String(slotIndex + 1);
    const userMessage: ChatMessage = {
      text: choice,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setLoading(true);
    try {
      const response = await sendMessage(choice, selectedModel?.id);
      const botMessage: ChatMessage = {
        text: response.message,
        sender: "bot",
        timestamp: new Date(),
        data: response.data,
        followUp: response.followUp,
        pending: response.pending,
        collectedParams: response.collectedParams,
        availableSlots: response.availableSlots,
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("Slot selection error", err);
      setMessages((prev) => [
        ...prev,
        {
          text: "Failed to select slot. Try again.",
          sender: "bot",
          timestamp: new Date(),
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format message text with line breaks
  const formatMessage = (text: string) => {
    return text.split("\n").map((line, i) => (
      <span key={i}>
        {line}
        {i !== text.split("\n").length - 1 && <br />}
      </span>
    ));
  };

  // Render events safely
  const renderEvents = (data: unknown): ReactNode => {
    if (!data || typeof data !== "object" || !("events" in data)) return null;
    const eventData = data as {
      events: Array<{ title: string; time: string; attendees?: number }>;
    };
    if (!eventData.events || eventData.events.length === 0) return null;

    return (
      <div className="mt-2 border border-border rounded-lg p-2 bg-muted/50">
        <h4 className="text-sm font-semibold mb-1">Events:</h4>
        <ul className="text-sm">
          {eventData.events.map((event, index: number) => (
            <li key={index} className="mb-1 pb-1 border-b border-border last:border-0">
              <div className="font-medium">{event.title}</div>
              <div className="text-xs text-muted-foreground">{event.time}</div>
              {event.attendees && event.attendees > 0 && (
                <div className="text-xs text-muted-foreground">
                  {event.attendees} attendee{event.attendees !== 1 ? "s" : ""}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ✅ FIXED: typed as ReactNode to match JSX return
  const renderCollectedParams = (
    collectedParams?: Record<string, string | number | boolean | null | undefined>
  ): ReactNode => {
    if (!collectedParams) return "None";

    const validEntries = Object.entries(collectedParams).filter(
      ([, value]) => value !== null && value !== undefined
    );

    if (validEntries.length === 0) return "None";

    const params = validEntries.map(([key, value]) => `${key}: ${String(value)}`).join(" | ");

    return params;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[32rem] rounded-lg shadow-2xl overflow-hidden bg-card border border-border z-50 flex flex-col animate-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="p-4 bg-primary text-primary-foreground shadow-md flex justify-between items-center">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="h-5 w-5" />
          <h1 className="text-lg font-semibold">AI Calendar Assistant</h1>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedModel?.id ?? ""}
            onChange={(e) => {
              const model = availableModels.find((m) => m.id === e.target.value);
              if (model) selectModel(model);
            }}
            disabled={loading || availableModels.length === 0 || !selectedModel}
            className="px-2 py-1 rounded text-xs bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 focus:outline-none focus:ring-2 focus:ring-primary-foreground/50"
          >
            {availableModels.map((model) => (
              <option key={model.id} value={model.id}>
                {model.name}
              </option>
            ))}
          </select>

          <button
            onClick={onClose}
            className="p-1 hover:bg-primary-foreground/10 rounded transition-colors"
            aria-label="Close chat"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] rounded-xl p-3 ${
                message.sender === "user"
                  ? "bg-primary text-primary-foreground"
                  : message.isError
                    ? "bg-destructive/10 text-destructive border border-destructive/20"
                    : "bg-muted text-foreground"
              }`}
            >
              <div className="text-sm">{formatMessage(message.text)}</div>

              {/* Follow-up indicator */}
              {message.followUp &&
                (Array.isArray(message.pending)
                  ? message.pending.length > 0
                  : message.pending === true) && (
                  <div className="mt-2 text-xs rounded p-2 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300 border border-yellow-500/20">
                    Awaiting:{" "}
                    {Array.isArray(message.pending)
                      ? message.pending.join(", ")
                      : "Awaiting response…"}
                  </div>
                )}

              {/* ✅ Collected params (type-safe) */}
              {message.collectedParams && message.followUp && (
                <div className="mt-2 text-[10px] text-muted-foreground">
                  Collected so far: {renderCollectedParams(message.collectedParams)}
                </div>
              )}

              {/* Available slots */}
              {message.availableSlots && message.availableSlots.length > 0 && message.followUp && (
                <div className="mt-3 space-y-2">
                  <div className="text-xs font-semibold text-foreground">Available Slots</div>
                  <div className="flex flex-wrap gap-2">
                    {message.availableSlots.map((slot, i) => {
                      const displayIndex = slot.index ?? i + 1;
                      return (
                        <button
                          key={displayIndex ?? slot.start}
                          disabled={loading || !selectedModel}
                          onClick={() => handleSelectSlot(displayIndex - 1)}
                          className="text-xs rounded px-2 py-1 bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
                          title={slot.score ? `Score: ${slot.score}` : ""}
                        >
                          {displayIndex}. {slot.label ?? slot.start}
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-[10px] text-muted-foreground">
                    Click a slot or type number / time (e.g. 14:30) or &apos;cancel&apos;
                  </div>
                </div>
              )}

              {message.data && renderEvents(message.data)}

              <div className="text-xs mt-1 opacity-70 text-right">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="rounded-xl p-3 flex items-center space-x-1 bg-muted">
              <div className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"></div>
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="w-2 h-2 rounded-full bg-muted-foreground animate-bounce"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-card">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-lg px-4 py-2 bg-background border border-input text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={loading || !selectedModel}
          />
          <button
            type="submit"
            disabled={loading || !input.trim() || !selectedModel}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}