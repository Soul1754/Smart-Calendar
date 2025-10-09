import React, { createContext, useContext, useState } from 'react';

const ChatModelContext = createContext();

export const useChatModel = () => useContext(ChatModelContext);

const AVAILABLE_MODELS = [
  { id: 'llama2-70b', name: 'Llama 2 (70B)', provider: 'Groq' },
  { id: 'mixtral-8x7b', name: 'Mixtral (8x7B)', provider: 'Groq' },
  { id: 'gemma-7b', name: 'Gemma (7B)', provider: 'Groq' }
];

export const ChatModelProvider = ({ children }) => {
  const [selectedModel, setSelectedModel] = useState(() => {
    const savedModel = localStorage.getItem('selectedModel');
    return savedModel ? JSON.parse(savedModel) : AVAILABLE_MODELS[0];
  });

  const selectModel = (model) => {
    setSelectedModel(model);
    localStorage.setItem('selectedModel', JSON.stringify(model));
  };

  return (
    <ChatModelContext.Provider value={{ 
      selectedModel, 
      selectModel, 
      availableModels: AVAILABLE_MODELS 
    }}>
      {children}
    </ChatModelContext.Provider>
  );
};
