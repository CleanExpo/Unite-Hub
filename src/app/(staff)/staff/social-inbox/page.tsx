'use client';

/**
 * Social Inbox Page
 *
 * Unified social media inbox with AI triage and reply suggestions.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
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

const PLATFORM_COLORS: Record<SocialPlatform, string> = {
  facebook: 'bg-blue-600',
  instagram: 'bg-gradient-to-r from-purple-500 to-pink-500',
  youtube: 'bg-red-600',
  tiktok: 'bg-black',
  linkedin: 'bg-blue-700',
  reddit: 'bg-orange-500',
  x: 'bg-gray-900',
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
      if (data.accounts) {
        setAccounts(data.accounts);
      }
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
      if (data.data) {
        setMessages(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [workspaceId, session?.access_token, activeTab]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleTriageMessage = async (messageId: string) => {
    if (!session?.access_token) return;

    setIsTriaging(true);
    try {
      const response = await fetch('/api/social-inbox/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'triage',
          messageId,
        }),
      });
      const data = await response.json();

      if (data.triage) {
        setMessages((prev) =>
          prev.map((m) =>
            m.id === messageId
              ? { ...m, priority: data.triage.priority, sentiment: data.triage.sentiment }
              : m
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
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
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          action: 'send',
          messageId: selectedMessage.id,
          content: replyContent,
        }),
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

  const getPriorityBadge = (priority?: MessagePriority) => {
    if (!priority) return null;
    const colors = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800',
    };
    return <Badge className={colors[priority]}>{priority}</Badge>;
  };

  const getSentimentIcon = (sentiment?: MessageSentiment) => {
    if (!sentiment) return null;
    const icons = {
      positive: <ArrowUp className="h-4 w-4 text-green-600" />,
      neutral: <Clock className="h-4 w-4 text-gray-600" />,
      negative: <ArrowDown className="h-4 w-4 text-red-600" />,
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

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Social Inbox</h1>
          <p className="text-muted-foreground">
            Unified inbox with AI-powered triage and reply suggestions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMessages} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Connected Accounts</p>
                <p className="text-2xl font-bold">{accounts.filter((a) => a.status === 'active').length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Messages</p>
                <p className="text-2xl font-bold">{messages.length}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold">{unreadCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">High Priority</p>
                <p className="text-2xl font-bold">{highPriorityCount}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Message List */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Messages</CardTitle>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search messages..."
                      className="pl-9 w-64"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" size="icon">
                    <Filter className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-4">
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="facebook">Facebook</TabsTrigger>
                  <TabsTrigger value="instagram">Instagram</TabsTrigger>
                  <TabsTrigger value="youtube">YouTube</TabsTrigger>
                  <TabsTrigger value="linkedin">LinkedIn</TabsTrigger>
                  <TabsTrigger value="x">X</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab} className="space-y-2">
                  {isLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading messages...</div>
                  ) : filteredMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No messages found. Connect your social accounts to get started.
                    </div>
                  ) : (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          selectedMessage?.id === message.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        } ${!message.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                        onClick={() => {
                          setSelectedMessage(message);
                          if (message.suggestedReply) {
                            setReplyContent(message.suggestedReply);
                          } else {
                            setReplyContent('');
                          }
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-full ${PLATFORM_COLORS[message.platform]} text-white`}>
                            {PLATFORM_ICONS[message.platform]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{message.authorName}</span>
                              <span className="text-muted-foreground text-sm">@{message.authorUsername}</span>
                              <Badge variant="outline" className="text-xs">
                                {message.type}
                              </Badge>
                              {getPriorityBadge(message.priority)}
                              {getSentimentIcon(message.sentiment)}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{message.content}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(message.timestamp).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Message Detail & Reply */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Message Details</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedMessage ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${PLATFORM_COLORS[selectedMessage.platform]} text-white`}>
                      {PLATFORM_ICONS[selectedMessage.platform]}
                    </div>
                    <div>
                      <p className="font-medium">{selectedMessage.authorName}</p>
                      <p className="text-sm text-muted-foreground">@{selectedMessage.authorUsername}</p>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-sm">{selectedMessage.content}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTriageMessage(selectedMessage.id)}
                      disabled={isTriaging}
                    >
                      <Sparkles className="h-4 w-4 mr-1" />
                      Analyze
                    </Button>
                    {selectedMessage.priority && (
                      <Badge className="bg-blue-100 text-blue-800">
                        {selectedMessage.sentiment} sentiment
                      </Badge>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Reply</label>
                      <Button variant="ghost" size="sm" onClick={handleGenerateReply} disabled={isTriaging}>
                        <Sparkles className={`h-4 w-4 mr-1 ${isTriaging ? 'animate-spin' : ''}`} />
                        AI Suggest
                      </Button>
                    </div>
                    <Textarea
                      placeholder="Type your reply..."
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      rows={4}
                    />
                    <Button
                      className="w-full mt-2"
                      onClick={handleSendReply}
                      disabled={!replyContent || isSendingReply}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSendingReply ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  Select a message to view details and reply
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
