"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ChatModel {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
}

interface ChatModelContextType {
  selectedModel: ChatModel;
  selectModel: (model: ChatModel) => void;
  availableModels: ChatModel[];
}

const defaultModels: ChatModel[] = [
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

const ChatModelContext = createContext<ChatModelContextType | undefined>(undefined);

/**
 * Provide chat model context to descendants and manage the currently selected chat model.
 *
 * Initializes the selected model from localStorage in browser environments (falling back to the first default model)
 * and persists selection changes to localStorage. The context value exposes `selectedModel`, `selectModel`, and `availableModels`.
 *
 * @param children - React nodes that will receive the ChatModelContext
 * @returns The ChatModelContext provider element supplying `selectedModel`, `selectModel`, and `availableModels`
 */
export function ChatModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<ChatModel>(() => {
    // Load from localStorage on client side only
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("selectedModel");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          return defaultModels[0];
        }
      }
    }
    return defaultModels[0];
  });
  const [availableModels] = useState<ChatModel[]>(defaultModels);

  const selectModel = (model: ChatModel) => {
    setSelectedModel(model);
    if (typeof window !== "undefined") {
      localStorage.setItem("selectedModel", JSON.stringify(model));
    }
  };

  const value = {
    selectedModel,
    selectModel,
    availableModels,
  };

  return <ChatModelContext.Provider value={value}>{children}</ChatModelContext.Provider>;
}

/**
 * Provides access to the ChatModel context created by ChatModelProvider.
 *
 * @returns The context object containing `selectedModel`, `selectModel`, and `availableModels`.
 * @throws Error if the hook is called outside of a ChatModelProvider.
 */
export function useChatModel() {
  const context = useContext(ChatModelContext);
  if (context === undefined) {
    throw new Error("useChatModel must be used within a ChatModelProvider");
  }
  return context;
}