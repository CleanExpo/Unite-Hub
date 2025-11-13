/**
 * Claude Context Management
 * Utilities for building and managing conversation context
 */

export interface ConversationContext {
  clientId: string;
  persona?: string;
  strategy?: string;
  competitors?: string[];
  industry?: string;
  businessType?: string;
  targetAudience?: string;
  recentEmails?: Array<{
    subject: string;
    body: string;
    from: string;
    date: string;
  }>;
  metadata?: Record<string, any>;
}

export interface EmailContext {
  subject: string;
  body: string;
  from: {
    name: string;
    email: string;
  };
  to?: {
    name: string;
    email: string;
  };
  date?: string;
  threadId?: string;
  previousEmails?: EmailContext[];
}

export function buildConversationContext(
  data: Partial<ConversationContext>
): ConversationContext {
  return {
    clientId: data.clientId || '',
    persona: data.persona,
    strategy: data.strategy,
    competitors: data.competitors,
    industry: data.industry,
    businessType: data.businessType,
    targetAudience: data.targetAudience,
    recentEmails: data.recentEmails,
    metadata: data.metadata || {},
  };
}

export function formatContextForPrompt(context: ConversationContext): string {
  const lines: string[] = [];

  if (context.businessType) {
    lines.push(`Business Type: ${context.businessType}`);
  }

  if (context.industry) {
    lines.push(`Industry: ${context.industry}`);
  }

  if (context.targetAudience) {
    lines.push(`Target Audience: ${context.targetAudience}`);
  }

  if (context.persona) {
    lines.push(`\nTarget Persona:\n${context.persona}`);
  }

  if (context.strategy) {
    lines.push(`\nMarketing Strategy:\n${context.strategy}`);
  }

  if (context.competitors && context.competitors.length > 0) {
    lines.push(`\nCompetitors: ${context.competitors.join(', ')}`);
  }

  if (context.recentEmails && context.recentEmails.length > 0) {
    lines.push('\nRecent Email Activity:');
    context.recentEmails.slice(0, 5).forEach((email, i) => {
      lines.push(`${i + 1}. From: ${email.from}`);
      lines.push(`   Subject: ${email.subject}`);
      lines.push(`   Date: ${email.date}`);
    });
  }

  return lines.join('\n');
}

export function buildEmailContext(email: {
  subject: string;
  body: string;
  from: { name: string; email: string };
  to?: { name: string; email: string };
  date?: string;
  threadId?: string;
  previousEmails?: any[];
}): EmailContext {
  return {
    subject: email.subject,
    body: email.body,
    from: email.from,
    to: email.to,
    date: email.date,
    threadId: email.threadId,
    previousEmails: email.previousEmails?.map((prev) => ({
      subject: prev.subject,
      body: prev.body,
      from: prev.from,
      to: prev.to,
      date: prev.date,
    })),
  };
}

export function formatEmailThread(context: EmailContext): string {
  const lines: string[] = [];

  lines.push(`Current Email:`);
  lines.push(`From: ${context.from.name} <${context.from.email}>`);
  if (context.to) {
    lines.push(`To: ${context.to.name} <${context.to.email}>`);
  }
  lines.push(`Subject: ${context.subject}`);
  if (context.date) {
    lines.push(`Date: ${context.date}`);
  }
  lines.push(`\nBody:\n${context.body}`);

  if (context.previousEmails && context.previousEmails.length > 0) {
    lines.push('\n---\n');
    lines.push('Previous Emails in Thread:');

    context.previousEmails.forEach((email, i) => {
      lines.push(`\n[${i + 1}] From: ${email.from.name} <${email.from.email}>`);
      if (email.date) {
        lines.push(`Date: ${email.date}`);
      }
      lines.push(`Subject: ${email.subject}`);
      lines.push(`\n${email.body}`);
      lines.push('---');
    });
  }

  return lines.join('\n');
}

export function extractKeywords(text: string): string[] {
  // Simple keyword extraction - can be enhanced with NLP
  const stopWords = new Set([
    'the',
    'a',
    'an',
    'and',
    'or',
    'but',
    'in',
    'on',
    'at',
    'to',
    'for',
    'of',
    'with',
    'by',
    'from',
    'as',
    'is',
    'was',
    'are',
    'were',
    'been',
    'be',
    'have',
    'has',
    'had',
    'do',
    'does',
    'did',
    'will',
    'would',
    'should',
    'could',
    'may',
    'might',
    'can',
  ]);

  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 3 && !stopWords.has(word));

  const wordFreq = new Map<string, number>();
  words.forEach((word) => {
    wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
  });

  return Array.from(wordFreq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([word]) => word);
}

export function analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
  // Simple sentiment analysis - can be enhanced with ML
  const positiveWords = [
    'great',
    'excellent',
    'amazing',
    'wonderful',
    'fantastic',
    'love',
    'thank',
    'thanks',
    'appreciate',
    'helpful',
    'perfect',
    'awesome',
    'brilliant',
  ];

  const negativeWords = [
    'bad',
    'terrible',
    'awful',
    'hate',
    'angry',
    'frustrated',
    'disappointed',
    'poor',
    'useless',
    'worst',
    'complaint',
    'issue',
    'problem',
    'broken',
    'failed',
  ];

  const lowerText = text.toLowerCase();
  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    const matches = lowerText.match(new RegExp(`\\b${word}\\b`, 'g'));
    if (matches) positiveCount += matches.length;
  });

  negativeWords.forEach((word) => {
    const matches = lowerText.match(new RegExp(`\\b${word}\\b`, 'g'));
    if (matches) negativeCount += matches.length;
  });

  if (positiveCount > negativeCount + 1) return 'positive';
  if (negativeCount > positiveCount + 1) return 'negative';
  return 'neutral';
}
