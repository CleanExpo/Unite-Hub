/**
 * Client AI Assistant Page - Phase 2 Step 3
 *
 * AI-powered assistant for client questions and support
 * Will be wired to AI APIs in Phase 2 Step 4
 */

'use client';

import { useState } from 'react';
import { Card } from '@/next/components/ui/Card';
import { Button } from '@/next/components/ui/Button';
import { Input } from '@/next/components/ui/Input';
import { AILoader } from '@/next/components/ai/AILoader';
import { AIInsightBubble } from '@/next/components/ai/AIInsightBubble';
import { Bot, Send, Lightbulb, FolderKanban, HelpCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ClientAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. I can help you with questions about your projects, ideas, proposals, and more. What would you like to know?',
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const suggestedQuestions = [
    {
      icon: Lightbulb,
      question: 'What is the status of my latest idea?',
    },
    {
      icon: FolderKanban,
      question: 'Show me my active projects',
    },
    {
      icon: HelpCircle,
      question: 'How do I submit a new idea?',
    },
  ];

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // TODO: Replace with actual API call in Phase 2 Step 4
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'This is a simulated response. In production, this will be powered by our AI orchestrator with intelligent routing between Gemini 3 Pro, OpenRouter, and Anthropic.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleSuggestedQuestion = (question: string) => {
    setInput(question);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          AI Assistant
        </h1>
        <p className="text-gray-400 mt-2">
          Get instant answers about your projects, ideas, and proposals
        </p>
      </div>

      {/* Chat interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chat area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            {/* Chat messages */}
            <div className="flex-1 p-6 overflow-y-auto space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Bot className="h-5 w-5 text-purple-400" />
                      </div>
                      <div className="max-w-md">
                        <div className="p-4 bg-gray-800/50 rounded-lg">
                          <p className="text-gray-100">{message.content}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1 ml-1">
                          {message.timestamp.toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {message.role === 'user' && (
                    <div className="max-w-md">
                      <div className="p-4 bg-blue-500/20 rounded-lg">
                        <p className="text-gray-100">{message.content}</p>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 mr-1 text-right">
                        {message.timestamp.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                      <Bot className="h-5 w-5 text-purple-400" />
                    </div>
                    <div className="p-4 bg-gray-800/50 rounded-lg">
                      <AILoader text="Thinking..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-gray-800">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <Input
                    placeholder="Ask me anything about your projects..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                  />
                </div>
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  leftIcon={<Send className="h-4 w-4" />}
                >
                  Send
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar with suggestions and tips */}
        <div className="space-y-6">
          {/* Suggested questions */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(item.question)}
                      className="w-full flex items-start space-x-3 p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="text-sm text-gray-300">{item.question}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </Card>

          {/* AI capabilities */}
          <Card>
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-100 mb-4">
                What I Can Help With
              </h3>
              <div className="space-y-3">
                <AIInsightBubble
                  type="insight"
                  content="Track project status and milestones"
                />
                <AIInsightBubble
                  type="suggestion"
                  content="Review and understand proposals"
                />
                <AIInsightBubble
                  type="insight"
                  content="Answer questions about ideas"
                />
              </div>
            </div>
          </Card>

          {/* AI info */}
          <Card variant="glass">
            <div className="p-6">
              <div className="flex items-start space-x-3">
                <Bot className="h-5 w-5 text-purple-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-100 mb-1">
                    Powered by AI
                  </p>
                  <p className="text-xs text-gray-400">
                    This assistant uses intelligent routing between Gemini 3 Pro, OpenRouter, and Anthropic for optimal responses.
                  </p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
