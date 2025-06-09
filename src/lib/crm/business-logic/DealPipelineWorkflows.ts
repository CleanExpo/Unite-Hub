/**
 * DEAL PIPELINE WORKFLOWS - BUSINESS LOGIC LAYER
 * 
 * Implements core business logic for deal management workflows
 * with real database integration and validation.
 */

import type { Deal } from '@/types/crm';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Local type definitions for immediate fix
type DealStatus = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost';

// Validation Schemas
export const DealWorkflowSchema = z.object({
  dealId: z.string().uuid(),
  fromStatus: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']),
  toStatus: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});

export const DealCreationSchema = z.object({
  title: z.string().min(1, 'Deal title is required'),
  description: z.string().optional(),
  value: z.number().min(0, 'Deal value must be positive'),
  clientId: z.string().uuid('Valid client ID required'),
  status: z.enum(['lead', 'qualified', 'proposal', 'negotiation', 'closed-won', 'closed-lost']).default('lead'),
  expectedCloseDate: z.string().datetime().optional(),
  probability: z.number().min(0).max(100).default(25),
  userId: z.string().uuid('Valid user ID required'),
});

export type DealWorkflowInput = z.infer<typeof DealWorkflowSchema>;
export type DealCreationInput = z.infer<typeof DealCreationSchema>;

// Business Logic Classes
export class DealPipelineWorkflows {
  
  /**
   * Create a new deal with proper validation and business rules
   */
  static async createDeal(input: DealCreationInput): Promise<{ success: boolean; deal?: Deal; error?: string }> {
    try {
      // Validate input
      const validated = DealCreationSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Check if client exists
      const { data: client, error: clientError } = await supabase
        .from('clients')
        .select('id, name')
        .eq('id', validated.clientId)
        .single();
      
      if (clientError || !client) {
        return { success: false, error: 'Client not found' };
      }
      
      // Create deal record
      const { data: deal, error: dealError } = await supabase
        .from('deals')
        .insert({
          title: validated.title,
          description: validated.description,
          value: validated.value,
          client_id: validated.clientId,
          status: validated.status,
          expected_close_date: validated.expectedCloseDate,
          probability: validated.probability,
          user_id: validated.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();
      
      if (dealError) {
        return { success: false, error: dealError.message };
      }
      
      // Log workflow activity
      await this.logDealActivity(deal.id, 'deal_created', `Deal "${validated.title}" created`, validated.userId);
      
      return { success: true, deal };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to create deal' };
    }
  }
  
  /**
   * Move deal through pipeline stages with business rule validation
   */
  static async moveDealsStatus(input: DealWorkflowInput): Promise<{ success: boolean; deal?: Deal; error?: string }> {
    try {
      // Validate input
      const validated = DealWorkflowSchema.parse(input);
      
      // Get server client
      const supabase = await createClient();
      
      // Get current deal
      const { data: currentDeal, error: fetchError } = await supabase
        .from('deals')
        .select('*, clients(name)')
        .eq('id', validated.dealId)
        .single();
      
      if (fetchError || !currentDeal) {
        return { success: false, error: 'Deal not found' };
      }
      
      // Validate status transition
      const isValidTransition = this.validateStatusTransition(validated.fromStatus, validated.toStatus);
      if (!isValidTransition) {
        return { success: false, error: `Invalid status transition from ${validated.fromStatus} to ${validated.toStatus}` };
      }
      
      // Update probability based on status
      const newProbability = this.calculateProbabilityByStatus(validated.toStatus);
      
      // Update deal
      const { data: updatedDeal, error: updateError } = await supabase
        .from('deals')
        .update({
          status: validated.toStatus,
          probability: newProbability,
          updated_at: new Date().toISOString(),
        })
        .eq('id', validated.dealId)
        .select()
        .single();
      
      if (updateError) {
        return { success: false, error: updateError.message };
      }
      
      // Log workflow activity
      await this.logDealActivity(
        validated.dealId,
        'status_changed',
        `Status changed from ${validated.fromStatus} to ${validated.toStatus}${validated.notes ? `: ${validated.notes}` : ''}`,
        validated.userId
      );
      
      return { success: true, deal: updatedDeal };
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        return { success: false, error: error.errors[0].message };
      }
      return { success: false, error: 'Failed to update deal status' };
    }
  }
  
  /**
   * Get deals by pipeline stage with analytics
   */
  static async getDealsByStage(status?: DealStatus): Promise<{
    success: boolean;
    deals?: Deal[];
    analytics?: {
      totalValue: number;
      averageValue: number;
      count: number;
      weightedValue: number;
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      let query = supabase
        .from('deals')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data: deals, error } = await query;
      
      if (error) {
        return { success: false, error: error.message };
      }
      
      // Calculate analytics
      const analytics = {
        totalValue: deals?.reduce((sum, deal) => sum + (deal.value || 0), 0) || 0,
        averageValue: deals?.length ? (deals.reduce((sum, deal) => sum + (deal.value || 0), 0) / deals.length) : 0,
        count: deals?.length || 0,
        weightedValue: deals?.reduce((sum, deal) => sum + ((deal.value || 0) * (deal.probability || 0) / 100), 0) || 0,
      };
      
      return { success: true, deals: deals || [], analytics };
      
    } catch (error) {
      return { success: false, error: 'Failed to fetch deals' };
    }
  }
  
  /**
   * Calculate deal pipeline metrics
   */
  static async getPipelineMetrics(): Promise<{
    success: boolean;
    metrics?: {
      totalDeals: number;
      totalValue: number;
      weightedPipelineValue: number;
      conversionRate: number;
      averageDealSize: number;
      stageDistribution: Record<DealStatus, number>;
      monthlyTrend: { month: string; value: number; count: number }[];
    };
    error?: string;
  }> {
    try {
      // Get server client
      const supabase = await createClient();
      
      // Get all deals
      const { data: allDeals, error: dealsError } = await supabase
        .from('deals')
        .select('*');
      
      if (dealsError) {
        return { success: false, error: dealsError.message };
      }
      
      const deals = allDeals || [];
      
      // Calculate metrics
      const totalDeals = deals.length;
      const totalValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);
      const weightedPipelineValue = deals.reduce((sum, deal) => {
        return sum + ((deal.value || 0) * (deal.probability || 0) / 100);
      }, 0);
      
      const closedWonDeals = deals.filter(deal => deal.status === 'closed-won');
      const closedDeals = deals.filter(deal => deal.status === 'closed-won' || deal.status === 'closed-lost');
      const conversionRate = closedDeals.length > 0 ? (closedWonDeals.length / closedDeals.length) * 100 : 0;
      
      const averageDealSize = totalDeals > 0 ? totalValue / totalDeals : 0;
      
      // Stage distribution
      const stageDistribution = deals.reduce((acc, deal) => {
        const status = deal.status as DealStatus;
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {} as Record<DealStatus, number>);
      
      // Monthly trend (last 6 months)
      const monthlyTrend = this.calculateMonthlyTrend(deals);
      
      return {
        success: true,
        metrics: {
          totalDeals,
          totalValue,
          weightedPipelineValue,
          conversionRate,
          averageDealSize,
          stageDistribution,
          monthlyTrend,
        }
      };
      
    } catch (error) {
      return { success: false, error: 'Failed to calculate pipeline metrics' };
    }
  }
  
  /**
   * Validate if a status transition is allowed
   */
  private static validateStatusTransition(fromStatus: DealStatus, toStatus: DealStatus): boolean {
    const validTransitions: Record<DealStatus, DealStatus[]> = {
      'lead': ['qualified', 'closed-lost'],
      'qualified': ['lead', 'proposal', 'closed-lost'],
      'proposal': ['qualified', 'negotiation', 'closed-lost'],
      'negotiation': ['proposal', 'closed-won', 'closed-lost'],
      'closed-won': [], // Final state
      'closed-lost': ['lead'], // Can be reopened
    };
    
    return validTransitions[fromStatus]?.includes(toStatus) || false;
  }
  
  /**
   * Calculate probability based on status
   */
  private static calculateProbabilityByStatus(status: DealStatus): number {
    const probabilityMap: Record<DealStatus, number> = {
      'lead': 15,
      'qualified': 25,
      'proposal': 50,
      'negotiation': 75,
      'closed-won': 100,
      'closed-lost': 0,
    };
    
    return probabilityMap[status] || 25;
  }
  
  /**
   * Log deal activity for audit trail
   */
  private static async logDealActivity(
    dealId: string,
    activityType: string,
    description: string,
    userId: string
  ): Promise<void> {
    try {
      // Get server client
      const supabase = await createClient();
      
      await supabase
        .from('activities')
        .insert({
          type: activityType,
          description,
          related_to: 'deal',
          related_id: dealId,
          user_id: userId,
          timestamp: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Failed to log deal activity:', error);
    }
  }
  
  /**
   * Calculate monthly trend data
   */
  private static calculateMonthlyTrend(deals: any[]): { month: string; value: number; count: number }[] {
    const monthlyData: Record<string, { value: number; count: number }> = {};
    
    deals.forEach(deal => {
      if (deal.created_at) {
        const month = new Date(deal.created_at).toISOString().slice(0, 7); // YYYY-MM
        if (!monthlyData[month]) {
          monthlyData[month] = { value: 0, count: 0 };
        }
        monthlyData[month].value += deal.value || 0;
        monthlyData[month].count += 1;
      }
    });
    
    // Convert to array and sort
    return Object.entries(monthlyData)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6); // Last 6 months
  }
}

// Export workflow functions for API routes
export const dealWorkflows = {
  createDeal: DealPipelineWorkflows.createDeal.bind(DealPipelineWorkflows),
  moveDealsStatus: DealPipelineWorkflows.moveDealsStatus.bind(DealPipelineWorkflows),
  getDealsByStage: DealPipelineWorkflows.getDealsByStage.bind(DealPipelineWorkflows),
  getPipelineMetrics: DealPipelineWorkflows.getPipelineMetrics.bind(DealPipelineWorkflows),
};
