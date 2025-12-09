/**
 * Agent Collaboration Protocol
 *
 * Defines the messaging standard for agent-to-agent communication.
 * Supports request/response patterns, insight sharing, and risk notifications.
 */

export type CoordinationRole = 'orchestrator' | 'specialist' | 'observer';
export type MessageIntent =
  | 'request_data'
  | 'share_insight'
  | 'propose_plan'
  | 'feedback'
  | 'notify_risk'
  | 'request_approval'
  | 'acknowledge'
  | 'error_report';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  role: CoordinationRole;
  intent: MessageIntent;
  topic: string;
  payload: any;
  createdAt: string;
  replyToId?: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  expiresAt?: string;
}

// In-memory message bus (would use database/queue in production)
let messageBus: AgentMessage[] = [];

/**
 * Send a message from one agent to another
 */
export function sendAgentMessage(msg: Omit<AgentMessage, 'id' | 'createdAt'>): AgentMessage {
  const record: AgentMessage = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    priority: msg.priority ?? 'medium',
    ...msg,
  };
  messageBus.push(record);
  return record;
}

/**
 * Get unread messages for an agent
 */
export function getMessagesForAgent(
  agent: string,
  opts?: { sinceId?: string; markAsRead?: boolean }
): AgentMessage[] {
  let msgs = messageBus.filter(m => m.to === agent || m.to === '*');

  // Filter by timestamp if sinceId provided
  if (opts?.sinceId) {
    const idx = messageBus.findIndex(m => m.id === opts.sinceId);
    if (idx >= 0) {
      msgs = messageBus.slice(idx + 1).filter(m => m.to === agent || m.to === '*');
    }
  }

  // Sort by priority and recency
  msgs = msgs.sort((a, b) => {
    const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const priorityDiff = (priorityOrder[b.priority ?? 'medium'] ?? 2) - (priorityOrder[a.priority ?? 'medium'] ?? 2);
    if (priorityDiff !== 0) {
return priorityDiff;
}
    return b.createdAt.localeCompare(a.createdAt);
  });

  return msgs;
}

/**
 * Get a specific message by ID
 */
export function getMessage(id: string): AgentMessage | null {
  return messageBus.find(m => m.id === id) ?? null;
}

/**
 * Get all messages for a conversation thread
 */
export function getConversationThread(messageId: string): AgentMessage[] {
  const root = messageBus.find(m => m.id === messageId);
  if (!root) {
return [];
}

  const thread: AgentMessage[] = [root];
  const visited = new Set([messageId]);

  // Find all replies to any message in the thread
  const toProcess = [messageId];
  while (toProcess.length > 0) {
    const current = toProcess.shift()!;
    const replies = messageBus.filter(m => m.replyToId === current && !visited.has(m.id));

    for (const reply of replies) {
      thread.push(reply);
      visited.add(reply.id);
      toProcess.push(reply.id);
    }
  }

  return thread.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/**
 * Get all active messages (not expired)
 */
export function getActiveMessages(): AgentMessage[] {
  const now = new Date();
  return messageBus.filter(m => !m.expiresAt || new Date(m.expiresAt) > now);
}

/**
 * Cleanup expired messages
 */
export function cleanupExpiredMessages(now = new Date()): number {
  const before = messageBus.length;
  messageBus = messageBus.filter(m => !m.expiresAt || new Date(m.expiresAt) > now);
  return before - messageBus.length;
}

/**
 * Get message statistics
 */
export function getMessageStats() {
  return {
    totalMessages: messageBus.length,
    byIntent: messageBus.reduce((acc, m) => {
      acc[m.intent] = (acc[m.intent] ?? 0) + 1;
      return acc;
    }, {} as Record<MessageIntent, number>),
    byPriority: messageBus.reduce((acc, m) => {
      const priority = m.priority ?? 'medium';
      acc[priority] = (acc[priority] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byFrom: messageBus.reduce((acc, m) => {
      acc[m.from] = (acc[m.from] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byTo: messageBus.reduce((acc, m) => {
      acc[m.to] = (acc[m.to] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>),
  };
}

/**
 * Clear all messages (for testing)
 */
export function clearAllMessages(): void {
  messageBus = [];
}
