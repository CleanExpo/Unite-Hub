"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Send, Bot } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface NexusAssistantProps {
  workspaceId?: string;
}

export function NexusAssistant({ workspaceId }: NexusAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "Hello! I'm NEXUS, your AI marketing assistant. I can help you review content, suggest improvements, and answer questions about your campaigns. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session && { Authorization: `Bearer ${session.access_token}` }),
        },
        body: JSON.stringify({
          message: userMessage.content,
          workspaceId,
          context: "workspace_assistant",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || "I apologize, but I couldn't process your request. Please try again.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="flex-[2] flex flex-col border-b border-gray-200">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-gray-200 bg-white">
        <div className="flex items-center font-semibold gap-2 text-gray-900">
          <div className="w-6 h-6 bg-blue-50 text-blue-600 rounded-md flex justify-center items-center">
            <Bot className="w-4 h-4" />
          </div>
          NEXUS Assistant
        </div>
        <button className="text-gray-400 hover:text-gray-600">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4 bg-gray-50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[85%] p-3 px-4 rounded-xl text-sm leading-relaxed ${
              message.role === "user"
                ? "self-end bg-blue-100 text-gray-900 rounded-br-sm"
                : "self-start bg-white border border-gray-200 text-gray-600 rounded-tl-sm flex gap-2.5"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-6 h-6 bg-blue-50 rounded-full flex-shrink-0" />
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-white border border-gray-200 text-gray-600 rounded-xl rounded-tl-sm p-3 px-4 flex gap-2.5">
            <div className="w-6 h-6 bg-blue-50 rounded-full flex-shrink-0" />
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 bg-white border-t border-gray-200 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full border border-gray-200 bg-gray-100 py-3 px-4 pr-10 rounded-full outline-none text-sm focus:border-blue-300 focus:ring-1 focus:ring-blue-300"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-500 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </section>
  );
}
