"use client";

import { useState, useCallback } from 'react';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function useCustomChat(initialMessages: Message[] = []) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  }, []);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    // Add user message
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [...messages, userMessage],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.content) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: data.content,
        };
        
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error('No content in response');
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      
      // Remove the assistant message if there was an error
      setMessages(prev => prev.filter(msg => msg.role === 'user' || msg.content !== ''));
    } finally {
      setIsLoading(false);
    }
  }, [input, messages, isLoading]);

  return {
    messages,
    input,
    isLoading,
    error,
    handleInputChange,
    handleSubmit,
    setInput,
  };
} 