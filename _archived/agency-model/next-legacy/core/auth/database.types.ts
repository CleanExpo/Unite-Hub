/**
 * Database Types for Phase 1 Architecture
 * Generated types for new tables
 */

export interface Database {
  public: {
    Tables: {
      staff_users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          role: 'founder' | 'admin' | 'developer';
          active: boolean;
          last_login: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          role: 'founder' | 'admin' | 'developer';
          active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          role?: 'founder' | 'admin' | 'developer';
          active?: boolean;
          last_login?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      staff_activity_logs: {
        Row: {
          id: string;
          staff_id: string;
          action: string;
          metadata: Record<string, any>;
          timestamp: string;
        };
        Insert: {
          id?: string;
          staff_id: string;
          action: string;
          metadata?: Record<string, any>;
          timestamp?: string;
        };
        Update: {
          id?: string;
          staff_id?: string;
          action?: string;
          metadata?: Record<string, any>;
          timestamp?: string;
        };
      };
      client_users: {
        Row: {
          id: string;
          google_id: string | null;
          name: string | null;
          email: string | null;
          subscription_tier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          google_id?: string | null;
          name?: string | null;
          email?: string | null;
          subscription_tier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          google_id?: string | null;
          name?: string | null;
          email?: string | null;
          subscription_tier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      ideas: {
        Row: {
          id: string;
          client_id: string;
          content: string;
          type: 'voice' | 'text' | 'video' | 'uploaded';
          ai_interpretation: Record<string, any> | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          content: string;
          type: 'voice' | 'text' | 'video' | 'uploaded';
          ai_interpretation?: Record<string, any> | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          content?: string;
          type?: 'voice' | 'text' | 'video' | 'uploaded';
          ai_interpretation?: Record<string, any> | null;
          status?: string;
          created_at?: string;
        };
      };
      proposal_scopes: {
        Row: {
          id: string;
          idea_id: string;
          scope: Record<string, any>;
          pricing: Record<string, any>;
          timeline: Record<string, any>;
          created_at: string;
        };
        Insert: {
          id?: string;
          idea_id: string;
          scope: Record<string, any>;
          pricing: Record<string, any>;
          timeline: Record<string, any>;
          created_at?: string;
        };
        Update: {
          id?: string;
          idea_id?: string;
          scope?: Record<string, any>;
          pricing?: Record<string, any>;
          timeline?: Record<string, any>;
          created_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          client_id: string;
          proposal_id: string | null;
          status: string;
          progress: number;
          timeline: Record<string, any> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          proposal_id?: string | null;
          status?: string;
          progress?: number;
          timeline?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          proposal_id?: string | null;
          status?: string;
          progress?: number;
          timeline?: Record<string, any> | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          project_id: string;
          assigned_to: string | null;
          status: string;
          proof: Record<string, any> | null;
          due_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          assigned_to?: string | null;
          status?: string;
          proof?: Record<string, any> | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          assigned_to?: string | null;
          status?: string;
          proof?: Record<string, any> | null;
          due_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      digital_vault: {
        Row: {
          id: string;
          client_id: string;
          key_name: string;
          value: string;
          encrypted: boolean;
          category: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          key_name: string;
          value: string;
          encrypted?: boolean;
          category?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          key_name?: string;
          value?: string;
          encrypted?: boolean;
          category?: string | null;
          created_at?: string;
        };
      };
      ai_event_logs: {
        Row: {
          id: string;
          agent: string;
          event: Record<string, any>;
          timestamp: string;
        };
        Insert: {
          id?: string;
          agent: string;
          event: Record<string, any>;
          timestamp?: string;
        };
        Update: {
          id?: string;
          agent?: string;
          event?: Record<string, any>;
          timestamp?: string;
        };
      };
    };
  };
}
