"use client";

import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Send, Bot, User, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ExplanationMode } from "@/lib/strategy/strategyGenerator";

interface Message {
  id: string;
  role: "client" | "assistant" | "system";
  content: string;
  explanation_mode: ExplanationMode;
  created_at: string;
}

interface AIConsultationPanelProps {
  consultationId: string;
  initialMode?: ExplanationMode;
  onInsight?: (insight: { type: string; payload: Record<string, unknown> }) => void;
}

export function AIConsultationPanel({
  consultationId,
  initialMode = "founder",
  onInsight,
}: AIConsultationPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState<ExplanationMode>(initialMode);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load messages on mount
  useEffect(() => {
    loadMessages();
  }, [consultationId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function loadMessages() {
    try {
      const res = await fetch(`/api/ai-consultations/${consultationId}`);
      if (!res.ok) {
        throw new Error("Failed to load messages");
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error("Failed to load messages:", error);
    } finally {
      setInitialLoading(false);
    }
  }

  async function sendMessage() {
    const trimmedInput = input.trim();
    if (!trimmedInput || loading) {
return;
}

    setLoading(true);
    setInput("");

    // Optimistically add client message
    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      role: "client",
      content: trimmedInput,
      explanation_mode: mode,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMessage]);

    try {
      const res = await fetch(`/api/ai-consultations/${consultationId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: trimmedInput,
          explanation_mode: mode,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to send message");
      }

      const data = await res.json();
      setMessages(data.messages || []);

      // Check for any insights in the response
      if (data.insights && onInsight) {
        for (const insight of data.insights) {
          onInsight(insight);
        }
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setInput(trimmedInput); // Restore input
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const getModeLabel = (m: ExplanationMode): string => {
    switch (m) {
      case "eli5":
        return "ELI5";
      case "beginner":
        return "Beginner";
      case "technical":
        return "Technical";
      case "founder":
        return "Founder";
      default:
        return m;
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full border rounded-lg bg-background">
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages
            .filter((m) => m.role !== "system")
            .map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex gap-3",
                  message.role === "client" ? "justify-end" : "justify-start"
                )}
              >
                {message.role === "assistant" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                )}

                <div
                  className={cn(
                    "max-w-[80%] rounded-lg px-4 py-2",
                    message.role === "client"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] opacity-70">
                      {message.role === "client" ? "You" : "AI Phill"}
                    </span>
                    <span className="text-[10px] opacity-50">
                      {getModeLabel(message.explanation_mode)}
                    </span>
                  </div>
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>

                {message.role === "client" && (
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            ))}

          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary" />
              </div>
              <div className="bg-muted rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span className="text-sm text-muted-foreground">
                    AI Phill is thinking...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area */}
      <div className="border-t p-4 space-y-3 bg-muted/30">
        {/* Mode selector */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Info className="w-3 h-3" />
          <span>How should AI Phill explain?</span>
          <Select
            value={mode}
            onValueChange={(v) => setMode(v as ExplanationMode)}
          >
            <SelectTrigger className="w-[140px] h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="eli5">Explain like I&apos;m 5</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="founder">Founder view</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Message input */}
        <div className="flex gap-2">
          <Textarea
            className="flex-1 min-h-[60px] max-h-[120px] resize-none text-sm"
            placeholder="Ask AI Phill about strategies, risks, options..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={loading}
          />
          <Button
            onClick={sendMessage}
            disabled={loading || !input.trim()}
            size="icon"
            className="h-[60px] w-[60px]"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AIConsultationPanel;
