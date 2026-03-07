/**
 * Client AI Assistant Page - Phase 2 Step 3
 *
 * AI-powered assistant for client questions and support
 * Will be wired to AI APIs in Phase 2 Step 4
 */

'use client';

import { useState } from 'react';
import { AILoader } from '@/components/ai/AILoader';
import { AIInsightBubble } from '@/components/ai/AIInsightBubble';
import { Bot, Send, Lightbulb, FolderKanban, HelpCircle } from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

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
    <PageContainer>
      <Section>
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold font-mono text-white">
            AI Assistant
          </h1>
          <p className="text-white/40 mt-2">
            Get instant answers about your projects, ideas, and proposals
          </p>
        </div>
      </Section>

      <Section>
        {/* Chat interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main chat area */}
        <div className="lg:col-span-2">
          <div className="h-[600px] flex flex-col bg-white/[0.02] border border-white/[0.06] rounded-sm">
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
                      <div className="p-2 bg-[#FF00FF]/10 rounded-sm">
                        <Bot className="h-5 w-5 text-[#FF00FF]" />
                      </div>
                      <div className="max-w-md">
                        <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                          <p className="text-white font-mono text-sm">{message.content}</p>
                        </div>
                        <p className="text-xs text-white/30 mt-1 ml-1 font-mono">
                          {message.timestamp.toLocaleTimeString('en-AU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  )}

                  {message.role === 'user' && (
                    <div className="max-w-md">
                      <div className="p-4 bg-[#00F5FF]/10 border border-[#00F5FF]/20 rounded-sm">
                        <p className="text-white font-mono text-sm">{message.content}</p>
                      </div>
                      <p className="text-xs text-white/30 mt-1 mr-1 text-right font-mono">
                        {message.timestamp.toLocaleTimeString('en-AU', {
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
                    <div className="p-2 bg-[#FF00FF]/10 rounded-sm">
                      <Bot className="h-5 w-5 text-[#FF00FF]" />
                    </div>
                    <div className="p-4 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                      <AILoader text="Thinking..." />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input area */}
            <div className="p-4 border-t border-white/[0.06]">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Ask me anything about your projects..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    className="w-full px-3 py-2 bg-white/[0.04] border border-white/[0.06] rounded-sm text-white font-mono text-sm placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40"
                  />
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar with suggestions and tips */}
        <div className="space-y-6">
          {/* Suggested questions */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-6">
              <h3 className="text-lg font-mono font-semibold text-white mb-4">
                Suggested Questions
              </h3>
              <div className="space-y-2">
                {suggestedQuestions.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuestion(item.question)}
                      className="w-full flex items-start space-x-3 p-3 bg-white/[0.02] hover:bg-white/[0.04] border border-white/[0.06] rounded-sm transition-colors text-left"
                    >
                      <Icon className="h-4 w-4 text-white/40 mt-0.5" />
                      <span className="text-sm font-mono text-white/60">{item.question}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI capabilities */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-6">
              <h3 className="text-lg font-mono font-semibold text-white mb-4">
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
          </div>

          {/* AI info */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
            <div className="p-6">
              <div className="flex items-start space-x-3">
                <Bot className="h-5 w-5 text-[#FF00FF] mt-0.5" />
                <div>
                  <p className="text-sm font-mono font-medium text-white mb-1">
                    Powered by AI
                  </p>
                  <p className="text-xs font-mono text-white/40">
                    This assistant uses intelligent routing between Gemini 3 Pro, OpenRouter, and Anthropic for optimal responses.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </Section>
    </PageContainer>
  );
}
