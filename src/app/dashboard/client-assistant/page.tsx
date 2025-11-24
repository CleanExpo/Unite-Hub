'use client';

/**
 * Client Assistant Page
 * Phase 83: User-facing interface for interacting with client operations agent
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bot,
  RefreshCw,
  User,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { AgentChatPanel } from '@/components/clientAgent/AgentChatPanel';
import { AgentRunHistory } from '@/components/clientAgent/AgentRunHistory';
import { SafetyIndicator } from '@/components/clientAgent/SafetyBanner';

// Demo workspace ID
const DEMO_WORKSPACE_ID = 'demo-workspace';

interface Contact {
  id: string;
  name: string;
  email?: string;
  ai_score: number;
  status: string;
}

export default function ClientAssistantPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [actionHistory, setActionHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadContacts();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      loadClientHistory(selectedClientId);
    }
  }, [selectedClientId]);

  const loadContacts = async () => {
    setIsLoading(true);
    try {
      // In production, this would fetch from contacts API
      // For demo, use placeholder data
      setContacts([
        { id: '1', name: 'Acme Corp', email: 'contact@acme.com', ai_score: 85, status: 'customer' },
        { id: '2', name: 'TechStart Inc', email: 'hello@techstart.io', ai_score: 72, status: 'prospect' },
        { id: '3', name: 'Global Services', email: 'info@global.com', ai_score: 65, status: 'lead' },
      ]);
    } catch (error) {
      console.error('Failed to load contacts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadClientHistory = async (clientId: string) => {
    try {
      const res = await fetch(
        `/api/client-agent/actions?workspaceId=${DEMO_WORKSPACE_ID}&clientId=${clientId}&limit=10`
      );
      if (res.ok) {
        const data = await res.json();
        setActionHistory(data.data || []);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  const selectedClient = contacts.find(c => c.id === selectedClientId);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6" />
            Client Assistant
          </h1>
          <p className="text-muted-foreground">
            AI-powered assistance for client operations
          </p>
        </div>

        <Button variant="outline" onClick={loadContacts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Client selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <User className="h-4 w-4" />
            Select Client
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Select
            value={selectedClientId || ''}
            onValueChange={value => setSelectedClientId(value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choose a client to assist..." />
            </SelectTrigger>
            <SelectContent>
              {contacts.map(contact => (
                <SelectItem key={contact.id} value={contact.id}>
                  <div className="flex items-center gap-2">
                    <span>{contact.name}</span>
                    <Badge variant="outline" className="text-[10px]">
                      Score: {contact.ai_score}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {selectedClient && (
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{selectedClient.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedClient.email}
                  </p>
                </div>
                <div className="text-right">
                  <Badge
                    variant={
                      selectedClient.ai_score >= 80
                        ? 'default'
                        : selectedClient.ai_score >= 60
                        ? 'secondary'
                        : 'outline'
                    }
                  >
                    {selectedClient.ai_score >= 80
                      ? 'Hot'
                      : selectedClient.ai_score >= 60
                      ? 'Warm'
                      : 'Cold'}
                  </Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedClient.status}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main content */}
      {selectedClientId ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chat panel */}
          <div className="lg:col-span-2">
            <AgentChatPanel
              workspaceId={DEMO_WORKSPACE_ID}
              clientId={selectedClientId}
              clientName={selectedClient?.name}
              onActionApproved={() => loadClientHistory(selectedClientId)}
            />
          </div>

          {/* History */}
          <div>
            <AgentRunHistory
              actions={actionHistory}
              onViewDetails={id => console.log('View action:', id)}
            />
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Select a client to start using the assistant</p>
              <p className="text-sm mt-2">
                The agent can help you manage follow-ups, update statuses,
                and perform other client operations safely.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info notice */}
      <Card className="border-blue-500/30 bg-blue-500/5">
        <CardContent className="pt-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-muted-foreground">
            <p>
              The Client Assistant is <strong>safety-caged</strong>: it can only perform
              pre-approved actions. Low-risk tasks (like adding tags) may be auto-executed,
              while higher-risk actions (like sending emails) require your approval.
            </p>
            <p className="mt-2 flex items-center gap-2">
              <AlertTriangle className="h-3 w-3" />
              All actions are logged and can be reviewed by founders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
