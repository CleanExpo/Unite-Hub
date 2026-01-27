'use client';

/**
 * Synthex AI Assistant Page
 *
 * Interactive AI marketing assistant for:
 * - Content ideas and brainstorming
 * - SEO recommendations
 * - Campaign strategy
 * - Quick content generation
 */

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Bot,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  FileText,
  Lightbulb,
} from 'lucide-react';

const QUICK_PROMPTS = [
  {
    icon: Lightbulb,
    label: 'Content Ideas',
    prompt: 'Generate 5 content ideas for my business this month',
  },
  {
    icon: Target,
    label: 'SEO Strategy',
    prompt: 'What are the top SEO improvements I should make?',
  },
  {
    icon: TrendingUp,
    label: 'Growth Tips',
    prompt: 'How can I grow my online presence this quarter?',
  },
  {
    icon: FileText,
    label: 'Blog Outline',
    prompt: 'Create a blog post outline about industry trends',
  },
];

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AssistantPage() {
  const searchParams = useSearchParams();
  const tenantId = searchParams.get('tenantId');

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    // Simulate AI response (in production, this calls the Synthex AGI bridge)
    setTimeout(() => {
      const assistantMessage: Message = {
        role: 'assistant',
        content: `I'd be happy to help with that! Here's my recommendation:\n\n${getSimulatedResponse(text)}\n\nWould you like me to create a job for any of these suggestions?`,
      };
      setMessages(prev => [...prev, assistantMessage]);
      setLoading(false);
    }, 1500);
  };

  const getSimulatedResponse = (prompt: string): string => {
    if (prompt.toLowerCase().includes('content')) {
      return '1. Behind-the-scenes of your process\n2. Customer success story spotlight\n3. Industry trend analysis post\n4. How-to guide for common problems\n5. Weekly tips series for social media';
    }
    if (prompt.toLowerCase().includes('seo')) {
      return '- Optimize page titles and meta descriptions\n- Add schema markup for rich snippets\n- Improve page load speed (target < 2s)\n- Build quality backlinks through guest posts\n- Create topic cluster content strategy';
    }
    if (prompt.toLowerCase().includes('grow')) {
      return '- Double down on your best-performing content channel\n- Start a referral program\n- Launch email nurture sequences\n- Invest in video content (short-form)\n- Partner with complementary businesses';
    }
    return '- Analyze your current marketing performance\n- Identify quick wins vs long-term strategy\n- Focus on channels with best ROI\n- Automate repetitive marketing tasks\n- Test and iterate on messaging';
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col h-[calc(100vh-200px)]">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
          <Bot className="h-6 w-6 text-blue-400" />
          AI Marketing Assistant
        </h1>
        <p className="text-gray-400 mt-1">
          Your AI-powered marketing strategist
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.length === 0 ? (
          <div className="space-y-6">
            <Card className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-500/20">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-6 w-6 text-blue-400 mt-0.5" />
                  <div>
                    <p className="text-gray-200 font-medium">Welcome to your AI Marketing Assistant</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Ask me anything about content strategy, SEO, campaigns, or marketing growth.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-3">
              {QUICK_PROMPTS.map((qp, i) => {
                const Icon = qp.icon;
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(qp.prompt)}
                    className="flex items-center gap-3 p-4 bg-gray-900 border border-gray-800 rounded-lg hover:border-gray-700 hover:bg-gray-800 transition-colors text-left"
                  >
                    <Icon className="h-5 w-5 text-blue-400 flex-shrink-0" />
                    <span className="text-sm text-gray-300">{qp.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-900 border border-gray-800 text-gray-200'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-900 border border-gray-800 rounded-lg px-4 py-3">
              <div className="flex items-center gap-2 text-gray-400 text-sm">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.1s]" />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                </div>
                Thinking...
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
          placeholder="Ask about marketing strategy, content ideas, SEO..."
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-4 py-3 text-gray-100 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
          disabled={loading}
        />
        <Button
          onClick={() => sendMessage(input)}
          disabled={loading || !input.trim()}
          className="px-4"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
