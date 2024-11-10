import React, { createContext, useContext, useState } from 'react';
import { Message } from '../../types/chat';
import { useAiSettings } from '../../hooks/useAiSettings';

interface ChatContextType {
  messages: Message[];
  addMessage: (message: Message) => void;
  settings: any;
  isLoading: boolean;
  error: string | null;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const { settings, loading: isLoading, error } = useAiSettings();

  const addMessage = (message: Message) => {
    setMessages((prev) => [...prev, message]);
  };

  return (
    <ChatContext.Provider value={{ messages, addMessage, settings, isLoading, error }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};