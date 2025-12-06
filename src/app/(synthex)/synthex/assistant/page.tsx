/**
 * Synthex AI Assistant
 *
 * Chat interface for AI interaction:
 * - Chat interface with message history
 * - Context-aware responses
 * - Quick action buttons
 * - Ability to trigger agent actions
 *
 * IMPLEMENTED[PHASE_B3]: Wire up assistant API
 * IMPLEMENTED[PHASE_B4]: Add agent action triggers
 * IMPLEMENTED[PHASE_B4]: Implement context awareness with autonomous mode
 *
 * Backlog: SYNTHEX-010
 */

'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Bot,
  Send,
  Sparkles,
  FileText,
  Search,
  Megaphone,
  BarChart3,
  HelpCircle,
  MessageSquare,
  Lightbulb,
  Loader2,
  User,
  Plus,
  History,
  Zap,
  Brain,
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface Conversation {
  conversation_id: string;
  last_message: string;
  created_at: string;
}

export default function SynthexAssistantPage() {
  const [tenantId, setTenantId] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [autonomousMode, setAutonomousMode] = useState(false);
  const [tokensUsed, setTokensUsed] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const loadHistory = async () => {
    if (!tenantId) return;

    try {
      const params = new URLSearchParams({ tenantId });
      if (conversationId) {
        params.append('conversationId', conversationId);
      }

      const res = await fetch(`/api/synthex/assistant/history?${params}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to load history');
      }

      setMessages(data.messages || []);
      if (data.conversations) {
        setConversations(data.conversations);
      }
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const sendMessage = async () => {
    if (!tenantId || !input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setError(null);
    setLoading(true);

    // Optimistically add user message
    const tempUserMsg: Message = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: userMessage,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      // Use agent API when autonomous mode is enabled, otherwise use regular assistant
      const endpoint = autonomousMode
        ? '/api/synthex/agent/run'
        : '/api/synthex/assistant/run';

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          [autonomousMode ? 'task' : 'prompt']: userMessage,
          conversationId,
          autonomousMode,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      // Update conversation ID
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Track tokens used (agent API returns this)
      if (data.tokensUsed) {
        setTokensUsed((prev) => prev + data.tokensUsed);
      }

      // Handle response based on API used
      const assistantContent = autonomousMode ? data.response : data.message?.content;
      const assistantId = autonomousMode ? `agent-${Date.now()}` : data.message?.id;

      // Add assistant response
      setMessages((prev) => [
        ...prev.filter((m) => m.id !== tempUserMsg.id),
        {
          id: `user-${Date.now()}`,
          role: 'user',
          content: userMessage,
          created_at: new Date().toISOString(),
        },
        {
          id: assistantId,
          role: 'assistant',
          content: assistantContent,
          created_at: new Date().toISOString(),
        },
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
      // Remove optimistic message on error
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setLoading(false);
    }
  };

  const startNewConversation = () => {
    setConversationId(null);
    setMessages([]);
    setError(null);
  };

  const selectConversation = (convId: string) => {
    setConversationId(convId);
    loadHistory();
  };

  const handleQuickAction = (prompt: string) => {
    setInput(prompt);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">AI Assistant</h1>
        <p className="text-gray-400 mt-2">
          Your intelligent marketing companion
        </p>
      </div>

      {/* Tenant ID Input (temporary - will auto-populate from session) */}
      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Tenant ID</label>
              <Input
                placeholder="Enter your tenant ID..."
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                className="bg-gray-800 border-gray-700 text-gray-100"
              />
            </div>
            <Button
              onClick={loadHistory}
              disabled={!tenantId}
              variant="outline"
              className="border-gray-700"
            >
              <History className="h-4 w-4 mr-2" />
              Load History
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <Card className="bg-gray-900 border-gray-800 lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                {autonomousMode ? (
                  <Brain className="h-5 w-5 text-amber-400" />
                ) : (
                  <Bot className="h-5 w-5 text-purple-400" />
                )}
                {autonomousMode ? 'Autonomous Agent' : 'Chat with AI'}
              </CardTitle>
              <CardDescription className="text-gray-400">
                {autonomousMode
                  ? 'Context-aware agent with memory and action capabilities'
                  : 'Ask questions about your marketing or get help with tasks'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              {/* Autonomous Mode Toggle */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="autonomous-mode"
                  checked={autonomousMode}
                  onCheckedChange={setAutonomousMode}
                />
                <Label htmlFor="autonomous-mode" className="text-gray-400 text-sm flex items-center gap-1">
                  <Zap className="h-3 w-3" />
                  Agent Mode
                </Label>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={startNewConversation}
                className="border-gray-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Messages Area */}
            <ScrollArea
              ref={scrollRef}
              className="h-96 bg-gray-800/50 rounded-lg border border-gray-700 p-4"
            >
              {!tenantId ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="h-16 w-16 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      Enter Tenant ID to Start
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      Enter your tenant ID above to start chatting with the AI assistant.
                    </p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <Sparkles className="h-16 w-16 text-purple-400/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-300 mb-2">
                      Start a Conversation
                    </h3>
                    <p className="text-gray-500 max-w-sm">
                      Ask me anything about content creation, SEO strategy, or marketing campaigns.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {msg.role === 'assistant' && (
                        <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-white" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] rounded-lg p-3 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-100'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      </div>
                      {msg.role === 'user' && (
                        <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                  {loading && (
                    <div className="flex gap-3 justify-start">
                      <div className="h-8 w-8 rounded-full bg-purple-600 flex items-center justify-center">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="bg-gray-700 rounded-lg p-3">
                        <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-800 rounded-lg p-3 text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Chat Input */}
            <div className="flex gap-2">
              <Input
                placeholder="Ask me anything about your marketing..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                className="bg-gray-800 border-gray-700 text-gray-100"
                disabled={!tenantId || loading}
              />
              <Button
                onClick={sendMessage}
                disabled={!tenantId || !input.trim() || loading}
                className="gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions Sidebar */}
        <div className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-400" />
                Quick Actions
              </CardTitle>
              <CardDescription className="text-gray-400">
                Common tasks you can ask the AI
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                onClick={() => handleQuickAction('Generate 5 content ideas for my business')}
                disabled={!tenantId}
              >
                <FileText className="h-4 w-4 mr-3" />
                Generate content ideas
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                onClick={() => handleQuickAction('What are the top SEO improvements I should make?')}
                disabled={!tenantId}
              >
                <Search className="h-4 w-4 mr-3" />
                Analyze my SEO
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                onClick={() => handleQuickAction('Help me plan an email campaign for customer re-engagement')}
                disabled={!tenantId}
              >
                <Megaphone className="h-4 w-4 mr-3" />
                Plan a campaign
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start text-gray-300 border-gray-700 hover:bg-gray-800"
                onClick={() => handleQuickAction('What marketing metrics should I be tracking?')}
                disabled={!tenantId}
              >
                <BarChart3 className="h-4 w-4 mr-3" />
                Review my analytics
              </Button>
            </CardContent>
          </Card>

          {/* Recent Conversations */}
          {conversations.length > 0 && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-gray-100 flex items-center gap-2">
                  <History className="h-5 w-5 text-blue-400" />
                  Recent Chats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {conversations.map((conv) => (
                  <Button
                    key={conv.conversation_id}
                    variant="ghost"
                    className="w-full justify-start text-gray-400 hover:text-gray-200 hover:bg-gray-800 text-left"
                    onClick={() => selectConversation(conv.conversation_id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                    <span className="truncate">{conv.last_message}</span>
                  </Button>
                ))}
              </CardContent>
            </Card>
          )}

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-blue-400" />
                Example Questions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-400">
              <p
                className="p-2 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:bg-gray-800"
                onClick={() => handleQuickAction('What content should I create for my plumbing business?')}
              >
                "What content should I create for my plumbing business?"
              </p>
              <p
                className="p-2 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:bg-gray-800"
                onClick={() => handleQuickAction('How can I improve my local SEO rankings?')}
              >
                "How can I improve my local SEO rankings?"
              </p>
              <p
                className="p-2 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:bg-gray-800"
                onClick={() => handleQuickAction('Create an email sequence for new customers')}
              >
                "Create an email sequence for new customers"
              </p>
              <p
                className="p-2 bg-gray-800/50 rounded border border-gray-700 cursor-pointer hover:bg-gray-800"
                onClick={() => handleQuickAction('What social media posts work best for trades?')}
              >
                "What social media posts work best for trades?"
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 border-purple-800/50">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 mb-3">
                <HelpCircle className="h-5 w-5 text-purple-400" />
                <span className="font-medium text-gray-100">Need Help?</span>
              </div>
              <p className="text-sm text-gray-400">
                The AI assistant understands your business context and can help
                with marketing strategy, content creation, and more.
              </p>
              <Badge variant="secondary" className="mt-4">Powered by Claude Sonnet</Badge>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
