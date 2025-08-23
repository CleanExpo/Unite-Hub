"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import the chatbot to avoid SSR issues
const Chatbot = dynamic(() => import('./chatbot'), {
  ssr: false,
  loading: () => null,
});

interface ChatbotContextType {
  isChatbotVisible: boolean;
  showChatbot: () => void;
  hideChatbot: () => void;
  toggleChatbot: () => void;
}

const ChatbotContext = createContext<ChatbotContextType | undefined>(undefined);

export function useChatbot() {
  const context = useContext(ChatbotContext);
  if (context === undefined) {
    throw new Error('useChatbot must be used within a ChatbotProvider');
  }
  return context;
}

interface ChatbotProviderProps {
  children: React.ReactNode;
}

export function ChatbotProvider({ children }: ChatbotProviderProps) {
  const [isChatbotVisible, setIsChatbotVisible] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const showChatbot = () => setIsChatbotVisible(true);
  const hideChatbot = () => setIsChatbotVisible(false);
  const toggleChatbot = () => setIsChatbotVisible(!isChatbotVisible);

  const value = {
    isChatbotVisible,
    showChatbot,
    hideChatbot,
    toggleChatbot,
  };

  return (
    <ChatbotContext.Provider value={value}>
      {children}
      {isMounted && <Chatbot />}
    </ChatbotContext.Provider>
  );
} 