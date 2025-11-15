'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Send, Search, Archive, User, Clock, CheckCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import WhatsAppChat from '@/components/WhatsAppChat';
import { formatDistanceToNow } from 'date-fns';

interface WhatsAppConversation {
  id: string;
  phone_number: string;
  contact_id: string;
  status: string;
  last_message_at: string;
  last_message_direction: string;
  unread_count: number;
  ai_sentiment: string;
  needs_attention: boolean;
  contacts: {
    name: string;
    email: string;
    phone: string;
  };
  last_message?: {
    content: string;
    direction: string;
    created_at: string;
  };
}

export default function WhatsAppMessagesPage() {
  const { currentOrganization } = useAuth();
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [filteredConversations, setFilteredConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<WhatsAppConversation | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'archived'>('all');
  const [loading, setLoading] = useState(true);

  // Get workspace ID
  const workspaceId = currentOrganization?.id || 'default-org';

  useEffect(() => {
    fetchConversations();
  }, [workspaceId, activeTab]);

  useEffect(() => {
    filterConversations();
  }, [conversations, searchQuery]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'all' ? undefined : activeTab;
      const response = await fetch(`/api/whatsapp/conversations?workspaceId=${workspaceId}${status ? `&status=${status}` : ''}`);

      if (!response.ok) {
        throw new Error('Failed to fetch conversations');
      }

      const data = await response.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterConversations = () => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = conversations.filter(conv =>
      conv.phone_number.includes(query) ||
      conv.contacts?.name?.toLowerCase().includes(query) ||
      conv.last_message?.content?.toLowerCase().includes(query)
    );
    setFilteredConversations(filtered);
  };

  const handleConversationSelect = (conversation: WhatsAppConversation) => {
    setSelectedConversation(conversation);
  };

  const handleArchive = async (conversationId: string) => {
    // TODO: Implement archive API call
    console.log('Archive conversation:', conversationId);
  };

  const getSentimentBadge = (sentiment: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      positive: 'default',
      neutral: 'secondary',
      negative: 'destructive',
      urgent: 'destructive'
    };

    return (
      <Badge variant={variants[sentiment] || 'outline'} className="text-xs">
        {sentiment}
      </Badge>
    );
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversations Sidebar */}
      <div className="w-96 border-r flex flex-col">
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <MessageSquare className="w-6 h-6" />
              WhatsApp
            </h1>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="archived">Archived</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <ScrollArea className="flex-1">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm">No conversations found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredConversations.map((conversation) => (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationSelect(conversation)}
                  className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                    selectedConversation?.id === conversation.id ? 'bg-accent' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {conversation.contacts?.name || conversation.phone_number}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {conversation.phone_number}
                        </p>
                      </div>
                    </div>
                    {conversation.unread_count > 0 && (
                      <Badge variant="default" className="rounded-full">
                        {conversation.unread_count}
                      </Badge>
                    )}
                  </div>

                  {conversation.last_message && (
                    <div className="ml-12">
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-1">
                        {conversation.last_message.direction === 'outbound' && (
                          <CheckCheck className="w-3 h-3 inline mr-1" />
                        )}
                        {conversation.last_message.content}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(conversation.last_message.created_at), {
                          addSuffix: true
                        })}
                        {conversation.ai_sentiment && getSentimentBadge(conversation.ai_sentiment)}
                      </div>
                    </div>
                  )}

                  {conversation.needs_attention && (
                    <Badge variant="destructive" className="mt-2 text-xs">
                      Needs Attention
                    </Badge>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedConversation ? (
          <WhatsAppChat
            conversation={selectedConversation}
            workspaceId={workspaceId}
            onUpdate={fetchConversations}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <MessageSquare className="w-24 h-24 mx-auto mb-4 opacity-20" />
              <h3 className="text-xl font-semibold mb-2">Select a conversation</h3>
              <p className="text-sm">Choose a conversation from the list to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
