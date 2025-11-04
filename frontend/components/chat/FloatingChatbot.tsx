"use client";

import { useState } from "react";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { ChatWindow } from "./ChatWindow";

/**
 * Render a floating chat button that toggles a chat window.
 *
 * The button is fixed to the bottom-right, updates internal open state when clicked,
 * and the ChatWindow receives the current `isOpen` state and an `onClose` handler.
 *
 * @returns The component's JSX element containing the floating button and chat window.
 */
export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Floating chat button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center transition-all duration-200 z-[60] ${
          isOpen ? "scale-90" : "scale-100"
        }`}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
       
          <ChatBubbleLeftRightIcon className="h-6 w-6" />
      </button>

      {/* Chat window */}
      <ChatWindow isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  );
}