/**
 * Client-side experiment service
 * Uses client-side Supabase instance
 */

import { supabaseClient } from '@/lib/supabase/client';
import type { 
  Experiment, 
  ExperimentVariant, 
  ExperimentStats
} from '@/types/experiments';

export class ExperimentService {
  /**
   * Get list of experiments
   */
  static async getExperiments(status?: string): Promise<Experiment[]> {
    let query = supabaseClient
      .from('experiments')
      .select(`
        *,
        variants:experiment_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching experiments:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Get a specific experiment by ID
   */
  static async getExperiment(id: string): Promise<Experiment | null> {
    const { data, error } = await supabaseClient
      .from('experiments')
      .select(`
        *,
        variants:experiment_variants(*),
        goals:experiment_goals(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching experiment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Create a new experiment
   */
  static async createExperiment(
    experiment: Omit<Experiment, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Experiment> {
    const { data, error } = await supabaseClient
      .from('experiments')
      .insert(experiment)
      .select()
      .single();

    if (error) {
      console.error('Error creating experiment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update an experiment
   */
  static async updateExperiment(
    id: string,
    updates: Partial<Experiment>
  ): Promise<Experiment> {
    const { data, error } = await supabaseClient
      .from('experiments')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating experiment:', error);
      throw error;
    }

    return data;
  }

  /**
   * Delete an experiment
   */
  static async deleteExperiment(id: string): Promise<void> {
    const { error } = await supabaseClient
      .from('experiments')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting experiment:', error);
      throw error;
    }
  }

  /**
   * Get experiment statistics
   */
  static async getExperimentStats(experimentId: string): Promise<ExperimentStats[]> {
    const { data, error } = await supabaseClient
      .from('experiment_stats')
      .select('*')
      .eq('experiment_id', experimentId)
      .order('variant_name', { ascending: true });

    if (error) {
      console.error('Error fetching experiment stats:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Track an experiment event
   */
  static async trackEvent(event: {
    experiment_id: string;
    event_name: string;
    event_value?: any;
    user_id?: string;
    session_id?: string;
  }): Promise<void> {
    const { error } = await supabaseClient
      .from('experiment_events')
      .insert({
        experiment_id: event.experiment_id,
        event_name: event.event_name,
        value: event.event_value,
        user_id: event.user_id || await this.getUserId(),
        session_id: event.session_id || this.getSessionId(),
      });

    if (error) {
      console.error('Error tracking experiment event:', error);
      throw error;
    }
  }

  /**
   * Get or create a user ID for tracking
   */
  private static async getUserId(): Promise<string> {
    // Check for authenticated user first
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (user) {
      return user.id;
    }

    // Use anonymous ID from localStorage
    const storageKey = 'experiment_user_id';
    let userId = localStorage.getItem(storageKey);
    
    if (!userId) {
      userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(storageKey, userId);
    }

    return userId;
  }

  /**
   * Get or create a session ID
   */
  private static getSessionId(): string {
    const storageKey = 'experiment_session_id';
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem(storageKey, sessionId);
    }

    return sessionId;
  }

  /**
   * Get experiment by name
   */
  static async getExperimentByName(name: string): Promise<Experiment | null> {
    const { data, error } = await supabaseClient
      .from('experiments')
      .select(`
        *,
        variants:experiment_variants(*),
        goals:experiment_goals(*)
      `)
      .eq('name', name)
      .single();

    if (error) {
      console.error('Error fetching experiment by name:', error);
      return null;
    }

    return data;
  }

  /**
   * Get active experiments for a user
   * This is a simplified client version that returns a basic assignment
   */
  static async getActiveExperimentsForUser(
    userId?: string,
    sessionId?: string
  ): Promise<Map<string, any>> {
    const experiments = await this.getExperiments('active');
    const assignments = new Map<string, any>();

    // For client-side, we'll do simple assignment based on session/user ID
    for (const experiment of experiments) {
      const variant = this.selectVariant(experiment, userId || sessionId || '');
      assignments.set(experiment.name, {
        experiment_id: experiment.id,
        variant_id: variant.id,
        variant_name: variant.name,
        assigned_at: new Date().toISOString()
      });
    }

    return assignments;
  }

  /**
   * Simple variant selection based on user/session ID
   */
  private static selectVariant(experiment: Experiment, identifier: string): ExperimentVariant {
    if (!experiment.variants || experiment.variants.length === 0) {
      return { id: 'control', name: 'control', experiment_id: experiment.id } as ExperimentVariant;
    }

    // Simple hash-based assignment
    let hash = 0;
    for (let i = 0; i < identifier.length; i++) {
      hash = ((hash << 5) - hash) + identifier.charCodeAt(i);
      hash |= 0; // Convert to 32bit integer
    }
    
    const index = Math.abs(hash) % experiment.variants.length;
    return experiment.variants[index];
  }
}
