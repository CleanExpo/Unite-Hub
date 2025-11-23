/**
 * Founder Voice Commands Service
 * Phase 51: Voice-activated controls for hands-free operation
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getLatestBriefing } from './founderBriefingService';
import { getEmailSummary, getUrgentEmails } from './founderEmailService';
import { getMemoryNodes, searchMemory } from './founderMemoryService';
import { getTeamOverview } from './founderStaffInsightsService';

export type VoiceCommandType =
  | 'show_briefing'
  | 'show_financials'
  | 'summarise_emails'
  | 'list_clients'
  | 'list_staff_activity'
  | 'fetch_invoice'
  | 'fetch_receipt'
  | 'run_report'
  | 'custom';

export interface VoiceCommandResult {
  success: boolean;
  command_type: VoiceCommandType;
  data?: any;
  message: string;
  error?: string;
}

// Execute a voice command
export async function executeVoiceCommand(
  founderId: string,
  organizationId: string,
  commandText: string
): Promise<VoiceCommandResult> {
  const supabase = await getSupabaseServer();

  // Parse command
  const commandType = parseCommand(commandText);
  const params = extractParams(commandText);

  let result: VoiceCommandResult;

  try {
    switch (commandType) {
      case 'show_briefing':
        result = await handleShowBriefing(founderId);
        break;

      case 'show_financials':
        result = await handleShowFinancials(founderId);
        break;

      case 'summarise_emails':
        result = await handleSummariseEmails(founderId);
        break;

      case 'list_clients':
        result = await handleListClients(founderId);
        break;

      case 'list_staff_activity':
        result = await handleListStaffActivity(founderId);
        break;

      case 'fetch_invoice':
        result = await handleFetchInvoice(founderId, params.invoiceNumber);
        break;

      case 'fetch_receipt':
        result = await handleFetchReceipt(founderId, params.query);
        break;

      case 'run_report':
        result = await handleRunReport(founderId, params.reportType);
        break;

      default:
        result = await handleCustomCommand(founderId, commandText);
    }
  } catch (error) {
    result = {
      success: false,
      command_type: commandType,
      message: 'Command execution failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }

  // Log command
  await supabase.from('founder_voice_commands').insert({
    founder_id: founderId,
    organization_id: organizationId,
    command_text: commandText,
    command_type: commandType,
    executed: result.success,
    execution_result: result.data || {},
    error_message: result.error,
    executed_at: new Date().toISOString(),
  });

  return result;
}

// Get command history
export async function getCommandHistory(
  founderId: string,
  limit: number = 20
): Promise<any[]> {
  const supabase = await getSupabaseServer();

  const { data } = await supabase
    .from('founder_voice_commands')
    .select('*')
    .eq('founder_id', founderId)
    .order('created_at', { ascending: false })
    .limit(limit);

  return data || [];
}

// Parse command text to determine type
function parseCommand(text: string): VoiceCommandType {
  const lower = text.toLowerCase();

  if (lower.includes('briefing') || lower.includes('summary')) {
    return 'show_briefing';
  }
  if (lower.includes('financial') || lower.includes('money') || lower.includes('cash flow')) {
    return 'show_financials';
  }
  if (lower.includes('email') || lower.includes('mail')) {
    return 'summarise_emails';
  }
  if (lower.includes('client') || lower.includes('customer')) {
    return 'list_clients';
  }
  if (lower.includes('staff') || lower.includes('team') || lower.includes('employee')) {
    return 'list_staff_activity';
  }
  if (lower.includes('invoice')) {
    return 'fetch_invoice';
  }
  if (lower.includes('receipt')) {
    return 'fetch_receipt';
  }
  if (lower.includes('report')) {
    return 'run_report';
  }

  return 'custom';
}

// Extract parameters from command text
function extractParams(text: string): Record<string, string> {
  const params: Record<string, string> = {};

  // Extract invoice number
  const invoiceMatch = text.match(/invoice\s*#?\s*([A-Z0-9-]+)/i);
  if (invoiceMatch) {
    params.invoiceNumber = invoiceMatch[1];
  }

  // Extract report type
  if (text.includes('weekly')) {
    params.reportType = 'weekly';
  } else if (text.includes('monthly')) {
    params.reportType = 'monthly';
  } else if (text.includes('financial')) {
    params.reportType = 'financial';
  } else {
    params.reportType = 'summary';
  }

  // Extract query for receipt search
  const words = text.split(' ');
  const queryWords = words.filter(
    (w) => !['fetch', 'get', 'find', 'show', 'receipt', 'receipts'].includes(w.toLowerCase())
  );
  if (queryWords.length > 0) {
    params.query = queryWords.join(' ');
  }

  return params;
}

// Command handlers
async function handleShowBriefing(founderId: string): Promise<VoiceCommandResult> {
  const briefing = await getLatestBriefing(founderId);

  if (!briefing) {
    return {
      success: false,
      command_type: 'show_briefing',
      message: 'No briefing available. Generate one first.',
    };
  }

  return {
    success: true,
    command_type: 'show_briefing',
    data: {
      summary: briefing.executive_summary,
      alerts: briefing.alerts,
      action_items: briefing.action_items,
      date: briefing.briefing_date,
    },
    message: briefing.executive_summary,
  };
}

async function handleShowFinancials(founderId: string): Promise<VoiceCommandResult> {
  const supabase = await getSupabaseServer();

  const { data: financials } = await supabase
    .from('founder_financial_extractions')
    .select('document_type, total_amount, currency')
    .eq('founder_id', founderId)
    .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const invoices = (financials || []).filter((f) => f.document_type === 'invoice');
  const receipts = (financials || []).filter((f) => f.document_type === 'receipt');

  const invoiceTotal = invoices.reduce((sum, f) => sum + (f.total_amount || 0), 0);
  const receiptTotal = receipts.reduce((sum, f) => sum + (f.total_amount || 0), 0);

  const message = `Last 30 days: ${invoices.length} invoices totaling $${invoiceTotal.toFixed(2)}, ${receipts.length} receipts totaling $${receiptTotal.toFixed(2)}. Net position: $${(invoiceTotal - receiptTotal).toFixed(2)}.`;

  return {
    success: true,
    command_type: 'show_financials',
    data: {
      invoices: { count: invoices.length, total: invoiceTotal },
      receipts: { count: receipts.length, total: receiptTotal },
      net: invoiceTotal - receiptTotal,
    },
    message,
  };
}

async function handleSummariseEmails(founderId: string): Promise<VoiceCommandResult> {
  const summary = await getEmailSummary(founderId);
  const urgent = await getUrgentEmails(founderId);

  let message = `${summary.total} emails this week.`;

  if (urgent.length > 0) {
    message += ` ${urgent.length} urgent emails require attention.`;
  }

  if (summary.actionItemsCount > 0) {
    message += ` ${summary.actionItemsCount} action items pending.`;
  }

  return {
    success: true,
    command_type: 'summarise_emails',
    data: {
      summary,
      urgent: urgent.map((e) => ({ subject: e.subject, sender: e.sender })),
    },
    message,
  };
}

async function handleListClients(founderId: string): Promise<VoiceCommandResult> {
  const clients = await getMemoryNodes(founderId, {
    node_type: 'client',
    limit: 10,
  });

  const message =
    clients.length > 0
      ? `${clients.length} clients in memory. Top: ${clients.slice(0, 3).map((c) => c.title).join(', ')}.`
      : 'No clients in memory yet.';

  return {
    success: true,
    command_type: 'list_clients',
    data: clients.map((c) => ({ title: c.title, importance: c.importance_score })),
    message,
  };
}

async function handleListStaffActivity(founderId: string): Promise<VoiceCommandResult> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const today = new Date().toISOString().split('T')[0];

  const overview = await getTeamOverview(founderId, weekAgo, today);

  const message = overview.totalStaff > 0
    ? `${overview.totalStaff} staff members. Average productivity: ${overview.avgProductivity}%, engagement: ${overview.avgEngagement}%. ${overview.totalTasks} tasks completed.`
    : 'No staff activity data available.';

  return {
    success: true,
    command_type: 'list_staff_activity',
    data: overview,
    message,
  };
}

async function handleFetchInvoice(
  founderId: string,
  invoiceNumber?: string
): Promise<VoiceCommandResult> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_financial_extractions')
    .select('*')
    .eq('founder_id', founderId)
    .eq('document_type', 'invoice');

  if (invoiceNumber) {
    query = query.ilike('document_number', `%${invoiceNumber}%`);
  } else {
    query = query.order('created_at', { ascending: false }).limit(5);
  }

  const { data: invoices } = await query;

  if (!invoices || invoices.length === 0) {
    return {
      success: false,
      command_type: 'fetch_invoice',
      message: invoiceNumber
        ? `No invoice found matching "${invoiceNumber}".`
        : 'No invoices found.',
    };
  }

  const invoice = invoices[0];
  const message = `Invoice ${invoice.document_number || 'N/A'} from ${invoice.vendor_name || 'Unknown'}: $${invoice.total_amount} ${invoice.currency}.`;

  return {
    success: true,
    command_type: 'fetch_invoice',
    data: invoices,
    message,
  };
}

async function handleFetchReceipt(
  founderId: string,
  searchQuery?: string
): Promise<VoiceCommandResult> {
  const supabase = await getSupabaseServer();

  let query = supabase
    .from('founder_financial_extractions')
    .select('*')
    .eq('founder_id', founderId)
    .eq('document_type', 'receipt');

  if (searchQuery) {
    query = query.or(`vendor_name.ilike.%${searchQuery}%,category.ilike.%${searchQuery}%`);
  }

  query = query.order('created_at', { ascending: false }).limit(5);

  const { data: receipts } = await query;

  if (!receipts || receipts.length === 0) {
    return {
      success: false,
      command_type: 'fetch_receipt',
      message: searchQuery
        ? `No receipts found matching "${searchQuery}".`
        : 'No receipts found.',
    };
  }

  const total = receipts.reduce((sum, r) => sum + (r.total_amount || 0), 0);
  const message = `Found ${receipts.length} receipts totaling $${total.toFixed(2)}.`;

  return {
    success: true,
    command_type: 'fetch_receipt',
    data: receipts,
    message,
  };
}

async function handleRunReport(
  founderId: string,
  reportType: string
): Promise<VoiceCommandResult> {
  // Placeholder - would generate actual reports
  const message = `Generating ${reportType} report. This will be available in your dashboard shortly.`;

  return {
    success: true,
    command_type: 'run_report',
    data: { reportType, status: 'generating' },
    message,
  };
}

async function handleCustomCommand(
  founderId: string,
  commandText: string
): Promise<VoiceCommandResult> {
  // Search memory for relevant context
  const results = await searchMemory(founderId, commandText);

  if (results.length > 0) {
    return {
      success: true,
      command_type: 'custom',
      data: results.slice(0, 5),
      message: `Found ${results.length} relevant items in memory.`,
    };
  }

  return {
    success: false,
    command_type: 'custom',
    message: `Command not recognized: "${commandText}". Try: briefing, emails, clients, staff, invoices, receipts.`,
  };
}

export default {
  executeVoiceCommand,
  getCommandHistory,
};
