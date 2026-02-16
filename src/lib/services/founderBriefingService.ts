/**
 * Founder Briefing Service
 * Phase 51: Auto-generated daily briefings
 */

import { getSupabaseServer } from '@/lib/supabase';
import { getEmailSummary } from './founderEmailService';
import { getMemoryStats } from './founderMemoryService';

interface EmailSummaryData {
  total: number;
  byCategory: Record<string, number>;
  byPriority: Record<string, number>;
  actionItemsCount: number;
}

interface MemoryStatsData {
  totalNodes: number;
  byType: Record<string, number>;
  avgImportance: number;
  recentlyAccessed: number;
}

interface FinancialRecord {
  document_type: string;
  total_amount: number | null;
  created_at: string;
}

interface AlertItem {
  type: string;
  message: string;
  severity: string;
}

interface InsightItem {
  insight: string;
  category: string;
}

export interface Briefing {
  id: string;
  founder_id: string;
  briefing_date: string;
  briefing_type: 'daily' | 'weekly' | 'monthly' | 'ad_hoc';
  executive_summary: string;
  key_metrics: Record<string, unknown>;
  client_updates: { id: string; name: string; status: string; score: number | null }[];
  financial_summary: Record<string, unknown>;
  staff_activity: { staff_id: string; tasks: number; hours: number }[];
  action_items: { title: string; priority: string; source: string }[];
  upcoming_events: unknown[];
  alerts: { type: string; message: string; severity: string }[];
  ai_insights: { insight: string; category: string }[];
  recommendations: { recommendation: string; priority: string }[];
  is_read: boolean;
  created_at: string;
}

// Generate daily briefing
export async function generateDailyBriefing(
  founderId: string,
  organizationId: string
): Promise<Briefing | null> {
  const supabase = await getSupabaseServer();

  const today = new Date().toISOString().split('T')[0];

  // Check if briefing already exists for today
  const { data: existing } = await supabase
    .from('founder_briefings')
    .select('id')
    .eq('founder_id', founderId)
    .eq('briefing_date', today)
    .eq('briefing_type', 'daily')
    .single();

  if (existing) {
    // Return existing briefing
    const { data } = await supabase
      .from('founder_briefings')
      .select('*')
      .eq('id', existing.id)
      .single();
    return data as Briefing;
  }

  // Gather data for briefing
  const emailSummary = await getEmailSummary(founderId);
  const memoryStats = await getMemoryStats(founderId);

  // Get recent client activity
  const { data: clients } = await supabase
    .from('contacts')
    .select('id, name, status, ai_score, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5);

  // Get financial summary
  const { data: financials } = await supabase
    .from('founder_financial_extractions')
    .select('document_type, total_amount, created_at')
    .eq('founder_id', founderId)
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Calculate financial metrics
  const invoiceTotal = (financials || [])
    .filter((f) => f.document_type === 'invoice')
    .reduce((sum, f) => sum + (f.total_amount || 0), 0);

  const receiptTotal = (financials || [])
    .filter((f) => f.document_type === 'receipt')
    .reduce((sum, f) => sum + (f.total_amount || 0), 0);

  // Get staff activity (simplified)
  const { data: staffActivity } = await supabase
    .from('founder_staff_insights')
    .select('staff_id, tasks_completed, hours_logged')
    .eq('founder_id', founderId)
    .gte('period_end', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  // Generate alerts
  const alerts = generateAlerts(emailSummary, financials || []);

  // Generate action items
  const actionItems = generateActionItems(emailSummary, alerts);

  // Generate AI insights
  const aiInsights = generateInsights(
    emailSummary,
    memoryStats,
    invoiceTotal,
    receiptTotal
  );

  // Generate recommendations
  const recommendations = generateRecommendations(alerts, aiInsights);

  // Create executive summary
  const executiveSummary = createExecutiveSummary(
    emailSummary,
    invoiceTotal,
    receiptTotal,
    clients?.length || 0,
    alerts.length
  );

  // Insert briefing
  const { data: briefing, error } = await supabase
    .from('founder_briefings')
    .insert({
      founder_id: founderId,
      organization_id: organizationId,
      briefing_date: today,
      briefing_type: 'daily',
      executive_summary: executiveSummary,
      key_metrics: {
        emails_processed: emailSummary.total,
        action_items_pending: emailSummary.actionItemsCount,
        memory_nodes: memoryStats.totalNodes,
        avg_importance: memoryStats.avgImportance,
      },
      client_updates: (clients || []).map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        score: c.ai_score,
      })),
      financial_summary: {
        invoices_total: invoiceTotal,
        receipts_total: receiptTotal,
        net_position: invoiceTotal - receiptTotal,
      },
      staff_activity: (staffActivity || []).map((s) => ({
        staff_id: s.staff_id,
        tasks: s.tasks_completed,
        hours: s.hours_logged,
      })),
      action_items: actionItems,
      upcoming_events: [],
      alerts,
      ai_insights: aiInsights,
      recommendations,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating briefing:', error);
    return null;
  }

  return briefing as Briefing;
}

// Get latest briefing
export async function getLatestBriefing(founderId: string): Promise<Briefing | null> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_briefings')
    .select('*')
    .eq('founder_id', founderId)
    .order('briefing_date', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    return null;
  }

  return data as Briefing;
}

// Get briefings for date range
export async function getBriefings(
  founderId: string,
  startDate: string,
  endDate: string
): Promise<Briefing[]> {
  const supabase = await getSupabaseServer();

  const { data, error } = await supabase
    .from('founder_briefings')
    .select('*')
    .eq('founder_id', founderId)
    .gte('briefing_date', startDate)
    .lte('briefing_date', endDate)
    .order('briefing_date', { ascending: false });

  if (error) {
    console.error('Error fetching briefings:', error);
    return [];
  }

  return data as Briefing[];
}

// Mark briefing as read
export async function markBriefingRead(
  founderId: string,
  briefingId: string
): Promise<boolean> {
  const supabase = await getSupabaseServer();

  const { error } = await supabase
    .from('founder_briefings')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', briefingId)
    .eq('founder_id', founderId);

  return !error;
}

// Helper functions
function generateAlerts(
  emailSummary: EmailSummaryData,
  financials: FinancialRecord[]
): AlertItem[] {
  const alerts: AlertItem[] = [];

  if (emailSummary.byPriority?.urgent > 0) {
    alerts.push({
      type: 'email',
      message: `${emailSummary.byPriority.urgent} urgent emails require attention`,
      severity: 'high',
    });
  }

  if (emailSummary.actionItemsCount > 10) {
    alerts.push({
      type: 'tasks',
      message: `${emailSummary.actionItemsCount} action items pending from emails`,
      severity: 'medium',
    });
  }

  // Check for overdue invoices (simplified)
  const invoiceCount = financials.filter((f) => f.document_type === 'invoice').length;
  if (invoiceCount > 5) {
    alerts.push({
      type: 'financial',
      message: `${invoiceCount} invoices processed this week`,
      severity: 'info',
    });
  }

  return alerts;
}

function generateActionItems(
  emailSummary: EmailSummaryData,
  alerts: AlertItem[]
): { title: string; priority: string; source: string }[] {
  const items: { title: string; priority: string; source: string }[] = [];

  if (alerts.some((a) => a.severity === 'high')) {
    items.push({
      title: 'Review urgent emails',
      priority: 'high',
      source: 'email',
    });
  }

  if (emailSummary.byCategory?.invoice > 0) {
    items.push({
      title: `Process ${emailSummary.byCategory.invoice} invoice emails`,
      priority: 'normal',
      source: 'email',
    });
  }

  if (emailSummary.actionItemsCount > 0) {
    items.push({
      title: `Complete ${emailSummary.actionItemsCount} email action items`,
      priority: 'normal',
      source: 'email',
    });
  }

  return items;
}

function generateInsights(
  emailSummary: EmailSummaryData,
  memoryStats: MemoryStatsData,
  invoiceTotal: number,
  receiptTotal: number
): InsightItem[] {
  const insights: InsightItem[] = [];

  if (invoiceTotal > receiptTotal * 2) {
    insights.push({
      insight: 'Invoice volume significantly exceeds expenses - healthy cash flow indicated',
      category: 'financial',
    });
  }

  if (emailSummary.byCategory?.client_communication > emailSummary.total * 0.5) {
    insights.push({
      insight: 'High client engagement this week - most emails are client communications',
      category: 'engagement',
    });
  }

  if (memoryStats.recentlyAccessed > memoryStats.totalNodes * 0.3) {
    insights.push({
      insight: 'Active context usage - 30%+ memory nodes accessed recently',
      category: 'productivity',
    });
  }

  return insights;
}

function generateRecommendations(
  alerts: AlertItem[],
  insights: InsightItem[]
): { recommendation: string; priority: string }[] {
  const recommendations: { recommendation: string; priority: string }[] = [];

  if (alerts.some((a) => a.type === 'email' && a.severity === 'high')) {
    recommendations.push({
      recommendation: 'Dedicate first 30 minutes to clearing urgent emails',
      priority: 'high',
    });
  }

  if (insights.some((i) => i.category === 'financial')) {
    recommendations.push({
      recommendation: 'Review financial dashboard for detailed cash flow analysis',
      priority: 'normal',
    });
  }

  return recommendations;
}

function createExecutiveSummary(
  emailSummary: EmailSummaryData,
  invoiceTotal: number,
  receiptTotal: number,
  clientCount: number,
  alertCount: number
): string {
  const parts: string[] = [];

  parts.push(`Today's briefing: ${emailSummary.total} emails processed.`);

  if (invoiceTotal > 0 || receiptTotal > 0) {
    parts.push(
      `Financial activity: $${invoiceTotal.toFixed(2)} in invoices, $${receiptTotal.toFixed(2)} in receipts.`
    );
  }

  if (clientCount > 0) {
    parts.push(`${clientCount} active clients updated.`);
  }

  if (alertCount > 0) {
    parts.push(`${alertCount} items requiring attention.`);
  }

  return parts.join(' ');
}

export default {
  generateDailyBriefing,
  getLatestBriefing,
  getBriefings,
  markBriefingRead,
};
