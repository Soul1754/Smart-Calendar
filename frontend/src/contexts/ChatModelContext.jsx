import React, { createContext, useContext, useState } from "react";

const ChatModelContext = createContext();

export const useChatModel = () => useContext(ChatModelContext);

const AVAILABLE_MODELS = [
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

export const ChatModelProvider = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem("selectedModel");
    return savedModel ? JSON.parse(savedModel) : AVAILABLE_MODELS[0];
  });

  const selectModel = (model) => {
    setSelectedModel(model);
    localStorage.setItem("selectedModel", JSON.stringify(model));
  };

  return (
    <ChatModelContext.Provider
      value={{
        selectedModel,
        selectModel,
        availableModels: AVAILABLE_MODELS,
      }}
    >
      {children}
    </ChatModelContext.Provider>
  );
};
