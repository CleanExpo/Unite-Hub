"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Send, Bot, Sparkles } from "lucide-react";
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
      content: "Hello! I'm NEXUS, your AI marketing assistant. I've analyzed your pending content and everything looks great. The TikTok video has strong engagement potential. Would you like me to suggest any optimizations?",
      timestamp: new Date(),
    },
    {
      id: "2",
      role: "user",
      content: "What about the banana banner set?",
      timestamp: new Date(),
    },
    {
      id: "3",
      role: "assistant",
      content: "The Banana Creative banner set is optimized for all channels - I've generated 12 size variations including Instagram Stories (1080x1920), Facebook Feed (1200x628), and Google Display (300x250). Color contrast scores are excellent at 7.2:1 for accessibility.",
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
    <section className="flex-[2] flex flex-col border-b border-cyan-900/30">
      {/* Header */}
      <div className="px-4 py-3 flex justify-between items-center border-b border-cyan-900/30 bg-[#0d2137]/50">
        <div className="flex items-center font-semibold gap-2 text-white text-sm">
          <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-md flex justify-center items-center shadow-lg shadow-cyan-500/20">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          NEXUS Assistant
        </div>
        <button className="text-gray-500 hover:text-cyan-400 transition-colors">
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 p-3 overflow-y-auto flex flex-col gap-3 bg-[#081624]/50">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`max-w-[90%] p-3 rounded-xl text-xs leading-relaxed ${
              message.role === "user"
                ? "self-end bg-cyan-500/20 text-cyan-100 rounded-br-sm border border-cyan-500/30"
                : "self-start bg-[#0d2137]/80 border border-cyan-900/30 text-gray-300 rounded-tl-sm"
            }`}
          >
            {message.role === "assistant" && (
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cyan-900/30">
                <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-teal-500 rounded flex items-center justify-center">
                  <Bot className="w-2.5 h-2.5 text-white" />
                </div>
                <span className="text-[10px] text-cyan-400 font-medium">NEXUS</span>
              </div>
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
        ))}
        {isLoading && (
          <div className="self-start bg-[#0d2137]/80 border border-cyan-900/30 text-gray-300 rounded-xl rounded-tl-sm p-3">
            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-cyan-900/30">
              <div className="w-4 h-4 bg-gradient-to-br from-cyan-400 to-teal-500 rounded flex items-center justify-center">
                <Bot className="w-2.5 h-2.5 text-white" />
              </div>
              <span className="text-[10px] text-cyan-400 font-medium">NEXUS</span>
            </div>
            <div className="flex gap-1 items-center">
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
              <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 bg-[#0d2137]/50 border-t border-cyan-900/30 relative">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type a message..."
          className="w-full bg-[#081624] border border-cyan-900/30 py-2.5 px-4 pr-10 rounded-lg outline-none text-xs text-white placeholder-gray-500 focus:border-cyan-600/50 focus:ring-1 focus:ring-cyan-600/30 transition-all"
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-500 hover:text-cyan-400 disabled:opacity-30 transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
}
