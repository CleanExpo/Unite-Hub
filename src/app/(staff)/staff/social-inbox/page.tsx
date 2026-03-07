'use client';

/**
 * Social Inbox Page
 *
 * Unified social media inbox with AI triage and reply suggestions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Textarea } from '@/components/ui/textarea';
import {
  MessageSquare,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  Twitter,
  RefreshCw,
  Send,
  Sparkles,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';

type SocialPlatform = 'facebook' | 'instagram' | 'youtube' | 'tiktok' | 'linkedin' | 'reddit' | 'x';
type MessagePriority = 'high' | 'medium' | 'low';
type MessageSentiment = 'positive' | 'neutral' | 'negative';

interface SocialAccount {
  id: string;
  platform: SocialPlatform;
  platformUsername: string;
  status: 'active' | 'disconnected' | 'expired';
}

interface SocialMessage {
  id: string;
  platform: SocialPlatform;
  type: 'dm' | 'comment' | 'mention' | 'review';
  authorName: string;
  authorUsername: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  priority?: MessagePriority;
  sentiment?: MessageSentiment;
  suggestedReply?: string;
}

const PLATFORM_ICONS: Record<SocialPlatform, React.ReactNode> = {
  facebook: <Facebook className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  youtube: <Youtube className="h-4 w-4" />,
  tiktok: <MessageSquare className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  reddit: <MessageSquare className="h-4 w-4" />,
  x: <Twitter className="h-4 w-4" />,
};

// Scientific Luxury platform colours — no gradients
const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: 'bg-[#00F5FF]/20',
  instagram: 'bg-[#FF00FF]/20',
  youtube: 'bg-[#FF4444]/20',
  tiktok: 'bg-white/10',
  linkedin: 'bg-[#00F5FF]/20',
  reddit: 'bg-[#FFB800]/20',
  x: 'bg-white/10',
};

const PLATFORM_TEXT: Record<SocialPlatform, string> = {
  facebook: 'text-[#00F5FF]',
  instagram: 'text-[#FF00FF]',
  youtube: 'text-[#FF4444]',
  tiktok: 'text-white/60',
  linkedin: 'text-[#00F5FF]',
  reddit: 'text-[#FFB800]',
  x: 'text-white/60',
};

export default function SocialInboxPage() {
  const { currentOrganization, session } = useAuth();
  const workspaceId = currentOrganization?.org_id;

  const [accounts, setAccounts] = useState<SocialAccount[]>([]);
  const [messages, setMessages] = useState<SocialMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<SocialMessage | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isTriaging, setIsTriaging] = useState(false);
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAccounts = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    try {
      const response = await fetch(`/api/social-inbox/accounts?workspaceId=${workspaceId}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.accounts) setAccounts(data.accounts);
    } catch (error) {
      console.error('Failed to fetch accounts:', error);
    }
  }, [workspaceId, session?.access_token]);

  const fetchMessages = useCallback(async () => {
    if (!workspaceId || !session?.access_token) return;
    setIsLoading(true);
    try {
      const platform = activeTab !== 'all' ? activeTab : undefined;
      const url = `/api/social-inbox/messages?workspaceId=${workspaceId}${platform ? `&platform=${platform}` : ''}`;
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const data = await response.json();
      if (data.data) setMessages(data.data);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, session?.access_token, activeTab]);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);
  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const handleTriageMessage = async (messageId: string) => {
    if (!session?.access_token) return;
    setIsTriaging(true);
    try {
      const response = await fetch('/api/social-inbox/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'triage', messageId }),
      });
      const data = await response.json();
      if (data.triage) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId ? { ...m, priority: data.triage.priority, sentiment: data.triage.sentiment } : m
          )
        );
        if (selectedMessage?.id === messageId) {
          setSelectedMessage((prev) =>
            prev ? { ...prev, priority: data.triage.priority, sentiment: data.triage.sentiment } : null
          );
        }
      }
    } catch (error) {
      console.error('Failed to triage message:', error);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleGenerateReply = async () => {
    if (!selectedMessage || !session?.access_token) return;
    setIsTriaging(true);
    try {
      const response = await fetch('/api/social-inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({
          action: 'generate',
          messageId: selectedMessage.id,
          options: { tone: 'professional', maxLength: 280 },
        }),
      });
      const data = await response.json();
      if (data.reply?.content) {
        setReplyContent(data.reply.content);
        setSelectedMessage((prev) =>
          prev ? { ...prev, suggestedReply: data.reply.content } : null
        );
      }
    } catch (error) {
      console.error('Failed to generate reply:', error);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyContent || !session?.access_token) return;
    setIsSendingReply(true);
    try {
      const response = await fetch('/api/social-inbox/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ action: 'send', messageId: selectedMessage.id, content: replyContent }),
      });
      if (response.ok) {
        setReplyContent('');
        setSelectedMessage(null);
        fetchMessages();
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    } finally {
      setIsSendingReply(false);
    }
  };

  const getPriorityStyle = (priority?: MessagePriority) => {
    if (!priority) return null;
    const styles: Record<MessagePriority, string> = {
      high: 'border-[#FF4444]/30 text-[#FF4444]',
      medium: 'border-[#FFB800]/30 text-[#FFB800]',
      low: 'border-[#00FF88]/30 text-[#00FF88]',
    };
    return (
      <span className={`text-xs font-mono px-2 py-0.5 rounded-sm border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const getSentimentIcon = (sentiment?: MessageSentiment) => {
    if (!sentiment) return null;
    const icons: Record<MessageSentiment, React.ReactNode> = {
      positive: <ArrowUp className="h-4 w-4" style={{ color: '#00FF88' }} />,
      neutral: <Clock className="h-4 w-4 text-white/40" />,
      negative: <ArrowDown className="h-4 w-4" style={{ color: '#FF4444' }} />,
    };
    return icons[sentiment];
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery) return true;
    return (
      m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.authorUsername.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const unreadCount = messages.filter((m) => !m.isRead).length;
  const highPriorityCount = messages.filter((m) => m.priority === 'high').length;

  const platformTabs = ['all', 'facebook', 'instagram', 'youtube', 'linkedin', 'x'];

  return (
    <div className="min-h-screen bg-[#050505] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white font-mono">Social Inbox</h1>
            <p className="text-white/40 font-mono text-sm mt-1">
              Unified inbox with AI-powered triage and reply suggestions
            </p>
          </div>
          <button
            onClick={fetchMessages}
            disabled={isLoading}
            className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 flex items-center gap-2 hover:bg-white/[0.06] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Connected Accounts', value: accounts.filter((a) => a.status === 'active').length, icon: <CheckCircle className="h-8 w-8" style={{ color: '#00FF88' }} /> },
            { label: 'Total Messages', value: messages.length, icon: <MessageSquare className="h-8 w-8" style={{ color: '#00F5FF' }} /> },
            { label: 'Unread', value: unreadCount, icon: <Clock className="h-8 w-8" style={{ color: '#FFB800' }} /> },
            { label: 'High Priority', value: highPriorityCount, icon: <AlertCircle className="h-8 w-8" style={{ color: '#FF4444' }} /> },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/40 font-mono">{stat.label}</p>
                  <p className="text-2xl font-bold text-white font-mono mt-1">{stat.value}</p>
                </div>
                {stat.icon}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Message List */}
          <div className="lg:col-span-2">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
                <h2 className="font-mono text-white font-bold">Messages</h2>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/30" />
                    <input
                      placeholder="Search messages..."
                      className="bg-white/[0.04] border border-white/[0.06] rounded-sm pl-9 pr-3 py-1.5 text-sm font-mono text-white placeholder-white/30 focus:outline-none focus:border-[#00F5FF]/40 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 rounded-sm p-1.5 hover:bg-white/[0.08]">
                    <Filter className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                {/* Platform tabs */}
                <div className="flex border-b border-white/[0.06] mb-4 overflow-x-auto">
                  {platformTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`font-mono text-xs px-3 py-2 border-b-2 transition-colors whitespace-nowrap capitalize ${
                        activeTab === tab
                          ? 'border-[#00F5FF] text-[#00F5FF]'
                          : 'border-transparent text-white/40 hover:text-white/60'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-white/30 font-mono text-sm">Loading messages...</div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-white/30 font-mono text-sm">
                      No messages found. Connect your social accounts to get started.
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 border rounded-sm cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'border-[#00F5FF]/40 bg-[#00F5FF]/5'
                            : 'border-white/[0.06] hover:border-white/20'
                        } ${!message.isRead ? 'border-l-4 border-l-[#00F5FF]' : ''}`}
                        onClick={() => {
                          setSelectedMessage(message);
                          setReplyContent(message.suggestedReply || '');
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-sm ${PLATFORM_COLORS[message.platform]} ${PLATFORM_TEXT[message.platform]}`}>
                            {PLATFORM_ICONS[message.platform]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="font-mono font-medium text-white text-sm">{message.authorName}</span>
                              <span className="text-white/30 font-mono text-xs">@{message.authorUsername}</span>
                              <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-white/10 text-white/40">
                                {message.type}
                              </span>
                              {getPriorityStyle(message.priority)}
                              {getSentimentIcon(message.sentiment)}
                            </div>
                            <p className="text-sm text-white/40 font-mono truncate">{message.content}</p>
                            <p className="text-xs text-white/20 font-mono mt-1">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Message Detail & Reply */}
          <div className="lg:col-span-1">
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm sticky top-6">
              <div className="p-4 border-b border-white/[0.06]">
                <h2 className="font-mono text-white font-bold">Message Details</h2>
              </div>
              <div className="p-4">
                {selectedMessage ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-sm ${PLATFORM_COLORS[selectedMessage.platform]} ${PLATFORM_TEXT[selectedMessage.platform]}`}>
                        {PLATFORM_ICONS[selectedMessage.platform]}
                      </div>
                      <div>
                        <p className="font-mono font-medium text-white">{selectedMessage.authorName}</p>
                        <p className="text-xs text-white/40 font-mono">@{selectedMessage.authorUsername}</p>
                      </div>
                    </div>

                    <div className="p-3 bg-white/[0.03] border border-white/[0.06] rounded-sm">
                      <p className="text-sm font-mono text-white/60">{selectedMessage.content}</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleTriageMessage(selectedMessage.id)}
                        disabled={isTriaging}
                        className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-xs rounded-sm px-3 py-1.5 flex items-center gap-1 hover:bg-white/[0.06] disabled:opacity-50"
                      >
                        <Sparkles className="h-4 w-4" />
                        Analyze
                      </button>
                      {selectedMessage.priority && (
                        <span className="text-xs font-mono px-2 py-0.5 rounded-sm border border-[#00F5FF]/30 text-[#00F5FF]">
                          {selectedMessage.sentiment} sentiment
                        </span>
                      )}
                    </div>

                    <div className="border-t border-white/[0.06] pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-mono text-white/40 uppercase tracking-wider">Reply</label>
                        <button
                          onClick={handleGenerateReply}
                          disabled={isTriaging}
                          className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-xs rounded-sm px-2 py-1 flex items-center gap-1 hover:bg-white/[0.06] disabled:opacity-50"
                        >
                          <Sparkles className={`h-4 w-4 ${isTriaging ? 'animate-spin' : ''}`} />
                          AI Suggest
                        </button>
                      </div>
                      <Textarea
                        placeholder="Type your reply..."
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        rows={4}
                        className="bg-white/[0.04] border-white/[0.06] text-white placeholder-white/30 font-mono text-sm rounded-sm focus:border-[#00F5FF]/40"
                      />
                      <button
                        className="w-full mt-2 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center justify-center gap-2 hover:bg-[#00F5FF]/90 disabled:opacity-50"
                        onClick={handleSendReply}
                        disabled={!replyContent || isSendingReply}
                      >
                        <Send className="h-4 w-4" />
                        {isSendingReply ? 'Sending...' : 'Send Reply'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-white/30 font-mono text-sm">
                    Select a message to view details and reply
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
