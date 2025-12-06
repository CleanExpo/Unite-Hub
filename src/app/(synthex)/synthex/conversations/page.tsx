'use client';

/**
 * Synthex Conversations Page
 * Phase B17: Conversation Intelligence UI
 *
 * Three-panel layout:
 * - Left: Conversation list with filters
 * - Center: Message thread
 * - Right: AI-generated insights
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare,
  Mail,
  Phone,
  MessageCircle,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Tag,
  Lightbulb,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useSynthexTenant } from '@/hooks/useSynthexTenant';

// Types matching service
interface Conversation {
  id: string;
  channel: 'email' | 'sms' | 'call' | 'chat' | 'other';
  direction: 'inbound' | 'outbound';
  subject_or_title: string | null;
  primary_owner: string | null;
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: string;
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed' | null;
  sentiment_score: number | null;
  message_count: number;
  unread_count: number;
  first_message_at: string | null;
  last_message_at: string | null;
  tags: string[];
}

interface Message {
  id: string;
  sender: string;
  sender_name: string | null;
  role: 'contact' | 'agent' | 'system' | 'bot';
  channel: string;
  direction: 'inbound' | 'outbound';
  subject: string | null;
  body: string;
  is_read: boolean;
  is_starred: boolean;
  occurred_at: string;
}

interface Insight {
  id: string;
  summary: string | null;
  sentiment: string | null;
  sentiment_score: number | null;
  topics: string[];
  keywords: string[];
  action_items: Array<{ description: string; priority?: string }>;
  next_steps: string[];
  risk_flags: Array<{ type: string; description: string; severity: string }>;
  churn_risk: number | null;
  urgency_score: number | null;
  primary_intent: string | null;
  confidence_score: number | null;
  analyzed_at: string;
}

// Channel icon mapping
const channelIcons: Record<string, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  sms: <MessageCircle className="h-4 w-4" />,
  call: <Phone className="h-4 w-4" />,
  chat: <MessageSquare className="h-4 w-4" />,
  other: <MessageSquare className="h-4 w-4" />,
};

// Status colors
const statusColors: Record<string, string> = {
  open: 'bg-blue-500/20 text-blue-400',
  pending: 'bg-yellow-500/20 text-yellow-400',
  resolved: 'bg-green-500/20 text-green-400',
  closed: 'bg-gray-500/20 text-gray-400',
};

// Sentiment colors
const sentimentColors: Record<string, string> = {
  positive: 'text-green-400',
  negative: 'text-red-400',
  neutral: 'text-gray-400',
  mixed: 'text-yellow-400',
};

export default function ConversationsPage() {
  const { tenantId, loading: tenantLoading } = useSynthexTenant();

  // State
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  // Filters
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch conversations
  const fetchConversations = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({ tenantId });
      if (channelFilter !== 'all') params.set('channel', channelFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (searchQuery) params.set('search', searchQuery);

      const res = await fetch(`/api/synthex/conversations?${params.toString()}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setConversations(data.conversations || []);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  }, [tenantId, channelFilter, statusFilter, searchQuery]);

  // Fetch conversation detail
  const fetchConversationDetail = useCallback(async (conversationId: string) => {
    if (!tenantId) return;
    try {
      const res = await fetch(`/api/synthex/conversations/${conversationId}?tenantId=${tenantId}`);
      const data = await res.json();
      if (data.status === 'ok') {
        setMessages(data.messages || []);
        setInsight(data.insight || null);
      }
    } catch (error) {
      console.error('Failed to fetch conversation detail:', error);
    }
  }, [tenantId]);

  // Analyze conversation with AI
  const analyzeConversation = async () => {
    if (!tenantId || !selectedConversation) return;
    setAnalyzing(true);
    try {
      const res = await fetch('/api/synthex/conversations/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          conversationId: selectedConversation.id,
        }),
      });
      const data = await res.json();
      if (data.status === 'ok' && data.insight) {
        setInsight(data.insight);
      }
    } catch (error) {
      console.error('Failed to analyze conversation:', error);
    } finally {
      setAnalyzing(false);
    }
  };

  // Load conversations on mount
  useEffect(() => {
    if (tenantId) {
      fetchConversations();
    }
  }, [tenantId, fetchConversations]);

  // Load detail when conversation selected
  useEffect(() => {
    if (selectedConversation) {
      fetchConversationDetail(selectedConversation.id);
    } else {
      setMessages([]);
      setInsight(null);
    }
  }, [selectedConversation, fetchConversationDetail]);

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!tenantId) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-950">
        <div className="text-center">
          <MessageSquare className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Please select a Synthex tenant to view conversations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-950">
      {/* Left Panel: Conversation List */}
      <div className="w-80 border-r border-gray-800 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-xl font-semibold text-white flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-orange-500" />
            Conversations
          </h1>
          <p className="text-sm text-gray-400 mt-1">AI-powered conversation intelligence</p>
        </div>

        {/* Filters */}
        <div className="p-3 border-b border-gray-800 space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-gray-900 border-gray-700 text-white"
            />
          </div>
          <div className="flex gap-2">
            <Select value={channelFilter} onValueChange={setChannelFilter}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-sm">
                <SelectValue placeholder="Channel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="sms">SMS</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="chat">Chat</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-gray-900 border-gray-700 text-white text-sm">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No conversations found</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv)}
                className={`p-3 border-b border-gray-800 cursor-pointer transition-colors ${
                  selectedConversation?.id === conv.id
                    ? 'bg-gray-800'
                    : 'hover:bg-gray-900'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-1 text-gray-400">
                    {channelIcons[conv.channel] || channelIcons.other}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white truncate">
                        {conv.subject_or_title || 'No subject'}
                      </span>
                      {conv.unread_count > 0 && (
                        <Badge variant="secondary" className="bg-orange-500/20 text-orange-400 text-xs">
                          {conv.unread_count}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className={`text-xs ${statusColors[conv.status]}`}>
                        {conv.status}
                      </Badge>
                      {conv.sentiment && (
                        <span className={`text-xs ${sentimentColors[conv.sentiment]}`}>
                          {conv.sentiment}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                      <span>{conv.message_count} messages</span>
                      <span>·</span>
                      <span>
                        {conv.last_message_at
                          ? new Date(conv.last_message_at).toLocaleDateString()
                          : 'No messages'}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-600 mt-1" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Refresh Button */}
        <div className="p-3 border-t border-gray-800">
          <Button
            variant="outline"
            onClick={fetchConversations}
            disabled={loading}
            className="w-full"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Center Panel: Message Thread */}
      <div className="flex-1 flex flex-col border-r border-gray-800">
        {selectedConversation ? (
          <>
            {/* Conversation Header */}
            <div className="p-4 border-b border-gray-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-medium text-white">
                    {selectedConversation.subject_or_title || 'Conversation'}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
                    {channelIcons[selectedConversation.channel]}
                    <span className="capitalize">{selectedConversation.channel}</span>
                    <span>·</span>
                    <Badge variant="outline" className={statusColors[selectedConversation.status]}>
                      {selectedConversation.status}
                    </Badge>
                    {selectedConversation.primary_owner && (
                      <>
                        <span>·</span>
                        <User className="h-3 w-3" />
                        <span>{selectedConversation.primary_owner}</span>
                      </>
                    )}
                  </div>
                </div>
                <Button
                  onClick={analyzeConversation}
                  disabled={analyzing}
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Sparkles className={`h-4 w-4 mr-2 ${analyzing ? 'animate-pulse' : ''}`} />
                  {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                </Button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No messages in this conversation</p>
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.direction === 'outbound' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        msg.direction === 'outbound'
                          ? 'bg-orange-500/20 text-white'
                          : 'bg-gray-800 text-gray-200'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {msg.direction === 'inbound' ? (
                          <ArrowDownLeft className="h-3 w-3 text-gray-400" />
                        ) : (
                          <ArrowUpRight className="h-3 w-3 text-orange-400" />
                        )}
                        <span className="text-xs font-medium">
                          {msg.sender_name || msg.sender}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(msg.occurred_at).toLocaleString()}
                        </span>
                      </div>
                      {msg.subject && (
                        <div className="text-sm font-medium mb-1">{msg.subject}</div>
                      )}
                      <div className="text-sm whitespace-pre-wrap">{msg.body}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a conversation to view messages</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel: AI Insights */}
      <div className="w-80 flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h3 className="text-lg font-medium text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-orange-500" />
            AI Insights
          </h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {insight ? (
            <div className="space-y-4">
              {/* Summary */}
              {insight.summary && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Summary</h4>
                  <p className="text-sm text-gray-400">{insight.summary}</p>
                </div>
              )}

              {/* Sentiment & Scores */}
              <div className="grid grid-cols-2 gap-2">
                {insight.sentiment && (
                  <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Sentiment</h4>
                    <span className={`text-sm font-medium capitalize ${sentimentColors[insight.sentiment]}`}>
                      {insight.sentiment}
                    </span>
                  </div>
                )}
                {insight.urgency_score !== null && (
                  <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Urgency</h4>
                    <span className="text-sm font-medium text-white">{insight.urgency_score}%</span>
                  </div>
                )}
                {insight.churn_risk !== null && (
                  <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Churn Risk</h4>
                    <span className={`text-sm font-medium ${
                      insight.churn_risk > 0.5 ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {(insight.churn_risk * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
                {insight.primary_intent && (
                  <div className="bg-gray-900 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-500 mb-1">Intent</h4>
                    <span className="text-sm font-medium text-white capitalize">
                      {insight.primary_intent}
                    </span>
                  </div>
                )}
              </div>

              {/* Topics */}
              {insight.topics.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Tag className="h-4 w-4" />
                    Topics
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {insight.topics.map((topic, i) => (
                      <Badge key={i} variant="secondary" className="bg-gray-800 text-gray-300">
                        {topic}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items */}
              {insight.action_items.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Action Items
                  </h4>
                  <ul className="space-y-2">
                    {insight.action_items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-400">
                        <CheckCircle className="h-4 w-4 mt-0.5 text-orange-500 flex-shrink-0" />
                        <span>{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Next Steps */}
              {insight.next_steps.length > 0 && (
                <div className="bg-gray-900 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Next Steps
                  </h4>
                  <ul className="space-y-1">
                    {insight.next_steps.map((step, i) => (
                      <li key={i} className="text-sm text-gray-400 flex items-start gap-2">
                        <span className="text-orange-500">•</span>
                        {step}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Risk Flags */}
              {insight.risk_flags.length > 0 && (
                <div className="bg-red-900/20 border border-red-900/50 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-red-400 mb-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Risk Flags
                  </h4>
                  <ul className="space-y-2">
                    {insight.risk_flags.map((flag, i) => (
                      <li key={i} className="text-sm text-red-300">
                        <span className="font-medium">{flag.type}:</span> {flag.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Confidence */}
              {insight.confidence_score !== null && (
                <div className="text-xs text-gray-500 text-center">
                  Analysis confidence: {(insight.confidence_score * 100).toFixed(0)}%
                  <br />
                  Analyzed: {new Date(insight.analyzed_at).toLocaleString()}
                </div>
              )}
            </div>
          ) : selectedConversation ? (
            <div className="text-center text-gray-500 py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="mb-4">No analysis yet</p>
              <Button
                onClick={analyzeConversation}
                disabled={analyzing}
                variant="outline"
                size="sm"
              >
                {analyzing ? 'Analyzing...' : 'Analyze Now'}
              </Button>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <Sparkles className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Select a conversation to see AI insights</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
