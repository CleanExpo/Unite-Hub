/**
 * AI Phill Chat Interface
 *
 * Features:
 * - Chat interface with AI business advisor
 * - Recent insights sidebar
 * - Journal entries below
 * - Generate Digest button
 */

'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Lightbulb,
  FileText,
  TrendingUp,
  Calendar,
  Plus,
} from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface Insight {
  id: string;
  title: string;
  summary: string;
  businessId: string;
  businessName: string;
  timestamp: string;
  acknowledged: boolean;
}

interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  businessId?: string;
  businessName?: string;
}

export default function AiPhillPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content:
        "Hi! I'm AI Phill, your business intelligence advisor. I monitor your portfolio and provide insights based on signals across your businesses. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showNewJournal, setShowNewJournal] = useState(false);
  const [journalTitle, setJournalTitle] = useState('');
  const [journalContent, setJournalContent] = useState('');

  const [insights] = useState<Insight[]>([
    {
      id: '1',
      title: 'Strong SEO Performance',
      summary: 'Balustrade Co. organic traffic up 25% week-over-week',
      businessId: '1',
      businessName: 'Balustrade Co.',
      timestamp: '2 hours ago',
      acknowledged: false,
    },
    {
      id: '2',
      title: 'Competitor Alert',
      summary: 'New competitor detected in Melbourne market',
      businessId: '1',
      businessName: 'Balustrade Co.',
      timestamp: '1 day ago',
      acknowledged: false,
    },
    {
      id: '3',
      title: 'Social Engagement Spike',
      summary: 'LinkedIn engagement increased 40% this week',
      businessId: '2',
      businessName: 'Tech Startup',
      timestamp: '2 days ago',
      acknowledged: true,
    },
  ]);

  const [journalEntries] = useState<JournalEntry[]>([
    {
      id: '1',
      title: 'Q1 Strategy Review',
      content:
        'Reviewed Q1 performance across all businesses. Balustrade Co. exceeded targets by 15%. Tech Startup needs focus on customer retention...',
      timestamp: '3 days ago',
    },
    {
      id: '2',
      title: 'Marketing Budget Reallocation',
      content:
        'Decided to shift 20% of marketing budget from paid ads to content marketing based on AI Phill recommendations...',
      timestamp: '1 week ago',
      businessId: '1',
      businessName: 'Balustrade Co.',
    },
  ]);

  const handleSendMessage = async () => {
    if (!input.trim()) {
return;
}

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // TODO: Replace with actual API call to AI orchestrator
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          'Based on the signals I\'m tracking, here\'s what I can tell you: [This will be powered by the AI orchestrator with access to all business data, signals, and historical context.]',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 2000);
  };

  const handleGenerateDigest = () => {
    // TODO: Implement digest generation
    console.log('Generating weekly digest...');
  };

  const handleSaveJournal = () => {
    // TODO: Save journal entry to database
    console.log('Saving journal:', { title: journalTitle, content: journalContent });
    setShowNewJournal(false);
    setJournalTitle('');
    setJournalContent('');
  };

  const suggestedPrompts = [
    'What are the key trends across my businesses this week?',
    'Which business needs the most attention right now?',
    'Generate a performance summary for Balustrade Co.',
    'What opportunities should I focus on?',
  ];

  return (
    <PageContainer>
      {/* Header */}
      <Section>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-info-600 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-text-primary">AI Phill</h1>
              <p className="text-text-muted mt-1">Your AI Business Intelligence Advisor</p>
            </div>
          </div>
          <Button
            onClick={handleGenerateDigest}
            className="bg-gradient-to-r from-info-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            <FileText className="w-4 h-4 mr-2" />
            Generate Weekly Digest
          </Button>
        </div>
      </Section>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-8">
        {/* Chat Interface - 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Chat Messages */}
          <Card className="bg-bg-raised/50 border-border flex flex-col h-[600px]">
            <div className="p-4 border-b border-border">
              <div className="flex items-center space-x-2">
                <Bot className="w-5 h-5 text-info-400" />
                <h3 className="font-semibold text-text-primary">Chat with AI Phill</h3>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`flex items-start space-x-2 max-w-[80%] ${
                      message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        message.role === 'user'
                          ? 'bg-success-600'
                          : 'bg-gradient-to-br from-info-600 to-purple-600'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <User className="w-4 h-4 text-white" />
                      ) : (
                        <Bot className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div
                      className={`p-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-success-600/20 border border-success-500/30'
                          : 'bg-bg-elevated/50 border border-border'
                      }`}
                    >
                      <p className="text-sm text-text-primary">{message.content}</p>
                      <p className="text-xs text-text-muted mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-info-600 to-purple-600 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <div className="bg-bg-elevated/50 border border-border p-3 rounded-lg">
                      <div className="flex space-x-2">
                        <div className="w-2 h-2 bg-bg-elevated rounded-full animate-bounce" />
                        <div
                          className="w-2 h-2 bg-bg-elevated rounded-full animate-bounce"
                          style={{ animationDelay: '0.1s' }}
                        />
                        <div
                          className="w-2 h-2 bg-bg-elevated rounded-full animate-bounce"
                          style={{ animationDelay: '0.2s' }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border">
              <div className="flex items-center space-x-2">
                <Input
                  type="text"
                  placeholder="Ask AI Phill anything about your businesses..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-bg-base/50 border-border text-text-primary"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  className="bg-info-600 hover:bg-info-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Suggested Prompts */}
          <div className="grid grid-cols-2 gap-3">
            {suggestedPrompts.map((prompt, idx) => (
              <Button
                key={idx}
                variant="outline"
                onClick={() => setInput(prompt)}
                className="border-border text-text-secondary hover:bg-bg-raised justify-start text-left h-auto py-3"
              >
                <Lightbulb className="w-4 h-4 mr-2 flex-shrink-0" />
                <span className="text-sm">{prompt}</span>
              </Button>
            ))}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Recent Insights */}
          <Card className="bg-bg-raised/50 border-border">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary flex items-center">
                <TrendingUp className="w-4 h-4 mr-2 text-info-400" />
                Recent Insights
              </h3>
            </div>
            <div className="divide-y divide-border-subtle">
              {insights.slice(0, 5).map((insight) => (
                <div key={insight.id} className="p-4 hover:bg-bg-raised/30 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="text-sm font-semibold text-text-primary">{insight.title}</h4>
                    {!insight.acknowledged && (
                      <span className="w-2 h-2 bg-info-500 rounded-full flex-shrink-0 mt-1" />
                    )}
                  </div>
                  <p className="text-xs text-text-muted mb-2">{insight.summary}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-text-tertiary">{insight.businessName}</span>
                    <span className="text-xs text-text-tertiary">{insight.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-bg-raised/50 border-border p-4">
            <h3 className="font-semibold text-text-primary mb-4">This Week</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">New Insights</span>
                <span className="text-lg font-bold text-info-400">
                  {insights.filter((i) => !i.acknowledged).length}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Journal Entries</span>
                <span className="text-lg font-bold text-success-400">{journalEntries.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-muted">Avg Health Score</span>
                <span className="text-lg font-bold text-warning-400">84</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Journal Section */}
      <Section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-purple-400" />
            Journal Entries
          </h2>
          <Button
            onClick={() => setShowNewJournal(!showNewJournal)}
            variant="outline"
            className="border-border"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Entry
          </Button>
        </div>

        {showNewJournal && (
          <Card className="bg-bg-raised/50 border-border p-6 mb-6">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Entry title..."
                value={journalTitle}
                onChange={(e) => setJournalTitle(e.target.value)}
                className="bg-bg-base/50 border-border text-text-primary"
              />
              <Textarea
                placeholder="What's on your mind? Record insights, decisions, or reflections..."
                value={journalContent}
                onChange={(e) => setJournalContent(e.target.value)}
                rows={6}
                className="bg-bg-base/50 border-border text-text-primary"
              />
              <div className="flex items-center justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setShowNewJournal(false)}
                  className="border-border"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveJournal}
                  disabled={!journalTitle.trim() || !journalContent.trim()}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Save Entry
                </Button>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-4">
          {journalEntries.map((entry) => (
            <Card key={entry.id} className="bg-bg-raised/50 border-border p-6">
              <div className="flex items-start justify-between mb-3">
                <h3 className="text-lg font-semibold text-text-primary">{entry.title}</h3>
                <span className="text-sm text-text-tertiary">{entry.timestamp}</span>
              </div>
              <p className="text-text-secondary mb-3">{entry.content}</p>
              {entry.businessName && (
                <div className="pt-3 border-t border-border">
                  <span className="text-xs text-text-muted">Related to: {entry.businessName}</span>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Section>
    </PageContainer>
  );
}
