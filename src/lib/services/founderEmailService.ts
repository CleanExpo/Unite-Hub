/**
 * Founder Email Intelligence Service
 * Phase 51: AI-powered email analysis and extraction
 */

import { getSupabaseServer } from '@/lib/supabase';

export type EmailCategory =
  | 'client_communication'
  | 'invoice'
  | 'receipt'
  | 'meeting'
  | 'staff'
  | 'urgent'
  | 'marketing'
  | 'legal'
  | 'financial'
  | 'other';

export interface EmailIntelligence {
  id: string;
  founder_id: string;
  email_id?: string;
  thread_id?: string;
  sender: string;
  subject: string;
  received_at: string;
  category: EmailCategory;
  priority: string;
  sentiment: string;
  ai_summary: string;
  action_items: string[];
  key_points: string[];
  extracted_amount?: number;
  extracted_client_id?: string;
}

// Analyze email and extract intelligence
export async function analyzeEmail(
  founderId: string,
  organizationId: string,
  email: {
    sender: string;
    subject: string;
    body: string;
    received_at: string;
    thread_id?: string;
  }
): Promise<EmailIntelligence | null> {
  const supabase = await getSupabaseServer();

  // Categorize email based on patterns
  const category = categorizeEmail(email.sender, email.subject, email.body);
  const priority = determinePriority(email.subject, email.body);
  const sentiment = analyzeSentiment(email.body);

  // Extract key information
  const summary = generateSummary(email.subject, email.body);
  const actionItems = extractActionItems(email.body);
  const keyPoints = extractKeyPoints(email.body);

  // Extract financial data if applicable
  const financialData = extractFinancialData(email.body);

  const { data, error } = await supabase
    .from('founder_email_intelligence')
    .insert({
      founder_id: founderId,
      organization_id: organizationId,
      thread_id: email.thread_id,
      sender: email.sender,
      sender_domain: email.sender.split('@')[1],
      subject: email.subject,
      received_at: email.received_at,
      category,
      priority,
      sentiment,
      ai_summary: summary,
      action_items: actionItems,
      key_points: keyPoints,
      extracted_amount: financialData.amount,
      extracted_currency: financialData.currency,
      extracted_due_date: financialData.dueDate,
      extracted_invoice_number: financialData.invoiceNumber,
      processed: true,
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error('Error saving email intelligence:', error);
    return null;
  }

  return data as EmailIntelligence;
}

// Get email intelligence for founder
export async function getEmailIntelligence(
  founderId: string,
  options: {
    category?: EmailCategory;
    priority?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<EmailIntelligence[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_email_intelligence')
    .select('*')
    .eq('founder_id', founderId)
    .order('received_at', { ascending: false });

  if (options.category) {
    query = query.eq('category', options.category);
  }

  if (options.priority) {
    query = query.eq('priority', options.priority);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  if (options.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching email intelligence:', error);
    return [];
  }

  return data as EmailIntelligence[];
}

// Get urgent emails
export async function getUrgentEmails(founderId: string): Promise<EmailIntelligence[]> {
  return getEmailIntelligence(founderId, { priority: 'urgent', limit: 10 });
}

// Get unprocessed emails summary
export async function getEmailSummary(founderId: string): Promise<{
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  actionItemsCount: number;
}> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_email_intelligence')
    .select('category, priority, action_items')
    .eq('founder_id', founderId)
    .gte('received_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  if (!data) {
    return {
      total: 0,
      byCategory: {},
      byPriority: {},
      actionItemsCount: 0,
    };
  }

  const byCategory: Record<string, number> = {};
  const byPriority: Record<string, number> = {};
  let actionItemsCount = 0;

  data.forEach((email) => {
    byCategory[email.category] = (byCategory[email.category] || 0) + 1;
    byPriority[email.priority] = (byPriority[email.priority] || 0) + 1;
    actionItemsCount += (email.action_items || []).length;
  });

  return {
    total: data.length,
    byCategory,
    byPriority,
    actionItemsCount,
  };
}

// Helper functions
function categorizeEmail(sender: string, subject: string, body: string): EmailCategory {
  const lowerSubject = subject.toLowerCase();
  const lowerBody = body.toLowerCase();

  if (lowerSubject.includes('invoice') || lowerBody.includes('invoice')) {
    return 'invoice';
  }
  if (lowerSubject.includes('receipt') || lowerBody.includes('receipt')) {
    return 'receipt';
  }
  if (lowerSubject.includes('meeting') || lowerSubject.includes('calendar')) {
    return 'meeting';
  }
  if (lowerSubject.includes('urgent') || lowerSubject.includes('asap')) {
    return 'urgent';
  }
  if (lowerSubject.includes('payment') || lowerSubject.includes('financial')) {
    return 'financial';
  }
  if (lowerSubject.includes('legal') || lowerSubject.includes('contract')) {
    return 'legal';
  }
  if (lowerSubject.includes('marketing') || lowerSubject.includes('campaign')) {
    return 'marketing';
  }

  return 'client_communication';
}

function determinePriority(subject: string, body: string): string {
  const content = (subject + ' ' + body).toLowerCase();

  if (content.includes('urgent') || content.includes('asap') || content.includes('immediately')) {
    return 'urgent';
  }
  if (content.includes('important') || content.includes('priority') || content.includes('deadline')) {
    return 'high';
  }
  if (content.includes('fyi') || content.includes('when you can')) {
    return 'low';
  }

  return 'normal';
}

function analyzeSentiment(body: string): string {
  const lower = body.toLowerCase();

  const positiveWords = ['thank', 'great', 'excellent', 'happy', 'pleased', 'wonderful', 'appreciate'];
  const negativeWords = ['issue', 'problem', 'concern', 'disappointed', 'frustrated', 'urgent', 'complaint'];

  let positiveCount = 0;
  let negativeCount = 0;

  positiveWords.forEach((word) => {
    if (lower.includes(word)) {
positiveCount++;
}
  });

  negativeWords.forEach((word) => {
    if (lower.includes(word)) {
negativeCount++;
}
  });

  if (positiveCount > negativeCount) {
return 'positive';
}
  if (negativeCount > positiveCount) {
return 'negative';
}
  return 'neutral';
}

function generateSummary(subject: string, body: string): string {
  // Simple summary - first 200 chars or first paragraph
  const firstParagraph = body.split('\n\n')[0];
  const summary = firstParagraph.length > 200
    ? firstParagraph.substring(0, 200) + '...'
    : firstParagraph;

  return summary.trim();
}

function extractActionItems(body: string): string[] {
  const items: string[] = [];
  const lines = body.split('\n');

  lines.forEach((line) => {
    const lower = line.toLowerCase();
    if (
      lower.includes('please') ||
      lower.includes('could you') ||
      lower.includes('need you to') ||
      lower.includes('action required') ||
      lower.match(/^\s*[-•]\s/)
    ) {
      const cleaned = line.trim().replace(/^[-•]\s*/, '');
      if (cleaned.length > 10 && cleaned.length < 200) {
        items.push(cleaned);
      }
    }
  });

  return items.slice(0, 5);
}

function extractKeyPoints(body: string): string[] {
  const points: string[] = [];
  const sentences = body.split(/[.!?]\s+/);

  sentences.forEach((sentence) => {
    if (
      sentence.length > 20 &&
      sentence.length < 150 &&
      (sentence.toLowerCase().includes('important') ||
        sentence.toLowerCase().includes('key') ||
        sentence.toLowerCase().includes('note') ||
        sentence.toLowerCase().includes('deadline'))
    ) {
      points.push(sentence.trim());
    }
  });

  return points.slice(0, 3);
}

function extractFinancialData(body: string): {
  amount?: number;
  currency: string;
  dueDate?: string;
  invoiceNumber?: string;
} {
  const result = {
    currency: 'AUD',
    amount: undefined as number | undefined,
    dueDate: undefined as string | undefined,
    invoiceNumber: undefined as string | undefined,
  };

  // Extract amount
  const amountMatch = body.match(/\$[\d,]+\.?\d*/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[0].replace(/[$,]/g, ''));
  }

  // Extract invoice number
  const invoiceMatch = body.match(/(?:invoice|inv)[\s#:]*([A-Z0-9-]+)/i);
  if (invoiceMatch) {
    result.invoiceNumber = invoiceMatch[1];
  }

  // Extract due date
  const dateMatch = body.match(/(?:due|by|before)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) {
    result.dueDate = dateMatch[1];
  }

  return result;
}

export default {
  analyzeEmail,
  getEmailIntelligence,
  getUrgentEmails,
  getEmailSummary,
};
