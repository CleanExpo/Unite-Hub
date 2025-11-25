/**
 * Safety Archive Bridge
 *
 * Archives all safety events, predictions, and interventions into the memory system
 * and Safety Ledger for persistent learning, auditability, and future reference.
 */

import { getSupabaseServer } from '@/lib/supabase';
import { MemoryStore } from '@/lib/memory';

class SafetyArchiveBridge {
  /**
   * Record safety intervention in ledger
   */
  async recordInterventionAction(params: {
    workspaceId: string;
    action: string;
    riskBefore: number;
    riskAfter: number;
    reason: string;
    targetAgent?: string;
    userId?: string;
  }): Promise<string> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      // 1. Record in safety ledger
      const { data: ledgerEntry, error } = await supabase
        .from('safety_ledger')
        .insert({
          workspace_id: params.workspaceId,
          action: params.action,
          risk_before: params.riskBefore,
          risk_after: params.riskAfter,
          affected_agents: params.targetAgent ? [params.targetAgent] : [],
          metadata: {
            reason: params.reason,
            action_type: params.action,
          },
          created_by: params.userId || 'system',
        })
        .select()
        .single();

      if (error || !ledgerEntry) {
        throw new Error(`Failed to record intervention: ${error?.message}`);
      }

      // 2. Archive as memory for learning
      const { data: { user } } = await supabase.auth.getUser();

      await memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'safety-engine',
        memoryType: 'safety_intervention',
        content: {
          intervention_id: ledgerEntry.id,
          action: params.action,
          reason: params.reason,
          risk_before: params.riskBefore,
          risk_after: params.riskAfter,
          risk_reduction: params.riskBefore - params.riskAfter,
          target_agent: params.targetAgent,
          timestamp: new Date().toISOString(),
        },
        importance: Math.max(70, (params.riskBefore - params.riskAfter) + 50),
        confidence: 90,
        keywords: ['safety', 'intervention', params.action.toLowerCase(), 'risk_reduction'],
      });

      // 3. Log to audit trail
      await supabase.from('audit_logs').insert({
        workspace_id: params.workspaceId,
        user_id: params.userId || 'system',
        action: 'safety_intervention_logged',
        resource_type: 'safety_ledger',
        resource_id: ledgerEntry.id,
        details: {
          action: params.action,
          risk_reduction: params.riskBefore - params.riskAfter,
          reason: params.reason,
        },
        timestamp: new Date().toISOString(),
      });

      return ledgerEntry.id;
    } catch (error) {
      console.error('Error recording intervention:', error);
      throw error;
    }
  }

  /**
   * Archive safety prediction
   */
  async recordSafetyPrediction(params: {
    workspaceId: string;
    predictionType: string;
    probability: number;
    confidence: number;
    affectedAgents: string[];
    recommendedAction: string;
    userId?: string;
  }): Promise<string> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      // 1. Record prediction in database
      const { data: prediction, error } = await supabase
        .from('safety_predictions')
        .insert({
          workspace_id: params.workspaceId,
          prediction_type: params.predictionType,
          probability: params.probability,
          confidence: params.confidence,
          affected_agents: params.affectedAgents,
          recommended_action: params.recommendedAction,
          action_priority:
            params.probability >= 80
              ? 'critical'
              : params.probability >= 70
                ? 'high'
                : params.probability >= 50
                  ? 'medium'
                  : 'low',
          expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
        })
        .select()
        .single();

      if (error || !prediction) {
        throw new Error(`Failed to record prediction: ${error?.message}`);
      }

      // 2. Archive as memory
      const { data: { user } } = await supabase.auth.getUser();

      await memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'safety-engine',
        memoryType: 'safety_prediction',
        content: {
          prediction_id: prediction.id,
          prediction_type: params.predictionType,
          probability: params.probability,
          confidence: params.confidence,
          affected_agents: params.affectedAgents,
          recommended_action: params.recommendedAction,
          predicted_at: new Date().toISOString(),
        },
        importance: Math.min(100, Math.max(60, params.probability + 20)),
        confidence: params.confidence,
        keywords: ['prediction', 'safety', params.predictionType.toLowerCase()],
      });

      return prediction.id;
    } catch (error) {
      console.error('Error recording prediction:', error);
      throw error;
    }
  }

  /**
   * Archive safety event
   */
  async recordSafetyEvent(params: {
    workspaceId: string;
    eventType: string;
    severity: number;
    riskLevel: number;
    source: string;
    details: Record<string, any>;
    userId?: string;
  }): Promise<string> {
    const supabase = await getSupabaseServer();
    const memoryStore = new MemoryStore();

    try {
      // 1. Record safety event
      const { data: event, error } = await supabase
        .from('safety_events')
        .insert({
          workspace_id: params.workspaceId,
          event_type: params.eventType,
          severity: params.severity,
          risk_level: params.riskLevel,
          source: params.source,
          details: params.details,
          created_by: params.userId || 'system',
        })
        .select()
        .single();

      if (error || !event) {
        throw new Error(`Failed to record event: ${error?.message}`);
      }

      // 2. Archive as memory
      const { data: { user } } = await supabase.auth.getUser();

      const eventMemory = await memoryStore.store({
        workspaceId: user?.id || 'system',
        agent: 'safety-engine',
        memoryType: 'safety_event',
        content: {
          event_id: event.id,
          event_type: params.eventType,
          severity: params.severity,
          risk_level: params.riskLevel,
          source: params.source,
          detected_at: new Date().toISOString(),
        },
        importance: params.severity * 15 + params.riskLevel / 5,
        confidence: Math.max(75, 100 - params.severity * 10),
        keywords: ['event', 'safety', params.eventType.toLowerCase()],
      });

      return event.id;
    } catch (error) {
      console.error('Error recording event:', error);
      throw error;
    }
  }

  /**
   * Generate safety report from recent events and predictions
   */
  async generateSafetyReport(params: {
    workspaceId: string;
    lookbackDays?: number;
  }): Promise<{
    reportId: string;
    totalEvents: number;
    totalPredictions: number;
    totalInterventions: number;
    averageRiskBefore: number;
    averageRiskAfter: number;
    effectivenessScore: number;
    topThreats: string[];
    recommendations: string[];
  }> {
    const supabase = await getSupabaseServer();
    const lookbackDays = params.lookbackDays || 7;
    const lookbackDate = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000).toISOString();

    try {
      // Fetch data
      const [{ data: events }, { data: predictions }, { data: ledgerEntries }] = await Promise.all([
        supabase
          .from('safety_events')
          .select('*')
          .eq('workspace_id', params.workspaceId)
          .gte('created_at', lookbackDate)
          .order('created_at', { ascending: false }),

        supabase
          .from('safety_predictions')
          .select('*')
          .eq('workspace_id', params.workspaceId)
          .gte('predicted_at', lookbackDate)
          .order('predicted_at', { ascending: false }),

        supabase
          .from('safety_ledger')
          .select('*')
          .eq('workspace_id', params.workspaceId)
          .gte('timestamp', lookbackDate)
          .order('timestamp', { ascending: false }),
      ]);

      // Calculate metrics
      const totalEvents = (events || []).length;
      const totalPredictions = (predictions || []).length;
      const totalInterventions = (ledgerEntries || []).length;

      const averageRiskBefore =
        (ledgerEntries || []).length > 0
          ? Math.round(
              (ledgerEntries || []).reduce((sum, l) => sum + (l.risk_before || 0), 0) / (ledgerEntries || []).length
            )
          : 50;

      const averageRiskAfter =
        (ledgerEntries || []).length > 0
          ? Math.round(
              (ledgerEntries || []).reduce((sum, l) => sum + (l.risk_after || 0), 0) / (ledgerEntries || []).length
            )
          : 45;

      const effectivenessScore =
        totalInterventions > 0
          ? Math.round(((averageRiskBefore - averageRiskAfter) / averageRiskBefore) * 100)
          : 0;

      // Identify top threats
      const threatCounts: Record<string, number> = {};
      for (const event of events || []) {
        threatCounts[event.event_type] = (threatCounts[event.event_type] || 0) + 1;
      }

      const topThreats = Object.entries(threatCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([threat]) => threat);

      // Generate recommendations
      const recommendations: string[] = [];

      if (averageRiskBefore > 60) {
        recommendations.push('System is experiencing elevated baseline risk - review autonomy settings');
      }

      if (effectivenessScore > 50) {
        recommendations.push('Interventions are effective - continue current safety strategies');
      } else if (effectivenessScore >= 0) {
        recommendations.push('Review intervention strategies for improved effectiveness');
      }

      if (topThreats.includes('cascade_risk')) {
        recommendations.push('Cascade failure risk detected - review agent dependencies');
      }

      if ((predictions || []).filter(p => p.probability >= 70).length > 5) {
        recommendations.push('High number of high-probability predictions - increase monitoring');
      }

      // Generate report ID
      const reportId = `report_${Date.now()}`;

      return {
        reportId,
        totalEvents,
        totalPredictions,
        totalInterventions,
        averageRiskBefore,
        averageRiskAfter,
        effectivenessScore,
        topThreats,
        recommendations,
      };
    } catch (error) {
      console.error('Error generating safety report:', error);
      throw error;
    }
  }
}

export const safetyArchiveBridge = new SafetyArchiveBridge();
