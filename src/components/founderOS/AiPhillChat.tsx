"use client";

import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Brain,
  Send,
  Loader2,
  Sparkles,
  User,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  confidence?: number;
}

interface WisdomQuote {
  text: string;
  author: string;
}

interface AiPhillChatProps {
  onSendMessage?: (message: string) => Promise<string>;
  initialMessages?: Message[];
  wisdomQuotes?: WisdomQuote[];
  maxHeight?: string;
}

const defaultWisdom: WisdomQuote[] = [
  {
    text: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb",
  },
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill",
  },
  {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
];

export function AiPhillChat({
  onSendMessage,
  initialMessages = [],
  wisdomQuotes = defaultWisdom,
  maxHeight = "500px",
}: AiPhillChatProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [currentWisdom, setCurrentWisdom] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isThinking) {
return;
}

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsThinking(true);

    try {
      let assistantResponse: string;

      if (onSendMessage) {
        assistantResponse = await onSendMessage(userMessage.content);
      } else {
        // Mock response for demo
        await new Promise((resolve) => setTimeout(resolve, 1500));
        assistantResponse = `I understand you're asking about "${userMessage.content}". As your AI business advisor, I'd recommend breaking this down into actionable steps and tracking key metrics. What specific aspect would you like to explore further?`;
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: assistantResponse,
        timestamp: new Date(),
        confidence: Math.floor(Math.random() * 20) + 80, // 80-100
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I apologize, but I encountered an error. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsThinking(false);
    }
  };

  const rotateWisdom = () => {
    setCurrentWisdom((prev) => (prev + 1) % wisdomQuotes.length);
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="grid lg:grid-cols-[1fr_300px] gap-4">
      {/* Main Chat */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Phill
            <Badge variant="secondary" className="ml-auto">
              <Sparkles className="h-3 w-3 mr-1" />
              Powered by AI
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          <ScrollArea style={{ height: maxHeight }} ref={scrollRef}>
            <div className="space-y-4 pr-4">
              {messages.length === 0 && !isThinking && (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                  <Brain className="h-16 w-16 mb-4 opacity-20" />
                  <h3 className="font-medium text-lg mb-2">Welcome to AI Phill</h3>
                  <p className="text-sm max-w-sm">
                    Your AI-powered business advisor. Ask me anything about your business,
                    strategy, or get insights on how to grow.
                  </p>
                </div>
              )}

              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        <Brain className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}

                  <div
                    className={`flex flex-col gap-1 max-w-[80%] ${
                      message.role === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`rounded-lg px-4 py-2 ${
                        message.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 px-2">
                      <span className="text-xs text-muted-foreground">
                        {formatTimestamp(message.timestamp)}
                      </span>
                      {message.confidence && (
                        <Badge variant="outline" className="text-xs">
                          {message.confidence}% confident
                        </Badge>
                      )}
                    </div>
                  </div>

                  {message.role === "user" && (
                    <Avatar className="h-8 w-8 shrink-0">
                      <AvatarFallback className="bg-secondary">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}

              {/* Thinking Indicator */}
              {isThinking && (
                <div className="flex gap-3 justify-start">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      <Brain className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="bg-muted rounded-lg px-4 py-2 flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    <span className="text-sm text-muted-foreground">Phill is thinking...</span>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask Phill anything about your business..."
              disabled={isThinking}
              className="flex-1"
            />
            <Button type="submit" disabled={!input.trim() || isThinking}>
              {isThinking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Wisdom Sidebar */}
      <Card className="hidden lg:block">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Lightbulb className="h-5 w-5" />
            Wisdom
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Quote */}
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 space-y-3">
              <p className="text-sm leading-relaxed italic">
                "{wisdomQuotes[currentWisdom].text}"
              </p>
              <p className="text-xs text-muted-foreground text-right">
                — {wisdomQuotes[currentWisdom].author}
              </p>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={rotateWisdom}
              className="w-full"
            >
              <RefreshCw className="h-3 w-3 mr-2" />
              Next Quote
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
              Quick Actions
            </h4>
            <div className="space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput("What should I focus on this week?")}
              >
                <Sparkles className="h-3 w-3 mr-2" />
                Weekly Focus
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput("Analyze my business health")}
              >
                <Brain className="h-3 w-3 mr-2" />
                Health Check
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setInput("What signals need attention?")}
              >
                <Lightbulb className="h-3 w-3 mr-2" />
                Priority Signals
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="space-y-2 pt-4 border-t">
            <h4 className="text-xs font-medium text-muted-foreground uppercase">
              Conversation Stats
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className="text-lg font-bold">{messages.length}</div>
                <div className="text-xs text-muted-foreground">Messages</div>
              </div>
              <div className="bg-muted rounded-lg p-2 text-center">
                <div className="text-lg font-bold">
                  {messages.filter((m) => m.role === "assistant").length}
                </div>
                <div className="text-xs text-muted-foreground">Insights</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
