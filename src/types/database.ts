export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          description: string | null
          due_date: string | null
          id: string
          order_id: string | null
          quote_id: string | null
          subject: string
          updated_at: string
        }
        Insert: {
          activity_type?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_id?: string | null
          quote_id?: string | null
          subject: string
          updated_at?: string
        }
        Update: {
          activity_type?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          order_id?: string | null
          quote_id?: string | null
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "ccw_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      advisory_cases: {
        Row: {
          accountant_notes: string | null
          approval_queue_id: string | null
          business_id: string | null
          created_at: string
          current_round: number
          financial_context: Json
          founder_id: string
          id: string
          judge_scores: Json | null
          judge_summary: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scenario: string
          status: string
          title: string
          total_rounds: number
          updated_at: string
          winning_firm: string | null
          xero_entry_id: string | null
        }
        Insert: {
          accountant_notes?: string | null
          approval_queue_id?: string | null
          business_id?: string | null
          created_at?: string
          current_round?: number
          financial_context?: Json
          founder_id: string
          id?: string
          judge_scores?: Json | null
          judge_summary?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scenario: string
          status?: string
          title: string
          total_rounds?: number
          updated_at?: string
          winning_firm?: string | null
          xero_entry_id?: string | null
        }
        Update: {
          accountant_notes?: string | null
          approval_queue_id?: string | null
          business_id?: string | null
          created_at?: string
          current_round?: number
          financial_context?: Json
          founder_id?: string
          id?: string
          judge_scores?: Json | null
          judge_summary?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scenario?: string
          status?: string
          title?: string
          total_rounds?: number
          updated_at?: string
          winning_firm?: string | null
          xero_entry_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisory_cases_approval_queue_id_fkey"
            columns: ["approval_queue_id"]
            isOneToOne: false
            referencedRelation: "approval_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisory_cases_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      advisory_evidence: {
        Row: {
          case_id: string
          citation_type: string
          created_at: string
          excerpt: string | null
          founder_id: string
          id: string
          proposal_id: string
          reference_id: string
          reference_title: string
          relevance_score: number | null
          url: string | null
        }
        Insert: {
          case_id: string
          citation_type: string
          created_at?: string
          excerpt?: string | null
          founder_id: string
          id?: string
          proposal_id: string
          reference_id: string
          reference_title: string
          relevance_score?: number | null
          url?: string | null
        }
        Update: {
          case_id?: string
          citation_type?: string
          created_at?: string
          excerpt?: string | null
          founder_id?: string
          id?: string
          proposal_id?: string
          reference_id?: string
          reference_title?: string
          relevance_score?: number | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advisory_evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "advisory_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advisory_evidence_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "advisory_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      advisory_judge_scores: {
        Row: {
          audit_triggers: Json
          case_id: string
          compliance_risk_score: number
          created_at: string
          documentation_score: number
          ethics_score: number
          financial_outcome_score: number
          firm_key: string
          founder_id: string
          id: string
          legality_score: number
          rationale: string
          risk_flags: Json
          weighted_total: number
        }
        Insert: {
          audit_triggers?: Json
          case_id: string
          compliance_risk_score: number
          created_at?: string
          documentation_score: number
          ethics_score: number
          financial_outcome_score: number
          firm_key: string
          founder_id: string
          id?: string
          legality_score: number
          rationale: string
          risk_flags?: Json
          weighted_total: number
        }
        Update: {
          audit_triggers?: Json
          case_id?: string
          compliance_risk_score?: number
          created_at?: string
          documentation_score?: number
          ethics_score?: number
          financial_outcome_score?: number
          firm_key?: string
          founder_id?: string
          id?: string
          legality_score?: number
          rationale?: string
          risk_flags?: Json
          weighted_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "advisory_judge_scores_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "advisory_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      advisory_proposals: {
        Row: {
          case_id: string
          confidence_score: number | null
          content: string
          created_at: string
          firm_key: string
          founder_id: string
          id: string
          input_tokens: number | null
          model_used: string | null
          output_tokens: number | null
          risk_level: string | null
          round: number
          round_type: string
          structured_data: Json
        }
        Insert: {
          case_id: string
          confidence_score?: number | null
          content: string
          created_at?: string
          firm_key: string
          founder_id: string
          id?: string
          input_tokens?: number | null
          model_used?: string | null
          output_tokens?: number | null
          risk_level?: string | null
          round: number
          round_type: string
          structured_data?: Json
        }
        Update: {
          case_id?: string
          confidence_score?: number | null
          content?: string
          created_at?: string
          firm_key?: string
          founder_id?: string
          id?: string
          input_tokens?: number | null
          model_used?: string | null
          output_tokens?: number | null
          risk_level?: string | null
          round?: number
          round_type?: string
          structured_data?: Json
        }
        Relationships: [
          {
            foreignKeyName: "advisory_proposals_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "advisory_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_executions: {
        Row: {
          agent_id: string
          agent_name: string
          completed_at: string | null
          context_snapshot: string | null
          created_at: string
          error: string | null
          estimated_cost_usd: number | null
          execution_time_ms: number | null
          id: string
          initiated_by: string
          parent_execution_id: string | null
          result: string | null
          status: string
          task: string
          tokens_used: number | null
          user_id: string | null
        }
        Insert: {
          agent_id: string
          agent_name: string
          completed_at?: string | null
          context_snapshot?: string | null
          created_at?: string
          error?: string | null
          estimated_cost_usd?: number | null
          execution_time_ms?: number | null
          id?: string
          initiated_by?: string
          parent_execution_id?: string | null
          result?: string | null
          status: string
          task: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Update: {
          agent_id?: string
          agent_name?: string
          completed_at?: string | null
          context_snapshot?: string | null
          created_at?: string
          error?: string | null
          estimated_cost_usd?: number | null
          execution_time_ms?: number | null
          id?: string
          initiated_by?: string
          parent_execution_id?: string | null
          result?: string | null
          status?: string
          task?: string
          tokens_used?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      agent_runs: {
        Row: {
          agent_id: string
          agent_name: string
          completed_at: string | null
          current_step: string | null
          error: string | null
          id: string
          metadata: Json | null
          progress_percent: number | null
          result: Json | null
          started_at: string | null
          status: string
          task_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_attempts: number | null
          verification_evidence: Json | null
        }
        Insert: {
          agent_id: string
          agent_name: string
          completed_at?: string | null
          current_step?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          progress_percent?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_attempts?: number | null
          verification_evidence?: Json | null
        }
        Update: {
          agent_id?: string
          agent_name?: string
          completed_at?: string | null
          current_step?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          progress_percent?: number | null
          result?: Json | null
          started_at?: string | null
          status?: string
          task_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          verification_attempts?: number | null
          verification_evidence?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generated_content: {
        Row: {
          content: string
          content_metadata: string | null
          content_type: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          title: string | null
          user_id: string | null
        }
        Insert: {
          content: string
          content_metadata?: string | null
          content_type: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string
          content_metadata?: string | null
          content_type?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      ap2_agent_interactions: {
        Row: {
          connection_id: string | null
          created_at: string
          error_message: string | null
          id: string
          interaction_type: string
          mandate_id: string | null
          order_id: string | null
          processing_time_ms: number | null
          request_data: Json | null
          response_data: Json | null
          source_agent_id: string
          source_agent_type: string | null
          status: string
          success: boolean | null
          target_agent_id: string | null
          updated_at: string
        }
        Insert: {
          connection_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          interaction_type: string
          mandate_id?: string | null
          order_id?: string | null
          processing_time_ms?: number | null
          request_data?: Json | null
          response_data?: Json | null
          source_agent_id: string
          source_agent_type?: string | null
          status?: string
          success?: boolean | null
          target_agent_id?: string | null
          updated_at?: string
        }
        Update: {
          connection_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          interaction_type?: string
          mandate_id?: string | null
          order_id?: string | null
          processing_time_ms?: number | null
          request_data?: Json | null
          response_data?: Json | null
          source_agent_id?: string
          source_agent_type?: string | null
          status?: string
          success?: boolean | null
          target_agent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap2_agent_interactions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ap2_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_agent_interactions_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "ap2_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_agent_interactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ap2_connections: {
        Row: {
          access_token: string | null
          connected_at: string | null
          created_at: string
          google_account_email: string | null
          google_account_id: string | null
          id: string
          last_used_at: string | null
          organization_id: string | null
          refresh_token: string | null
          status: Database["public"]["Enums"]["ap2_connection_status"]
          token_expires_at: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string
          google_account_email?: string | null
          google_account_id?: string | null
          id?: string
          last_used_at?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["ap2_connection_status"]
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          access_token?: string | null
          connected_at?: string | null
          created_at?: string
          google_account_email?: string | null
          google_account_id?: string | null
          id?: string
          last_used_at?: string | null
          organization_id?: string | null
          refresh_token?: string | null
          status?: Database["public"]["Enums"]["ap2_connection_status"]
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap2_connections_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_connections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      ap2_mandates: {
        Row: {
          cart_items: Json | null
          cart_total: number | null
          connection_id: string
          created_at: string
          executed_at: string | null
          expires_at: string
          id: string
          intent_description: string | null
          intent_language: string | null
          mandate_metadata: Json | null
          mandate_type: Database["public"]["Enums"]["ap2_mandate_type"]
          parent_mandate_id: string | null
          payment_amount: number | null
          payment_currency: string | null
          payment_method: string | null
          public_key: string | null
          signature: string | null
          signature_algorithm: string | null
          status: Database["public"]["Enums"]["ap2_mandate_status"]
          updated_at: string
          verified_at: string | null
        }
        Insert: {
          cart_items?: Json | null
          cart_total?: number | null
          connection_id: string
          created_at?: string
          executed_at?: string | null
          expires_at: string
          id?: string
          intent_description?: string | null
          intent_language?: string | null
          mandate_metadata?: Json | null
          mandate_type: Database["public"]["Enums"]["ap2_mandate_type"]
          parent_mandate_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_method?: string | null
          public_key?: string | null
          signature?: string | null
          signature_algorithm?: string | null
          status?: Database["public"]["Enums"]["ap2_mandate_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Update: {
          cart_items?: Json | null
          cart_total?: number | null
          connection_id?: string
          created_at?: string
          executed_at?: string | null
          expires_at?: string
          id?: string
          intent_description?: string | null
          intent_language?: string | null
          mandate_metadata?: Json | null
          mandate_type?: Database["public"]["Enums"]["ap2_mandate_type"]
          parent_mandate_id?: string | null
          payment_amount?: number | null
          payment_currency?: string | null
          payment_method?: string | null
          public_key?: string | null
          signature?: string | null
          signature_algorithm?: string | null
          status?: Database["public"]["Enums"]["ap2_mandate_status"]
          updated_at?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap2_mandates_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ap2_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_mandates_parent_mandate_id_fkey"
            columns: ["parent_mandate_id"]
            isOneToOne: false
            referencedRelation: "ap2_mandates"
            referencedColumns: ["id"]
          },
        ]
      }
      ap2_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          error_message: string | null
          failed_at: string | null
          fee: number | null
          google_transaction_id: string | null
          id: string
          mandate_id: string
          net_amount: number | null
          order_id: string | null
          payment_method: string | null
          processing_started_at: string | null
          status: Database["public"]["Enums"]["ap2_transaction_status"]
          transaction_metadata: Json | null
          transaction_type: string
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          failed_at?: string | null
          fee?: number | null
          google_transaction_id?: string | null
          id?: string
          mandate_id: string
          net_amount?: number | null
          order_id?: string | null
          payment_method?: string | null
          processing_started_at?: string | null
          status?: Database["public"]["Enums"]["ap2_transaction_status"]
          transaction_metadata?: Json | null
          transaction_type: string
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          error_message?: string | null
          failed_at?: string | null
          fee?: number | null
          google_transaction_id?: string | null
          id?: string
          mandate_id?: string
          net_amount?: number | null
          order_id?: string | null
          payment_method?: string | null
          processing_started_at?: string | null
          status?: Database["public"]["Enums"]["ap2_transaction_status"]
          transaction_metadata?: Json | null
          transaction_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap2_transactions_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "ap2_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ap2_voice_sessions: {
        Row: {
          abandoned_at: string | null
          assistant_type: string | null
          completed_at: string | null
          connection_id: string | null
          conversation_history: Json | null
          created_at: string
          detected_intent: string | null
          id: string
          intent_confidence: number | null
          language: string
          mandate_id: string | null
          order_id: string | null
          session_metadata: Json | null
          started_at: string
          status: Database["public"]["Enums"]["ap2_voice_session_status"]
          turn_count: number
          updated_at: string
        }
        Insert: {
          abandoned_at?: string | null
          assistant_type?: string | null
          completed_at?: string | null
          connection_id?: string | null
          conversation_history?: Json | null
          created_at?: string
          detected_intent?: string | null
          id?: string
          intent_confidence?: number | null
          language?: string
          mandate_id?: string | null
          order_id?: string | null
          session_metadata?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["ap2_voice_session_status"]
          turn_count?: number
          updated_at?: string
        }
        Update: {
          abandoned_at?: string | null
          assistant_type?: string | null
          completed_at?: string | null
          connection_id?: string | null
          conversation_history?: Json | null
          created_at?: string
          detected_intent?: string | null
          id?: string
          intent_confidence?: number | null
          language?: string
          mandate_id?: string | null
          order_id?: string | null
          session_metadata?: Json | null
          started_at?: string
          status?: Database["public"]["Enums"]["ap2_voice_session_status"]
          turn_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ap2_voice_sessions_connection_id_fkey"
            columns: ["connection_id"]
            isOneToOne: false
            referencedRelation: "ap2_connections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_voice_sessions_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "ap2_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_voice_sessions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      ap2_webhook_logs: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          headers: Json | null
          id: string
          mandate_id: string | null
          payload: Json | null
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          received_at: string
          signature: string | null
          signature_verified: boolean | null
          transaction_id: string | null
          verification_error: string | null
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          headers?: Json | null
          id?: string
          mandate_id?: string | null
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
          signature?: string | null
          signature_verified?: boolean | null
          transaction_id?: string | null
          verification_error?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          headers?: Json | null
          id?: string
          mandate_id?: string | null
          payload?: Json | null
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
          signature?: string | null
          signature_verified?: boolean | null
          transaction_id?: string | null
          verification_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ap2_webhook_logs_mandate_id_fkey"
            columns: ["mandate_id"]
            isOneToOne: false
            referencedRelation: "ap2_mandates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ap2_webhook_logs_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "ap2_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      api_usage: {
        Row: {
          agent_run_id: string
          cost_per_input_token: string
          cost_per_output_token: string
          created_at: string
          id: string
          input_tokens: number
          metadata: Json | null
          model: string
          output_tokens: number
          prd_id: string | null
          provider: string
        }
        Insert: {
          agent_run_id: string
          cost_per_input_token: string
          cost_per_output_token: string
          created_at?: string
          id?: string
          input_tokens: number
          metadata?: Json | null
          model: string
          output_tokens: number
          prd_id?: string | null
          provider: string
        }
        Update: {
          agent_run_id?: string
          cost_per_input_token?: string
          cost_per_output_token?: string
          created_at?: string
          id?: string
          input_tokens?: number
          metadata?: Json | null
          model?: string
          output_tokens?: number
          prd_id?: string | null
          provider?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_usage_prd_id_fkey"
            columns: ["prd_id"]
            isOneToOne: false
            referencedRelation: "prds"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_queue: {
        Row: {
          approved_at: string | null
          business_id: string | null
          created_at: string
          description: string | null
          executed_at: string | null
          expires_at: string | null
          founder_id: string
          id: string
          payload: Json
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          business_id?: string | null
          created_at?: string
          description?: string | null
          executed_at?: string | null
          expires_at?: string | null
          founder_id: string
          id?: string
          payload?: Json
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          business_id?: string | null
          created_at?: string
          description?: string | null
          executed_at?: string | null
          expires_at?: string | null
          founder_id?: string
          id?: string
          payload?: Json
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      approval_steps: {
        Row: {
          approval_id: string
          approver_id: string
          approver_role: string | null
          comments: string | null
          created_at: string
          id: string
          reviewed_at: string | null
          status: string
          step_number: number
        }
        Insert: {
          approval_id: string
          approver_id: string
          approver_role?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          step_number: number
        }
        Update: {
          approval_id?: string
          approver_id?: string
          approver_role?: string | null
          comments?: string | null
          created_at?: string
          id?: string
          reviewed_at?: string | null
          status?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "approval_steps_approval_id_fkey"
            columns: ["approval_id"]
            isOneToOne: false
            referencedRelation: "approvals"
            referencedColumns: ["id"]
          },
        ]
      }
      approvals: {
        Row: {
          approval_type: string
          completed_at: string | null
          created_at: string
          current_step: number
          entity_id: string
          entity_type: string
          id: string
          notes: string | null
          requested_by: string
          status: string
          total_steps: number
          updated_at: string
        }
        Insert: {
          approval_type: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          entity_id: string
          entity_type: string
          id?: string
          notes?: string | null
          requested_by: string
          status?: string
          total_steps?: number
          updated_at?: string
        }
        Update: {
          approval_type?: string
          completed_at?: string | null
          created_at?: string
          current_step?: number
          entity_id?: string
          entity_type?: string
          id?: string
          notes?: string | null
          requested_by?: string
          status?: string
          total_steps?: number
          updated_at?: string
        }
        Relationships: []
      }
      audience_research: {
        Row: {
          business_id: string | null
          category: string
          created_at: string | null
          id: string
          is_gold: boolean | null
          keywords: string[] | null
          pattern_frequency: number | null
          quote: string
          quote_date: string | null
          sentiment: string | null
          source_name: string | null
          source_type: string
          source_url: string | null
          subcategory: string | null
          user_id: string
        }
        Insert: {
          business_id?: string | null
          category: string
          created_at?: string | null
          id?: string
          is_gold?: boolean | null
          keywords?: string[] | null
          pattern_frequency?: number | null
          quote: string
          quote_date?: string | null
          sentiment?: string | null
          source_name?: string | null
          source_type: string
          source_url?: string | null
          subcategory?: string | null
          user_id: string
        }
        Update: {
          business_id?: string | null
          category?: string
          created_at?: string | null
          id?: string
          is_gold?: boolean | null
          keywords?: string[] | null
          pattern_frequency?: number | null
          quote?: string
          quote_date?: string | null
          sentiment?: string | null
          source_name?: string | null
          source_type?: string
          source_url?: string | null
          subcategory?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "audience_research_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          id: string
          message: string
          run_id: string | null
          severity: string
          title: string
          triggered_at: string | null
          type: string
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          id?: string
          message: string
          run_id?: string | null
          severity: string
          title: string
          triggered_at?: string | null
          type: string
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          id?: string
          message?: string
          run_id?: string | null
          severity?: string
          title?: string
          triggered_at?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_alerts_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "audit_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_evidence: {
        Row: {
          agent_id: string | null
          category: string
          checksum: string | null
          content: string | null
          content_type: string
          created_at: string | null
          expires_at: string | null
          id: string
          is_archived: boolean | null
          journey_id: string | null
          metadata: Json | null
          size_bytes: number
          source: string
          step_id: string | null
          storage_path: string | null
          tags: string[] | null
          task_id: string | null
          type: string
          verifier_id: string | null
        }
        Insert: {
          agent_id?: string | null
          category: string
          checksum?: string | null
          content?: string | null
          content_type: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          journey_id?: string | null
          metadata?: Json | null
          size_bytes?: number
          source: string
          step_id?: string | null
          storage_path?: string | null
          tags?: string[] | null
          task_id?: string | null
          type: string
          verifier_id?: string | null
        }
        Update: {
          agent_id?: string | null
          category?: string
          checksum?: string | null
          content?: string | null
          content_type?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_archived?: boolean | null
          journey_id?: string | null
          metadata?: Json | null
          size_bytes?: number
          source?: string
          step_id?: string | null
          storage_path?: string | null
          tags?: string[] | null
          task_id?: string | null
          type?: string
          verifier_id?: string | null
        }
        Relationships: []
      }
      audit_runs: {
        Row: {
          alerts: Json | null
          completed_at: string | null
          config: Json | null
          id: string
          results: Json | null
          schedule_id: string | null
          started_at: string
          status: string
          type: string
        }
        Insert: {
          alerts?: Json | null
          completed_at?: string | null
          config?: Json | null
          id?: string
          results?: Json | null
          schedule_id?: string | null
          started_at?: string
          status: string
          type: string
        }
        Update: {
          alerts?: Json | null
          completed_at?: string | null
          config?: Json | null
          id?: string
          results?: Json | null
          schedule_id?: string | null
          started_at?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      audit_schedules: {
        Row: {
          config: Json | null
          created_at: string | null
          cron: string
          enabled: boolean | null
          id: string
          last_run: string | null
          name: string
          next_run: string | null
          type: string
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string | null
          cron: string
          enabled?: boolean | null
          id?: string
          last_run?: string | null
          name: string
          next_run?: string | null
          type: string
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string | null
          cron?: string
          enabled?: boolean | null
          id?: string
          last_run?: string | null
          name?: string
          next_run?: string | null
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      auto_research_runs: {
        Row: {
          completedAt: string | null
          error: string | null
          id: string
          insightsCount: number
          organizationId: string | null
          platforms: string[]
          promptsUpdated: number
          runType: string
          startedAt: string
          status: string
        }
        Insert: {
          completedAt?: string | null
          error?: string | null
          id: string
          insightsCount?: number
          organizationId?: string | null
          platforms?: string[]
          promptsUpdated?: number
          runType: string
          startedAt?: string
          status?: string
        }
        Update: {
          completedAt?: string | null
          error?: string | null
          id?: string
          insightsCount?: number
          organizationId?: string | null
          platforms?: string[]
          promptsUpdated?: number
          runType?: string
          startedAt?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_research_runs_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_slots: {
        Row: {
          contractor_id: string
          created_at: string
          date: string
          end_time: string
          id: string
          notes: string | null
          postcode: string | null
          start_time: string
          state: Database["public"]["Enums"]["australian_state"]
          status: Database["public"]["Enums"]["availability_status"] | null
          suburb: string
          updated_at: string
        }
        Insert: {
          contractor_id: string
          created_at?: string
          date: string
          end_time: string
          id?: string
          notes?: string | null
          postcode?: string | null
          start_time: string
          state?: Database["public"]["Enums"]["australian_state"]
          status?: Database["public"]["Enums"]["availability_status"] | null
          suburb: string
          updated_at?: string
        }
        Update: {
          contractor_id?: string
          created_at?: string
          date?: string
          end_time?: string
          id?: string
          notes?: string | null
          postcode?: string | null
          start_time?: string
          state?: Database["public"]["Enums"]["australian_state"]
          status?: Database["public"]["Enums"]["availability_status"] | null
          suburb?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_slots_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
        ]
      }
      background_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          input_data: Json | null
          job_type: string
          output_data: Json | null
          progress: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type: string
          output_data?: Json | null
          progress?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          input_data?: Json | null
          job_type?: string
          output_data?: Json | null
          progress?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      backlink_gap_analysis: {
        Row: {
          analyzed_at: string | null
          avg_competitor_backlinks: number | null
          avg_competitor_domain_authority: number | null
          avg_competitor_referring_domains: number | null
          client_backlinks: number | null
          client_domain: string
          client_domain_authority: number | null
          client_referring_domains: number | null
          client_toxic_links: number | null
          common_link_sources: Json | null
          created_at: string | null
          easy_win_opportunities: Json | null
          high_value_opportunities: Json | null
          id: string
          link_gap_domains: Json | null
          toxic_link_details: Json | null
          workspace_id: string
        }
        Insert: {
          analyzed_at?: string | null
          avg_competitor_backlinks?: number | null
          avg_competitor_domain_authority?: number | null
          avg_competitor_referring_domains?: number | null
          client_backlinks?: number | null
          client_domain: string
          client_domain_authority?: number | null
          client_referring_domains?: number | null
          client_toxic_links?: number | null
          common_link_sources?: Json | null
          created_at?: string | null
          easy_win_opportunities?: Json | null
          high_value_opportunities?: Json | null
          id?: string
          link_gap_domains?: Json | null
          toxic_link_details?: Json | null
          workspace_id: string
        }
        Update: {
          analyzed_at?: string | null
          avg_competitor_backlinks?: number | null
          avg_competitor_domain_authority?: number | null
          avg_competitor_referring_domains?: number | null
          client_backlinks?: number | null
          client_domain?: string
          client_domain_authority?: number | null
          client_referring_domains?: number | null
          client_toxic_links?: number | null
          common_link_sources?: Json | null
          created_at?: string | null
          easy_win_opportunities?: Json | null
          high_value_opportunities?: Json | null
          id?: string
          link_gap_domains?: Json | null
          toxic_link_details?: Json | null
          workspace_id?: string
        }
        Relationships: []
      }
      backorders: {
        Row: {
          container_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          customer_notified: boolean
          expected_availability_date: string | null
          fulfilled_at: string | null
          fulfillment_location: string
          id: string
          internal_notes: string | null
          last_notification_date: string | null
          notes: string | null
          notification_count: number
          order_id: string
          order_item_id: string | null
          original_order_date: string
          priority: number
          product_id: string
          quantity_backordered: number
          quantity_fulfilled: number
          status: Database["public"]["Enums"]["backorder_status"]
          updated_at: string
        }
        Insert: {
          container_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_notified?: boolean
          expected_availability_date?: string | null
          fulfilled_at?: string | null
          fulfillment_location?: string
          id?: string
          internal_notes?: string | null
          last_notification_date?: string | null
          notes?: string | null
          notification_count?: number
          order_id: string
          order_item_id?: string | null
          original_order_date: string
          priority?: number
          product_id: string
          quantity_backordered: number
          quantity_fulfilled?: number
          status?: Database["public"]["Enums"]["backorder_status"]
          updated_at?: string
        }
        Update: {
          container_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          customer_notified?: boolean
          expected_availability_date?: string | null
          fulfilled_at?: string | null
          fulfillment_location?: string
          id?: string
          internal_notes?: string | null
          last_notification_date?: string | null
          notes?: string | null
          notification_count?: number
          order_id?: string
          order_item_id?: string | null
          original_order_date?: string
          priority?: number
          product_id?: string
          quantity_backordered?: number
          quantity_fulfilled?: number
          status?: Database["public"]["Enums"]["backorder_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "backorders_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "backorders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_name: string
          account_number: string
          account_type: string | null
          bank_name: string | null
          bsb: string | null
          created_at: string
          currency: string
          feed_account_id: string | null
          feed_provider: string | null
          feed_sync_status: string | null
          id: string
          is_active: boolean
          last_feed_sync_at: string | null
          last_sync_error: string | null
          location_code: string | null
          sync_interval_hours: number
          sync_retry_count: number
          updated_at: string
          webhook_enabled: boolean
          webhook_secret: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          account_type?: string | null
          bank_name?: string | null
          bsb?: string | null
          created_at?: string
          currency?: string
          feed_account_id?: string | null
          feed_provider?: string | null
          feed_sync_status?: string | null
          id?: string
          is_active?: boolean
          last_feed_sync_at?: string | null
          last_sync_error?: string | null
          location_code?: string | null
          sync_interval_hours?: number
          sync_retry_count?: number
          updated_at?: string
          webhook_enabled?: boolean
          webhook_secret?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          account_type?: string | null
          bank_name?: string | null
          bsb?: string | null
          created_at?: string
          currency?: string
          feed_account_id?: string | null
          feed_provider?: string | null
          feed_sync_status?: string | null
          id?: string
          is_active?: boolean
          last_feed_sync_at?: string | null
          last_sync_error?: string | null
          location_code?: string | null
          sync_interval_hours?: number
          sync_retry_count?: number
          updated_at?: string
          webhook_enabled?: boolean
          webhook_secret?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_location_code_fkey"
            columns: ["location_code"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["code"]
          },
        ]
      }
      bank_feeds: {
        Row: {
          balance: number | null
          bank_account_id: string
          created_at: string
          credit: number | null
          debit: number | null
          description: string | null
          id: string
          match_confidence: number | null
          match_status: string
          match_suggestions: Json | null
          matched_at: string | null
          matched_by: string | null
          matched_pos_transaction_id: string | null
          raw_data: Json | null
          reference: string | null
          transaction_date: string
          updated_at: string
        }
        Insert: {
          balance?: number | null
          bank_account_id: string
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          match_confidence?: number | null
          match_status?: string
          match_suggestions?: Json | null
          matched_at?: string | null
          matched_by?: string | null
          matched_pos_transaction_id?: string | null
          raw_data?: Json | null
          reference?: string | null
          transaction_date: string
          updated_at?: string
        }
        Update: {
          balance?: number | null
          bank_account_id?: string
          created_at?: string
          credit?: number | null
          debit?: number | null
          description?: string | null
          id?: string
          match_confidence?: number | null
          match_status?: string
          match_suggestions?: Json | null
          matched_at?: string | null
          matched_by?: string | null
          matched_pos_transaction_id?: string | null
          raw_data?: Json | null
          reference?: string | null
          transaction_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_feeds_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_feeds_matched_pos_transaction_id_fkey"
            columns: ["matched_pos_transaction_id"]
            isOneToOne: false
            referencedRelation: "pos_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      bookkeeper_runs: {
        Row: {
          auto_reconciled: number
          businesses_processed: Json
          completed_at: string | null
          created_at: string
          error_log: Json
          failed_count: number
          flagged_for_review: number
          founder_id: string
          gst_collected_cents: number
          gst_paid_cents: number
          id: string
          net_gst_cents: number
          started_at: string
          status: string
          total_transactions: number
        }
        Insert: {
          auto_reconciled?: number
          businesses_processed?: Json
          completed_at?: string | null
          created_at?: string
          error_log?: Json
          failed_count?: number
          flagged_for_review?: number
          founder_id: string
          gst_collected_cents?: number
          gst_paid_cents?: number
          id?: string
          net_gst_cents?: number
          started_at: string
          status: string
          total_transactions?: number
        }
        Update: {
          auto_reconciled?: number
          businesses_processed?: Json
          completed_at?: string | null
          created_at?: string
          error_log?: Json
          failed_count?: number
          flagged_for_review?: number
          founder_id?: string
          gst_collected_cents?: number
          gst_paid_cents?: number
          id?: string
          net_gst_cents?: number
          started_at?: string
          status?: string
          total_transactions?: number
        }
        Relationships: []
      }
      bookkeeper_transactions: {
        Row: {
          amount_cents: number
          approval_queue_id: string | null
          approved_at: string | null
          approved_by: string | null
          business_key: string
          confidence_score: number
          created_at: string
          currency: string
          deduction_category: string | null
          deduction_notes: string | null
          description: string | null
          founder_id: string
          gst_amount_cents: number
          id: string
          is_deductible: boolean
          matched_bill_id: string | null
          matched_invoice_id: string | null
          raw_xero_data: Json | null
          raw_xero_data_encrypted: string | null
          raw_xero_data_iv: string | null
          raw_xero_data_salt: string | null
          reconciliation_status: string
          run_id: string
          tax_category: string | null
          tax_code: string | null
          transaction_date: string
          updated_at: string
          xero_tenant_id: string
          xero_transaction_id: string
        }
        Insert: {
          amount_cents: number
          approval_queue_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_key: string
          confidence_score?: number
          created_at?: string
          currency?: string
          deduction_category?: string | null
          deduction_notes?: string | null
          description?: string | null
          founder_id: string
          gst_amount_cents?: number
          id?: string
          is_deductible?: boolean
          matched_bill_id?: string | null
          matched_invoice_id?: string | null
          raw_xero_data?: Json | null
          raw_xero_data_encrypted?: string | null
          raw_xero_data_iv?: string | null
          raw_xero_data_salt?: string | null
          reconciliation_status: string
          run_id: string
          tax_category?: string | null
          tax_code?: string | null
          transaction_date: string
          updated_at?: string
          xero_tenant_id: string
          xero_transaction_id: string
        }
        Update: {
          amount_cents?: number
          approval_queue_id?: string | null
          approved_at?: string | null
          approved_by?: string | null
          business_key?: string
          confidence_score?: number
          created_at?: string
          currency?: string
          deduction_category?: string | null
          deduction_notes?: string | null
          description?: string | null
          founder_id?: string
          gst_amount_cents?: number
          id?: string
          is_deductible?: boolean
          matched_bill_id?: string | null
          matched_invoice_id?: string | null
          raw_xero_data?: Json | null
          raw_xero_data_encrypted?: string | null
          raw_xero_data_iv?: string | null
          raw_xero_data_salt?: string | null
          reconciliation_status?: string
          run_id?: string
          tax_category?: string | null
          tax_code?: string | null
          transaction_date?: string
          updated_at?: string
          xero_tenant_id?: string
          xero_transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookkeeper_transactions_approval_queue_id_fkey"
            columns: ["approval_queue_id"]
            isOneToOne: false
            referencedRelation: "approval_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bookkeeper_transactions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "bookkeeper_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_guidelines: {
        Row: {
          approved_words: string[] | null
          banned_words: string[] | null
          business_id: string
          created_at: string | null
          do_examples: string[] | null
          dont_examples: string[] | null
          id: string
          industry_terms: Json | null
          tone_keywords: string[] | null
          updated_at: string | null
          voice_description: string | null
        }
        Insert: {
          approved_words?: string[] | null
          banned_words?: string[] | null
          business_id: string
          created_at?: string | null
          do_examples?: string[] | null
          dont_examples?: string[] | null
          id?: string
          industry_terms?: Json | null
          tone_keywords?: string[] | null
          updated_at?: string | null
          voice_description?: string | null
        }
        Update: {
          approved_words?: string[] | null
          banned_words?: string[] | null
          business_id?: string
          created_at?: string | null
          do_examples?: string[] | null
          dont_examples?: string[] | null
          id?: string
          industry_terms?: Json | null
          tone_keywords?: string[] | null
          updated_at?: string | null
          voice_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_guidelines_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      brand_identities: {
        Row: {
          business_key: string
          character_female: Json
          character_male: Json
          colour_primary: string | null
          colour_secondary: string | null
          created_at: string
          do_list: string[]
          dont_list: string[]
          founder_id: string
          id: string
          industry_keywords: string[]
          sample_content: Json
          target_audience: string
          tone_of_voice: string
          unique_selling_points: Json
          updated_at: string
        }
        Insert: {
          business_key: string
          character_female?: Json
          character_male?: Json
          colour_primary?: string | null
          colour_secondary?: string | null
          created_at?: string
          do_list?: string[]
          dont_list?: string[]
          founder_id: string
          id?: string
          industry_keywords?: string[]
          sample_content?: Json
          target_audience?: string
          tone_of_voice?: string
          unique_selling_points?: Json
          updated_at?: string
        }
        Update: {
          business_key?: string
          character_female?: Json
          character_male?: Json
          colour_primary?: string | null
          colour_secondary?: string | null
          created_at?: string
          do_list?: string[]
          dont_list?: string[]
          founder_id?: string
          id?: string
          industry_keywords?: string[]
          sample_content?: Json
          target_audience?: string
          tone_of_voice?: string
          unique_selling_points?: Json
          updated_at?: string
        }
        Relationships: []
      }
      brand_profiles: {
        Row: {
          brand_values: string[]
          business_key: string | null
          client_name: string
          colours: Json
          created_at: string
          fonts: Json
          founder_id: string
          id: string
          imagery_style: string | null
          industry: string | null
          logo_url: string | null
          raw_scrape: Json
          reference_images: string[]
          scan_error: string | null
          status: string
          tagline: string | null
          target_audience: string | null
          tone_of_voice: string | null
          updated_at: string
          website_url: string
        }
        Insert: {
          brand_values?: string[]
          business_key?: string | null
          client_name: string
          colours?: Json
          created_at?: string
          fonts?: Json
          founder_id: string
          id?: string
          imagery_style?: string | null
          industry?: string | null
          logo_url?: string | null
          raw_scrape?: Json
          reference_images?: string[]
          scan_error?: string | null
          status?: string
          tagline?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          website_url: string
        }
        Update: {
          brand_values?: string[]
          business_key?: string | null
          client_name?: string
          colours?: Json
          created_at?: string
          fonts?: Json
          founder_id?: string
          id?: string
          imagery_style?: string | null
          industry?: string | null
          logo_url?: string | null
          raw_scrape?: Json
          reference_images?: string[]
          scan_error?: string | null
          status?: string
          tagline?: string | null
          target_audience?: string | null
          tone_of_voice?: string | null
          updated_at?: string
          website_url?: string
        }
        Relationships: []
      }
      businesses: {
        Row: {
          abn: string | null
          acn: string | null
          business_hours: Json | null
          country: string | null
          created_at: string | null
          description_long: string | null
          description_medium: string | null
          description_short: string | null
          email: string | null
          id: string
          latitude: number | null
          legal_name: string
          licenses: Json | null
          longitude: number | null
          phone: string
          phone_format: string | null
          postcode: string
          primary_category: string | null
          secondary_categories: string[] | null
          service_areas: string[] | null
          service_radius_km: number | null
          social_profiles: Json | null
          state: string
          street_address: string
          suburb: string
          trading_name: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          abn?: string | null
          acn?: string | null
          business_hours?: Json | null
          country?: string | null
          created_at?: string | null
          description_long?: string | null
          description_medium?: string | null
          description_short?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          legal_name: string
          licenses?: Json | null
          longitude?: number | null
          phone: string
          phone_format?: string | null
          postcode: string
          primary_category?: string | null
          secondary_categories?: string[] | null
          service_areas?: string[] | null
          service_radius_km?: number | null
          social_profiles?: Json | null
          state: string
          street_address: string
          suburb: string
          trading_name?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          abn?: string | null
          acn?: string | null
          business_hours?: Json | null
          country?: string | null
          created_at?: string | null
          description_long?: string | null
          description_medium?: string | null
          description_short?: string | null
          email?: string | null
          id?: string
          latitude?: number | null
          legal_name?: string
          licenses?: Json | null
          longitude?: number | null
          phone?: string
          phone_format?: string | null
          postcode?: string
          primary_category?: string | null
          secondary_categories?: string[] | null
          service_areas?: string[] | null
          service_radius_km?: number | null
          social_profiles?: Json | null
          state?: string
          street_address?: string
          suburb?: string
          trading_name?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      campaign_assets: {
        Row: {
          campaign_id: string
          copy: string
          created_at: string
          cta: string | null
          founder_id: string
          hashtags: string[]
          headline: string | null
          height: number
          id: string
          image_engine: string | null
          image_prompt: string
          image_url: string | null
          platform: string
          quality_score: number | null
          quality_status: string | null
          social_post_id: string | null
          status: string
          updated_at: string
          variant: number
          visual_type: string
          width: number
        }
        Insert: {
          campaign_id: string
          copy: string
          created_at?: string
          cta?: string | null
          founder_id: string
          hashtags?: string[]
          headline?: string | null
          height?: number
          id?: string
          image_engine?: string | null
          image_prompt?: string
          image_url?: string | null
          platform: string
          quality_score?: number | null
          quality_status?: string | null
          social_post_id?: string | null
          status?: string
          updated_at?: string
          variant?: number
          visual_type?: string
          width?: number
        }
        Update: {
          campaign_id?: string
          copy?: string
          created_at?: string
          cta?: string | null
          founder_id?: string
          hashtags?: string[]
          headline?: string | null
          height?: number
          id?: string
          image_engine?: string | null
          image_prompt?: string
          image_url?: string | null
          platform?: string
          quality_score?: number | null
          quality_status?: string | null
          social_post_id?: string | null
          status?: string
          updated_at?: string
          variant?: number
          visual_type?: string
          width?: number
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_assets_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          brand_profile_id: string
          created_at: string
          date_range_end: string | null
          date_range_start: string | null
          founder_id: string
          id: string
          metadata: Json
          objective: string
          platforms: string[]
          post_count: number
          status: string
          theme: string
          updated_at: string
        }
        Insert: {
          brand_profile_id: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          founder_id: string
          id?: string
          metadata?: Json
          objective: string
          platforms?: string[]
          post_count?: number
          status?: string
          theme: string
          updated_at?: string
        }
        Update: {
          brand_profile_id?: string
          created_at?: string
          date_range_end?: string | null
          date_range_start?: string | null
          founder_id?: string
          id?: string
          metadata?: Json
          objective?: string
          platforms?: string[]
          post_count?: number
          status?: string
          theme?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_brand_profile_id_fkey"
            columns: ["brand_profile_id"]
            isOneToOne: false
            referencedRelation: "brand_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      carrier_configurations: {
        Row: {
          api_endpoint: string | null
          api_key_encrypted: string | null
          carrier_name: string
          created_at: string
          id: string
          is_active: boolean
          supported_services: Json | null
          updated_at: string | null
          webhook_secret: string | null
        }
        Insert: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          carrier_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          supported_services?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Update: {
          api_endpoint?: string | null
          api_key_encrypted?: string | null
          carrier_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          supported_services?: Json | null
          updated_at?: string | null
          webhook_secret?: string | null
        }
        Relationships: []
      }
      category_translations: {
        Row: {
          category_code: string
          created_at: string
          description: string | null
          id: string
          language_code: string
          name: string
          updated_at: string
        }
        Insert: {
          category_code: string
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          name: string
          updated_at?: string
        }
        Update: {
          category_code?: string
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      ccw_agent_runs: {
        Row: {
          agent_name: string
          completed_at: string | null
          current_step: string | null
          error: string | null
          id: string
          outputs: Json | null
          prd_id: string | null
          progress: number | null
          started_at: string
          status: string
          task_description: string | null
        }
        Insert: {
          agent_name: string
          completed_at?: string | null
          current_step?: string | null
          error?: string | null
          id?: string
          outputs?: Json | null
          prd_id?: string | null
          progress?: number | null
          started_at?: string
          status?: string
          task_description?: string | null
        }
        Update: {
          agent_name?: string
          completed_at?: string | null
          current_step?: string | null
          error?: string | null
          id?: string
          outputs?: Json | null
          prd_id?: string | null
          progress?: number | null
          started_at?: string
          status?: string
          task_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ccw_agent_runs_prd_id_fkey"
            columns: ["prd_id"]
            isOneToOne: false
            referencedRelation: "prds"
            referencedColumns: ["id"]
          },
        ]
      }
      ccw_contacts: {
        Row: {
          created_at: string
          customer_id: string | null
          department: string | null
          email: string | null
          first_name: string
          id: string
          is_active: boolean
          is_primary: boolean
          job_title: string | null
          last_name: string
          mobile: string | null
          notes: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          department?: string | null
          email?: string | null
          first_name: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          job_title?: string | null
          last_name: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          department?: string | null
          email?: string | null
          first_name?: string
          id?: string
          is_active?: boolean
          is_primary?: boolean
          job_title?: string | null
          last_name?: string
          mobile?: string | null
          notes?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ccw_contacts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      ccw_webhook_events: {
        Row: {
          completed_at: string | null
          error_details: Json | null
          error_message: string | null
          event_id: string
          event_type: string
          headers: Json | null
          id: string
          max_retries: number
          next_retry_at: string | null
          payload: Json
          processing_result: Json | null
          received_at: string
          retry_count: number
          source: string
          started_processing_at: string | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          event_id: string
          event_type: string
          headers?: Json | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          payload: Json
          processing_result?: Json | null
          received_at?: string
          retry_count?: number
          source: string
          started_processing_at?: string | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          event_id?: string
          event_type?: string
          headers?: Json | null
          id?: string
          max_retries?: number
          next_retry_at?: string | null
          payload?: Json
          processing_result?: Json | null
          received_at?: string
          retry_count?: number
          source?: string
          started_processing_at?: string | null
          status?: string
        }
        Relationships: []
      }
      cin7_account_mappings: {
        Row: {
          account_code: string | null
          cin7_account_id: string | null
          created_at: string
          erp_entity_type: string
          erp_field: string
          id: string
          is_default: boolean
          updated_at: string
        }
        Insert: {
          account_code?: string | null
          cin7_account_id?: string | null
          created_at?: string
          erp_entity_type: string
          erp_field: string
          id?: string
          is_default?: boolean
          updated_at?: string
        }
        Update: {
          account_code?: string | null
          cin7_account_id?: string | null
          created_at?: string
          erp_entity_type?: string
          erp_field?: string
          id?: string
          is_default?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cin7_account_mappings_cin7_account_id_fkey"
            columns: ["cin7_account_id"]
            isOneToOne: false
            referencedRelation: "cin7_chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_bom_components: {
        Row: {
          bom_master_id: string
          component_name: string
          component_sku: string
          id: string
          notes: string | null
          quantity: number
          uom: string | null
          wastage_percent: number | null
        }
        Insert: {
          bom_master_id: string
          component_name: string
          component_sku: string
          id?: string
          notes?: string | null
          quantity: number
          uom?: string | null
          wastage_percent?: number | null
        }
        Update: {
          bom_master_id?: string
          component_name?: string
          component_sku?: string
          id?: string
          notes?: string | null
          quantity?: number
          uom?: string | null
          wastage_percent?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_bom_components_bom_master_id_fkey"
            columns: ["bom_master_id"]
            isOneToOne: false
            referencedRelation: "cin7_bom_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_bom_masters: {
        Row: {
          cin7_bom_id: string
          created_at: string
          finished_good_name: string | null
          finished_good_sku: string | null
          id: string
          last_synced_at: string | null
          name: string
          notes: string | null
          quantity_produced: number | null
          sku: string
          status: string | null
          uom: string | null
          updated_at: string
          version: string | null
        }
        Insert: {
          cin7_bom_id: string
          created_at?: string
          finished_good_name?: string | null
          finished_good_sku?: string | null
          id?: string
          last_synced_at?: string | null
          name: string
          notes?: string | null
          quantity_produced?: number | null
          sku: string
          status?: string | null
          uom?: string | null
          updated_at?: string
          version?: string | null
        }
        Update: {
          cin7_bom_id?: string
          created_at?: string
          finished_good_name?: string | null
          finished_good_sku?: string | null
          id?: string
          last_synced_at?: string | null
          name?: string
          notes?: string | null
          quantity_produced?: number | null
          sku?: string
          status?: string | null
          uom?: string | null
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      cin7_chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          cin7_account_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          is_active: boolean
          last_synced_at: string | null
          parent_account_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type?: string
          cin7_account_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          parent_account_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          cin7_account_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          parent_account_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_connections: {
        Row: {
          account_name: string
          connection_type: string | null
          core_account_id: string | null
          core_application_key: string | null
          created_at: string
          id: string
          is_active: boolean | null
          last_customer_sync_at: string | null
          last_inventory_sync_at: string | null
          last_product_sync_at: string | null
          last_sync_at: string | null
          omni_api_key: string | null
          omni_username: string | null
          organization_id: string | null
          sync_settings: Json | null
          updated_at: string
        }
        Insert: {
          account_name: string
          connection_type?: string | null
          core_account_id?: string | null
          core_application_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_customer_sync_at?: string | null
          last_inventory_sync_at?: string | null
          last_product_sync_at?: string | null
          last_sync_at?: string | null
          omni_api_key?: string | null
          omni_username?: string | null
          organization_id?: string | null
          sync_settings?: Json | null
          updated_at?: string
        }
        Update: {
          account_name?: string
          connection_type?: string | null
          core_account_id?: string | null
          core_application_key?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_customer_sync_at?: string | null
          last_inventory_sync_at?: string | null
          last_product_sync_at?: string | null
          last_sync_at?: string | null
          omni_api_key?: string | null
          omni_username?: string | null
          organization_id?: string | null
          sync_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_customer_mappings: {
        Row: {
          cin7_core_customer_id: string | null
          cin7_customer_name: string
          cin7_omni_contact_id: number | null
          created_at: string
          customer_id: string
          id: string
          last_synced_at: string | null
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          cin7_core_customer_id?: string | null
          cin7_customer_name: string
          cin7_omni_contact_id?: number | null
          created_at?: string
          customer_id: string
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          cin7_core_customer_id?: string | null
          cin7_customer_name?: string
          cin7_omni_contact_id?: number | null
          created_at?: string
          customer_id?: string
          id?: string
          last_synced_at?: string | null
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_fulfilments: {
        Row: {
          carrier: string | null
          cin7_fulfilment_id: string | null
          cin7_order_mapping_id: string
          created_at: string
          delivered_at: string | null
          id: string
          notes: string | null
          pick_location: string | null
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          carrier?: string | null
          cin7_fulfilment_id?: string | null
          cin7_order_mapping_id: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          pick_location?: string | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          carrier?: string | null
          cin7_fulfilment_id?: string | null
          cin7_order_mapping_id?: string
          created_at?: string
          delivered_at?: string | null
          id?: string
          notes?: string | null
          pick_location?: string | null
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cin7_fulfilments_cin7_order_mapping_id_fkey"
            columns: ["cin7_order_mapping_id"]
            isOneToOne: false
            referencedRelation: "cin7_order_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_goods_receipt_lines: {
        Row: {
          batch_number: string | null
          condition: string | null
          expiry_date: string | null
          goods_receipt_id: string
          id: string
          notes: string | null
          ordered_qty: number | null
          product_id: string | null
          product_name: string
          put_away_location: string | null
          received_qty: number | null
          sku: string
        }
        Insert: {
          batch_number?: string | null
          condition?: string | null
          expiry_date?: string | null
          goods_receipt_id: string
          id?: string
          notes?: string | null
          ordered_qty?: number | null
          product_id?: string | null
          product_name: string
          put_away_location?: string | null
          received_qty?: number | null
          sku: string
        }
        Update: {
          batch_number?: string | null
          condition?: string | null
          expiry_date?: string | null
          goods_receipt_id?: string
          id?: string
          notes?: string | null
          ordered_qty?: number | null
          product_id?: string | null
          product_name?: string
          put_away_location?: string | null
          received_qty?: number | null
          sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "cin7_goods_receipt_lines_goods_receipt_id_fkey"
            columns: ["goods_receipt_id"]
            isOneToOne: false
            referencedRelation: "cin7_goods_receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_goods_receipts: {
        Row: {
          cin7_po_mapping_id: string | null
          cin7_receipt_id: string | null
          confirmed_at: string | null
          created_at: string
          id: string
          location_id: string | null
          notes: string | null
          po_reference: string
          received_by: string | null
          received_date: string | null
          status: string | null
          supplier_name: string | null
          synced_at: string | null
          total_items_received: number | null
        }
        Insert: {
          cin7_po_mapping_id?: string | null
          cin7_receipt_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          po_reference: string
          received_by?: string | null
          received_date?: string | null
          status?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          total_items_received?: number | null
        }
        Update: {
          cin7_po_mapping_id?: string | null
          cin7_receipt_id?: string | null
          confirmed_at?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          po_reference?: string
          received_by?: string | null
          received_date?: string | null
          status?: string | null
          supplier_name?: string | null
          synced_at?: string | null
          total_items_received?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_goods_receipts_cin7_po_mapping_id_fkey"
            columns: ["cin7_po_mapping_id"]
            isOneToOne: false
            referencedRelation: "cin7_purchase_order_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_invoices: {
        Row: {
          amount: number | null
          cin7_invoice_id: string | null
          cin7_order_mapping_id: string
          created_at: string
          currency: string | null
          due_date: string | null
          id: string
          invoice_date: string | null
          invoice_number: string | null
          paid_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          cin7_invoice_id?: string | null
          cin7_order_mapping_id: string
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          paid_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          cin7_invoice_id?: string | null
          cin7_order_mapping_id?: string
          created_at?: string
          currency?: string | null
          due_date?: string | null
          id?: string
          invoice_date?: string | null
          invoice_number?: string | null
          paid_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cin7_invoices_cin7_order_mapping_id_fkey"
            columns: ["cin7_order_mapping_id"]
            isOneToOne: false
            referencedRelation: "cin7_order_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_journal_entries: {
        Row: {
          cin7_journal_id: string | null
          cin7_synced: boolean
          created_at: string
          currency: string
          description: string | null
          id: string
          journal_date: string
          reference: string | null
          source: string
          status: string
          total_credit: number
          total_debit: number
          updated_at: string
        }
        Insert: {
          cin7_journal_id?: string | null
          cin7_synced?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          journal_date: string
          reference?: string | null
          source?: string
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Update: {
          cin7_journal_id?: string | null
          cin7_synced?: boolean
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          journal_date?: string
          reference?: string | null
          source?: string
          status?: string
          total_credit?: number
          total_debit?: number
          updated_at?: string
        }
        Relationships: []
      }
      cin7_journal_lines: {
        Row: {
          account_id: string
          amount: number
          description: string | null
          id: string
          journal_entry_id: string
          line_type: string
          order_id: string | null
          tax_amount: number
        }
        Insert: {
          account_id: string
          amount: number
          description?: string | null
          id?: string
          journal_entry_id: string
          line_type: string
          order_id?: string | null
          tax_amount?: number
        }
        Update: {
          account_id?: string
          amount?: number
          description?: string | null
          id?: string
          journal_entry_id?: string
          line_type?: string
          order_id?: string | null
          tax_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "cin7_journal_lines_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "cin7_chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cin7_journal_lines_journal_entry_id_fkey"
            columns: ["journal_entry_id"]
            isOneToOne: false
            referencedRelation: "cin7_journal_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_order_line_items: {
        Row: {
          cin7_line_id: string | null
          cin7_order_mapping_id: string
          created_at: string
          id: string
          notes: string | null
          product_name: string | null
          product_sku: string | null
          quantity: number | null
          tax_rate: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          cin7_line_id?: string | null
          cin7_order_mapping_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name?: string | null
          product_sku?: string | null
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          cin7_line_id?: string | null
          cin7_order_mapping_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name?: string | null
          product_sku?: string | null
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_order_line_items_cin7_order_mapping_id_fkey"
            columns: ["cin7_order_mapping_id"]
            isOneToOne: false
            referencedRelation: "cin7_order_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_order_mappings: {
        Row: {
          cin7_core_sale_id: string | null
          cin7_omni_order_id: number | null
          cin7_order_number: string
          created_at: string
          id: string
          last_synced_at: string | null
          order_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          cin7_core_sale_id?: string | null
          cin7_omni_order_id?: number | null
          cin7_order_number: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          order_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          cin7_core_sale_id?: string | null
          cin7_omni_order_id?: number | null
          cin7_order_number?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          order_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_payments: {
        Row: {
          amount: number | null
          cin7_invoice_id: string | null
          cin7_payment_id: string | null
          created_at: string
          currency: string | null
          id: string
          payment_date: string | null
          payment_method: string | null
          reference: string | null
          status: string | null
        }
        Insert: {
          amount?: number | null
          cin7_invoice_id?: string | null
          cin7_payment_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          reference?: string | null
          status?: string | null
        }
        Update: {
          amount?: number | null
          cin7_invoice_id?: string | null
          cin7_payment_id?: string | null
          created_at?: string
          currency?: string | null
          id?: string
          payment_date?: string | null
          payment_method?: string | null
          reference?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_payments_cin7_invoice_id_fkey"
            columns: ["cin7_invoice_id"]
            isOneToOne: false
            referencedRelation: "cin7_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_product_mappings: {
        Row: {
          cin7_core_product_id: string | null
          cin7_omni_product_id: number | null
          cin7_sku: string
          created_at: string
          id: string
          last_synced_at: string | null
          product_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          cin7_core_product_id?: string | null
          cin7_omni_product_id?: number | null
          cin7_sku: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          product_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          cin7_core_product_id?: string | null
          cin7_omni_product_id?: number | null
          cin7_sku?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          product_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_production_runs: {
        Row: {
          bom_master_id: string
          cin7_production_id: string | null
          cin7_synced: boolean | null
          completed_date: string | null
          created_at: string
          id: string
          location_id: string | null
          notes: string | null
          planned_date: string | null
          quantity_completed: number | null
          quantity_planned: number
          status: string | null
          updated_at: string
        }
        Insert: {
          bom_master_id: string
          cin7_production_id?: string | null
          cin7_synced?: boolean | null
          completed_date?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          planned_date?: string | null
          quantity_completed?: number | null
          quantity_planned: number
          status?: string | null
          updated_at?: string
        }
        Update: {
          bom_master_id?: string
          cin7_production_id?: string | null
          cin7_synced?: boolean | null
          completed_date?: string | null
          created_at?: string
          id?: string
          location_id?: string | null
          notes?: string | null
          planned_date?: string | null
          quantity_completed?: number | null
          quantity_planned?: number
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cin7_production_runs_bom_master_id_fkey"
            columns: ["bom_master_id"]
            isOneToOne: false
            referencedRelation: "cin7_bom_masters"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_purchase_order_line_items: {
        Row: {
          cin7_line_id: string | null
          cin7_purchase_order_mapping_id: string
          created_at: string
          id: string
          notes: string | null
          product_name: string | null
          product_sku: string | null
          quantity: number | null
          tax_rate: number | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          cin7_line_id?: string | null
          cin7_purchase_order_mapping_id: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name?: string | null
          product_sku?: string | null
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          cin7_line_id?: string | null
          cin7_purchase_order_mapping_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          product_name?: string | null
          product_sku?: string | null
          quantity?: number | null
          tax_rate?: number | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_purchase_order_line_item_cin7_purchase_order_mapping__fkey"
            columns: ["cin7_purchase_order_mapping_id"]
            isOneToOne: false
            referencedRelation: "cin7_purchase_order_mappings"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_purchase_order_mappings: {
        Row: {
          cin7_core_purchase_id: string | null
          cin7_omni_po_id: number | null
          cin7_po_number: string
          created_at: string
          id: string
          last_synced_at: string | null
          purchase_order_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          cin7_core_purchase_id?: string | null
          cin7_omni_po_id?: number | null
          cin7_po_number: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          purchase_order_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          cin7_core_purchase_id?: string | null
          cin7_omni_po_id?: number | null
          cin7_po_number?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          purchase_order_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_quote_mappings: {
        Row: {
          cin7_omni_quote_id: number | null
          cin7_quote_reference: string
          created_at: string
          id: string
          last_synced_at: string | null
          quote_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          cin7_omni_quote_id?: number | null
          cin7_quote_reference: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          quote_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          cin7_omni_quote_id?: number | null
          cin7_quote_reference?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          quote_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_shadow_syncs: {
        Row: {
          cin7_hash: string | null
          cin7_id: string
          created_at: string
          entity_type: string
          erp_hash: string | null
          erp_id: string | null
          gap_detected_at: string | null
          id: string
          last_checked_at: string
          resolved_at: string | null
          sync_status: string | null
        }
        Insert: {
          cin7_hash?: string | null
          cin7_id: string
          created_at?: string
          entity_type: string
          erp_hash?: string | null
          erp_id?: string | null
          gap_detected_at?: string | null
          id?: string
          last_checked_at?: string
          resolved_at?: string | null
          sync_status?: string | null
        }
        Update: {
          cin7_hash?: string | null
          cin7_id?: string
          created_at?: string
          entity_type?: string
          erp_hash?: string | null
          erp_id?: string | null
          gap_detected_at?: string | null
          id?: string
          last_checked_at?: string
          resolved_at?: string | null
          sync_status?: string | null
        }
        Relationships: []
      }
      cin7_stock_adjustments: {
        Row: {
          adjustment_qty: number
          cin7_adjustment_id: string | null
          created_at: string
          error_message: string | null
          id: string
          location_id: string
          product_id: string
          reason: string | null
          sku: string
          status: string | null
          synced_at: string | null
        }
        Insert: {
          adjustment_qty: number
          cin7_adjustment_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          location_id: string
          product_id: string
          reason?: string | null
          sku: string
          status?: string | null
          synced_at?: string | null
        }
        Update: {
          adjustment_qty?: number
          cin7_adjustment_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          location_id?: string
          product_id?: string
          reason?: string | null
          sku?: string
          status?: string | null
          synced_at?: string | null
        }
        Relationships: []
      }
      cin7_stock_take_lines: {
        Row: {
          counted_qty: number
          id: string
          product_id: string
          sku: string
          stock_take_id: string
          system_qty: number | null
          variance: number | null
        }
        Insert: {
          counted_qty: number
          id?: string
          product_id: string
          sku: string
          stock_take_id: string
          system_qty?: number | null
          variance?: number | null
        }
        Update: {
          counted_qty?: number
          id?: string
          product_id?: string
          sku?: string
          stock_take_id?: string
          system_qty?: number | null
          variance?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_stock_take_lines_stock_take_id_fkey"
            columns: ["stock_take_id"]
            isOneToOne: false
            referencedRelation: "cin7_stock_takes"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_stock_takes: {
        Row: {
          cin7_stock_take_id: string | null
          created_at: string
          id: string
          location_id: string
          reference: string
          status: string | null
          submitted_at: string | null
          synced_at: string | null
        }
        Insert: {
          cin7_stock_take_id?: string | null
          created_at?: string
          id?: string
          location_id: string
          reference: string
          status?: string | null
          submitted_at?: string | null
          synced_at?: string | null
        }
        Update: {
          cin7_stock_take_id?: string | null
          created_at?: string
          id?: string
          location_id?: string
          reference?: string
          status?: string | null
          submitted_at?: string | null
          synced_at?: string | null
        }
        Relationships: []
      }
      cin7_stock_transfers: {
        Row: {
          cin7_transfer_id: string | null
          created_at: string
          error_message: string | null
          from_location_id: string
          id: string
          product_id: string
          quantity: number
          reference: string | null
          sku: string
          status: string | null
          synced_at: string | null
          to_location_id: string
        }
        Insert: {
          cin7_transfer_id?: string | null
          created_at?: string
          error_message?: string | null
          from_location_id: string
          id?: string
          product_id: string
          quantity: number
          reference?: string | null
          sku: string
          status?: string | null
          synced_at?: string | null
          to_location_id: string
        }
        Update: {
          cin7_transfer_id?: string | null
          created_at?: string
          error_message?: string | null
          from_location_id?: string
          id?: string
          product_id?: string
          quantity?: number
          reference?: string | null
          sku?: string
          status?: string | null
          synced_at?: string | null
          to_location_id?: string
        }
        Relationships: []
      }
      cin7_supplier_mappings: {
        Row: {
          cin7_core_supplier_id: string | null
          cin7_omni_supplier_id: number | null
          cin7_supplier_name: string
          created_at: string
          id: string
          last_synced_at: string | null
          supplier_id: string
          sync_status: string | null
          updated_at: string
        }
        Insert: {
          cin7_core_supplier_id?: string | null
          cin7_omni_supplier_id?: number | null
          cin7_supplier_name: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          supplier_id: string
          sync_status?: string | null
          updated_at?: string
        }
        Update: {
          cin7_core_supplier_id?: string | null
          cin7_omni_supplier_id?: number | null
          cin7_supplier_name?: string
          created_at?: string
          id?: string
          last_synced_at?: string | null
          supplier_id?: string
          sync_status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      cin7_sync_gaps: {
        Row: {
          cin7_id: string
          cin7_value: string | null
          created_at: string
          detected_at: string
          entity_type: string
          erp_id: string | null
          erp_value: string | null
          field_name: string | null
          gap_type: string
          id: string
          resolution_notes: string | null
          resolved_at: string | null
          severity: string | null
          shadow_sync_id: string
          status: string | null
        }
        Insert: {
          cin7_id: string
          cin7_value?: string | null
          created_at?: string
          detected_at?: string
          entity_type: string
          erp_id?: string | null
          erp_value?: string | null
          field_name?: string | null
          gap_type: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          shadow_sync_id: string
          status?: string | null
        }
        Update: {
          cin7_id?: string
          cin7_value?: string | null
          created_at?: string
          detected_at?: string
          entity_type?: string
          erp_id?: string | null
          erp_value?: string | null
          field_name?: string | null
          gap_type?: string
          id?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          severity?: string | null
          shadow_sync_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cin7_sync_gaps_shadow_sync_id_fkey"
            columns: ["shadow_sync_id"]
            isOneToOne: false
            referencedRelation: "cin7_shadow_syncs"
            referencedColumns: ["id"]
          },
        ]
      }
      cin7_sync_logs: {
        Row: {
          api_source: string | null
          completed_at: string | null
          connection_id: string | null
          details: Json | null
          direction: string | null
          error_message: string | null
          id: string
          records_created: number | null
          records_failed: number | null
          records_processed: number | null
          records_updated: number | null
          started_at: string
          status: string | null
          sync_type: string
        }
        Insert: {
          api_source?: string | null
          completed_at?: string | null
          connection_id?: string | null
          details?: Json | null
          direction?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string | null
          sync_type: string
        }
        Update: {
          api_source?: string | null
          completed_at?: string | null
          connection_id?: string | null
          details?: Json | null
          direction?: string | null
          error_message?: string | null
          id?: string
          records_created?: number | null
          records_failed?: number | null
          records_processed?: number | null
          records_updated?: number | null
          started_at?: string
          status?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      cin7_webhook_subscriptions: {
        Row: {
          created_at: string
          endpoint_url: string
          event_type: string
          id: string
          is_active: boolean | null
          last_triggered_at: string | null
          secret_key: string | null
          trigger_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          endpoint_url: string
          event_type: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret_key?: string | null
          trigger_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          endpoint_url?: string
          event_type?: string
          id?: string
          is_active?: boolean | null
          last_triggered_at?: string | null
          secret_key?: string | null
          trigger_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      coach_reports: {
        Row: {
          brief_markdown: string | null
          business_key: string | null
          coach_type: string
          created_at: string
          duration_ms: number | null
          error_message: string | null
          founder_id: string
          id: string
          input_tokens: number | null
          metrics: Json | null
          model: string | null
          output_tokens: number | null
          raw_data: Json | null
          report_date: string
          status: string
          updated_at: string
        }
        Insert: {
          brief_markdown?: string | null
          business_key?: string | null
          coach_type: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          founder_id: string
          id?: string
          input_tokens?: number | null
          metrics?: Json | null
          model?: string | null
          output_tokens?: number | null
          raw_data?: Json | null
          report_date?: string
          status?: string
          updated_at?: string
        }
        Update: {
          brief_markdown?: string | null
          business_key?: string | null
          coach_type?: string
          created_at?: string
          duration_ms?: number | null
          error_message?: string | null
          founder_id?: string
          id?: string
          input_tokens?: number | null
          metrics?: Json | null
          model?: string | null
          output_tokens?: number | null
          raw_data?: Json | null
          report_date?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      competitor_analyses: {
        Row: {
          analyzed_at: string | null
          competitor_location: string | null
          competitor_name: string
          competitor_url: string
          id: string
          opportunities: string[] | null
          page_type: string
          sections: Json | null
          strengths: string[] | null
          unique_features: Json | null
          user_id: string
          weaknesses: string[] | null
        }
        Insert: {
          analyzed_at?: string | null
          competitor_location?: string | null
          competitor_name: string
          competitor_url: string
          id?: string
          opportunities?: string[] | null
          page_type: string
          sections?: Json | null
          strengths?: string[] | null
          unique_features?: Json | null
          user_id: string
          weaknesses?: string[] | null
        }
        Update: {
          analyzed_at?: string | null
          competitor_location?: string | null
          competitor_name?: string
          competitor_url?: string
          id?: string
          opportunities?: string[] | null
          page_type?: string
          sections?: Json | null
          strengths?: string[] | null
          unique_features?: Json | null
          user_id?: string
          weaknesses?: string[] | null
        }
        Relationships: []
      }
      competitor_profiles: {
        Row: {
          client_domain: string
          competitor_domain: string
          competitor_name: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          client_domain: string
          competitor_domain: string
          competitor_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          client_domain?: string
          competitor_domain?: string
          competitor_name?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: []
      }
      connected_projects: {
        Row: {
          business_id: string | null
          created_at: string
          founder_id: string
          id: string
          last_synced_at: string | null
          metadata: Json
          provider: string
          provider_project_id: string
          provider_project_name: string
          sync_enabled: boolean
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          founder_id: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          provider: string
          provider_project_id: string
          provider_project_name: string
          sync_enabled?: boolean
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          founder_id?: string
          id?: string
          last_synced_at?: string | null
          metadata?: Json
          provider?: string
          provider_project_id?: string
          provider_project_name?: string
          sync_enabled?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      consistency_audits: {
        Row: {
          ai_visibility_results: Json | null
          audit_type: string
          auditor: string | null
          business_id: string
          created_at: string | null
          critical_issues: number
          findings: Json | null
          id: string
          issues_found: number
          overall_score: number
          platforms_audited: number
          platforms_consistent: number
          recommendations: Json | null
          tier_1_score: number | null
          tier_2_score: number | null
          tier_3_score: number | null
        }
        Insert: {
          ai_visibility_results?: Json | null
          audit_type: string
          auditor?: string | null
          business_id: string
          created_at?: string | null
          critical_issues?: number
          findings?: Json | null
          id?: string
          issues_found?: number
          overall_score: number
          platforms_audited?: number
          platforms_consistent?: number
          recommendations?: Json | null
          tier_1_score?: number | null
          tier_2_score?: number | null
          tier_3_score?: number | null
        }
        Update: {
          ai_visibility_results?: Json | null
          audit_type?: string
          auditor?: string | null
          business_id?: string
          created_at?: string | null
          critical_issues?: number
          findings?: Json | null
          id?: string
          issues_found?: number
          overall_score?: number
          platforms_audited?: number
          platforms_consistent?: number
          recommendations?: Json | null
          tier_1_score?: number | null
          tier_2_score?: number | null
          tier_3_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "consistency_audits_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
          source: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
          source: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          business_id: string | null
          company: string | null
          created_at: string
          email: string | null
          first_name: string | null
          founder_id: string
          id: string
          last_name: string | null
          metadata: Json
          phone: string | null
          role: string | null
          status: string
          tags: string[]
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          founder_id: string
          id?: string
          last_name?: string | null
          metadata?: Json
          phone?: string | null
          role?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          first_name?: string | null
          founder_id?: string
          id?: string
          last_name?: string | null
          metadata?: Json
          phone?: string | null
          role?: string | null
          status?: string
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      container_items: {
        Row: {
          container_id: string
          created_at: string
          id: string
          product_id: string
          quality_checked: boolean
          quality_notes: string | null
          quantity_damaged: number
          quantity_ordered: number
          quantity_preallocated: number
          quantity_received: number
          unit_cost: number | null
          updated_at: string
        }
        Insert: {
          container_id: string
          created_at?: string
          id?: string
          product_id: string
          quality_checked?: boolean
          quality_notes?: string | null
          quantity_damaged?: number
          quantity_ordered: number
          quantity_preallocated?: number
          quantity_received?: number
          unit_cost?: number | null
          updated_at?: string
        }
        Update: {
          container_id?: string
          created_at?: string
          id?: string
          product_id?: string
          quality_checked?: boolean
          quality_notes?: string | null
          quantity_damaged?: number
          quantity_ordered?: number
          quantity_preallocated?: number
          quantity_received?: number
          unit_cost?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "container_items_container_id_fkey"
            columns: ["container_id"]
            isOneToOne: false
            referencedRelation: "containers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "container_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      containers: {
        Row: {
          actual_arrival_date: string | null
          booking_date: string | null
          carrier: string | null
          container_number: string
          created_at: string
          created_by: string | null
          customs_clearance_date: string | null
          customs_duty: number | null
          delivered_date: string | null
          departure_date: string | null
          destination_port: string | null
          destination_warehouse: string
          estimated_arrival_date: string | null
          id: string
          internal_notes: string | null
          notes: string | null
          origin_port: string | null
          other_charges: number | null
          purchase_order_id: string | null
          shipping_cost: number | null
          status: Database["public"]["Enums"]["container_status"]
          supplier_id: string | null
          tracking_events: Json
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string
          vessel_name: string | null
          voyage_number: string | null
        }
        Insert: {
          actual_arrival_date?: string | null
          booking_date?: string | null
          carrier?: string | null
          container_number: string
          created_at?: string
          created_by?: string | null
          customs_clearance_date?: string | null
          customs_duty?: number | null
          delivered_date?: string | null
          departure_date?: string | null
          destination_port?: string | null
          destination_warehouse?: string
          estimated_arrival_date?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          origin_port?: string | null
          other_charges?: number | null
          purchase_order_id?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["container_status"]
          supplier_id?: string | null
          tracking_events?: Json
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Update: {
          actual_arrival_date?: string | null
          booking_date?: string | null
          carrier?: string | null
          container_number?: string
          created_at?: string
          created_by?: string | null
          customs_clearance_date?: string | null
          customs_duty?: number | null
          delivered_date?: string | null
          departure_date?: string | null
          destination_port?: string | null
          destination_warehouse?: string
          estimated_arrival_date?: string | null
          id?: string
          internal_notes?: string | null
          notes?: string | null
          origin_port?: string | null
          other_charges?: number | null
          purchase_order_id?: string | null
          shipping_cost?: number | null
          status?: Database["public"]["Enums"]["container_status"]
          supplier_id?: string | null
          tracking_events?: Json
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string
          vessel_name?: string | null
          voyage_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "containers_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "containers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      content_gap_analysis: {
        Row: {
          analyzed_at: string | null
          client_domain: string
          client_page_types: Json | null
          client_topics: Json | null
          competitor_page_types: Json | null
          competitor_topics: Json | null
          content_recommendations: Json | null
          created_at: string | null
          id: string
          missing_content_types: Json | null
          missing_topics: Json | null
          priority_topics: Json | null
          workspace_id: string
        }
        Insert: {
          analyzed_at?: string | null
          client_domain: string
          client_page_types?: Json | null
          client_topics?: Json | null
          competitor_page_types?: Json | null
          competitor_topics?: Json | null
          content_recommendations?: Json | null
          created_at?: string | null
          id?: string
          missing_content_types?: Json | null
          missing_topics?: Json | null
          priority_topics?: Json | null
          workspace_id: string
        }
        Update: {
          analyzed_at?: string | null
          client_domain?: string
          client_page_types?: Json | null
          client_topics?: Json | null
          competitor_page_types?: Json | null
          competitor_topics?: Json | null
          content_recommendations?: Json | null
          created_at?: string | null
          id?: string
          missing_content_types?: Json | null
          missing_topics?: Json | null
          priority_topics?: Json | null
          workspace_id?: string
        }
        Relationships: []
      }
      content_pieces: {
        Row: {
          business_id: string | null
          claims_evidence: Json | null
          content: string
          content_type: string
          created_at: string | null
          id: string
          integrity_passed: boolean | null
          plagiarism_check_date: string | null
          plagiarism_check_passed: boolean | null
          published_at: string | null
          research_ids: string[] | null
          status: string | null
          title: string
          uniqueness_score: number | null
          updated_at: string | null
          user_id: string
          validation_results: Json | null
          verifiability_score: number | null
        }
        Insert: {
          business_id?: string | null
          claims_evidence?: Json | null
          content: string
          content_type: string
          created_at?: string | null
          id?: string
          integrity_passed?: boolean | null
          plagiarism_check_date?: string | null
          plagiarism_check_passed?: boolean | null
          published_at?: string | null
          research_ids?: string[] | null
          status?: string | null
          title: string
          uniqueness_score?: number | null
          updated_at?: string | null
          user_id: string
          validation_results?: Json | null
          verifiability_score?: number | null
        }
        Update: {
          business_id?: string | null
          claims_evidence?: Json | null
          content?: string
          content_type?: string
          created_at?: string | null
          id?: string
          integrity_passed?: boolean | null
          plagiarism_check_date?: string | null
          plagiarism_check_passed?: boolean | null
          published_at?: string | null
          research_ids?: string[] | null
          status?: string | null
          title?: string
          uniqueness_score?: number | null
          updated_at?: string | null
          user_id?: string
          validation_results?: Json | null
          verifiability_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_pieces_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      contractors: {
        Row: {
          abn: string | null
          created_at: string
          email: string | null
          id: string
          mobile: string
          name: string
          specialisation: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          abn?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile: string
          name: string
          specialisation?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          abn?: string | null
          created_at?: string
          email?: string | null
          id?: string
          mobile?: string
          name?: string
          specialisation?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contractors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_history: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
          user_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
          user_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          messages: Json | null
          title: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          messages?: Json | null
          title?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      credentials_vault: {
        Row: {
          business_id: string | null
          created_at: string
          encrypted_value: string
          founder_id: string
          id: string
          iv: string
          label: string
          last_accessed_at: string | null
          metadata: Json
          notes: string | null
          salt: string
          service: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          encrypted_value: string
          founder_id: string
          id?: string
          iv: string
          label: string
          last_accessed_at?: string | null
          metadata?: Json
          notes?: string | null
          salt: string
          service: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          encrypted_value?: string
          founder_id?: string
          id?: string
          iv?: string
          label?: string
          last_accessed_at?: string | null
          metadata?: Json
          notes?: string | null
          salt?: string
          service?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_personas: {
        Row: {
          classified_at: string
          confidence: string
          customer_id: string
          id: string
          persona: string
          reason: string | null
          updated_at: string
        }
        Insert: {
          classified_at?: string
          confidence?: string
          customer_id: string
          id?: string
          persona?: string
          reason?: string | null
          updated_at?: string
        }
        Update: {
          classified_at?: string
          confidence?: string
          customer_id?: string
          id?: string
          persona?: string
          reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_personas_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: true
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_product_interactions: {
        Row: {
          created_at: string
          customer_id: string
          first_interaction_at: string
          id: string
          interaction_count: number
          interaction_type: string
          last_interaction_at: string
          product_id: string
          session_id: string | null
          source: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          first_interaction_at?: string
          id?: string
          interaction_count?: number
          interaction_type: string
          last_interaction_at?: string
          product_id: string
          session_id?: string | null
          source?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          first_interaction_at?: string
          id?: string
          interaction_count?: number
          interaction_type?: string
          last_interaction_at?: string
          product_id?: string
          session_id?: string | null
          source?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_product_interactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_product_interactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_name: string
          created_at: string
          customer_number: string
          email: string
          id: string
          is_active: boolean
          organization_id: string | null
          phone: string | null
          postcode: string | null
          state: string | null
          updated_at: string
          xero_contact_id: string | null
          xero_synced_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_name: string
          created_at?: string
          customer_number: string
          email: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          updated_at?: string
          xero_contact_id?: string | null
          xero_synced_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string
          created_at?: string
          customer_number?: string
          email?: string
          id?: string
          is_active?: boolean
          organization_id?: string | null
          phone?: string | null
          postcode?: string | null
          state?: string | null
          updated_at?: string
          xero_contact_id?: string | null
          xero_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      debugging_sessions: {
        Row: {
          affected_files: Json | null
          attempted_fixes: Json | null
          created_at: string | null
          current_hypothesis_id: string | null
          error_type: string
          feature_id: string | null
          findings: Json | null
          hypotheses: Json | null
          id: string
          initial_error: string
          project_id: string
          resolution: string | null
          session_id: string
          stack_trace: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          affected_files?: Json | null
          attempted_fixes?: Json | null
          created_at?: string | null
          current_hypothesis_id?: string | null
          error_type: string
          feature_id?: string | null
          findings?: Json | null
          hypotheses?: Json | null
          id?: string
          initial_error: string
          project_id: string
          resolution?: string | null
          session_id: string
          stack_trace?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          affected_files?: Json | null
          attempted_fixes?: Json | null
          created_at?: string | null
          current_hypothesis_id?: string | null
          error_type?: string
          feature_id?: string | null
          findings?: Json | null
          hypotheses?: Json | null
          id?: string
          initial_error?: string
          project_id?: string
          resolution?: string | null
          session_id?: string
          stack_trace?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      demo_requests: {
        Row: {
          company_name: string
          contact_name: string
          created_at: string
          email: string
          id: string
          notes: string | null
          phone: string
          preferred_date: string | null
          product_interest: string | null
          status: string
          updated_at: string
        }
        Insert: {
          company_name: string
          contact_name: string
          created_at?: string
          email: string
          id?: string
          notes?: string | null
          phone: string
          preferred_date?: string | null
          product_interest?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          contact_name?: string
          created_at?: string
          email?: string
          id?: string
          notes?: string | null
          phone?: string
          preferred_date?: string | null
          product_interest?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          created_at: string | null
          embedding: string | null
          id: string
          metadata: Json | null
          title: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          title: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          embedding?: string | null
          id?: string
          metadata?: Json | null
          title?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      domain_knowledge: {
        Row: {
          confidence: number | null
          context: string | null
          created_at: string | null
          created_by_session: string | null
          description: string
          examples: Json | null
          id: string
          project_id: string
          related_features: Json | null
          related_files: Json | null
          tags: Json | null
          title: string
          type: string
          updated_at: string | null
          usage_count: number | null
          user_id: string | null
        }
        Insert: {
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          created_by_session?: string | null
          description: string
          examples?: Json | null
          id?: string
          project_id: string
          related_features?: Json | null
          related_files?: Json | null
          tags?: Json | null
          title: string
          type: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Update: {
          confidence?: number | null
          context?: string | null
          created_at?: string | null
          created_by_session?: string | null
          description?: string
          examples?: Json | null
          id?: string
          project_id?: string
          related_features?: Json | null
          related_files?: Json | null
          tags?: Json | null
          title?: string
          type?: string
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      domain_memories: {
        Row: {
          access_count: number | null
          category: string
          created_at: string | null
          domain: string
          embedding: string | null
          expires_at: string | null
          id: string
          key: string
          last_accessed_at: string | null
          relevance_score: number | null
          source: string | null
          tags: Json | null
          updated_at: string | null
          user_id: string | null
          value: Json
        }
        Insert: {
          access_count?: number | null
          category: string
          created_at?: string | null
          domain: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key: string
          last_accessed_at?: string | null
          relevance_score?: number | null
          source?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_id?: string | null
          value: Json
        }
        Update: {
          access_count?: number | null
          category?: string
          created_at?: string | null
          domain?: string
          embedding?: string | null
          expires_at?: string | null
          id?: string
          key?: string
          last_accessed_at?: string | null
          relevance_score?: number | null
          source?: string | null
          tags?: Json | null
          updated_at?: string | null
          user_id?: string | null
          value?: Json
        }
        Relationships: []
      }
      email_campaigns: {
        Row: {
          body_html: string
          body_text: string | null
          business_key: string
          click_count: number
          created_at: string
          error_message: string | null
          founder_id: string
          generated_content_id: string | null
          id: string
          metadata: Json
          open_count: number
          recipient_list: Json
          scheduled_at: string | null
          sent_at: string | null
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          business_key: string
          click_count?: number
          created_at?: string
          error_message?: string | null
          founder_id: string
          generated_content_id?: string | null
          id?: string
          metadata?: Json
          open_count?: number
          recipient_list?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          business_key?: string
          click_count?: number
          created_at?: string
          error_message?: string | null
          founder_id?: string
          generated_content_id?: string | null
          id?: string
          metadata?: Json
          open_count?: number
          recipient_list?: Json
          scheduled_at?: string | null
          sent_at?: string | null
          status?: string
          subject?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_generated_content_id_fkey"
            columns: ["generated_content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      email_consents: {
        Row: {
          bounce_count: number
          created_at: string
          customer_id: string | null
          email: string
          hard_bounced: boolean
          hard_bounced_at: string | null
          id: string
          marketing_consent: boolean
          marketing_consent_at: string | null
          marketing_consent_source: string | null
          notification_consent: boolean
          notification_consent_at: string | null
          spam_reported: boolean
          spam_reported_at: string | null
          unsubscribe_reason: string | null
          unsubscribed: boolean
          unsubscribed_at: string | null
          updated_at: string
        }
        Insert: {
          bounce_count?: number
          created_at?: string
          customer_id?: string | null
          email: string
          hard_bounced?: boolean
          hard_bounced_at?: string | null
          id?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_consent_source?: string | null
          notification_consent?: boolean
          notification_consent_at?: string | null
          spam_reported?: boolean
          spam_reported_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Update: {
          bounce_count?: number
          created_at?: string
          customer_id?: string | null
          email?: string
          hard_bounced?: boolean
          hard_bounced_at?: string | null
          id?: string
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_consent_source?: string | null
          notification_consent?: boolean
          notification_consent_at?: string | null
          spam_reported?: boolean
          spam_reported_at?: string | null
          unsubscribe_reason?: string | null
          unsubscribed?: boolean
          unsubscribed_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_consents_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      email_conversations: {
        Row: {
          assigned_to: string | null
          confidence_score: number | null
          created_at: string
          customer_email: string
          customer_id: string | null
          customer_name: string | null
          first_message_at: string
          id: string
          intent: string | null
          last_message_at: string
          message_count: number
          related_order_ids: Json | null
          related_product_ids: Json | null
          related_quote_ids: Json | null
          status: string
          subject: string
          thread_id: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          confidence_score?: number | null
          created_at?: string
          customer_email: string
          customer_id?: string | null
          customer_name?: string | null
          first_message_at?: string
          id?: string
          intent?: string | null
          last_message_at?: string
          message_count?: number
          related_order_ids?: Json | null
          related_product_ids?: Json | null
          related_quote_ids?: Json | null
          status?: string
          subject: string
          thread_id: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          confidence_score?: number | null
          created_at?: string
          customer_email?: string
          customer_id?: string | null
          customer_name?: string | null
          first_message_at?: string
          id?: string
          intent?: string | null
          last_message_at?: string
          message_count?: number
          related_order_ids?: Json | null
          related_product_ids?: Json | null
          related_quote_ids?: Json | null
          status?: string
          subject?: string
          thread_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          bounced_at: string | null
          click_count: number
          clicked_at: string | null
          consent_given: boolean
          consent_source: string | null
          consent_timestamp: string | null
          content_purged: boolean
          created_at: string
          customer_id: string | null
          delivered_at: string | null
          error_code: string | null
          error_message: string | null
          from_email: string
          from_name: string | null
          html_content: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          open_count: number
          opened_at: string | null
          organization_id: string | null
          purged_at: string | null
          purpose: string
          recipient_email: string
          recipient_name: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          reply_to: string | null
          sendgrid_message_id: string | null
          sent_at: string | null
          spam_reported_at: string | null
          status: string
          subject: string
          template_id: string | null
          text_content: string | null
          unsubscribed_at: string | null
          updated_at: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          bounced_at?: string | null
          click_count?: number
          clicked_at?: string | null
          consent_given?: boolean
          consent_source?: string | null
          consent_timestamp?: string | null
          content_purged?: boolean
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          from_email: string
          from_name?: string | null
          html_content?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          open_count?: number
          opened_at?: string | null
          organization_id?: string | null
          purged_at?: string | null
          purpose?: string
          recipient_email: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          reply_to?: string | null
          sendgrid_message_id?: string | null
          sent_at?: string | null
          spam_reported_at?: string | null
          status?: string
          subject: string
          template_id?: string | null
          text_content?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          bounced_at?: string | null
          click_count?: number
          clicked_at?: string | null
          consent_given?: boolean
          consent_source?: string | null
          consent_timestamp?: string | null
          content_purged?: boolean
          created_at?: string
          customer_id?: string | null
          delivered_at?: string | null
          error_code?: string | null
          error_message?: string | null
          from_email?: string
          from_name?: string | null
          html_content?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          open_count?: number
          opened_at?: string | null
          organization_id?: string | null
          purged_at?: string | null
          purpose?: string
          recipient_email?: string
          recipient_name?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          reply_to?: string | null
          sendgrid_message_id?: string | null
          sent_at?: string | null
          spam_reported_at?: string | null
          status?: string
          subject?: string
          template_id?: string | null
          text_content?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      email_messages: {
        Row: {
          ai_confidence: number | null
          ai_intent: string | null
          attachments: Json | null
          bcc_emails: Json | null
          body_html: string | null
          body_text: string | null
          cc_emails: Json | null
          conversation_id: string
          created_at: string
          delivered_at: string | null
          direction: string
          from_email: string
          from_name: string | null
          id: string
          message_id: string
          opened_at: string | null
          sendgrid_message_id: string | null
          sendgrid_status: string | null
          sent_at: string
          subject: string
          to_email: string
          to_name: string | null
          was_ai_generated: boolean
        }
        Insert: {
          ai_confidence?: number | null
          ai_intent?: string | null
          attachments?: Json | null
          bcc_emails?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json | null
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          direction: string
          from_email: string
          from_name?: string | null
          id?: string
          message_id: string
          opened_at?: string | null
          sendgrid_message_id?: string | null
          sendgrid_status?: string | null
          sent_at?: string
          subject: string
          to_email: string
          to_name?: string | null
          was_ai_generated?: boolean
        }
        Update: {
          ai_confidence?: number | null
          ai_intent?: string | null
          attachments?: Json | null
          bcc_emails?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_emails?: Json | null
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          direction?: string
          from_email?: string
          from_name?: string | null
          id?: string
          message_id?: string
          opened_at?: string | null
          sendgrid_message_id?: string | null
          sendgrid_status?: string | null
          sent_at?: string
          subject?: string
          to_email?: string
          to_name?: string | null
          was_ai_generated?: boolean
        }
        Relationships: []
      }
      email_template_translations: {
        Row: {
          body_html: string
          body_text: string | null
          created_at: string
          id: string
          language_code: string
          subject: string
          template_name: string
          updated_at: string
        }
        Insert: {
          body_html: string
          body_text?: string | null
          created_at?: string
          id?: string
          language_code: string
          subject: string
          template_name: string
          updated_at?: string
        }
        Update: {
          body_html?: string
          body_text?: string | null
          created_at?: string
          id?: string
          language_code?: string
          subject?: string
          template_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_template_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      email_templates: {
        Row: {
          body_html_template: string | null
          body_text_template: string
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          required_variables: Json | null
          sendgrid_template_id: string | null
          subject_template: string
          template_key: string
          updated_at: string
        }
        Insert: {
          body_html_template?: string | null
          body_text_template: string
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          required_variables?: Json | null
          sendgrid_template_id?: string | null
          subject_template: string
          template_key: string
          updated_at?: string
        }
        Update: {
          body_html_template?: string | null
          body_text_template?: string
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          required_variables?: Json | null
          sendgrid_template_id?: string | null
          subject_template?: string
          template_key?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_triage_results: {
        Row: {
          account_email: string
          action: string
          applied_at: string | null
          auto_applied: boolean | null
          category: string
          created_at: string | null
          founder_id: string
          from_email: string | null
          id: string
          linear_issue_id: string | null
          priority: number | null
          reason: string | null
          subject: string | null
          thread_id: string
        }
        Insert: {
          account_email: string
          action: string
          applied_at?: string | null
          auto_applied?: boolean | null
          category: string
          created_at?: string | null
          founder_id: string
          from_email?: string | null
          id?: string
          linear_issue_id?: string | null
          priority?: number | null
          reason?: string | null
          subject?: string | null
          thread_id: string
        }
        Update: {
          account_email?: string
          action?: string
          applied_at?: string | null
          auto_applied?: boolean | null
          category?: string
          created_at?: string | null
          founder_id?: string
          from_email?: string | null
          id?: string
          linear_issue_id?: string | null
          priority?: number | null
          reason?: string | null
          subject?: string | null
          thread_id?: string
        }
        Relationships: []
      }
      email_webhook_logs: {
        Row: {
          created_at: string
          email_message_id: string | null
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed: boolean
          sendgrid_message_id: string | null
        }
        Insert: {
          created_at?: string
          email_message_id?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          sendgrid_message_id?: string | null
        }
        Update: {
          created_at?: string
          email_message_id?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          sendgrid_message_id?: string | null
        }
        Relationships: []
      }
      equipment: {
        Row: {
          created_at: string
          current_hours: number
          customer_id: string
          id: string
          interval_hours: number | null
          interval_months: number | null
          last_service_date: string | null
          last_service_hours: number | null
          location: string
          make: string
          model: string
          next_service_date: string | null
          next_service_hours: number | null
          notes: string | null
          product_id: string | null
          purchase_date: string | null
          reminder_lead_days: number
          serial_number: string
          status: Database["public"]["Enums"]["equipment_status"]
          updated_at: string
          warranty_expiry: string | null
          year: number | null
        }
        Insert: {
          created_at?: string
          current_hours?: number
          customer_id: string
          id?: string
          interval_hours?: number | null
          interval_months?: number | null
          last_service_date?: string | null
          last_service_hours?: number | null
          location: string
          make: string
          model: string
          next_service_date?: string | null
          next_service_hours?: number | null
          notes?: string | null
          product_id?: string | null
          purchase_date?: string | null
          reminder_lead_days?: number
          serial_number: string
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          warranty_expiry?: string | null
          year?: number | null
        }
        Update: {
          created_at?: string
          current_hours?: number
          customer_id?: string
          id?: string
          interval_hours?: number | null
          interval_months?: number | null
          last_service_date?: string | null
          last_service_hours?: number | null
          location?: string
          make?: string
          model?: string
          next_service_date?: string | null
          next_service_hours?: number | null
          notes?: string | null
          product_id?: string | null
          purchase_date?: string | null
          reminder_lead_days?: number
          serial_number?: string
          status?: Database["public"]["Enums"]["equipment_status"]
          updated_at?: string
          warranty_expiry?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_service_history: {
        Row: {
          booking_id: string | null
          created_at: string
          equipment_id: string
          hours_at_service: number | null
          id: string
          next_service_date: string | null
          next_service_hours: number | null
          notes: string | null
          parts_used: Json | null
          service_date: string
          service_type: string
          technician: string | null
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          equipment_id: string
          hours_at_service?: number | null
          id?: string
          next_service_date?: string | null
          next_service_hours?: number | null
          notes?: string | null
          parts_used?: Json | null
          service_date: string
          service_type: string
          technician?: string | null
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          equipment_id?: string
          hours_at_service?: number | null
          id?: string
          next_service_date?: string | null
          next_service_hours?: number | null
          notes?: string | null
          parts_used?: Json | null
          service_date?: string
          service_type?: string
          technician?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_service_history_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "workshop_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_service_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_results: {
        Row: {
          clicks: number
          comments: number
          conversion_value_cents: number
          conversions: number
          created_at: string
          experiment_id: string
          founder_id: string
          id: string
          impressions: number
          likes: number
          period_date: string
          platform_data: Json
          reach: number
          saves: number
          shares: number
          source: string
          variant_id: string
        }
        Insert: {
          clicks?: number
          comments?: number
          conversion_value_cents?: number
          conversions?: number
          created_at?: string
          experiment_id: string
          founder_id: string
          id?: string
          impressions?: number
          likes?: number
          period_date: string
          platform_data?: Json
          reach?: number
          saves?: number
          shares?: number
          source?: string
          variant_id: string
        }
        Update: {
          clicks?: number
          comments?: number
          conversion_value_cents?: number
          conversions?: number
          created_at?: string
          experiment_id?: string
          founder_id?: string
          id?: string
          impressions?: number
          likes?: number
          period_date?: string
          platform_data?: Json
          reach?: number
          saves?: number
          shares?: number
          source?: string
          variant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experiment_results_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiment_results_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      experiment_variants: {
        Row: {
          content: string | null
          created_at: string
          cta_text: string | null
          description: string | null
          experiment_id: string
          founder_id: string
          id: string
          is_control: boolean
          label: string
          media_urls: Json
          platforms: Json
          scheduled_time: string | null
          updated_at: string
          variant_key: string
          weight: number
        }
        Insert: {
          content?: string | null
          created_at?: string
          cta_text?: string | null
          description?: string | null
          experiment_id: string
          founder_id: string
          id?: string
          is_control?: boolean
          label: string
          media_urls?: Json
          platforms?: Json
          scheduled_time?: string | null
          updated_at?: string
          variant_key: string
          weight?: number
        }
        Update: {
          content?: string | null
          created_at?: string
          cta_text?: string | null
          description?: string | null
          experiment_id?: string
          founder_id?: string
          id?: string
          is_control?: boolean
          label?: string
          media_urls?: Json
          platforms?: Json
          scheduled_time?: string | null
          updated_at?: string
          variant_key?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "experiment_variants_experiment_id_fkey"
            columns: ["experiment_id"]
            isOneToOne: false
            referencedRelation: "experiments"
            referencedColumns: ["id"]
          },
        ]
      }
      experiments: {
        Row: {
          ai_rationale: string | null
          approval_queue_id: string | null
          business_key: string
          conclusion: string | null
          confidence_level: number
          created_at: string
          ended_at: string | null
          experiment_type: string
          founder_id: string
          generated_by: string | null
          hypothesis: string
          id: string
          metric_primary: string
          metric_secondary: string | null
          sample_size_target: number | null
          started_at: string | null
          status: string
          title: string
          updated_at: string
          winner_variant_id: string | null
        }
        Insert: {
          ai_rationale?: string | null
          approval_queue_id?: string | null
          business_key: string
          conclusion?: string | null
          confidence_level?: number
          created_at?: string
          ended_at?: string | null
          experiment_type: string
          founder_id: string
          generated_by?: string | null
          hypothesis: string
          id?: string
          metric_primary?: string
          metric_secondary?: string | null
          sample_size_target?: number | null
          started_at?: string | null
          status?: string
          title: string
          updated_at?: string
          winner_variant_id?: string | null
        }
        Update: {
          ai_rationale?: string | null
          approval_queue_id?: string | null
          business_key?: string
          conclusion?: string | null
          confidence_level?: number
          created_at?: string
          ended_at?: string | null
          experiment_type?: string
          founder_id?: string
          generated_by?: string | null
          hypothesis?: string
          id?: string
          metric_primary?: string
          metric_secondary?: string | null
          sample_size_target?: number | null
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          winner_variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiments_approval_queue_id_fkey"
            columns: ["approval_queue_id"]
            isOneToOne: false
            referencedRelation: "approval_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_winner_variant"
            columns: ["winner_variant_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      food_diary_entries: {
        Row: {
          b12_mcg: number | null
          calcium_mg: number | null
          calories: number | null
          carbs_g: number | null
          contains_triggers: boolean | null
          created_at: string
          custom_food_name: string | null
          entry_date: string
          fat_g: number | null
          fiber_g: number | null
          id: string
          magnesium_mg: number | null
          meal_slot: string
          notes: string | null
          omega3_g: number | null
          protein_g: number | null
          recipe_id: string | null
          servings_consumed: number | null
          trigger_notes: string | null
          updated_at: string
          user_id: string
          vitamin_d_iu: number | null
        }
        Insert: {
          b12_mcg?: number | null
          calcium_mg?: number | null
          calories?: number | null
          carbs_g?: number | null
          contains_triggers?: boolean | null
          created_at?: string
          custom_food_name?: string | null
          entry_date: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          magnesium_mg?: number | null
          meal_slot: string
          notes?: string | null
          omega3_g?: number | null
          protein_g?: number | null
          recipe_id?: string | null
          servings_consumed?: number | null
          trigger_notes?: string | null
          updated_at?: string
          user_id: string
          vitamin_d_iu?: number | null
        }
        Update: {
          b12_mcg?: number | null
          calcium_mg?: number | null
          calories?: number | null
          carbs_g?: number | null
          contains_triggers?: boolean | null
          created_at?: string
          custom_food_name?: string | null
          entry_date?: string
          fat_g?: number | null
          fiber_g?: number | null
          id?: string
          magnesium_mg?: number | null
          meal_slot?: string
          notes?: string | null
          omega3_g?: number | null
          protein_g?: number | null
          recipe_id?: string | null
          servings_consumed?: number | null
          trigger_notes?: string | null
          updated_at?: string
          user_id?: string
          vitamin_d_iu?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "food_diary_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      friction_analyses: {
        Row: {
          created_at: string | null
          critical_count: number
          friction_points: Json | null
          friction_score: number
          high_count: number
          id: string
          journey_id: string | null
          low_count: number
          medium_count: number
          recommendations: Json | null
          source: string
          total_friction_points: number
        }
        Insert: {
          created_at?: string | null
          critical_count?: number
          friction_points?: Json | null
          friction_score: number
          high_count?: number
          id?: string
          journey_id?: string | null
          low_count?: number
          medium_count?: number
          recommendations?: Json | null
          source: string
          total_friction_points?: number
        }
        Update: {
          created_at?: string | null
          critical_count?: number
          friction_points?: Json | null
          friction_score?: number
          high_count?: number
          id?: string
          journey_id?: string | null
          low_count?: number
          medium_count?: number
          recommendations?: Json | null
          source?: string
          total_friction_points?: number
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          ai_model: string | null
          body: string
          business_key: string
          character_used: string | null
          content_type: string
          created_at: string
          cta: string | null
          founder_id: string
          generation_source: string
          hashtags: string[]
          id: string
          input_tokens: number | null
          media_prompt: string | null
          media_urls: Json
          metadata: Json
          output_tokens: number | null
          platform: string | null
          social_post_id: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          ai_model?: string | null
          body: string
          business_key: string
          character_used?: string | null
          content_type: string
          created_at?: string
          cta?: string | null
          founder_id: string
          generation_source: string
          hashtags?: string[]
          id?: string
          input_tokens?: number | null
          media_prompt?: string | null
          media_urls?: Json
          metadata?: Json
          output_tokens?: number | null
          platform?: string | null
          social_post_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          ai_model?: string | null
          body?: string
          business_key?: string
          character_used?: string | null
          content_type?: string
          created_at?: string
          cta?: string | null
          founder_id?: string
          generation_source?: string
          hashtags?: string[]
          id?: string
          input_tokens?: number | null
          media_prompt?: string | null
          media_urls?: Json
          metadata?: Json
          output_tokens?: number | null
          platform?: string | null
          social_post_id?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      in_app_notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          is_read: boolean
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message: string
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          is_read?: boolean
          message?: string
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      inbound_shipments: {
        Row: {
          actual_delivery_date: string | null
          carrier_name: string | null
          carrier_service: string | null
          created_at: string
          destination_location: string
          expected_delivery_date: string | null
          id: string
          last_tracking_update: string | null
          notes: string | null
          origin_address: string | null
          purchase_order_id: string | null
          shipment_number: string
          shipped_date: string | null
          status: string
          supplier_id: string
          tracking_events: Json | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          carrier_name?: string | null
          carrier_service?: string | null
          created_at?: string
          destination_location: string
          expected_delivery_date?: string | null
          id?: string
          last_tracking_update?: string | null
          notes?: string | null
          origin_address?: string | null
          purchase_order_id?: string | null
          shipment_number: string
          shipped_date?: string | null
          status?: string
          supplier_id: string
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          carrier_name?: string | null
          carrier_service?: string | null
          created_at?: string
          destination_location?: string
          expected_delivery_date?: string | null
          id?: string
          last_tracking_update?: string | null
          notes?: string | null
          origin_address?: string | null
          purchase_order_id?: string | null
          shipment_number?: string
          shipped_date?: string | null
          status?: string
          supplier_id?: string
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inbound_shipments_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_shipments_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      industry_events: {
        Row: {
          created_at: string
          end_date: string | null
          event_type: string
          event_url: string | null
          id: string
          image_url: string | null
          industry_categories: string[]
          is_free: boolean
          is_virtual: boolean
          lat: number | null
          lng: number | null
          location_address: string | null
          location_name: string | null
          organiser_name: string | null
          organiser_url: string | null
          price_range: string | null
          published: boolean
          schema_event_status: string | null
          source: string
          source_id: string | null
          start_date: string
          ticket_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          event_type?: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          industry_categories?: string[]
          is_free?: boolean
          is_virtual?: boolean
          lat?: number | null
          lng?: number | null
          location_address?: string | null
          location_name?: string | null
          organiser_name?: string | null
          organiser_url?: string | null
          price_range?: string | null
          published?: boolean
          schema_event_status?: string | null
          source?: string
          source_id?: string | null
          start_date: string
          ticket_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          event_type?: string
          event_url?: string | null
          id?: string
          image_url?: string | null
          industry_categories?: string[]
          is_free?: boolean
          is_virtual?: boolean
          lat?: number | null
          lng?: number | null
          location_address?: string | null
          location_name?: string | null
          organiser_name?: string | null
          organiser_url?: string | null
          price_range?: string | null
          published?: boolean
          schema_event_status?: string | null
          source?: string
          source_id?: string | null
          start_date?: string
          ticket_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      job_listings: {
        Row: {
          apply_email: string | null
          apply_url: string | null
          company_logo_url: string | null
          company_name: string
          company_website: string | null
          created_at: string
          description: string
          employment_type: string
          id: string
          industry_categories: string[]
          is_featured: boolean
          is_remote: boolean
          location_city: string | null
          location_postcode: string | null
          location_state: string | null
          published: boolean
          salary_max: number | null
          salary_min: number | null
          source: string
          source_id: string | null
          submitter_email: string | null
          submitter_name: string | null
          submitter_phone: string | null
          title: string
          updated_at: string
          valid_through: string
        }
        Insert: {
          apply_email?: string | null
          apply_url?: string | null
          company_logo_url?: string | null
          company_name: string
          company_website?: string | null
          created_at?: string
          description: string
          employment_type?: string
          id?: string
          industry_categories?: string[]
          is_featured?: boolean
          is_remote?: boolean
          location_city?: string | null
          location_postcode?: string | null
          location_state?: string | null
          published?: boolean
          salary_max?: number | null
          salary_min?: number | null
          source?: string
          source_id?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          title: string
          updated_at?: string
          valid_through?: string
        }
        Update: {
          apply_email?: string | null
          apply_url?: string | null
          company_logo_url?: string | null
          company_name?: string
          company_website?: string | null
          created_at?: string
          description?: string
          employment_type?: string
          id?: string
          industry_categories?: string[]
          is_featured?: boolean
          is_remote?: boolean
          location_city?: string | null
          location_postcode?: string | null
          location_state?: string | null
          published?: boolean
          salary_max?: number | null
          salary_min?: number | null
          source?: string
          source_id?: string | null
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_phone?: string | null
          title?: string
          updated_at?: string
          valid_through?: string
        }
        Relationships: []
      }
      keyword_gap_analysis: {
        Row: {
          analyzed_at: string | null
          client_domain: string
          client_unique_keywords: number | null
          competitor_unique_keywords: number | null
          created_at: string | null
          id: string
          missing_keywords: Json | null
          opportunity_keywords: Json | null
          quick_wins: Json | null
          shared_keywords: number | null
          strategic_targets: Json | null
          strong_keywords: Json | null
          total_client_keywords: number | null
          total_competitor_keywords: number | null
          weak_keywords: Json | null
          workspace_id: string
        }
        Insert: {
          analyzed_at?: string | null
          client_domain: string
          client_unique_keywords?: number | null
          competitor_unique_keywords?: number | null
          created_at?: string | null
          id?: string
          missing_keywords?: Json | null
          opportunity_keywords?: Json | null
          quick_wins?: Json | null
          shared_keywords?: number | null
          strategic_targets?: Json | null
          strong_keywords?: Json | null
          total_client_keywords?: number | null
          total_competitor_keywords?: number | null
          weak_keywords?: Json | null
          workspace_id: string
        }
        Update: {
          analyzed_at?: string | null
          client_domain?: string
          client_unique_keywords?: number | null
          competitor_unique_keywords?: number | null
          created_at?: string | null
          id?: string
          missing_keywords?: Json | null
          opportunity_keywords?: Json | null
          quick_wins?: Json | null
          shared_keywords?: number | null
          strategic_targets?: Json | null
          strong_keywords?: Json | null
          total_client_keywords?: number | null
          total_competitor_keywords?: number | null
          weak_keywords?: Json | null
          workspace_id?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string
          id: string
          is_active: boolean
          is_rtl: boolean
          name: string
          native_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_rtl?: boolean
          name: string
          native_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_rtl?: boolean
          name?: string
          native_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      learning_insights: {
        Row: {
          agent_id: string
          created_at: string
          description: string
          expected_improvement: number
          id: string
          implemented_at: string | null
          insight_id: string
          insight_type: Database["public"]["Enums"]["insight_type_enum"]
          is_implemented: boolean
          priority: Database["public"]["Enums"]["insight_priority_enum"]
          recommended_action: string
          supporting_patterns: Json
          title: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          description: string
          expected_improvement: number
          id?: string
          implemented_at?: string | null
          insight_id: string
          insight_type: Database["public"]["Enums"]["insight_type_enum"]
          is_implemented?: boolean
          priority: Database["public"]["Enums"]["insight_priority_enum"]
          recommended_action: string
          supporting_patterns?: Json
          title: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          description?: string
          expected_improvement?: number
          id?: string
          implemented_at?: string | null
          insight_id?: string
          insight_type?: Database["public"]["Enums"]["insight_type_enum"]
          is_implemented?: boolean
          priority?: Database["public"]["Enums"]["insight_priority_enum"]
          recommended_action?: string
          supporting_patterns?: Json
          title?: string
        }
        Relationships: []
      }
      learning_patterns: {
        Row: {
          actions: Json
          agent_id: string
          avg_duration_ms: number
          conditions: Json
          confidence: number
          created_at: string
          first_observed: string
          id: string
          last_observed: string
          observed_count: number
          outcomes: Json
          pattern_id: string
          pattern_metadata: Json
          pattern_type: Database["public"]["Enums"]["pattern_type_enum"]
          success_rate: number
          task_category: string
          updated_at: string
        }
        Insert: {
          actions?: Json
          agent_id: string
          avg_duration_ms: number
          conditions?: Json
          confidence: number
          created_at?: string
          first_observed: string
          id?: string
          last_observed: string
          observed_count?: number
          outcomes?: Json
          pattern_id: string
          pattern_metadata?: Json
          pattern_type: Database["public"]["Enums"]["pattern_type_enum"]
          success_rate: number
          task_category: string
          updated_at?: string
        }
        Update: {
          actions?: Json
          agent_id?: string
          avg_duration_ms?: number
          conditions?: Json
          confidence?: number
          created_at?: string
          first_observed?: string
          id?: string
          last_observed?: string
          observed_count?: number
          outcomes?: Json
          pattern_id?: string
          pattern_metadata?: Json
          pattern_type?: Database["public"]["Enums"]["pattern_type_enum"]
          success_rate?: number
          task_category?: string
          updated_at?: string
        }
        Relationships: []
      }
      locations: {
        Row: {
          address: string | null
          city: string | null
          code: string
          country: string
          created_at: string
          id: string
          is_active: boolean
          location_type: string
          name: string
          postal_code: string | null
          state: string | null
          timezone: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          code: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_type: string
          name: string
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          code?: string
          country?: string
          created_at?: string
          id?: string
          is_active?: boolean
          location_type?: string
          name?: string
          postal_code?: string | null
          state?: string | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_connections: {
        Row: {
          channel_metadata: Json | null
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          created_at: string
          credentials: Json | null
          display_name: string
          id: string
          is_active: boolean
          last_inventory_sync: string | null
          last_order_sync: string | null
          last_product_sync: string | null
          last_sync_error: string | null
          mode: string
          status: Database["public"]["Enums"]["marketplace_connection_status"]
          sync_settings: Json | null
          updated_at: string
        }
        Insert: {
          channel_metadata?: Json | null
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          created_at?: string
          credentials?: Json | null
          display_name: string
          id?: string
          is_active?: boolean
          last_inventory_sync?: string | null
          last_order_sync?: string | null
          last_product_sync?: string | null
          last_sync_error?: string | null
          mode?: string
          status?: Database["public"]["Enums"]["marketplace_connection_status"]
          sync_settings?: Json | null
          updated_at?: string
        }
        Update: {
          channel_metadata?: Json | null
          channel_type?: Database["public"]["Enums"]["marketplace_channel_type"]
          created_at?: string
          credentials?: Json | null
          display_name?: string
          id?: string
          is_active?: boolean
          last_inventory_sync?: string | null
          last_order_sync?: string | null
          last_product_sync?: string | null
          last_sync_error?: string | null
          mode?: string
          status?: Database["public"]["Enums"]["marketplace_connection_status"]
          sync_settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_inventory_syncs: {
        Row: {
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id: string
          created_at: string
          id: string
          local_quantity: number
          product_id: string
          quantity_delta: number
          remote_quantity: number
          sync_direction: string
          sync_error: string | null
          sync_status: Database["public"]["Enums"]["marketplace_sync_status"]
          synced_at: string
          updated_at: string
        }
        Insert: {
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id: string
          created_at?: string
          id?: string
          local_quantity?: number
          product_id: string
          quantity_delta?: number
          remote_quantity?: number
          sync_direction?: string
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["marketplace_sync_status"]
          synced_at?: string
          updated_at?: string
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id?: string
          created_at?: string
          id?: string
          local_quantity?: number
          product_id?: string
          quantity_delta?: number
          remote_quantity?: number
          sync_direction?: string
          sync_error?: string | null
          sync_status?: Database["public"]["Enums"]["marketplace_sync_status"]
          synced_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_orders: {
        Row: {
          channel_data: Json | null
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id: string
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          erp_order_id: string | null
          external_order_id: string
          external_order_number: string | null
          id: string
          line_items: Json | null
          ordered_at: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["marketplace_order_status"]
          sync_error: string | null
          sync_status: string
          synced_at: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          channel_data?: Json | null
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          erp_order_id?: string | null
          external_order_id: string
          external_order_number?: string | null
          id?: string
          line_items?: Json | null
          ordered_at?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["marketplace_order_status"]
          sync_error?: string | null
          sync_status?: string
          synced_at?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          channel_data?: Json | null
          channel_type?: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id?: string
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          erp_order_id?: string | null
          external_order_id?: string
          external_order_number?: string | null
          id?: string
          line_items?: Json | null
          ordered_at?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["marketplace_order_status"]
          sync_error?: string | null
          sync_status?: string
          synced_at?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_product_listings: {
        Row: {
          channel_data: Json | null
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id: string
          created_at: string
          external_product_id: string | null
          external_url: string | null
          external_variant_id: string | null
          id: string
          last_synced_at: string | null
          listed_currency: string
          listed_price: number | null
          listed_quantity: number
          listed_title: string | null
          product_id: string
          status: Database["public"]["Enums"]["marketplace_listing_status"]
          sync_error: string | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          channel_data?: Json | null
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id: string
          created_at?: string
          external_product_id?: string | null
          external_url?: string | null
          external_variant_id?: string | null
          id?: string
          last_synced_at?: string | null
          listed_currency?: string
          listed_price?: number | null
          listed_quantity?: number
          listed_title?: string | null
          product_id: string
          status?: Database["public"]["Enums"]["marketplace_listing_status"]
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          channel_data?: Json | null
          channel_type?: Database["public"]["Enums"]["marketplace_channel_type"]
          connection_id?: string
          created_at?: string
          external_product_id?: string | null
          external_url?: string | null
          external_variant_id?: string | null
          id?: string
          last_synced_at?: string | null
          listed_currency?: string
          listed_price?: number | null
          listed_quantity?: number
          listed_title?: string | null
          product_id?: string
          status?: Database["public"]["Enums"]["marketplace_listing_status"]
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_sync_logs: {
        Row: {
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          completed_at: string | null
          connection_id: string | null
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          error_message: string | null
          id: string
          items_failed: number
          items_processed: number
          items_succeeded: number
          operation: string
          started_at: string
          status: Database["public"]["Enums"]["marketplace_sync_status"]
          updated_at: string
        }
        Insert: {
          channel_type: Database["public"]["Enums"]["marketplace_channel_type"]
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          items_failed?: number
          items_processed?: number
          items_succeeded?: number
          operation: string
          started_at?: string
          status?: Database["public"]["Enums"]["marketplace_sync_status"]
          updated_at?: string
        }
        Update: {
          channel_type?: Database["public"]["Enums"]["marketplace_channel_type"]
          completed_at?: string | null
          connection_id?: string | null
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          error_message?: string | null
          id?: string
          items_failed?: number
          items_processed?: number
          items_succeeded?: number
          operation?: string
          started_at?: string
          status?: Database["public"]["Enums"]["marketplace_sync_status"]
          updated_at?: string
        }
        Relationships: []
      }
      meal_plan_entries: {
        Row: {
          created_at: string
          custom_entry_name: string | null
          day_of_week: number
          id: string
          meal_plan_id: string
          meal_slot: string
          notes: string | null
          recipe_id: string | null
          servings: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_entry_name?: string | null
          day_of_week: number
          id?: string
          meal_plan_id: string
          meal_slot: string
          notes?: string | null
          recipe_id?: string | null
          servings?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_entry_name?: string | null
          day_of_week?: number
          id?: string
          meal_plan_id?: string
          meal_slot?: string
          notes?: string | null
          recipe_id?: string | null
          servings?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_plan_entries_meal_plan_id_fkey"
            columns: ["meal_plan_id"]
            isOneToOne: false
            referencedRelation: "meal_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_plan_entries_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_plans: {
        Row: {
          avg_daily_calories: number | null
          avg_daily_protein_g: number | null
          created_at: string
          id: string
          name: string | null
          notes: string | null
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          avg_daily_calories?: number | null
          avg_daily_protein_g?: number | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          avg_daily_calories?: number | null
          avg_daily_protein_g?: number | null
          created_at?: string
          id?: string
          name?: string | null
          notes?: string | null
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
      news_articles: {
        Row: {
          ai_summary: string | null
          ai_tags: string[]
          ai_title: string | null
          author: string | null
          created_at: string
          guid: string
          id: string
          image_url: string | null
          industry_categories: string[]
          is_featured: boolean
          original_title: string
          published: boolean
          published_at: string | null
          relevance_score: number | null
          source_id: string
          source_url: string | null
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          ai_tags?: string[]
          ai_title?: string | null
          author?: string | null
          created_at?: string
          guid: string
          id?: string
          image_url?: string | null
          industry_categories?: string[]
          is_featured?: boolean
          original_title: string
          published?: boolean
          published_at?: string | null
          relevance_score?: number | null
          source_id: string
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          ai_tags?: string[]
          ai_title?: string | null
          author?: string | null
          created_at?: string
          guid?: string
          id?: string
          image_url?: string | null
          industry_categories?: string[]
          is_featured?: boolean
          original_title?: string
          published?: boolean
          published_at?: string | null
          relevance_score?: number | null
          source_id?: string
          source_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_articles_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "news_feed_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      news_feed_sources: {
        Row: {
          created_at: string
          fetch_interval_minutes: number
          id: string
          industry_categories: string[]
          is_active: boolean
          last_fetched_at: string | null
          name: string
          rss_url: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fetch_interval_minutes?: number
          id?: string
          industry_categories?: string[]
          is_active?: boolean
          last_fetched_at?: string | null
          name: string
          rss_url: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fetch_interval_minutes?: number
          id?: string
          industry_categories?: string[]
          is_active?: boolean
          last_fetched_at?: string | null
          name?: string
          rss_url?: string
          updated_at?: string
        }
        Relationships: []
      }
      nexus_databases: {
        Row: {
          business_id: string | null
          created_at: string
          founder_id: string
          id: string
          name: string
          page_id: string | null
          schema: Json
          updated_at: string
          view_type: string
        }
        Insert: {
          business_id?: string | null
          created_at?: string
          founder_id: string
          id?: string
          name: string
          page_id?: string | null
          schema?: Json
          updated_at?: string
          view_type?: string
        }
        Update: {
          business_id?: string | null
          created_at?: string
          founder_id?: string
          id?: string
          name?: string
          page_id?: string | null
          schema?: Json
          updated_at?: string
          view_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_databases_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "nexus_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_pages: {
        Row: {
          business_id: string | null
          content: Json
          cover_url: string | null
          created_at: string
          founder_id: string
          icon: string | null
          id: string
          is_published: boolean
          parent_id: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          business_id?: string | null
          content?: Json
          cover_url?: string | null
          created_at?: string
          founder_id: string
          icon?: string | null
          id?: string
          is_published?: boolean
          parent_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Update: {
          business_id?: string | null
          content?: Json
          cover_url?: string | null
          created_at?: string
          founder_id?: string
          icon?: string | null
          id?: string
          is_published?: boolean
          parent_id?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_pages_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "nexus_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      nexus_rows: {
        Row: {
          created_at: string
          database_id: string
          founder_id: string
          id: string
          properties: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          database_id: string
          founder_id: string
          id?: string
          properties?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          database_id?: string
          founder_id?: string
          id?: string
          properties?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nexus_rows_database_id_fkey"
            columns: ["database_id"]
            isOneToOne: false
            referencedRelation: "nexus_databases"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sequences: {
        Row: {
          cancelled_at: string | null
          completed_at: string | null
          created_at: string
          customer_id: string
          id: string
          status: string
          triggered_at: string
        }
        Insert: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id: string
          id?: string
          status?: string
          triggered_at?: string
        }
        Update: {
          cancelled_at?: string | null
          completed_at?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          status?: string
          triggered_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_sequences_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_touchpoints: {
        Row: {
          created_at: string
          day: string
          email_subject: string | null
          error_message: string | null
          id: string
          scheduled_at: string
          sent_at: string | null
          sequence_id: string
          status: string
        }
        Insert: {
          created_at?: string
          day: string
          email_subject?: string | null
          error_message?: string | null
          id?: string
          scheduled_at: string
          sent_at?: string | null
          sequence_id: string
          status?: string
        }
        Update: {
          created_at?: string
          day?: string
          email_subject?: string | null
          error_message?: string | null
          id?: string
          scheduled_at?: string
          sent_at?: string | null
          sequence_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_touchpoints_sequence_id_fkey"
            columns: ["sequence_id"]
            isOneToOne: false
            referencedRelation: "onboarding_sequences"
            referencedColumns: ["id"]
          },
        ]
      }
      order_activity: {
        Row: {
          created_at: string
          created_by: string | null
          event_type: string
          id: string
          message: string
          meta_data: Json | null
          order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          event_type: string
          id?: string
          message: string
          meta_data?: Json | null
          order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          event_type?: string
          id?: string
          message?: string
          meta_data?: Json | null
          order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_activity_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          order_id: string
          product_id: string
          quantity?: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          carrier_name: string | null
          created_at: string
          customer_id: string
          estimated_delivery_date: string | null
          fulfillment_location: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          organization_id: string | null
          shipped_date: string | null
          status: string
          total: number
          tracking_number: string | null
          updated_at: string
          xero_invoice_id: string | null
          xero_sync_status: string | null
          xero_synced_at: string | null
        }
        Insert: {
          carrier_name?: string | null
          created_at?: string
          customer_id: string
          estimated_delivery_date?: string | null
          fulfillment_location?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number: string
          organization_id?: string | null
          shipped_date?: string | null
          status?: string
          total?: number
          tracking_number?: string | null
          updated_at?: string
          xero_invoice_id?: string | null
          xero_sync_status?: string | null
          xero_synced_at?: string | null
        }
        Update: {
          carrier_name?: string | null
          created_at?: string
          customer_id?: string
          estimated_delivery_date?: string | null
          fulfillment_location?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          organization_id?: string | null
          shipped_date?: string | null
          status?: string
          total?: number
          tracking_number?: string | null
          updated_at?: string
          xero_invoice_id?: string | null
          xero_sync_status?: string | null
          xero_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      outbound_shipments: {
        Row: {
          actual_delivery_date: string | null
          carrier_name: string | null
          carrier_service: string | null
          created_at: string
          destination_address: string | null
          expected_delivery_date: string | null
          id: string
          last_tracking_update: string | null
          notes: string | null
          order_id: string
          origin_location: string
          shipment_number: string
          shipped_date: string | null
          status: string
          tracking_events: Json | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          carrier_name?: string | null
          carrier_service?: string | null
          created_at?: string
          destination_address?: string | null
          expected_delivery_date?: string | null
          id?: string
          last_tracking_update?: string | null
          notes?: string | null
          order_id: string
          origin_location: string
          shipment_number: string
          shipped_date?: string | null
          status?: string
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          carrier_name?: string | null
          carrier_service?: string | null
          created_at?: string
          destination_address?: string | null
          expected_delivery_date?: string | null
          id?: string
          last_tracking_update?: string | null
          notes?: string | null
          order_id?: string
          origin_location?: string
          shipment_number?: string
          shipped_date?: string | null
          status?: string
          tracking_events?: Json | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "outbound_shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          order_id: string
          payment_date: string
          payment_method: string
          reference: string | null
          xero_payment_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          order_id: string
          payment_date: string
          payment_method?: string
          reference?: string | null
          xero_payment_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          order_id?: string
          payment_date?: string
          payment_method?: string
          reference?: string | null
          xero_payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_analytics: {
        Row: {
          business_key: string
          clicks: number | null
          comments: number | null
          created_at: string | null
          engagement_rate: number | null
          engagements: number | null
          follower_delta: number | null
          founder_id: string
          id: string
          impressions: number | null
          likes: number | null
          metadata: Json | null
          metric_date: string
          platform: string
          post_external_id: string
          reach: number | null
          saves: number | null
          shares: number | null
          social_post_id: string | null
          updated_at: string | null
          video_views: number | null
          video_watch_time_seconds: number | null
        }
        Insert: {
          business_key: string
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          engagements?: number | null
          follower_delta?: number | null
          founder_id: string
          id?: string
          impressions?: number | null
          likes?: number | null
          metadata?: Json | null
          metric_date: string
          platform: string
          post_external_id: string
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_post_id?: string | null
          updated_at?: string | null
          video_views?: number | null
          video_watch_time_seconds?: number | null
        }
        Update: {
          business_key?: string
          clicks?: number | null
          comments?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          engagements?: number | null
          follower_delta?: number | null
          founder_id?: string
          id?: string
          impressions?: number | null
          likes?: number | null
          metadata?: Json | null
          metric_date?: string
          platform?: string
          post_external_id?: string
          reach?: number | null
          saves?: number | null
          shares?: number | null
          social_post_id?: string | null
          updated_at?: string | null
          video_views?: number | null
          video_watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_analytics_social_post_id_fkey"
            columns: ["social_post_id"]
            isOneToOne: false
            referencedRelation: "social_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_listings: {
        Row: {
          address_matches: boolean | null
          business_id: string
          claimed: boolean | null
          consistency_score: number | null
          created_at: string | null
          current_address: string | null
          current_hours: Json | null
          current_name: string | null
          current_phone: string | null
          current_website: string | null
          hours_matches: boolean | null
          id: string
          issues: Json | null
          last_checked: string | null
          last_updated: string | null
          listing_url: string | null
          name_matches: boolean | null
          overall_consistent: boolean | null
          phone_matches: boolean | null
          platform_name: string
          platform_tier: number
          platform_url: string | null
          verified: boolean | null
          website_matches: boolean | null
        }
        Insert: {
          address_matches?: boolean | null
          business_id: string
          claimed?: boolean | null
          consistency_score?: number | null
          created_at?: string | null
          current_address?: string | null
          current_hours?: Json | null
          current_name?: string | null
          current_phone?: string | null
          current_website?: string | null
          hours_matches?: boolean | null
          id?: string
          issues?: Json | null
          last_checked?: string | null
          last_updated?: string | null
          listing_url?: string | null
          name_matches?: boolean | null
          overall_consistent?: boolean | null
          phone_matches?: boolean | null
          platform_name: string
          platform_tier: number
          platform_url?: string | null
          verified?: boolean | null
          website_matches?: boolean | null
        }
        Update: {
          address_matches?: boolean | null
          business_id?: string
          claimed?: boolean | null
          consistency_score?: number | null
          created_at?: string | null
          current_address?: string | null
          current_hours?: Json | null
          current_name?: string | null
          current_phone?: string | null
          current_website?: string | null
          hours_matches?: boolean | null
          id?: string
          issues?: Json | null
          last_checked?: string | null
          last_updated?: string | null
          listing_url?: string | null
          name_matches?: boolean | null
          overall_consistent?: boolean | null
          phone_matches?: boolean | null
          platform_name?: string
          platform_tier?: number
          platform_url?: string | null
          verified?: boolean | null
          website_matches?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_listings_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      pos_terminals: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          last_ping_at: string | null
          location_code: string
          merchant_id: string | null
          terminal_config: Json
          terminal_id: string
          terminal_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_ping_at?: string | null
          location_code: string
          merchant_id?: string | null
          terminal_config?: Json
          terminal_id: string
          terminal_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          last_ping_at?: string | null
          location_code?: string
          merchant_id?: string | null
          terminal_config?: Json
          terminal_id?: string
          terminal_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pos_terminals_location_code_fkey"
            columns: ["location_code"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["code"]
          },
        ]
      }
      pos_transactions: {
        Row: {
          amount: number
          bank_statement_ref: string | null
          cin7_transaction_id: string | null
          created_at: string
          currency: string
          id: string
          location_code: string
          order_id: string | null
          payment_gateway_ref: string | null
          payment_gateway_response: Json | null
          payment_method: string
          payment_status: string
          reconciled_at: string | null
          reconciled_by: string | null
          reconciliation_status: string
          resolved_location_code: string | null
          sales_staff_id: string | null
          terminal_id: string | null
          transaction_number: string
          transaction_type: string
          updated_at: string
          xero_invoice_id: string | null
        }
        Insert: {
          amount: number
          bank_statement_ref?: string | null
          cin7_transaction_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          location_code: string
          order_id?: string | null
          payment_gateway_ref?: string | null
          payment_gateway_response?: Json | null
          payment_method: string
          payment_status: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          resolved_location_code?: string | null
          sales_staff_id?: string | null
          terminal_id?: string | null
          transaction_number: string
          transaction_type: string
          updated_at?: string
          xero_invoice_id?: string | null
        }
        Update: {
          amount?: number
          bank_statement_ref?: string | null
          cin7_transaction_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          location_code?: string
          order_id?: string | null
          payment_gateway_ref?: string | null
          payment_gateway_response?: Json | null
          payment_method?: string
          payment_status?: string
          reconciled_at?: string | null
          reconciled_by?: string | null
          reconciliation_status?: string
          resolved_location_code?: string | null
          sales_staff_id?: string | null
          terminal_id?: string | null
          transaction_number?: string
          transaction_type?: string
          updated_at?: string
          xero_invoice_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pos_transactions_location_code_fkey"
            columns: ["location_code"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "pos_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_resolved_location_code_fkey"
            columns: ["resolved_location_code"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "pos_transactions_sales_staff_id_fkey"
            columns: ["sales_staff_id"]
            isOneToOne: false
            referencedRelation: "sales_staff"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pos_transactions_terminal_id_fkey"
            columns: ["terminal_id"]
            isOneToOne: false
            referencedRelation: "pos_terminals"
            referencedColumns: ["id"]
          },
        ]
      }
      prds: {
        Row: {
          completed_at: string | null
          context: Json | null
          created_at: string
          documents_generated: string[] | null
          error_message: string | null
          estimated_duration_weeks: number | null
          executive_summary: string | null
          feature_decomposition: Json | null
          id: string
          model_used: string | null
          organization_id: string | null
          prd_analysis: Json | null
          problem_statement: string | null
          requirements: string
          roadmap: Json | null
          status: string
          technical_spec: Json | null
          test_plan: Json | null
          total_api_endpoints: number | null
          total_sprints: number | null
          total_test_scenarios: number | null
          total_user_stories: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          documents_generated?: string[] | null
          error_message?: string | null
          estimated_duration_weeks?: number | null
          executive_summary?: string | null
          feature_decomposition?: Json | null
          id?: string
          model_used?: string | null
          organization_id?: string | null
          prd_analysis?: Json | null
          problem_statement?: string | null
          requirements: string
          roadmap?: Json | null
          status?: string
          technical_spec?: Json | null
          test_plan?: Json | null
          total_api_endpoints?: number | null
          total_sprints?: number | null
          total_test_scenarios?: number | null
          total_user_stories?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          documents_generated?: string[] | null
          error_message?: string | null
          estimated_duration_weeks?: number | null
          executive_summary?: string | null
          feature_decomposition?: Json | null
          id?: string
          model_used?: string | null
          organization_id?: string | null
          prd_analysis?: Json | null
          problem_statement?: string | null
          requirements?: string
          roadmap?: Json | null
          status?: string
          technical_spec?: Json | null
          test_plan?: Json | null
          total_api_endpoints?: number | null
          total_sprints?: number | null
          total_test_scenarios?: number | null
          total_user_stories?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prds_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          created_at: string
          id: string
          key: string
          product_id: string
          unit: string | null
          value: string
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          product_id: string
          unit?: string | null
          value: string
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          product_id?: string
          unit?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_barcodes: {
        Row: {
          barcode: string
          barcode_type: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          barcode: string
          barcode_type?: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          barcode?: string
          barcode_type?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_barcodes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_co_occurrences: {
        Row: {
          co_occurrence_count: number
          confidence: number | null
          created_at: string
          first_co_occurrence_at: string
          id: string
          last_co_occurrence_at: string | null
          lift: number | null
          product_a_id: string
          product_b_id: string
          updated_at: string
        }
        Insert: {
          co_occurrence_count?: number
          confidence?: number | null
          created_at?: string
          first_co_occurrence_at?: string
          id?: string
          last_co_occurrence_at?: string | null
          lift?: number | null
          product_a_id: string
          product_b_id: string
          updated_at?: string
        }
        Update: {
          co_occurrence_count?: number
          confidence?: number | null
          created_at?: string
          first_co_occurrence_at?: string
          id?: string
          last_co_occurrence_at?: string | null
          lift?: number | null
          product_a_id?: string
          product_b_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_co_occurrences_product_a_id_fkey"
            columns: ["product_a_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_co_occurrences_product_b_id_fkey"
            columns: ["product_b_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_embeddings: {
        Row: {
          created_at: string
          embedding: string
          generated_from: string | null
          generation_timestamp: string
          id: string
          language_code: string
          model_provider: string
          model_version: string
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          embedding: string
          generated_from?: string | null
          generation_timestamp?: string
          id?: string
          language_code: string
          model_provider?: string
          model_version?: string
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          embedding?: string
          generated_from?: string | null
          generation_timestamp?: string
          id?: string
          language_code?: string
          model_provider?: string
          model_version?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_embeddings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_recommendations: {
        Row: {
          algorithm_version: string | null
          created_at: string
          generated_at: string
          id: string
          rank: number
          reason: string | null
          recommendation_type: string
          recommended_product_id: string
          score: number
          source_product_id: string
          updated_at: string
        }
        Insert: {
          algorithm_version?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          rank: number
          reason?: string | null
          recommendation_type: string
          recommended_product_id: string
          score: number
          source_product_id: string
          updated_at?: string
        }
        Update: {
          algorithm_version?: string | null
          created_at?: string
          generated_at?: string
          id?: string
          rank?: number
          reason?: string | null
          recommendation_type?: string
          recommended_product_id?: string
          score?: number
          source_product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_recommendations_recommended_product_id_fkey"
            columns: ["recommended_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_recommendations_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_stock_by_location: {
        Row: {
          created_at: string
          id: string
          last_counted_at: string | null
          last_counted_by: string | null
          location: string
          product_id: string
          reorder_point: number | null
          reorder_quantity: number | null
          reserved: number
          stock: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          location: string
          product_id: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_counted_at?: string | null
          last_counted_by?: string | null
          location?: string
          product_id?: string
          reorder_point?: number | null
          reorder_quantity?: number | null
          reserved?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_stock_by_location_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_translations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          language_code: string
          meta_description: string | null
          meta_title: string | null
          name: string
          product_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          short_description: string | null
          specifications: Json | null
          translated_at: string | null
          translated_by: string | null
          translation_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          language_code: string
          meta_description?: string | null
          meta_title?: string | null
          name: string
          product_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_description?: string | null
          specifications?: Json | null
          translated_at?: string | null
          translated_by?: string | null
          translation_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          language_code?: string
          meta_description?: string | null
          meta_title?: string | null
          name?: string
          product_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_description?: string | null
          specifications?: Json | null
          translated_at?: string | null
          translated_by?: string | null
          translation_status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          attributes: Json | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          price_override: number | null
          product_id: string
          updated_at: string
          variant_sku: string
        }
        Insert: {
          attributes?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          price_override?: number | null
          product_id: string
          updated_at?: string
          variant_sku: string
        }
        Update: {
          attributes?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          price_override?: number | null
          product_id?: string
          updated_at?: string
          variant_sku?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          cost: number
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string | null
          price: number
          sku: string
          stock: number
          updated_at: string
          warehouse_location: string | null
        }
        Insert: {
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id?: string | null
          price: number
          sku: string
          stock?: number
          updated_at?: string
          warehouse_location?: string | null
        }
        Update: {
          category?: string
          cost?: number
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string | null
          price?: number
          sku?: string
          stock?: number
          updated_at?: string
          warehouse_location?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          bio: string | null
          business_name: string | null
          certification_details: Json
          certifications: string[]
          created_at: string
          email: string | null
          id: string
          industries: string[]
          is_featured: boolean
          lat: number | null
          lng: number | null
          location_city: string | null
          location_postcode: string | null
          location_state: string | null
          name: string
          nrpg_member_id: string | null
          nrpg_membership_status: string | null
          nrpg_membership_tier: string | null
          nrpg_synced_at: string | null
          phone: string | null
          published: boolean
          service_areas: string[]
          updated_at: string
          website: string | null
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          certification_details?: Json
          certifications?: string[]
          created_at?: string
          email?: string | null
          id?: string
          industries?: string[]
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          location_city?: string | null
          location_postcode?: string | null
          location_state?: string | null
          name: string
          nrpg_member_id?: string | null
          nrpg_membership_status?: string | null
          nrpg_membership_tier?: string | null
          nrpg_synced_at?: string | null
          phone?: string | null
          published?: boolean
          service_areas?: string[]
          updated_at?: string
          website?: string | null
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          certification_details?: Json
          certifications?: string[]
          created_at?: string
          email?: string | null
          id?: string
          industries?: string[]
          is_featured?: boolean
          lat?: number | null
          lng?: number | null
          location_city?: string | null
          location_postcode?: string | null
          location_state?: string | null
          name?: string
          nrpg_member_id?: string | null
          nrpg_membership_status?: string | null
          nrpg_membership_tier?: string | null
          nrpg_synced_at?: string | null
          phone?: string | null
          published?: boolean
          service_areas?: string[]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      prompt_variants: {
        Row: {
          agent_id: string
          avg_duration_ms: number
          confidence_score: number
          created_at: string
          executions: number
          failure_count: number
          id: string
          is_active: boolean
          last_used: string | null
          prompt_template: string
          success_count: number
          variant_id: string
          version: number
        }
        Insert: {
          agent_id: string
          avg_duration_ms?: number
          confidence_score?: number
          created_at?: string
          executions?: number
          failure_count?: number
          id?: string
          is_active?: boolean
          last_used?: string | null
          prompt_template: string
          success_count?: number
          variant_id: string
          version: number
        }
        Update: {
          agent_id?: string
          avg_duration_ms?: number
          confidence_score?: number
          created_at?: string
          executions?: number
          failure_count?: number
          id?: string
          is_active?: boolean
          last_used?: string | null
          prompt_template?: string
          success_count?: number
          variant_id?: string
          version?: number
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          created_at: string
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          quantity_received: number
          subtotal: number
          unit_cost: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          quantity_received?: number
          subtotal: number
          unit_cost: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          quantity_received?: number
          subtotal?: number
          unit_cost?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          created_by_id: string | null
          delivery_location: string
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string | null
          po_number: string
          shipping_cost: number | null
          status: string
          subtotal: number
          supplier_id: string
          tax: number
          total: number
          updated_at: string | null
          xero_purchase_order_id: string | null
          xero_synced_at: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          created_by_id?: string | null
          delivery_location: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number: string
          shipping_cost?: number | null
          status?: string
          subtotal?: number
          supplier_id: string
          tax?: number
          total?: number
          updated_at?: string | null
          xero_purchase_order_id?: string | null
          xero_synced_at?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          created_by_id?: string | null
          delivery_location?: string
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string | null
          po_number?: string
          shipping_cost?: number | null
          status?: string
          subtotal?: number
          supplier_id?: string
          tax?: number
          total?: number
          updated_at?: string | null
          xero_purchase_order_id?: string | null
          xero_synced_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_created_by_id_fkey"
            columns: ["created_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          product_id: string
          quantity: number
          quote_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          line_total: number
          product_id: string
          quantity?: number
          quote_id: string
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          product_id?: string
          quantity?: number
          quote_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          created_at: string
          customer_id: string
          id: string
          notes: string | null
          organization_id: string | null
          quote_date: string
          quote_number: string
          status: string
          total: number
          updated_at: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          customer_id: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          quote_date?: string
          quote_number: string
          status?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string
          id?: string
          notes?: string | null
          organization_id?: string | null
          quote_date?: string
          quote_number?: string
          status?: string
          total?: number
          updated_at?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      rank_tracking: {
        Row: {
          brand_slug: string | null
          change: number | null
          cpc: number | null
          created_at: string | null
          date_recorded: string
          difficulty: number | null
          id: string
          keyword: string
          position: number | null
          url: string | null
          volume: number | null
          workspace_id: string
        }
        Insert: {
          brand_slug?: string | null
          change?: number | null
          cpc?: number | null
          created_at?: string | null
          date_recorded?: string
          difficulty?: number | null
          id?: string
          keyword: string
          position?: number | null
          url?: string | null
          volume?: number | null
          workspace_id: string
        }
        Update: {
          brand_slug?: string | null
          change?: number | null
          cpc?: number | null
          created_at?: string | null
          date_recorded?: string
          difficulty?: number | null
          id?: string
          keyword?: string
          position?: number | null
          url?: string | null
          volume?: number | null
          workspace_id?: string
        }
        Relationships: []
      }
      recipe_ingredients: {
        Row: {
          created_at: string
          id: string
          ingredient_name: string
          is_optional: boolean | null
          is_trigger_food: boolean | null
          nutrition_note: string | null
          quantity: number | null
          recipe_id: string
          sort_order: number
          unit: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          ingredient_name: string
          is_optional?: boolean | null
          is_trigger_food?: boolean | null
          nutrition_note?: string | null
          quantity?: number | null
          recipe_id: string
          sort_order?: number
          unit?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          ingredient_name?: string
          is_optional?: boolean | null
          is_trigger_food?: boolean | null
          nutrition_note?: string | null
          quantity?: number | null
          recipe_id?: string
          sort_order?: number
          unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipe_ingredients_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          b12_mcg: number | null
          calcium_mg: number | null
          calories_per_serving: number | null
          carbs_g: number | null
          cook_time_minutes: number
          created_at: string
          created_by: string | null
          description: string
          dietary_tags: Json | null
          difficulty: string
          fat_g: number | null
          fiber_g: number | null
          fnd_benefits: Json | null
          fnd_notes: string | null
          id: string
          image_url: string | null
          instructions: Json
          is_seed: boolean | null
          magnesium_mg: number | null
          meal_type: string
          name: string
          omega3_g: number | null
          prep_time_minutes: number
          protein_g: number | null
          servings: number
          slug: string
          total_time_minutes: number | null
          trigger_free: Json | null
          updated_at: string
          vitamin_d_iu: number | null
        }
        Insert: {
          b12_mcg?: number | null
          calcium_mg?: number | null
          calories_per_serving?: number | null
          carbs_g?: number | null
          cook_time_minutes?: number
          created_at?: string
          created_by?: string | null
          description: string
          dietary_tags?: Json | null
          difficulty?: string
          fat_g?: number | null
          fiber_g?: number | null
          fnd_benefits?: Json | null
          fnd_notes?: string | null
          id?: string
          image_url?: string | null
          instructions?: Json
          is_seed?: boolean | null
          magnesium_mg?: number | null
          meal_type: string
          name: string
          omega3_g?: number | null
          prep_time_minutes?: number
          protein_g?: number | null
          servings?: number
          slug: string
          total_time_minutes?: number | null
          trigger_free?: Json | null
          updated_at?: string
          vitamin_d_iu?: number | null
        }
        Update: {
          b12_mcg?: number | null
          calcium_mg?: number | null
          calories_per_serving?: number | null
          carbs_g?: number | null
          cook_time_minutes?: number
          created_at?: string
          created_by?: string | null
          description?: string
          dietary_tags?: Json | null
          difficulty?: string
          fat_g?: number | null
          fiber_g?: number | null
          fnd_benefits?: Json | null
          fnd_notes?: string | null
          id?: string
          image_url?: string | null
          instructions?: Json
          is_seed?: boolean | null
          magnesium_mg?: number | null
          meal_type?: string
          name?: string
          omega3_g?: number | null
          prep_time_minutes?: number
          protein_g?: number | null
          servings?: number
          slug?: string
          total_time_minutes?: number | null
          trigger_free?: Json | null
          updated_at?: string
          vitamin_d_iu?: number | null
        }
        Relationships: []
      }
      RedditContentPillar: {
        Row: {
          categories: string[] | null
          code: string
          createdAt: string
          description: string | null
          id: string
          isActive: boolean
          lastUsedAt: string
          name: string
          updatedAt: string
          usageCount: number
        }
        Insert: {
          categories?: string[] | null
          code: string
          createdAt?: string
          description?: string | null
          id: string
          isActive?: boolean
          lastUsedAt?: string
          name: string
          updatedAt: string
          usageCount?: number
        }
        Update: {
          categories?: string[] | null
          code?: string
          createdAt?: string
          description?: string | null
          id?: string
          isActive?: boolean
          lastUsedAt?: string
          name?: string
          updatedAt?: string
          usageCount?: number
        }
        Relationships: []
      }
      RedditOrchestratorRun: {
        Row: {
          command: string | null
          completedAt: string | null
          errorMessage: string | null
          id: string
          postsFailed: number
          postsGenerated: number
          postsPosted: number
          postsValidated: number
          startedAt: string
          status: string
          totalDurationMs: number
          totalTokensUsed: number
          triggerType: string
        }
        Insert: {
          command?: string | null
          completedAt?: string | null
          errorMessage?: string | null
          id: string
          postsFailed?: number
          postsGenerated?: number
          postsPosted?: number
          postsValidated?: number
          startedAt?: string
          status?: string
          totalDurationMs?: number
          totalTokensUsed?: number
          triggerType: string
        }
        Update: {
          command?: string | null
          completedAt?: string | null
          errorMessage?: string | null
          id?: string
          postsFailed?: number
          postsGenerated?: number
          postsPosted?: number
          postsValidated?: number
          startedAt?: string
          status?: string
          totalDurationMs?: number
          totalTokensUsed?: number
          triggerType?: string
        }
        Relationships: []
      }
      RedditPerformanceLog: {
        Row: {
          commentCount: number
          downvotes: number
          id: string
          isRemoved: boolean
          postId: string
          sampledAt: string
          upvoteRatio: number
          upvotes: number
        }
        Insert: {
          commentCount: number
          downvotes: number
          id: string
          isRemoved?: boolean
          postId: string
          sampledAt?: string
          upvoteRatio: number
          upvotes: number
        }
        Update: {
          commentCount?: number
          downvotes?: number
          id?: string
          isRemoved?: boolean
          postId?: string
          sampledAt?: string
          upvoteRatio?: number
          upvotes?: number
        }
        Relationships: [
          {
            foreignKeyName: "RedditPerformanceLog_postId_fkey"
            columns: ["postId"]
            isOneToOne: false
            referencedRelation: "RedditPost"
            referencedColumns: ["id"]
          },
        ]
      }
      RedditPost: {
        Row: {
          aiModel: string | null
          aiPromptVersion: string | null
          body: string
          brands: string
          category: string
          commentCount: number
          contentPillarId: string | null
          createdAt: string
          downvotes: number
          failedAt: string | null
          failureReason: string | null
          generatedAt: string | null
          generationTokens: number | null
          geoCompliant: boolean
          geoIssues: string | null
          geoSignals: string
          id: string
          imageFormat: string | null
          imageGenerated: boolean
          imagePrompt: string | null
          imageUrl: string | null
          isRemoved: boolean
          orchestratorRunId: string | null
          postedAt: string | null
          redditId: string | null
          redditUrl: string | null
          safetyGateResults: string | null
          safetyStatus: string
          scheduledFor: string | null
          status: string
          subreddit: string
          title: string
          tldr: string | null
          updatedAt: string
          upvoteRatio: number
          upvotes: number
          validatedAt: string | null
        }
        Insert: {
          aiModel?: string | null
          aiPromptVersion?: string | null
          body: string
          brands: string
          category: string
          commentCount?: number
          contentPillarId?: string | null
          createdAt?: string
          downvotes?: number
          failedAt?: string | null
          failureReason?: string | null
          generatedAt?: string | null
          generationTokens?: number | null
          geoCompliant?: boolean
          geoIssues?: string | null
          geoSignals: string
          id: string
          imageFormat?: string | null
          imageGenerated?: boolean
          imagePrompt?: string | null
          imageUrl?: string | null
          isRemoved?: boolean
          orchestratorRunId?: string | null
          postedAt?: string | null
          redditId?: string | null
          redditUrl?: string | null
          safetyGateResults?: string | null
          safetyStatus?: string
          scheduledFor?: string | null
          status?: string
          subreddit?: string
          title: string
          tldr?: string | null
          updatedAt: string
          upvoteRatio?: number
          upvotes?: number
          validatedAt?: string | null
        }
        Update: {
          aiModel?: string | null
          aiPromptVersion?: string | null
          body?: string
          brands?: string
          category?: string
          commentCount?: number
          contentPillarId?: string | null
          createdAt?: string
          downvotes?: number
          failedAt?: string | null
          failureReason?: string | null
          generatedAt?: string | null
          generationTokens?: number | null
          geoCompliant?: boolean
          geoIssues?: string | null
          geoSignals?: string
          id?: string
          imageFormat?: string | null
          imageGenerated?: boolean
          imagePrompt?: string | null
          imageUrl?: string | null
          isRemoved?: boolean
          orchestratorRunId?: string | null
          postedAt?: string | null
          redditId?: string | null
          redditUrl?: string | null
          safetyGateResults?: string | null
          safetyStatus?: string
          scheduledFor?: string | null
          status?: string
          subreddit?: string
          title?: string
          tldr?: string | null
          updatedAt?: string
          upvoteRatio?: number
          upvotes?: number
          validatedAt?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "RedditPost_contentPillarId_fkey"
            columns: ["contentPillarId"]
            isOneToOne: false
            referencedRelation: "RedditContentPillar"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "RedditPost_orchestratorRunId_fkey"
            columns: ["orchestratorRunId"]
            isOneToOne: false
            referencedRelation: "RedditOrchestratorRun"
            referencedColumns: ["id"]
          },
        ]
      }
      RedditSafetyAudit: {
        Row: {
          confidence: number
          createdAt: string
          durationMs: number | null
          findings: string
          gateModel: string
          gateName: string
          id: string
          passed: boolean
          postId: string
          tokensUsed: number | null
        }
        Insert: {
          confidence: number
          createdAt?: string
          durationMs?: number | null
          findings: string
          gateModel: string
          gateName: string
          id: string
          passed: boolean
          postId: string
          tokensUsed?: number | null
        }
        Update: {
          confidence?: number
          createdAt?: string
          durationMs?: number | null
          findings?: string
          gateModel?: string
          gateName?: string
          id?: string
          passed?: boolean
          postId?: string
          tokensUsed?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "RedditSafetyAudit_postId_fkey"
            columns: ["postId"]
            isOneToOne: false
            referencedRelation: "RedditPost"
            referencedColumns: ["id"]
          },
        ]
      }
      RedditSystemPrompt: {
        Row: {
          createdAt: string
          id: string
          isActive: boolean
          promptText: string
          updatedAt: string
          version: string
        }
        Insert: {
          createdAt?: string
          id: string
          isActive?: boolean
          promptText: string
          updatedAt: string
          version: string
        }
        Update: {
          createdAt?: string
          id?: string
          isActive?: boolean
          promptText?: string
          updatedAt?: string
          version?: string
        }
        Relationships: []
      }
      reorder_rules: {
        Row: {
          auto_approve_under_qty: number
          created_at: string
          id: string
          is_enabled: boolean
          lead_time_days: number
          location: string
          product_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          auto_approve_under_qty?: number
          created_at?: string
          id?: string
          is_enabled?: boolean
          lead_time_days?: number
          location: string
          product_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          auto_approve_under_qty?: number
          created_at?: string
          id?: string
          is_enabled?: boolean
          lead_time_days?: number
          location?: string
          product_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reorder_rules_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reorder_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      route_audit_results: {
        Row: {
          checks: Json | null
          created_at: string | null
          id: string
          issues: Json | null
          performance: Json | null
          route_methods: string[]
          route_path: string
          score: number
          status: string
        }
        Insert: {
          checks?: Json | null
          created_at?: string | null
          id?: string
          issues?: Json | null
          performance?: Json | null
          route_methods: string[]
          route_path: string
          score: number
          status: string
        }
        Update: {
          checks?: Json | null
          created_at?: string | null
          id?: string
          issues?: Json | null
          performance?: Json | null
          route_methods?: string[]
          route_path?: string
          score?: number
          status?: string
        }
        Relationships: []
      }
      sales_staff: {
        Row: {
          can_sell_at_locations: string[]
          created_at: string
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          primary_location_code: string
          staff_code: string
          updated_at: string
        }
        Insert: {
          can_sell_at_locations?: string[]
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          primary_location_code: string
          staff_code: string
          updated_at?: string
        }
        Update: {
          can_sell_at_locations?: string[]
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          primary_location_code?: string
          staff_code?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_staff_primary_location_code_fkey"
            columns: ["primary_location_code"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["code"]
          },
        ]
      }
      schema_markup: {
        Row: {
          business_id: string
          created_at: string | null
          id: string
          is_valid: boolean | null
          schema_json: Json
          schema_type: string
          updated_at: string | null
          validation_errors: Json | null
        }
        Insert: {
          business_id: string
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          schema_json: Json
          schema_type: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Update: {
          business_id?: string
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          schema_json?: Json
          schema_type?: string
          updated_at?: string | null
          validation_errors?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "schema_markup_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "businesses"
            referencedColumns: ["id"]
          },
        ]
      }
      search_queries: {
        Row: {
          clicked_product_id: string | null
          clicked_rank: number | null
          converted: boolean
          created_at: string
          customer_id: string | null
          id: string
          query_language: string
          query_text: string
          query_time_ms: number | null
          query_type: string
          results_count: number
          results_product_ids: string[] | null
          searched_at: string
          session_id: string | null
        }
        Insert: {
          clicked_product_id?: string | null
          clicked_rank?: number | null
          converted?: boolean
          created_at?: string
          customer_id?: string | null
          id?: string
          query_language?: string
          query_text: string
          query_time_ms?: number | null
          query_type?: string
          results_count?: number
          results_product_ids?: string[] | null
          searched_at?: string
          session_id?: string | null
        }
        Update: {
          clicked_product_id?: string | null
          clicked_rank?: number | null
          converted?: boolean
          created_at?: string
          customer_id?: string | null
          id?: string
          query_language?: string
          query_text?: string
          query_time_ms?: number | null
          query_type?: string
          results_count?: number
          results_product_ids?: string[] | null
          searched_at?: string
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "search_queries_clicked_product_id_fkey"
            columns: ["clicked_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "search_queries_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reminders: {
        Row: {
          booking_id: string | null
          created_at: string
          customer_id: string
          email_subject: string | null
          equipment_id: string
          id: string
          reminder_type: string
          scheduled_send_at: string
          sent_at: string | null
          status: Database["public"]["Enums"]["reminder_status_enum"]
          updated_at: string
        }
        Insert: {
          booking_id?: string | null
          created_at?: string
          customer_id: string
          email_subject?: string | null
          equipment_id: string
          id?: string
          reminder_type: string
          scheduled_send_at: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status_enum"]
          updated_at?: string
        }
        Update: {
          booking_id?: string | null
          created_at?: string
          customer_id?: string
          email_subject?: string | null
          equipment_id?: string
          id?: string
          reminder_type?: string
          scheduled_send_at?: string
          sent_at?: string | null
          status?: Database["public"]["Enums"]["reminder_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reminders_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "workshop_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_reminders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          approved_amount: number | null
          assigned_technician: string | null
          created_at: string
          customer_id: string
          equipment_description: string
          id: string
          issue_description: string
          order_id: string | null
          photos: Json | null
          quote_amount: number | null
          request_type: Database["public"]["Enums"]["request_type_enum"]
          scheduled_date: string | null
          status: Database["public"]["Enums"]["service_status_enum"]
          updated_at: string
        }
        Insert: {
          approved_amount?: number | null
          assigned_technician?: string | null
          created_at?: string
          customer_id: string
          equipment_description: string
          id?: string
          issue_description: string
          order_id?: string | null
          photos?: Json | null
          quote_amount?: number | null
          request_type?: Database["public"]["Enums"]["request_type_enum"]
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["service_status_enum"]
          updated_at?: string
        }
        Update: {
          approved_amount?: number | null
          assigned_technician?: string | null
          created_at?: string
          customer_id?: string
          equipment_description?: string
          id?: string
          issue_description?: string
          order_id?: string | null
          photos?: Json | null
          quote_amount?: number | null
          request_type?: Database["public"]["Enums"]["request_type_enum"]
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["service_status_enum"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_requests_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      service_template_items: {
        Row: {
          created_at: string
          id: string
          lead_time_days: number
          notes: string | null
          product_id: string
          quantity: number
          template_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          lead_time_days?: number
          notes?: string | null
          product_id: string
          quantity?: number
          template_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          lead_time_days?: number
          notes?: string | null
          product_id?: string
          quantity?: number
          template_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_template_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_template_items_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      service_templates: {
        Row: {
          applies_to_make: string | null
          applies_to_model: string | null
          created_at: string
          description: string
          estimated_hours: number
          id: string
          is_active: boolean
          location: string | null
          name: string
          service_type: string
          updated_at: string
        }
        Insert: {
          applies_to_make?: string | null
          applies_to_model?: string | null
          created_at?: string
          description?: string
          estimated_hours?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name: string
          service_type: string
          updated_at?: string
        }
        Update: {
          applies_to_make?: string | null
          applies_to_model?: string | null
          created_at?: string
          description?: string
          estimated_hours?: number
          id?: string
          is_active?: boolean
          location?: string | null
          name?: string
          service_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_connections: {
        Row: {
          access_token: string
          api_key: string
          api_secret: string
          api_version: string
          created_at: string
          currency: string | null
          email: string | null
          id: string
          is_active: boolean
          last_inventory_sync: string | null
          last_order_sync: string | null
          last_product_sync: string | null
          phone: string | null
          shop_domain: string
          shop_id: number | null
          shop_name: string
          sync_settings: Json | null
          timezone: string | null
          updated_at: string
          webhook_secret: string
        }
        Insert: {
          access_token: string
          api_key: string
          api_secret: string
          api_version?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_inventory_sync?: string | null
          last_order_sync?: string | null
          last_product_sync?: string | null
          phone?: string | null
          shop_domain: string
          shop_id?: number | null
          shop_name: string
          sync_settings?: Json | null
          timezone?: string | null
          updated_at?: string
          webhook_secret: string
        }
        Update: {
          access_token?: string
          api_key?: string
          api_secret?: string
          api_version?: string
          created_at?: string
          currency?: string | null
          email?: string | null
          id?: string
          is_active?: boolean
          last_inventory_sync?: string | null
          last_order_sync?: string | null
          last_product_sync?: string | null
          phone?: string | null
          shop_domain?: string
          shop_id?: number | null
          shop_name?: string
          sync_settings?: Json | null
          timezone?: string | null
          updated_at?: string
          webhook_secret?: string
        }
        Relationships: []
      }
      shopify_inventory_sync_queue: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          last_error: string | null
          max_retries: number
          next_retry_at: string
          product_id: string
          retry_count: number
          shopify_inventory_item_id: string
          shopify_location_id: string
          shopify_product_id: string
          status: string
          sync_direction: string
          sync_metadata: Json | null
          triggered_by: string | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at: string
          product_id: string
          retry_count?: number
          shopify_inventory_item_id: string
          shopify_location_id: string
          shopify_product_id: string
          status?: string
          sync_direction: string
          sync_metadata?: Json | null
          triggered_by?: string | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          max_retries?: number
          next_retry_at?: string
          product_id?: string
          retry_count?: number
          shopify_inventory_item_id?: string
          shopify_location_id?: string
          shopify_product_id?: string
          status?: string
          sync_direction?: string
          sync_metadata?: Json | null
          triggered_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_inventory_sync_queue_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_inventory_syncs: {
        Row: {
          created_at: string
          direction: string
          error_message: string | null
          id: string
          new_location: string | null
          new_quantity: number | null
          old_location: string | null
          old_quantity: number | null
          product_id: string
          quantity_delta: number | null
          shopify_inventory_item_id: string | null
          shopify_product_id: string | null
          shopify_variant_id: string | null
          status: string
          sync_metadata: Json | null
          sync_type: string
          synced_at: string
          triggered_by: string | null
        }
        Insert: {
          created_at?: string
          direction: string
          error_message?: string | null
          id?: string
          new_location?: string | null
          new_quantity?: number | null
          old_location?: string | null
          old_quantity?: number | null
          product_id: string
          quantity_delta?: number | null
          shopify_inventory_item_id?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          status?: string
          sync_metadata?: Json | null
          sync_type: string
          synced_at?: string
          triggered_by?: string | null
        }
        Update: {
          created_at?: string
          direction?: string
          error_message?: string | null
          id?: string
          new_location?: string | null
          new_quantity?: number | null
          old_location?: string | null
          old_quantity?: number | null
          product_id?: string
          quantity_delta?: number | null
          shopify_inventory_item_id?: string | null
          shopify_product_id?: string | null
          shopify_variant_id?: string | null
          status?: string
          sync_metadata?: Json | null
          sync_type?: string
          synced_at?: string
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shopify_inventory_syncs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_metafields: {
        Row: {
          created_at: string
          id: string
          is_synced: boolean
          key: string
          last_synced_at: string | null
          namespace: string
          product_id: string
          shopify_metafield_id: string | null
          shopify_product_id: string | null
          sync_error: string | null
          updated_at: string
          value: string | null
          value_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_synced?: boolean
          key: string
          last_synced_at?: string | null
          namespace?: string
          product_id: string
          shopify_metafield_id?: string | null
          shopify_product_id?: string | null
          sync_error?: string | null
          updated_at?: string
          value?: string | null
          value_type?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_synced?: boolean
          key?: string
          last_synced_at?: string | null
          namespace?: string
          product_id?: string
          shopify_metafield_id?: string | null
          shopify_product_id?: string | null
          sync_error?: string | null
          updated_at?: string
          value?: string | null
          value_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_metafields_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_order_mappings: {
        Row: {
          created_at: string
          financial_status: string | null
          fulfillment_status: string | null
          id: string
          import_status: string
          imported_at: string
          order_id: string
          shopify_data: Json | null
          shopify_order_id: number
          shopify_order_name: string
          shopify_order_number: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          import_status?: string
          imported_at?: string
          order_id: string
          shopify_data?: Json | null
          shopify_order_id: number
          shopify_order_name: string
          shopify_order_number: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          financial_status?: string | null
          fulfillment_status?: string | null
          id?: string
          import_status?: string
          imported_at?: string
          order_id?: string
          shopify_data?: Json | null
          shopify_order_id?: number
          shopify_order_name?: string
          shopify_order_number?: number
          updated_at?: string
        }
        Relationships: []
      }
      shopify_product_mappings: {
        Row: {
          created_at: string
          id: string
          last_synced_at: string | null
          product_id: string
          shopify_data: Json | null
          shopify_inventory_item_id: number | null
          shopify_product_id: number
          shopify_variant_id: number
          sync_direction: string | null
          sync_error: string | null
          sync_status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          product_id: string
          shopify_data?: Json | null
          shopify_inventory_item_id?: number | null
          shopify_product_id: number
          shopify_variant_id: number
          sync_direction?: string | null
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          last_synced_at?: string | null
          product_id?: string
          shopify_data?: Json | null
          shopify_inventory_item_id?: number | null
          shopify_product_id?: number
          shopify_variant_id?: number
          sync_direction?: string | null
          sync_error?: string | null
          sync_status?: string
          updated_at?: string
        }
        Relationships: []
      }
      shopify_product_sync_logs: {
        Row: {
          error_message: string | null
          id: string
          product_id: string
          shopify_product_id: number | null
          sync_action: string
          sync_direction: string
          sync_status: string
          synced_at: string
        }
        Insert: {
          error_message?: string | null
          id?: string
          product_id: string
          shopify_product_id?: number | null
          sync_action: string
          sync_direction: string
          sync_status: string
          synced_at?: string
        }
        Update: {
          error_message?: string | null
          id?: string
          product_id?: string
          shopify_product_id?: number | null
          sync_action?: string
          sync_direction?: string
          sync_status?: string
          synced_at?: string
        }
        Relationships: []
      }
      shopify_product_translations: {
        Row: {
          created_at: string
          id: string
          is_synced: boolean
          language_code: string
          last_synced_at: string | null
          product_id: string
          shopify_product_id: string | null
          shopify_translation_id: string | null
          sync_error: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_synced?: boolean
          language_code: string
          last_synced_at?: string | null
          product_id: string
          shopify_product_id?: string | null
          shopify_translation_id?: string | null
          sync_error?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_synced?: boolean
          language_code?: string
          last_synced_at?: string | null
          product_id?: string
          shopify_product_id?: string | null
          shopify_translation_id?: string | null
          sync_error?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopify_product_translations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      shopify_theme_endpoints: {
        Row: {
          cache_enabled: boolean
          cache_ttl_seconds: number | null
          created_at: string
          description: string | null
          endpoint_path: string
          endpoint_type: string
          id: string
          is_active: boolean
          last_accessed_at: string | null
          rate_limit_per_hour: number | null
          request_count: number
          shopify_store_domain: string | null
          shopify_theme_id: string | null
          updated_at: string
        }
        Insert: {
          cache_enabled?: boolean
          cache_ttl_seconds?: number | null
          created_at?: string
          description?: string | null
          endpoint_path: string
          endpoint_type: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          rate_limit_per_hour?: number | null
          request_count?: number
          shopify_store_domain?: string | null
          shopify_theme_id?: string | null
          updated_at?: string
        }
        Update: {
          cache_enabled?: boolean
          cache_ttl_seconds?: number | null
          created_at?: string
          description?: string | null
          endpoint_path?: string
          endpoint_type?: string
          id?: string
          is_active?: boolean
          last_accessed_at?: string | null
          rate_limit_per_hour?: number | null
          request_count?: number
          shopify_store_domain?: string | null
          shopify_theme_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      shopify_webhook_logs: {
        Row: {
          headers: Json | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          processing_error: string | null
          received_at: string
          shop_domain: string
          shopify_webhook_id: string | null
          topic: string
        }
        Insert: {
          headers?: Json | null
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
          shop_domain: string
          shopify_webhook_id?: string | null
          topic: string
        }
        Update: {
          headers?: Json | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          processing_error?: string | null
          received_at?: string
          shop_domain?: string
          shopify_webhook_id?: string | null
          topic?: string
        }
        Relationships: []
      }
      skill_health: {
        Row: {
          eval_count: number
          founder_id: string
          id: string
          pass_count: number
          pass_rate: number
          run_at: string
          skill_name: string
        }
        Insert: {
          eval_count: number
          founder_id: string
          id?: string
          pass_count: number
          pass_rate: number
          run_at?: string
          skill_name: string
        }
        Update: {
          eval_count?: number
          founder_id?: string
          id?: string
          pass_count?: number
          pass_rate?: number
          run_at?: string
          skill_name?: string
        }
        Relationships: []
      }
      sla_instances: {
        Row: {
          breach_notified: boolean
          breached: boolean
          created_at: string
          deadline: string
          entity_id: string
          entity_type: string
          id: string
          sla_rule_id: string
        }
        Insert: {
          breach_notified?: boolean
          breached?: boolean
          created_at?: string
          deadline: string
          entity_id: string
          entity_type: string
          id?: string
          sla_rule_id: string
        }
        Update: {
          breach_notified?: boolean
          breached?: boolean
          created_at?: string
          deadline?: string
          entity_id?: string
          entity_type?: string
          id?: string
          sla_rule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sla_instances_sla_rule_id_fkey"
            columns: ["sla_rule_id"]
            isOneToOne: false
            referencedRelation: "sla_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      sla_rules: {
        Row: {
          created_at: string
          entity_type: string
          escalation_action: string
          escalation_config: Json | null
          id: string
          is_active: boolean
          name: string
          sla_hours: number
        }
        Insert: {
          created_at?: string
          entity_type: string
          escalation_action: string
          escalation_config?: Json | null
          id?: string
          is_active?: boolean
          name: string
          sla_hours: number
        }
        Update: {
          created_at?: string
          entity_type?: string
          escalation_action?: string
          escalation_config?: Json | null
          id?: string
          is_active?: boolean
          name?: string
          sla_hours?: number
        }
        Relationships: []
      }
      social_channels: {
        Row: {
          access_token_encrypted: string | null
          business_id: string
          business_key: string | null
          channel_id: string | null
          channel_name: string
          created_at: string
          follower_count: number | null
          founder_id: string
          handle: string | null
          id: string
          is_connected: boolean
          last_synced_at: string | null
          metadata: Json
          name: string | null
          platform: string
          profile_image_url: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          updated_at: string
        }
        Insert: {
          access_token_encrypted?: string | null
          business_id: string
          business_key?: string | null
          channel_id?: string | null
          channel_name: string
          created_at?: string
          follower_count?: number | null
          founder_id: string
          handle?: string | null
          id?: string
          is_connected?: boolean
          last_synced_at?: string | null
          metadata?: Json
          name?: string | null
          platform: string
          profile_image_url?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Update: {
          access_token_encrypted?: string | null
          business_id?: string
          business_key?: string | null
          channel_id?: string | null
          channel_name?: string
          created_at?: string
          follower_count?: number | null
          founder_id?: string
          handle?: string | null
          id?: string
          is_connected?: boolean
          last_synced_at?: string | null
          metadata?: Json
          name?: string | null
          platform?: string
          profile_image_url?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_engagements: {
        Row: {
          ai_reply: string | null
          author_id: string | null
          author_name: string | null
          business_key: string
          content: string
          created_at: string
          engagement_type: string
          founder_id: string
          id: string
          metadata: Json
          platform: string
          post_external_id: string | null
          replied_at: string | null
          reply_status: string
          sentiment: string | null
          updated_at: string
        }
        Insert: {
          ai_reply?: string | null
          author_id?: string | null
          author_name?: string | null
          business_key: string
          content: string
          created_at?: string
          engagement_type: string
          founder_id: string
          id?: string
          metadata?: Json
          platform: string
          post_external_id?: string | null
          replied_at?: string | null
          reply_status?: string
          sentiment?: string | null
          updated_at?: string
        }
        Update: {
          ai_reply?: string | null
          author_id?: string | null
          author_name?: string | null
          business_key?: string
          content?: string
          created_at?: string
          engagement_type?: string
          founder_id?: string
          id?: string
          metadata?: Json
          platform?: string
          post_external_id?: string | null
          replied_at?: string | null
          reply_status?: string
          sentiment?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          business_key: string
          content: string
          created_at: string
          error_message: string | null
          experiment_variant_id: string | null
          founder_id: string
          id: string
          media_urls: string[] | null
          platform_post_ids: Json | null
          platforms: string[]
          published_at: string | null
          scheduled_at: string | null
          status: string
          title: string | null
          updated_at: string
        }
        Insert: {
          business_key: string
          content: string
          created_at?: string
          error_message?: string | null
          experiment_variant_id?: string | null
          founder_id: string
          id?: string
          media_urls?: string[] | null
          platform_post_ids?: Json | null
          platforms?: string[]
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Update: {
          business_key?: string
          content?: string
          created_at?: string
          error_message?: string | null
          experiment_variant_id?: string | null
          founder_id?: string
          id?: string
          media_urls?: string[] | null
          platform_post_ids?: Json | null
          platforms?: string[]
          published_at?: string | null
          scheduled_at?: string | null
          status?: string
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_experiment_variant_id_fkey"
            columns: ["experiment_variant_id"]
            isOneToOne: false
            referencedRelation: "experiment_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_adjustments: {
        Row: {
          adjusted_at: string
          adjusted_by: string | null
          adjustment_type: string
          created_at: string
          id: string
          location: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason: string | null
          reference_id: string | null
        }
        Insert: {
          adjusted_at?: string
          adjusted_by?: string | null
          adjustment_type: string
          created_at?: string
          id?: string
          location: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          quantity_change: number
          reason?: string | null
          reference_id?: string | null
        }
        Update: {
          adjusted_at?: string
          adjusted_by?: string | null
          adjustment_type?: string
          created_at?: string
          id?: string
          location?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          quantity_change?: number
          reason?: string | null
          reference_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_reservations: {
        Row: {
          cancelled_at: string | null
          created_at: string
          expires_at: string | null
          fulfilled_at: string | null
          id: string
          location: string
          order_id: string
          product_id: string
          quantity: number
          reserved_at: string
          status: string
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fulfilled_at?: string | null
          id?: string
          location: string
          order_id: string
          product_id: string
          quantity: number
          reserved_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          created_at?: string
          expires_at?: string | null
          fulfilled_at?: string | null
          id?: string
          location?: string
          order_id?: string
          product_id?: string
          quantity?: number
          reserved_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_reservations_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_reservations_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_take_items: {
        Row: {
          counted_qty: number
          created_at: string
          id: string
          product_id: string
          stock_take_id: string
          system_qty: number
          variance: number
        }
        Insert: {
          counted_qty: number
          created_at?: string
          id?: string
          product_id: string
          stock_take_id: string
          system_qty: number
          variance: number
        }
        Update: {
          counted_qty?: number
          created_at?: string
          id?: string
          product_id?: string
          stock_take_id?: string
          system_qty?: number
          variance?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_take_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_take_items_stock_take_id_fkey"
            columns: ["stock_take_id"]
            isOneToOne: false
            referencedRelation: "stock_takes"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_takes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          location: string
          status: string
          submitted_at: string | null
          submitted_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          location: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          location?: string
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
        }
        Relationships: []
      }
      stock_transfers: {
        Row: {
          completed_at: string | null
          completed_by: string | null
          created_at: string
          from_location: string
          id: string
          initiated_at: string
          initiated_by: string | null
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          status: string
          to_location: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          from_location: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          status?: string
          to_location: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          from_location?: string
          id?: string
          initiated_at?: string
          initiated_by?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          status?: string
          to_location?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      submission_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          meta_data: string | null
          note_type: string
          submission_id: string
          submission_type: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta_data?: string | null
          note_type?: string
          submission_id: string
          submission_type: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          meta_data?: string | null
          note_type?: string
          submission_id?: string
          submission_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          abn: string | null
          address: string | null
          city: string | null
          company_name: string
          contact_name: string | null
          country: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          notes: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          preferred_carrier: string | null
          state: string | null
          supplier_code: string
          updated_at: string | null
          xero_contact_id: string | null
          xero_synced_at: string | null
        }
        Insert: {
          abn?: string | null
          address?: string | null
          city?: string | null
          company_name: string
          contact_name?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_carrier?: string | null
          state?: string | null
          supplier_code: string
          updated_at?: string | null
          xero_contact_id?: string | null
          xero_synced_at?: string | null
        }
        Update: {
          abn?: string | null
          address?: string | null
          city?: string | null
          company_name?: string
          contact_name?: string | null
          country?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_carrier?: string | null
          state?: string | null
          supplier_code?: string
          updated_at?: string | null
          xero_contact_id?: string | null
          xero_synced_at?: string | null
        }
        Relationships: []
      }
      symptom_logs: {
        Row: {
          created_at: string
          duration_minutes: number | null
          energy_level: number | null
          food_related: boolean | null
          id: string
          notes: string | null
          potential_triggers: Json | null
          severity: number
          symptom_date: string
          symptom_name: string
          symptom_time: string | null
          symptom_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          energy_level?: number | null
          food_related?: boolean | null
          id?: string
          notes?: string | null
          potential_triggers?: Json | null
          severity: number
          symptom_date: string
          symptom_name: string
          symptom_time?: string | null
          symptom_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          energy_level?: number | null
          food_related?: boolean | null
          id?: string
          notes?: string | null
          potential_triggers?: Json | null
          severity?: number
          symptom_date?: string
          symptom_name?: string
          symptom_time?: string | null
          symptom_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assigned_agent: string | null
          attempts: number | null
          conversation_id: string | null
          created_at: string | null
          description: string
          error: string | null
          id: string
          result: Json | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          assigned_agent?: string | null
          attempts?: number | null
          conversation_id?: string | null
          created_at?: string | null
          description: string
          error?: string | null
          id?: string
          result?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          assigned_agent?: string | null
          attempts?: number | null
          conversation_id?: string | null
          created_at?: string | null
          description?: string
          error?: string | null
          id?: string
          result?: Json | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      test_failure_patterns: {
        Row: {
          created_at: string | null
          description: string
          error_signature: string
          error_type: string
          id: string
          last_occurred: string | null
          occurrence_count: number | null
          project_id: string
          resolved_count: number | null
          solutions: Json | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          error_signature: string
          error_type: string
          id?: string
          last_occurred?: string | null
          occurrence_count?: number | null
          project_id: string
          resolved_count?: number | null
          solutions?: Json | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          error_signature?: string
          error_type?: string
          id?: string
          last_occurred?: string | null
          occurrence_count?: number | null
          project_id?: string
          resolved_count?: number | null
          solutions?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      test_results: {
        Row: {
          coverage: number | null
          created_at: string | null
          duration_seconds: number | null
          failed_tests: number
          failures: Json | null
          feature_id: string | null
          id: string
          passed: boolean
          passed_tests: number
          project_id: string
          session_id: string
          skipped_tests: number | null
          test_type: string
          total_tests: number
        }
        Insert: {
          coverage?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          failed_tests: number
          failures?: Json | null
          feature_id?: string | null
          id?: string
          passed: boolean
          passed_tests: number
          project_id: string
          session_id: string
          skipped_tests?: number | null
          test_type: string
          total_tests: number
        }
        Update: {
          coverage?: number | null
          created_at?: string | null
          duration_seconds?: number | null
          failed_tests?: number
          failures?: Json | null
          feature_id?: string | null
          id?: string
          passed?: boolean
          passed_tests?: number
          project_id?: string
          session_id?: string
          skipped_tests?: number | null
          test_type?: string
          total_tests?: number
        }
        Relationships: []
      }
      translation_queue: {
        Row: {
          attempts: number
          created_at: string
          entity_id: string
          entity_type: string
          error_message: string | null
          id: string
          priority: number
          status: string
          target_language: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          entity_id: string
          entity_type: string
          error_message?: string | null
          id?: string
          priority?: number
          status?: string
          target_language: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          entity_id?: string
          entity_type?: string
          error_message?: string | null
          id?: string
          priority?: number
          status?: string
          target_language?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "translation_queue_target_language_fkey"
            columns: ["target_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      trend_insights: {
        Row: {
          applied: boolean
          category: string
          confidence: number
          createdAt: string
          dataPoints: number
          id: string
          insight: string
          organizationId: string | null
          platform: string
          runId: string
          validUntil: string | null
        }
        Insert: {
          applied?: boolean
          category: string
          confidence: number
          createdAt?: string
          dataPoints: number
          id: string
          insight: string
          organizationId?: string | null
          platform: string
          runId: string
          validUntil?: string | null
        }
        Update: {
          applied?: boolean
          category?: string
          confidence?: number
          createdAt?: string
          dataPoints?: number
          id?: string
          insight?: string
          organizationId?: string | null
          platform?: string
          runId?: string
          validUntil?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trend_insights_organizationId_fkey"
            columns: ["organizationId"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trend_insights_runId_fkey"
            columns: ["runId"]
            isOneToOne: false
            referencedRelation: "auto_research_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      ui_translations: {
        Row: {
          context: string | null
          created_at: string
          id: string
          key: string
          language_code: string
          namespace: string
          updated_at: string
          value: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: string
          key: string
          language_code: string
          namespace: string
          updated_at?: string
          value: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: string
          key?: string
          language_code?: string
          namespace?: string
          updated_at?: string
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ui_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_health_profiles: {
        Row: {
          b12_target_mcg: number | null
          calcium_target_mg: number | null
          created_at: string
          date_of_birth: string | null
          dietary_restrictions: Json | null
          fnd_symptoms: Json | null
          health_goals: Json | null
          height_cm: number | null
          id: string
          known_triggers: Json | null
          magnesium_target_mg: number | null
          omega3_target_g: number | null
          onboarding_completed: boolean | null
          protein_target_g: number | null
          sex: string | null
          updated_at: string
          user_id: string
          vitamin_d_target_iu: number | null
          weight_kg: number | null
        }
        Insert: {
          b12_target_mcg?: number | null
          calcium_target_mg?: number | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: Json | null
          fnd_symptoms?: Json | null
          health_goals?: Json | null
          height_cm?: number | null
          id?: string
          known_triggers?: Json | null
          magnesium_target_mg?: number | null
          omega3_target_g?: number | null
          onboarding_completed?: boolean | null
          protein_target_g?: number | null
          sex?: string | null
          updated_at?: string
          user_id: string
          vitamin_d_target_iu?: number | null
          weight_kg?: number | null
        }
        Update: {
          b12_target_mcg?: number | null
          calcium_target_mg?: number | null
          created_at?: string
          date_of_birth?: string | null
          dietary_restrictions?: Json | null
          fnd_symptoms?: Json | null
          health_goals?: Json | null
          height_cm?: number | null
          id?: string
          known_triggers?: Json | null
          magnesium_target_mg?: number | null
          omega3_target_g?: number | null
          onboarding_completed?: boolean | null
          protein_target_g?: number | null
          sex?: string | null
          updated_at?: string
          user_id?: string
          vitamin_d_target_iu?: number | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          coding_style: Json | null
          communication: Json | null
          created_at: string | null
          custom: Json | null
          id: string
          learned_corrections: Json | null
          project_id: string | null
          updated_at: string | null
          user_id: string
          workflow: Json | null
        }
        Insert: {
          coding_style?: Json | null
          communication?: Json | null
          created_at?: string | null
          custom?: Json | null
          id?: string
          learned_corrections?: Json | null
          project_id?: string | null
          updated_at?: string | null
          user_id: string
          workflow?: Json | null
        }
        Update: {
          coding_style?: Json | null
          communication?: Json | null
          created_at?: string | null
          custom?: Json | null
          id?: string
          learned_corrections?: Json | null
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
          workflow?: Json | null
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          created_at: string | null
          google_drive_vault_folder_id: string | null
          id: string
          locale: string | null
          notification_alerts: boolean | null
          notification_cases: boolean | null
          notification_digest: boolean | null
          notification_slack: boolean | null
          notification_whatsapp: boolean | null
          slack_channel: string | null
          slack_webhook_url: string | null
          timezone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          google_drive_vault_folder_id?: string | null
          id?: string
          locale?: string | null
          notification_alerts?: boolean | null
          notification_cases?: boolean | null
          notification_digest?: boolean | null
          notification_slack?: boolean | null
          notification_whatsapp?: boolean | null
          slack_channel?: string | null
          slack_webhook_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          google_drive_vault_folder_id?: string | null
          id?: string
          locale?: string | null
          notification_alerts?: boolean | null
          notification_cases?: boolean | null
          notification_digest?: boolean | null
          notification_slack?: boolean | null
          notification_whatsapp?: boolean | null
          slack_channel?: string | null
          slack_webhook_url?: string | null
          timezone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string
          email: string
          full_name: string | null
          hashed_password: string
          id: string
          is_active: boolean
          is_admin: boolean
          referral_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name?: string | null
          hashed_password: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          referral_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string | null
          hashed_password?: string
          id?: string
          is_active?: boolean
          is_admin?: boolean
          referral_code?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      verification_results: {
        Row: {
          created_at: string | null
          evidence: Json | null
          failed_checks: number
          failures: Json | null
          id: string
          passed_checks: number
          requesting_agent_id: string
          task_id: string
          total_checks: number
          verified: boolean
          verifier_id: string
        }
        Insert: {
          created_at?: string | null
          evidence?: Json | null
          failed_checks?: number
          failures?: Json | null
          id?: string
          passed_checks?: number
          requesting_agent_id: string
          task_id: string
          total_checks?: number
          verified: boolean
          verifier_id: string
        }
        Update: {
          created_at?: string | null
          evidence?: Json | null
          failed_checks?: number
          failures?: Json | null
          id?: string
          passed_checks?: number
          requesting_agent_id?: string
          task_id?: string
          total_checks?: number
          verified?: boolean
          verifier_id?: string
        }
        Relationships: []
      }
      video_assets: {
        Row: {
          aspect_ratio: string
          business_key: string
          created_at: string
          duration_seconds: number | null
          error_message: string | null
          external_job_id: string | null
          founder_id: string
          generated_content_id: string | null
          id: string
          metadata: Json
          provider: string
          script: string
          status: string
          thumbnail_url: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          aspect_ratio?: string
          business_key: string
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          external_job_id?: string | null
          founder_id: string
          generated_content_id?: string | null
          id?: string
          metadata?: Json
          provider: string
          script: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          aspect_ratio?: string
          business_key?: string
          created_at?: string
          duration_seconds?: number | null
          error_message?: string | null
          external_job_id?: string | null
          founder_id?: string
          generated_content_id?: string | null
          id?: string
          metadata?: Json
          provider?: string
          script?: string
          status?: string
          thumbnail_url?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "video_assets_generated_content_id_fkey"
            columns: ["generated_content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      voice_search_sessions: {
        Row: {
          assistant_type: string | null
          conversion_count: number
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          language: string
          queries: Json | null
          query_count: number
          session_id: string
          started_at: string
          total_results_shown: number
        }
        Insert: {
          assistant_type?: string | null
          conversion_count?: number
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          language?: string
          queries?: Json | null
          query_count?: number
          session_id: string
          started_at?: string
          total_results_shown?: number
        }
        Update: {
          assistant_type?: string | null
          conversion_count?: number
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          language?: string
          queries?: Json | null
          query_count?: number
          session_id?: string
          started_at?: string
          total_results_shown?: number
        }
        Relationships: []
      }
      webhook_events: {
        Row: {
          attempts: number
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          provider: string
          status: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider: string
          status?: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          provider?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      webhook_metrics: {
        Row: {
          avg_processing_time_ms: number | null
          calculated_at: string
          id: string
          max_processing_time_ms: number | null
          period_end: string
          period_start: string
          period_type: string
          reliability_rate: number | null
          source: string
          total_completed: number
          total_dead_letter: number
          total_failed: number
          total_received: number
        }
        Insert: {
          avg_processing_time_ms?: number | null
          calculated_at?: string
          id?: string
          max_processing_time_ms?: number | null
          period_end: string
          period_start: string
          period_type: string
          reliability_rate?: number | null
          source: string
          total_completed?: number
          total_dead_letter?: number
          total_failed?: number
          total_received?: number
        }
        Update: {
          avg_processing_time_ms?: number | null
          calculated_at?: string
          id?: string
          max_processing_time_ms?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          reliability_rate?: number | null
          source?: string
          total_completed?: number
          total_dead_letter?: number
          total_failed?: number
          total_received?: number
        }
        Relationships: []
      }
      workflow_executions: {
        Row: {
          completed_at: string | null
          completed_nodes: string[] | null
          current_node_id: string | null
          error: string | null
          failed_nodes: string[] | null
          id: string
          logs: Json | null
          node_outputs: Json | null
          started_at: string
          status: string
          updated_at: string
          user_id: string | null
          variables: Json | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_nodes?: string[] | null
          current_node_id?: string | null
          error?: string | null
          failed_nodes?: string[] | null
          id?: string
          logs?: Json | null
          node_outputs?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          variables?: Json | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          completed_nodes?: string[] | null
          current_node_id?: string | null
          error?: string | null
          failed_nodes?: string[] | null
          id?: string
          logs?: Json | null
          node_outputs?: Json | null
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string | null
          variables?: Json | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_executions_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_instances: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          started_at: string
          status: string
          template_id: string | null
          trigger_entity_id: string | null
          trigger_entity_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string
          template_id?: string | null
          trigger_entity_id?: string | null
          trigger_entity_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          started_at?: string
          status?: string
          template_id?: string | null
          trigger_entity_id?: string | null
          trigger_entity_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_instances_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_template_actions: {
        Row: {
          action_config: Json | null
          action_type: string
          created_at: string
          id: string
          order: number
          template_id: string
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          created_at?: string
          id?: string
          order?: number
          template_id: string
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          order?: number
          template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_template_actions_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          trigger_conditions: Json | null
          trigger_event: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          trigger_conditions?: Json | null
          trigger_event: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          trigger_conditions?: Json | null
          trigger_event?: string
          updated_at?: string
        }
        Relationships: []
      }
      workflows: {
        Row: {
          created_at: string
          created_by: string | null
          definition: Json
          description: string | null
          id: string
          is_published: boolean | null
          is_template: boolean | null
          name: string
          skill_compatibility: string[] | null
          tags: string[] | null
          updated_at: string
          user_id: string | null
          version: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          definition: Json
          description?: string | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          name: string
          skill_compatibility?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          version?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          definition?: Json
          description?: string | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          name?: string
          skill_compatibility?: string[] | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string | null
          version?: string
        }
        Relationships: []
      }
      workshop_bookings: {
        Row: {
          actual_hours: number | null
          booking_number: string
          contractor_id: string | null
          created_at: string
          customer_notes: string | null
          equipment_id: string
          estimated_end_datetime: string | null
          hours_on_completion: number | null
          id: string
          location: string
          parts_ordered_at: string | null
          purchase_order_id: string | null
          scheduled_date: string
          service_request_id: string | null
          service_template_id: string | null
          status: Database["public"]["Enums"]["booking_status_enum"]
          technician_notes: string | null
          updated_at: string
        }
        Insert: {
          actual_hours?: number | null
          booking_number: string
          contractor_id?: string | null
          created_at?: string
          customer_notes?: string | null
          equipment_id: string
          estimated_end_datetime?: string | null
          hours_on_completion?: number | null
          id?: string
          location: string
          parts_ordered_at?: string | null
          purchase_order_id?: string | null
          scheduled_date: string
          service_request_id?: string | null
          service_template_id?: string | null
          status?: Database["public"]["Enums"]["booking_status_enum"]
          technician_notes?: string | null
          updated_at?: string
        }
        Update: {
          actual_hours?: number | null
          booking_number?: string
          contractor_id?: string | null
          created_at?: string
          customer_notes?: string | null
          equipment_id?: string
          estimated_end_datetime?: string | null
          hours_on_completion?: number | null
          id?: string
          location?: string
          parts_ordered_at?: string | null
          purchase_order_id?: string | null
          scheduled_date?: string
          service_request_id?: string | null
          service_template_id?: string | null
          status?: Database["public"]["Enums"]["booking_status_enum"]
          technician_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workshop_bookings_contractor_id_fkey"
            columns: ["contractor_id"]
            isOneToOne: false
            referencedRelation: "contractors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_bookings_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_bookings_service_request_id_fkey"
            columns: ["service_request_id"]
            isOneToOne: false
            referencedRelation: "service_requests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workshop_bookings_service_template_id_fkey"
            columns: ["service_template_id"]
            isOneToOne: false
            referencedRelation: "service_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      xero_connections: {
        Row: {
          access_token: string
          created_at: string
          expires_at: string
          id: string
          is_active: boolean
          last_synced_at: string | null
          organization_id: string | null
          refresh_token: string
          scopes: Json
          tenant_id: string
          tenant_name: string | null
          updated_at: string
        }
        Insert: {
          access_token: string
          created_at?: string
          expires_at: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          organization_id?: string | null
          refresh_token: string
          scopes?: Json
          tenant_id: string
          tenant_name?: string | null
          updated_at?: string
        }
        Update: {
          access_token?: string
          created_at?: string
          expires_at?: string
          id?: string
          is_active?: boolean
          last_synced_at?: string | null
          organization_id?: string | null
          refresh_token?: string
          scopes?: Json
          tenant_id?: string
          tenant_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      agent_run_summaries: {
        Row: {
          agent_name: string | null
          completed_at: string | null
          current_step: string | null
          duration_seconds: number | null
          id: string | null
          progress_percent: number | null
          started_at: string | null
          status: string | null
          task_description: string | null
          task_id: string | null
          updated_at: string | null
          user_id: string | null
          verification_attempts: number | null
        }
        Relationships: [
          {
            foreignKeyName: "agent_runs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      cleanup_expired_evidence: { Args: never; Returns: number }
      find_similar_memories: {
        Args: {
          filter_domain?: string
          filter_user_id?: string
          match_count?: number
          match_threshold?: number
          query_embedding: string
        }
        Returns: {
          category: string
          domain: string
          id: string
          key: string
          similarity: number
          value: Json
        }[]
      }
      get_active_agent_runs: {
        Args: { p_user_id: string }
        Returns: {
          agent_name: string
          current_step: string
          id: string
          progress_percent: number
          started_at: string
          status: string
        }[]
      }
      increment_memory_access: {
        Args: { memory_id: string }
        Returns: undefined
      }
      match_documents: {
        Args: {
          match_count: number
          match_threshold: number
          query_embedding: string
        }
        Returns: {
          content: string
          id: string
          similarity: number
          title: string
        }[]
      }
      prune_stale_memories: {
        Args: { max_age_days?: number; min_relevance?: number }
        Returns: number
      }
    }
    Enums: {
      ap2_connection_status: "pending" | "active" | "expired" | "revoked"
      ap2_mandate_status:
        | "pending"
        | "verified"
        | "executed"
        | "expired"
        | "revoked"
      ap2_mandate_type: "intent" | "cart" | "payment"
      ap2_transaction_status:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "refunded"
      ap2_voice_session_status: "active" | "completed" | "abandoned" | "error"
      australian_state:
        | "QLD"
        | "NSW"
        | "VIC"
        | "SA"
        | "WA"
        | "TAS"
        | "NT"
        | "ACT"
      availability_status: "available" | "booked" | "tentative" | "unavailable"
      backorder_status:
        | "pending"
        | "allocated"
        | "ready"
        | "fulfilled"
        | "cancelled"
      booking_status:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      booking_status_enum:
        | "scheduled"
        | "confirmed"
        | "in_progress"
        | "completed"
        | "cancelled"
        | "no_show"
      container_status:
        | "booked"
        | "in_transit"
        | "at_port"
        | "customs_clearance"
        | "cleared"
        | "out_for_delivery"
        | "delivered"
        | "cancelled"
      equipment_status: "active" | "in_service" | "retired"
      equipment_status_enum: "active" | "in_service" | "retired"
      insight_priority_enum: "high" | "medium" | "low"
      insight_type_enum:
        | "prompt_improvement"
        | "process_optimization"
        | "error_prevention"
      marketplace_channel_type: "shopify" | "ebay" | "facebook"
      marketplace_connection_status:
        | "connected"
        | "disconnected"
        | "error"
        | "pending"
      marketplace_listing_status:
        | "active"
        | "draft"
        | "inactive"
        | "error"
        | "pending"
      marketplace_order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      marketplace_sync_status:
        | "success"
        | "failed"
        | "in_progress"
        | "pending"
        | "partial"
      pattern_type_enum: "success" | "failure" | "optimization"
      reminder_status: "pending" | "sent" | "failed" | "suppressed"
      reminder_status_enum: "pending" | "sent" | "failed" | "suppressed"
      request_type_enum: "repair" | "maintenance" | "installation"
      service_status_enum:
        | "submitted"
        | "quoted"
        | "approved"
        | "in_progress"
        | "completed"
        | "cancelled"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      ap2_connection_status: ["pending", "active", "expired", "revoked"],
      ap2_mandate_status: [
        "pending",
        "verified",
        "executed",
        "expired",
        "revoked",
      ],
      ap2_mandate_type: ["intent", "cart", "payment"],
      ap2_transaction_status: [
        "pending",
        "processing",
        "completed",
        "failed",
        "refunded",
      ],
      ap2_voice_session_status: ["active", "completed", "abandoned", "error"],
      australian_state: ["QLD", "NSW", "VIC", "SA", "WA", "TAS", "NT", "ACT"],
      availability_status: ["available", "booked", "tentative", "unavailable"],
      backorder_status: [
        "pending",
        "allocated",
        "ready",
        "fulfilled",
        "cancelled",
      ],
      booking_status: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      booking_status_enum: [
        "scheduled",
        "confirmed",
        "in_progress",
        "completed",
        "cancelled",
        "no_show",
      ],
      container_status: [
        "booked",
        "in_transit",
        "at_port",
        "customs_clearance",
        "cleared",
        "out_for_delivery",
        "delivered",
        "cancelled",
      ],
      equipment_status: ["active", "in_service", "retired"],
      equipment_status_enum: ["active", "in_service", "retired"],
      insight_priority_enum: ["high", "medium", "low"],
      insight_type_enum: [
        "prompt_improvement",
        "process_optimization",
        "error_prevention",
      ],
      marketplace_channel_type: ["shopify", "ebay", "facebook"],
      marketplace_connection_status: [
        "connected",
        "disconnected",
        "error",
        "pending",
      ],
      marketplace_listing_status: [
        "active",
        "draft",
        "inactive",
        "error",
        "pending",
      ],
      marketplace_order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      marketplace_sync_status: [
        "success",
        "failed",
        "in_progress",
        "pending",
        "partial",
      ],
      pattern_type_enum: ["success", "failure", "optimization"],
      reminder_status: ["pending", "sent", "failed", "suppressed"],
      reminder_status_enum: ["pending", "sent", "failed", "suppressed"],
      request_type_enum: ["repair", "maintenance", "installation"],
      service_status_enum: [
        "submitted",
        "quoted",
        "approved",
        "in_progress",
        "completed",
        "cancelled",
      ],
    },
  },
} as const

// Convenience row type aliases
export type Contact = Database['public']['Tables']['contacts']['Row']
export type UserSettings = Database['public']['Tables']['user_settings']['Row']
