"use client";

import { createContext, useContext, useState, ReactNode } from "react";

interface ChatModel {
  id: string;
  name: string;
  provider: string;
}

interface ChatModelContextType {
  selectedModel: ChatModel;
  selectModel: (model: ChatModel) => void;
  availableModels: ChatModel[];
}

const defaultModels: ChatModel[] = [
  { id: "llama-3.3-70b-versatile", name: "Llama 3.3 70B", provider: "groq" },
  { id: "llama-3.1-70b-versatile", name: "Llama 3.1 70B", provider: "groq" },
  { id: "mixtral-8x7b-32768", name: "Mixtral 8x7B", provider: "groq" },
];

const ChatModelContext = createContext<ChatModelContextType | undefined>(undefined);

export function ChatModelProvider({ children }: { children: ReactNode }) {
  const [selectedModel, setSelectedModel] = useState<ChatModel>(defaultModels[0]);
  const [availableModels] = useState<ChatModel[]>(defaultModels);

  const selectModel = (model: ChatModel) => {
    setSelectedModel(model);
  };

  const value = {
    selectedModel,
    selectModel,
    availableModels,
  };

  return <ChatModelContext.Provider value={value}>{children}</ChatModelContext.Provider>;
}

export function useChatModel() {
  const context = useContext(ChatModelContext);
  if (context === undefined) {
    throw new Error("useChatModel must be used within a ChatModelProvider");
  }
  return context;
}
