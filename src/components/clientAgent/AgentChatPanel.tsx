'use client';

/**
 * Agent Chat Panel
 * Phase 83: Interactive chat with the client operations agent
 */

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Bot,
  User,
  Send,
  Loader2,
  AlertTriangle,
  CheckCircle,
  Clock,
} from 'lucide-react';

interface Message {
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: string;
}

interface ProposedAction {
  id: string;
  action_type: string;
  description: string;
  risk_level: 'low' | 'medium' | 'high';
  requires_approval: boolean;
}

interface AgentChatPanelProps {
  workspaceId: string;
  clientId?: string;
  clientName?: string;
  onActionApproved?: (actionId: string) => void;
  className?: string;
}

export function AgentChatPanel({
  workspaceId,
  clientId,
  clientName,
  onActionApproved,
  className = '',
}: AgentChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [pendingActions, setPendingActions] = useState<ProposedAction[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setIsLoading(true);

    // Add user message
    setMessages(prev => [
      ...prev,
      {
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString(),
      },
    ]);

    try {
      const res = await fetch('/api/client-agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          client_id: clientId,
          workspace_id: workspaceId,
          message: userMessage,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to send message');
      }

      const data = await res.json();

      // Update session ID
      if (data.session_id) {
        setSessionId(data.session_id);
      }

      // Add agent message
      setMessages(prev => [
        ...prev,
        {
          role: 'agent',
          content: data.message,
          timestamp: new Date().toISOString(),
        },
      ]);

      // Update pending actions
      const pending = data.proposed_actions?.filter((a: ProposedAction) => a.requires_approval) || [];
      setPendingActions(prev => [...prev, ...pending]);

      // Show executed actions
      if (data.executed_actions?.length > 0) {
        setMessages(prev => [
          ...prev,
          {
            role: 'system',
            content: `Auto-executed ${data.executed_actions.length} action(s)`,
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (error) {
      setMessages(prev => [
        ...prev,
        {
          role: 'system',
          content: 'Error: Failed to get response',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const approveAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/client-agent/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          approval_status: 'approved_executed',
        }),
      });

      if (res.ok) {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
        setMessages(prev => [
          ...prev,
          {
            role: 'system',
            content: 'Action approved and executed',
            timestamp: new Date().toISOString(),
          },
        ]);
        onActionApproved?.(actionId);
      }
    } catch (error) {
      console.error('Failed to approve action:', error);
    }
  };

  const rejectAction = async (actionId: string) => {
    try {
      const res = await fetch('/api/client-agent/actions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action_id: actionId,
          approval_status: 'rejected',
          rejection_reason: 'User rejected',
        }),
      });

      if (res.ok) {
        setPendingActions(prev => prev.filter(a => a.id !== actionId));
      }
    } catch (error) {
      console.error('Failed to reject action:', error);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high':
        return 'text-red-500 bg-red-500/10';
      case 'medium':
        return 'text-yellow-500 bg-yellow-500/10';
      default:
        return 'text-green-500 bg-green-500/10';
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Bot className="h-4 w-4" />
          {clientName ? `Agent Assistant - ${clientName}` : 'Agent Assistant'}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-[300px] overflow-y-auto space-y-3 p-2 bg-muted/30 rounded-lg">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              Start a conversation with the agent
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role !== 'user' && (
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  {msg.role === 'agent' ? (
                    <Bot className="h-3 w-3" />
                  ) : (
                    <AlertTriangle className="h-3 w-3" />
                  )}
                </div>
              )}

              <div
                className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                  msg.role === 'user'
                    ? 'bg-primary text-primary-foreground'
                    : msg.role === 'system'
                    ? 'bg-muted text-muted-foreground italic'
                    : 'bg-background border'
                }`}
              >
                {msg.content}
              </div>

              {msg.role === 'user' && (
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <User className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="h-3 w-3" />
              </div>
              <div className="bg-background border rounded-lg px-3 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Pending Actions */}
        {pendingActions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Pending Approvals ({pendingActions.length})
            </p>
            {pendingActions.map(action => (
              <div
                key={action.id}
                className="flex items-center justify-between p-2 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs">{action.action_type}</span>
                  <Badge className={`text-[10px] ${getRiskColor(action.risk_level)}`}>
                    {action.risk_level}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-green-500"
                    onClick={() => approveAction(action.id)}
                  >
                    <CheckCircle className="h-3 w-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-red-500"
                    onClick={() => rejectAction(action.id)}
                  >
                    <AlertTriangle className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask the agent..."
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            disabled={isLoading}
          />
          <Button onClick={sendMessage} disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
