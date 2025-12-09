import Anthropic from '@anthropic-ai/sdk';

// Context types for different conversation types
export type ContextType = 'email' | 'persona' | 'strategy' | 'campaign' | 'general';

// Context entry for maintaining conversation history
export interface ContextEntry {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

// Context manager for maintaining conversation state
export class ConversationContext {
  private context: ContextEntry[] = [];
  private maxContextLength: number;
  private contextType: ContextType;

  constructor(contextType: ContextType = 'general', maxLength: number = 10) {
    this.contextType = contextType;
    this.maxContextLength = maxLength;
  }

  // Add a user message to context
  addUserMessage(content: string, metadata?: Record<string, any>): void {
    this.context.push({
      role: 'user',
      content,
      timestamp: new Date(),
      metadata,
    });
    this.pruneContext();
  }

  // Add an assistant message to context
  addAssistantMessage(content: string, metadata?: Record<string, any>): void {
    this.context.push({
      role: 'assistant',
      content,
      timestamp: new Date(),
      metadata,
    });
    this.pruneContext();
  }

  // Get context as Claude messages
  getMessages(): Anthropic.MessageParam[] {
    return this.context.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
  }

  // Get last N messages
  getLastMessages(n: number): Anthropic.MessageParam[] {
    const lastN = this.context.slice(-n);
    return lastN.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));
  }

  // Clear context
  clear(): void {
    this.context = [];
  }

  // Get context summary
  getSummary(): string {
    return this.context
      .map((entry) => `${entry.role.toUpperCase()}: ${entry.content.slice(0, 100)}...`)
      .join('\n');
  }

  // Prune old messages to maintain context window
  private pruneContext(): void {
    if (this.context.length > this.maxContextLength) {
      // Keep the most recent messages
      this.context = this.context.slice(-this.maxContextLength);
    }
  }

  // Export context for storage
  export(): string {
    return JSON.stringify({
      contextType: this.contextType,
      context: this.context,
      maxContextLength: this.maxContextLength,
    });
  }

  // Import context from storage
  static import(data: string): ConversationContext {
    const parsed = JSON.parse(data);
    const context = new ConversationContext(parsed.contextType, parsed.maxContextLength);
    context.context = parsed.context.map((entry: any) => ({
      ...entry,
      timestamp: new Date(entry.timestamp),
    }));
    return context;
  }
}

// Session manager for multi-turn conversations
export class SessionManager {
  private sessions: Map<string, ConversationContext> = new Map();
  private sessionTimeout: number;

  constructor(timeoutMs: number = 30 * 60 * 1000) {
    this.sessionTimeout = timeoutMs;
    this.startCleanupInterval();
  }

  // Get or create a session
  getSession(sessionId: string, contextType: ContextType = 'general'): ConversationContext {
    if (!this.sessions.has(sessionId)) {
      this.sessions.set(sessionId, new ConversationContext(contextType));
    }
    return this.sessions.get(sessionId)!;
  }

  // Delete a session
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  // Check if session exists
  hasSession(sessionId: string): boolean {
    return this.sessions.has(sessionId);
  }

  // Clean up old sessions
  private startCleanupInterval(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [sessionId, context] of this.sessions.entries()) {
        const messages = context.getMessages();
        if (messages.length === 0) {
continue;
}

        // Check last message timestamp
        const lastEntry = (context as any).context[messages.length - 1];
        if (lastEntry && now - lastEntry.timestamp.getTime() > this.sessionTimeout) {
          this.deleteSession(sessionId);
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }
}

// Global session manager instance
export const sessionManager = new SessionManager();

// Context builder helpers
export class ContextBuilder {
  // Build email context
  static buildEmailContext(emails: Array<{ from: string; subject: string; body: string; date?: string }>): string {
    return emails
      .map(
        (email, i) =>
          `Email ${i + 1}${email.date ? ` (${email.date})` : ''}:\nFrom: ${email.from}\nSubject: ${email.subject}\nBody: ${email.body}`
      )
      .join('\n\n---\n\n');
  }

  // Build persona context
  static buildPersonaContext(persona: any): string {
    return `Customer Persona:
Name: ${persona.name || 'N/A'}
Demographics: ${JSON.stringify(persona.demographics || {}, null, 2)}
Pain Points: ${persona.painPoints?.map((p: any) => p.pain || p).join(', ') || 'N/A'}
Goals: ${persona.goals?.map((g: any) => g.goal || g).join(', ') || 'N/A'}`;
  }

  // Build business context
  static buildBusinessContext(data: {
    name?: string;
    description?: string;
    industry?: string;
    goals?: string[];
  }): string {
    return `Business Context:
${data.name ? `Name: ${data.name}` : ''}
${data.description ? `Description: ${data.description}` : ''}
${data.industry ? `Industry: ${data.industry}` : ''}
${data.goals ? `Goals: ${data.goals.join(', ')}` : ''}`;
  }

  // Build campaign context
  static buildCampaignContext(data: {
    platforms?: string[];
    budget?: string;
    timeline?: string;
    objectives?: string[];
  }): string {
    return `Campaign Context:
${data.platforms ? `Platforms: ${data.platforms.join(', ')}` : ''}
${data.budget ? `Budget: ${data.budget}` : ''}
${data.timeline ? `Timeline: ${data.timeline}` : ''}
${data.objectives ? `Objectives: ${data.objectives.join(', ')}` : ''}`;
  }
}

// Token counting helper (approximate)
export class TokenCounter {
  // Rough approximation: 1 token ≈ 4 characters
  static estimate(text: string): number {
    return Math.ceil(text.length / 4);
  }

  // Check if context fits within limit
  static fitsWithinLimit(messages: Anthropic.MessageParam[], maxTokens: number = 100000): boolean {
    const totalChars = messages.reduce((sum, msg) => {
      if (typeof msg.content === 'string') {
        return sum + msg.content.length;
      }
      return sum;
    }, 0);
    return this.estimate(String(totalChars)) < maxTokens;
  }

  // Truncate messages to fit within limit
  static truncateToLimit(
    messages: Anthropic.MessageParam[],
    maxTokens: number = 100000
  ): Anthropic.MessageParam[] {
    const result: Anthropic.MessageParam[] = [];
    let currentTokens = 0;

    // Add messages from the end (most recent first)
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      const msgTokens = typeof msg.content === 'string' ? this.estimate(msg.content) : 0;

      if (currentTokens + msgTokens > maxTokens) {
        break;
      }

      result.unshift(msg);
      currentTokens += msgTokens;
    }

    return result;
  }
}
