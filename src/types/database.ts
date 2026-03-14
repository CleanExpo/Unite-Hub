/**
 * Database Types for Supabase Tables
 * Nexus 2.0 — Generated from active migration files
 * Last updated: 15/03/2026
 *
 * Tables (21):
 *   businesses, contacts, nexus_pages, nexus_databases, nexus_rows,
 *   credentials_vault, approval_queue, social_channels, connected_projects,
 *   bookkeeper_runs, bookkeeper_transactions,
 *   advisory_cases, advisory_proposals, advisory_evidence, advisory_judge_scores,
 *   user_settings, social_posts, coach_reports,
 *   experiments, experiment_variants, experiment_results,
 *   skill_health
 */

export type Database = {
  public: {
    Tables: {
      // ── 20260309000000_nexus_schema ──────────────────────────

      businesses: {
        Row: {
          id: string;
          founder_id: string;
          name: string;
          slug: string;
          domain: string | null;
          description: string | null;
          status: 'active' | 'inactive' | 'archived';
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['businesses']['Row'], 'id' | 'status' | 'metadata' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['businesses']['Insert']>;
      };

      contacts: {
        Row: {
          id: string;
          founder_id: string;
          business_id: string | null;
          first_name: string | null;
          last_name: string | null;
          email: string | null;
          phone: string | null;
          company: string | null;
          role: string | null;
          status: 'lead' | 'prospect' | 'client' | 'churned' | 'archived';
          tags: string[];
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'status' | 'tags' | 'metadata' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };

      nexus_pages: {
        Row: {
          id: string;
          founder_id: string;
          parent_id: string | null;
          business_id: string | null;
          title: string;
          icon: string | null;
          cover_url: string | null;
          content: Record<string, unknown>;
          is_published: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nexus_pages']['Row'], 'id' | 'title' | 'content' | 'is_published' | 'sort_order' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['nexus_pages']['Insert']>;
      };

      nexus_databases: {
        Row: {
          id: string;
          founder_id: string;
          page_id: string | null;
          business_id: string | null;
          name: string;
          schema: Record<string, unknown>;
          view_type: 'table' | 'kanban' | 'calendar' | 'gallery';
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nexus_databases']['Row'], 'id' | 'schema' | 'view_type' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['nexus_databases']['Insert']>;
      };

      nexus_rows: {
        Row: {
          id: string;
          founder_id: string;
          database_id: string;
          properties: Record<string, unknown>;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['nexus_rows']['Row'], 'id' | 'properties' | 'sort_order' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['nexus_rows']['Insert']>;
      };

      credentials_vault: {
        Row: {
          id: string;
          founder_id: string;
          business_id: string | null;
          label: string;
          service: string;
          encrypted_value: string;
          iv: string;
          salt: string;
          notes: string | null;
          metadata: Record<string, unknown>;
          last_accessed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['credentials_vault']['Row'], 'id' | 'metadata' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['credentials_vault']['Insert']>;
      };

      approval_queue: {
        Row: {
          id: string;
          founder_id: string;
          business_id: string | null;
          type: string;
          title: string;
          description: string | null;
          payload: Record<string, unknown>;
          status: 'pending' | 'approved' | 'rejected' | 'executed' | 'expired';
          expires_at: string | null;
          approved_at: string | null;
          executed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['approval_queue']['Row'], 'id' | 'payload' | 'status' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['approval_queue']['Insert']>;
      };

      social_channels: {
        Row: {
          id: string;
          founder_id: string;
          business_id: string;
          platform: 'facebook' | 'instagram' | 'linkedin' | 'tiktok' | 'youtube' | 'twitter';
          channel_name: string;
          channel_id: string | null;
          access_token_encrypted: string | null;
          refresh_token_encrypted: string | null;
          token_expires_at: string | null;
          is_connected: boolean;
          metadata: Record<string, unknown>;
          // Added by 20260312000001_social_content_calendar
          business_key: string | null;
          handle: string | null;
          name: string | null;
          follower_count: number;
          profile_image_url: string | null;
          last_synced_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['social_channels']['Row'], 'id' | 'is_connected' | 'metadata' | 'follower_count' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['social_channels']['Insert']>;
      };

      connected_projects: {
        Row: {
          id: string;
          founder_id: string;
          business_id: string | null;
          provider: 'linear' | 'github' | 'jira';
          provider_project_id: string;
          provider_project_name: string;
          sync_enabled: boolean;
          last_synced_at: string | null;
          metadata: Record<string, unknown>;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['connected_projects']['Row'], 'id' | 'sync_enabled' | 'metadata' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['connected_projects']['Insert']>;
      };

      // ── 20260310000000_bookkeeper_tables ─────────────────────

      bookkeeper_runs: {
        Row: {
          id: string;
          founder_id: string;
          started_at: string;
          completed_at: string | null;
          status: 'running' | 'completed' | 'partial' | 'failed';
          businesses_processed: Record<string, unknown>;
          total_transactions: number;
          auto_reconciled: number;
          flagged_for_review: number;
          failed_count: number;
          gst_collected_cents: number;
          gst_paid_cents: number;
          net_gst_cents: number;
          error_log: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookkeeper_runs']['Row'], 'id' | 'businesses_processed' | 'total_transactions' | 'auto_reconciled' | 'flagged_for_review' | 'failed_count' | 'gst_collected_cents' | 'gst_paid_cents' | 'net_gst_cents' | 'error_log' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['bookkeeper_runs']['Insert']>;
      };

      bookkeeper_transactions: {
        Row: {
          id: string;
          run_id: string;
          founder_id: string;
          business_key: string;
          xero_tenant_id: string;
          xero_transaction_id: string;
          transaction_date: string;
          description: string | null;
          amount_cents: number;
          currency: string;
          reconciliation_status: 'auto_matched' | 'suggested_match' | 'unmatched' | 'manual_review' | 'reconciled';
          confidence_score: number;
          matched_invoice_id: string | null;
          matched_bill_id: string | null;
          tax_code: string | null;
          gst_amount_cents: number;
          tax_category: string | null;
          is_deductible: boolean;
          deduction_category: string | null;
          deduction_notes: string | null;
          approval_queue_id: string | null;
          approved_by: string | null;
          approved_at: string | null;
          raw_xero_data: Record<string, unknown> | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['bookkeeper_transactions']['Row'], 'id' | 'currency' | 'confidence_score' | 'gst_amount_cents' | 'is_deductible' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['bookkeeper_transactions']['Insert']>;
      };

      // ── 20260311000000_advisory_schema ───────────────────────

      advisory_cases: {
        Row: {
          id: string;
          founder_id: string;
          business_id: string | null;
          title: string;
          scenario: string;
          financial_context: Record<string, unknown>;
          status: 'draft' | 'debating' | 'judged' | 'pending_review' | 'approved' | 'rejected' | 'executed' | 'closed';
          current_round: number;
          total_rounds: number;
          winning_firm: string | null;
          judge_summary: string | null;
          judge_scores: Record<string, unknown> | null;
          accountant_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          approval_queue_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisory_cases']['Row'], 'id' | 'financial_context' | 'status' | 'current_round' | 'total_rounds' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['advisory_cases']['Insert']>;
      };

      advisory_proposals: {
        Row: {
          id: string;
          case_id: string;
          founder_id: string;
          firm_key: 'tax_strategy' | 'grants_incentives' | 'cashflow_optimisation' | 'compliance';
          round: number;
          round_type: 'proposal' | 'rebuttal' | 'counterargument' | 'risk_assessment' | 'final_recommendation';
          content: string;
          structured_data: Record<string, unknown>;
          confidence_score: number | null;
          risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
          model_used: string | null;
          input_tokens: number | null;
          output_tokens: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisory_proposals']['Row'], 'id' | 'structured_data' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['advisory_proposals']['Insert']>;
      };

      advisory_evidence: {
        Row: {
          id: string;
          proposal_id: string;
          case_id: string;
          founder_id: string;
          citation_type: 'ato_ruling' | 'legislation' | 'case_law' | 'ato_guidance' | 'industry_standard';
          reference_id: string;
          reference_title: string;
          excerpt: string | null;
          relevance_score: number | null;
          url: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisory_evidence']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['advisory_evidence']['Insert']>;
      };

      advisory_judge_scores: {
        Row: {
          id: string;
          case_id: string;
          founder_id: string;
          firm_key: 'tax_strategy' | 'grants_incentives' | 'cashflow_optimisation' | 'compliance';
          legality_score: number;
          compliance_risk_score: number;
          financial_outcome_score: number;
          documentation_score: number;
          ethics_score: number;
          weighted_total: number;
          rationale: string;
          risk_flags: Record<string, unknown>;
          audit_triggers: Record<string, unknown>;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['advisory_judge_scores']['Row'], 'id' | 'risk_flags' | 'audit_triggers' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['advisory_judge_scores']['Insert']>;
      };

      // ── 20260312000000_user_settings_table + 20260316000000_notification_channels ──

      user_settings: {
        Row: {
          id: string;
          user_id: string;
          timezone: string;
          locale: string;
          notification_digest: boolean;
          notification_alerts: boolean;
          notification_cases: boolean;
          google_drive_vault_folder_id: string | null;
          // Added by 20260316000000_notification_channels
          slack_webhook_url: string | null;
          slack_channel: string | null;
          notification_slack: boolean;
          notification_whatsapp: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['user_settings']['Row'], 'id' | 'timezone' | 'locale' | 'notification_digest' | 'notification_alerts' | 'notification_cases' | 'slack_channel' | 'notification_slack' | 'notification_whatsapp' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['user_settings']['Insert']>;
      };

      // ── 20260312000001_social_content_calendar + 20260314000000 + 20260315000000 ──

      social_posts: {
        Row: {
          id: string;
          founder_id: string;
          business_key: string;
          title: string | null;
          content: string;
          media_urls: Record<string, unknown>;
          platforms: Record<string, unknown>;
          status: 'draft' | 'scheduled' | 'publishing' | 'published' | 'failed';
          scheduled_at: string | null;
          published_at: string | null;
          platform_post_ids: Record<string, unknown>;
          error_message: string | null;
          // Added by 20260315000000_experiments_schema
          experiment_variant_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['social_posts']['Row'], 'id' | 'media_urls' | 'platforms' | 'status' | 'platform_post_ids' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['social_posts']['Insert']>;
      };

      // ── 20260313000000_coach_reports ─────────────────────────

      coach_reports: {
        Row: {
          id: string;
          founder_id: string;
          coach_type: 'revenue' | 'build' | 'marketing' | 'life';
          business_key: string | null;
          report_date: string;
          status: 'pending' | 'running' | 'completed' | 'failed';
          brief_markdown: string | null;
          raw_data: Record<string, unknown> | null;
          metrics: Record<string, unknown> | null;
          input_tokens: number | null;
          output_tokens: number | null;
          model: string | null;
          duration_ms: number | null;
          error_message: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['coach_reports']['Row'], 'id' | 'report_date' | 'status' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['coach_reports']['Insert']>;
      };

      // ── 20260315000000_experiments_schema ────────────────────

      experiments: {
        Row: {
          id: string;
          founder_id: string;
          business_key: string;
          title: string;
          hypothesis: string;
          experiment_type: 'social_copy' | 'social_media' | 'social_timing' | 'social_platform' | 'cta_variation' | 'subject_line' | 'landing_page' | 'offer_test';
          status: 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
          generated_by: 'synthex_ai' | 'manual' | null;
          ai_rationale: string | null;
          metric_primary: 'engagement' | 'clicks' | 'conversions' | 'reach';
          metric_secondary: string | null;
          sample_size_target: number | null;
          confidence_level: number;
          started_at: string | null;
          ended_at: string | null;
          winner_variant_id: string | null;
          conclusion: string | null;
          approval_queue_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['experiments']['Row'], 'id' | 'status' | 'metric_primary' | 'confidence_level' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['experiments']['Insert']>;
      };

      experiment_variants: {
        Row: {
          id: string;
          experiment_id: string;
          founder_id: string;
          variant_key: string;
          label: string;
          description: string | null;
          content: string | null;
          media_urls: Record<string, unknown>;
          cta_text: string | null;
          scheduled_time: string | null;
          platforms: Record<string, unknown>;
          is_control: boolean;
          weight: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['experiment_variants']['Row'], 'id' | 'media_urls' | 'platforms' | 'is_control' | 'weight' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['experiment_variants']['Insert']>;
      };

      experiment_results: {
        Row: {
          id: string;
          variant_id: string;
          experiment_id: string;
          founder_id: string;
          period_date: string;
          impressions: number;
          reach: number;
          clicks: number;
          likes: number;
          comments: number;
          shares: number;
          saves: number;
          conversions: number;
          conversion_value_cents: number;
          platform_data: Record<string, unknown>;
          source: 'manual' | 'api_sync' | 'webhook';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['experiment_results']['Row'], 'id' | 'impressions' | 'reach' | 'clicks' | 'likes' | 'comments' | 'shares' | 'saves' | 'conversions' | 'conversion_value_cents' | 'platform_data' | 'source' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['experiment_results']['Insert']>;
      };

      // ── 20260317000000_skill_health ──────────────────────────

      skill_health: {
        Row: {
          id: string;
          founder_id: string;
          skill_name: string;
          eval_count: number;
          pass_count: number;
          pass_rate: number;
          run_at: string;
        };
        Insert: Omit<Database['public']['Tables']['skill_health']['Row'], 'id' | 'run_at'>;
        Update: Partial<Database['public']['Tables']['skill_health']['Insert']>;
      };
    };
  };
};

// ── Helper types ────────────────────────────────────────────────
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// ── Named exports for commonly used types ───────────────────────
export type BusinessRow = Tables<'businesses'>;
export type ContactRow = Tables<'contacts'>;
export type NexusPageRow = Tables<'nexus_pages'>;
export type NexusDatabaseRow = Tables<'nexus_databases'>;
export type NexusRowRow = Tables<'nexus_rows'>;
export type CredentialsVaultRow = Tables<'credentials_vault'>;
export type ApprovalQueueRow = Tables<'approval_queue'>;
export type SocialChannelRow = Tables<'social_channels'>;
export type ConnectedProjectRow = Tables<'connected_projects'>;
export type BookkeeperRunRow = Tables<'bookkeeper_runs'>;
export type BookkeeperTransactionRow = Tables<'bookkeeper_transactions'>;
export type AdvisoryCaseRow = Tables<'advisory_cases'>;
export type AdvisoryProposalRow = Tables<'advisory_proposals'>;
export type AdvisoryEvidenceRow = Tables<'advisory_evidence'>;
export type AdvisoryJudgeScoreRow = Tables<'advisory_judge_scores'>;
export type SocialPostRow = Tables<'social_posts'>;
export type CoachReportRow = Tables<'coach_reports'>;
export type ExperimentRow = Tables<'experiments'>;
export type ExperimentVariantRow = Tables<'experiment_variants'>;
export type ExperimentResultRow = Tables<'experiment_results'>;
export type SkillHealthRow = Tables<'skill_health'>;

// ── Backward-compatible aliases ─────────────────────────────────
export type Contact = Tables<'contacts'>;

// ── UserSettings (matches user_settings table with notification columns) ──
export type UserSettings = Tables<'user_settings'>;
