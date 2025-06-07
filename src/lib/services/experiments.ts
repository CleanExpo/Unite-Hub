// A/B Testing Service
import { createServerClient } from '@/lib/supabase/server';
import type {
  Experiment,
  ExperimentVariant,
  ExperimentAssignment,
  ExperimentResult,
  ExperimentGoal,
  ExperimentStats,
  CreateExperimentInput,
  UpdateExperimentInput,
  TrackEventInput,
  AssignmentResult,
} from '@/types/experiments';

export class ExperimentService {
  /**
   * Get all experiments with optional filters
   */
  static async getExperiments(status?: string): Promise<Experiment[]> {
    const supabase = await createServerClient();
    
    let query = supabase.from('experiments').select(`
      *,
      variants:experiment_variants(*),
      goals:experiment_goals(*)
    `);
    
    if (status) {
      query = query.eq('status', status);
    }
    
    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching experiments:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get a single experiment by ID
   */
  static async getExperiment(id: string): Promise<Experiment | null> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
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
      return null;
    }
    
    return data;
  }
  
  /**
   * Get experiment by name
   */
  static async getExperimentByName(name: string): Promise<Experiment | null> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
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
   * Create a new experiment
   */
  static async createExperiment(input: CreateExperimentInput): Promise<Experiment> {
    const supabase = await createServerClient();
    
    // Create experiment
    const { data: experiment, error: experimentError } = await supabase
      .from('experiments')
      .insert({
        name: input.name,
        description: input.description,
        hypothesis: input.hypothesis,
        traffic_percentage: input.traffic_percentage || 100,
        start_date: input.start_date,
        end_date: input.end_date,
      })
      .select()
      .single();
    
    if (experimentError || !experiment) {
      console.error('Error creating experiment:', experimentError);
      throw experimentError || new Error('Failed to create experiment');
    }
    
    // Create variants
    if (input.variants && input.variants.length > 0) {
      const { error: variantsError } = await supabase
        .from('experiment_variants')
        .insert(
          input.variants.map(variant => ({
            experiment_id: experiment.id,
            name: variant.name,
            description: variant.description,
            weight: variant.weight || 0.5,
            config: variant.config || {},
            is_control: variant.is_control || false,
          }))
        );
      
      if (variantsError) {
        console.error('Error creating variants:', variantsError);
        // Clean up experiment if variants fail
        await supabase.from('experiments').delete().eq('id', experiment.id);
        throw variantsError;
      }
    }
    
    // Create goals
    if (input.goals && input.goals.length > 0) {
      const { error: goalsError } = await supabase
        .from('experiment_goals')
        .insert(
          input.goals.map(goal => ({
            experiment_id: experiment.id,
            name: goal.name,
            description: goal.description,
            event_name: goal.event_name,
            target_value: goal.target_value,
          }))
        );
      
      if (goalsError) {
        console.error('Error creating goals:', goalsError);
      }
    }
    
    // Return complete experiment
    return this.getExperiment(experiment.id) as Promise<Experiment>;
  }
  
  /**
   * Update an experiment
   */
  static async updateExperiment(id: string, input: UpdateExperimentInput): Promise<Experiment> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('experiments')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) {
      console.error('Error updating experiment:', error);
      throw error || new Error('Failed to update experiment');
    }
    
    return this.getExperiment(id) as Promise<Experiment>;
  }
  
  /**
   * Delete an experiment
   */
  static async deleteExperiment(id: string): Promise<boolean> {
    const supabase = await createServerClient();
    
    const { error } = await supabase
      .from('experiments')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting experiment:', error);
      throw error;
    }
    
    return true;
  }
  
  /**
   * Assign user to experiment
   */
  static async assignUserToExperiment(
    experimentId: string,
    userId?: string,
    sessionId?: string
  ): Promise<AssignmentResult> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .rpc('assign_user_to_experiment', {
        p_experiment_id: experimentId,
        p_user_id: userId,
        p_session_id: sessionId,
      });
    
    if (error || !data || !data[0]) {
      console.error('Error assigning user to experiment:', error);
      throw error || new Error('Failed to assign user to experiment');
    }
    
    return data[0];
  }
  
  /**
   * Track experiment event
   */
  static async trackEvent(input: TrackEventInput): Promise<boolean> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .rpc('track_experiment_event', {
        p_experiment_id: input.experiment_id,
        p_event_name: input.event_name,
        p_event_value: input.event_value || {},
        p_user_id: input.user_id,
        p_session_id: input.session_id,
      });
    
    if (error) {
      console.error('Error tracking event:', error);
      throw error;
    }
    
    return data;
  }
  
  /**
   * Get experiment statistics
   */
  static async getExperimentStats(experimentId: string): Promise<ExperimentStats[]> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .rpc('calculate_experiment_stats', {
        p_experiment_id: experimentId,
      });
    
    if (error) {
      console.error('Error getting experiment stats:', error);
      throw error;
    }
    
    return data || [];
  }
  
  /**
   * Get user's experiment assignments
   */
  static async getUserAssignments(userId: string): Promise<ExperimentAssignment[]> {
    const supabase = await createServerClient();
    
    const { data, error } = await supabase
      .from('experiment_assignments')
      .select('*')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error getting user assignments:', error);
      return [];
    }
    
    return data || [];
  }
  
  /**
   * Get active experiments for a user
   */
  static async getActiveExperimentsForUser(
    userId?: string,
    sessionId?: string
  ): Promise<Map<string, AssignmentResult>> {
    const supabase = await createServerClient();
    
    // Get all active experiments
    const experiments = await this.getExperiments('active');
    const assignments = new Map<string, AssignmentResult>();
    
    // Assign user to each active experiment
    for (const experiment of experiments) {
      try {
        const assignment = await this.assignUserToExperiment(
          experiment.id,
          userId,
          sessionId
        );
        assignments.set(experiment.name, assignment);
      } catch (error) {
        console.error(`Error assigning user to experiment ${experiment.name}:`, error);
      }
    }
    
    return assignments;
  }
  
  /**
   * Check if experiment is active
   */
  static isExperimentActive(experiment: Experiment): boolean {
    if (experiment.status !== 'active') {
      return false;
    }
    
    const now = new Date();
    
    if (experiment.start_date && new Date(experiment.start_date) > now) {
      return false;
    }
    
    if (experiment.end_date && new Date(experiment.end_date) < now) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if user should be in experiment based on traffic percentage
   */
  static shouldUserBeInExperiment(
    experiment: Experiment,
    userId?: string,
    sessionId?: string
  ): boolean {
    // Use user ID or session ID as seed for consistent assignment
    const seed = userId || sessionId || '';
    const hash = this.hashString(seed + experiment.id);
    const percentage = (hash % 100) + 1;
    
    return percentage <= experiment.traffic_percentage;
  }
  
  /**
   * Simple hash function for consistent assignment
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }
  
  /**
   * Get variant config
   */
  static getVariantConfig(variant: ExperimentVariant): Record<string, any> {
    return variant.config || {};
  }
  
  /**
   * Archive completed experiments
   */
  static async archiveCompletedExperiments(): Promise<number> {
    const supabase = await createServerClient();
    const now = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('experiments')
      .update({ status: 'completed' })
      .eq('status', 'active')
      .lt('end_date', now)
      .select();
    
    if (error) {
      console.error('Error archiving experiments:', error);
      return 0;
    }
    
    return data?.length || 0;
  }
}
