/**
 * Email Extraction Bridge
 * Phase 51: Extract invoices, receipts, and context from emails
 */

import { getSupabaseServer } from '@/lib/supabase';
import { analyzeEmail } from '@/lib/services/founderEmailService';
import { upsertMemoryNode } from '@/lib/services/founderMemoryService';

export interface ExtractedDocument {
  type: 'invoice' | 'receipt' | 'quote' | 'statement';
  vendor_name?: string;
  client_name?: string;
  document_number?: string;
  document_date?: string;
  due_date?: string;
  subtotal?: number;
  tax_amount?: number;
  total_amount: number;
  currency: string;
  line_items: any[];
  category?: string;
  raw_text?: string;
}

// Process email and extract financial documents
export async function processEmailForExtraction(
  founderId: string,
  organizationId: string,
  email: {
    id?: string;
    sender: string;
    subject: string;
    body: string;
    received_at: string;
    attachments?: { filename: string; content: string }[];
  }
): Promise<{
  emailIntelligence: any;
  extractedDocuments: ExtractedDocument[];
}> {
  // Analyze email for intelligence
  const emailIntelligence = await analyzeEmail(founderId, organizationId, email);

  // Extract financial documents
  const extractedDocuments: ExtractedDocument[] = [];

  // Check if email contains invoice/receipt
  if (isFinancialEmail(email.subject, email.body)) {
    const document = extractDocumentFromEmail(email);
    if (document) {
      extractedDocuments.push(document);

      // Save to database
      await saveExtractedDocument(founderId, organizationId, document, 'email', email.id);

      // Add to memory graph
      await upsertMemoryNode(founderId, organizationId, {
        node_type: document.type === 'invoice' ? 'invoice' : 'receipt',
        entity_id: email.id || crypto.randomUUID(),
        title: `${document.type}: ${document.document_number || document.vendor_name || 'Unknown'}`,
        summary: `$${document.total_amount} ${document.currency} from ${document.vendor_name || 'Unknown'}`,
        context_data: document,
        importance_score: document.total_amount > 1000 ? 80 : 60,
      });
    }
  }

  // Process attachments if any
  if (email.attachments) {
    for (const attachment of email.attachments) {
      if (isPDFInvoice(attachment.filename)) {
        // Would integrate with PDF extraction here
        const pdfDoc = await extractFromPDF(attachment);
        if (pdfDoc) {
          extractedDocuments.push(pdfDoc);
          await saveExtractedDocument(founderId, organizationId, pdfDoc, 'email', email.id);
        }
      }
    }
  }

  return {
    emailIntelligence,
    extractedDocuments,
  };
}

// Batch process multiple emails
export async function batchProcessEmails(
  founderId: string,
  organizationId: string,
  emails: any[]
): Promise<{
  processed: number;
  documents: number;
  errors: number;
}> {
  let processed = 0;
  let documents = 0;
  let errors = 0;

  for (const email of emails) {
    try {
      const result = await processEmailForExtraction(founderId, organizationId, email);
      processed++;
      documents += result.extractedDocuments.length;
    } catch (error) {
      console.error('Error processing email:', error);
      errors++;
    }
  }

  return { processed, documents, errors };
}

// Get extracted documents
export async function getExtractedDocuments(
  founderId: string,
  options: {
    type?: string;
    startDate?: string;
    endDate?: string;
    verified?: boolean;
    limit?: number;
  } = {}
): Promise<any[]> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_financial_extractions')
    .select('*')
    .eq('founder_id', founderId)
    .order('created_at', { ascending: false });

  if (options.type) {
    query = query.eq('document_type', options.type);
  }

  if (options.startDate) {
    query = query.gte('document_date', options.startDate);
  }

  if (options.endDate) {
    query = query.lte('document_date', options.endDate);
  }

  if (options.verified !== undefined) {
    query = query.eq('verified', options.verified);
  }

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching documents:', error);
    return [];
  }

  return data;
}

// Verify extracted document
export async function verifyDocument(
  founderId: string,
  documentId: string,
  corrections?: Partial<ExtractedDocument>
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const updateData: any = {
    verified: true,
    verified_by: founderId,
    verified_at: new Date().toISOString(),
  };

  if (corrections) {
    Object.assign(updateData, corrections);
  }

  const { error } = await supabase
    .from('founder_financial_extractions')
    .update(updateData)
    .eq('id', documentId)
    .eq('founder_id', founderId);

  return !error;
}

// Helper functions
function isFinancialEmail(subject: string, body: string): boolean {
  const content = (subject + ' ' + body).toLowerCase();
  const keywords = [
    'invoice',
    'receipt',
    'payment',
    'bill',
    'statement',
    'quote',
    'total',
    'amount due',
    'balance',
  ];
  return keywords.some((keyword) => content.includes(keyword));
}

function extractDocumentFromEmail(email: {
  subject: string;
  body: string;
  sender: string;
}): ExtractedDocument | null {
  const subject = email.subject.toLowerCase();
  const body = email.body;

  // Determine document type
  let type: 'invoice' | 'receipt' | 'quote' | 'statement' = 'invoice';
  if (subject.includes('receipt') || body.toLowerCase().includes('receipt')) {
    type = 'receipt';
  } else if (subject.includes('quote')) {
    type = 'quote';
  } else if (subject.includes('statement')) {
    type = 'statement';
  }

  // Extract vendor name from sender
  const vendor_name = extractVendorName(email.sender);

  // Extract amount
  const amounts = extractAmounts(body);
  if (amounts.length === 0) {
    return null;
  }

  const total_amount = Math.max(...amounts);

  // Extract document number
  const document_number = extractDocumentNumber(body, type);

  // Extract dates
  const dates = extractDates(body);

  // Extract line items (simplified)
  const line_items = extractLineItems(body);

  return {
    type,
    vendor_name,
    document_number,
    document_date: dates.document,
    due_date: dates.due,
    total_amount,
    currency: 'AUD',
    line_items,
    raw_text: body.substring(0, 1000),
  };
}

function extractVendorName(sender: string): string {
  // Extract name from email format "Name <email@domain.com>"
  const match = sender.match(/^([^<]+)/);
  if (match) {
    return match[1].trim();
  }
  // Extract from domain
  const domain = sender.split('@')[1]?.split('.')[0];
  return domain ? domain.charAt(0).toUpperCase() + domain.slice(1) : 'Unknown';
}

function extractAmounts(text: string): number[] {
  const amounts: number[] = [];
  const regex = /\$[\d,]+\.?\d*/g;
  const matches = text.match(regex);

  if (matches) {
    matches.forEach((match) => {
      const amount = parseFloat(match.replace(/[$,]/g, ''));
      if (!isNaN(amount) && amount > 0) {
        amounts.push(amount);
      }
    });
  }

  return amounts;
}

function extractDocumentNumber(text: string, type: string): string | undefined {
  const patterns = [
    /(?:invoice|inv)[\s#:]*([A-Z0-9-]+)/i,
    /(?:receipt|rcpt)[\s#:]*([A-Z0-9-]+)/i,
    /(?:order|ref)[\s#:]*([A-Z0-9-]+)/i,
    /#\s*([A-Z0-9-]+)/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return undefined;
}

function extractDates(text: string): { document?: string; due?: string } {
  const result: { document?: string; due?: string } = {};

  // Due date
  const dueMatch = text.match(/(?:due|by|before)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dueMatch) {
    result.due = normalizeDate(dueMatch[1]);
  }

  // Document date
  const dateMatch = text.match(/(?:date|dated)[\s:]*(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/i);
  if (dateMatch) {
    result.document = normalizeDate(dateMatch[1]);
  }

  return result;
}

function normalizeDate(dateStr: string): string {
  // Simple date normalization - would be more robust in production
  const parts = dateStr.split(/[\/\-]/);
  if (parts.length === 3) {
    let [day, month, year] = parts;
    if (year.length === 2) {
      year = '20' + year;
    }
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  return dateStr;
}

function extractLineItems(text: string): any[] {
  // Simplified line item extraction
  const items: any[] = [];
  const lines = text.split('\n');

  lines.forEach((line) => {
    // Look for lines with amounts
    const amountMatch = line.match(/\$[\d,]+\.?\d*/);
    if (amountMatch) {
      const amount = parseFloat(amountMatch[0].replace(/[$,]/g, ''));
      const description = line.replace(amountMatch[0], '').trim();
      if (description.length > 3 && description.length < 100) {
        items.push({
          description,
          amount,
        });
      }
    }
  });

  return items.slice(0, 10); // Limit to 10 items
}

async function saveExtractedDocument(
  founderId: string,
  organizationId: string,
  document: ExtractedDocument,
  sourceType: string,
  sourceId?: string
): Promise<void> {
  const supabase = await getSupabaseServer();

  await supabase.from('founder_financial_extractions').insert({
    founder_id: founderId,
    organization_id: organizationId,
    source_type: sourceType,
    source_id: sourceId,
    document_type: document.type,
    vendor_name: document.vendor_name,
    client_name: document.client_name,
    document_number: document.document_number,
    document_date: document.document_date,
    due_date: document.due_date,
    subtotal: document.subtotal,
    tax_amount: document.tax_amount,
    total_amount: document.total_amount,
    currency: document.currency,
    line_items: document.line_items,
    category: document.category,
  });
}

function isPDFInvoice(filename: string): boolean {
  const lower = filename.toLowerCase();
  return lower.endsWith('.pdf') &&
    (lower.includes('invoice') || lower.includes('receipt') || lower.includes('bill'));
}

async function extractFromPDF(attachment: {
  filename: string;
  content: string;
}): Promise<ExtractedDocument | null> {
  // Placeholder for PDF extraction
  // Would integrate with PDF parsing library
  return null;
}

export default {
  processEmailForExtraction,
  batchProcessEmails,
  getExtractedDocuments,
  verifyDocument,
};
