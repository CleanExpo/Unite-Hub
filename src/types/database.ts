/**
 * Database Types for Supabase Tables
 * Auto-generated types matching the database schema
 */

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          website: string | null;
          team_size: string | null;
          industry: string | null;
          plan: 'starter' | 'professional' | 'enterprise';
          status: 'active' | 'trial' | 'cancelled';
          trial_ends_at: string | null;
          stripe_customer_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
      };

      workspaces: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workspaces']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['workspaces']['Insert']>;
      };

      team_members: {
        Row: {
          id: string;
          org_id: string;
          name: string;
          role: string;
          email: string;
          phone: string | null;
          avatar_url: string | null;
          initials: string;
          capacity_hours: number;
          hours_allocated: number;
          status: 'available' | 'near-capacity' | 'over-capacity';
          current_projects: number;
          skills: string[];
          join_date: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['team_members']['Row'], 'id' | 'status' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['team_members']['Insert']>;
      };

      projects: {
        Row: {
          id: string;
          org_id: string;
          workspace_id: string | null;
          title: string;
          client_name: string;
          description: string | null;
          status: 'on-track' | 'at-risk' | 'delayed' | 'completed' | 'archived';
          priority: 'high' | 'medium' | 'low';
          progress: number;
          due_date: string | null;
          start_date: string | null;
          completed_date: string | null;
          budget_amount: number | null;
          budget_currency: string;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['projects']['Row'], 'id' | 'category' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['projects']['Insert']>;
      };

      project_assignees: {
        Row: {
          id: string;
          project_id: string;
          team_member_id: string;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_assignees']['Row'], 'id' | 'assigned_at'>;
        Update: Partial<Database['public']['Tables']['project_assignees']['Insert']>;
      };

      project_milestones: {
        Row: {
          id: string;
          project_id: string;
          title: string;
          description: string | null;
          status: 'completed' | 'in-progress' | 'pending';
          due_date: string | null;
          completed_date: string | null;
          order_index: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_milestones']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['project_milestones']['Insert']>;
      };

      approvals: {
        Row: {
          id: string;
          org_id: string;
          project_id: string | null;
          title: string;
          description: string | null;
          client_name: string | null;
          type: 'design' | 'content' | 'video' | 'document';
          priority: 'high' | 'medium' | 'low';
          status: 'pending' | 'approved' | 'declined';
          asset_url: string | null;
          submitted_by_id: string | null;
          submitted_by_name: string;
          reviewed_by_id: string | null;
          reviewed_at: string | null;
          decline_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['approvals']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['approvals']['Insert']>;
      };

      deliverables: {
        Row: {
          id: string;
          project_id: string;
          name: string;
          file_type: 'pdf' | 'image' | 'video' | 'zip' | 'other';
          file_size: string;
          file_url: string;
          description: string | null;
          uploaded_at: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deliverables']['Row'], 'id' | 'uploaded_at' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['deliverables']['Insert']>;
      };

      project_messages: {
        Row: {
          id: string;
          project_id: string;
          author_id: string | null;
          author_name: string;
          author_initials: string;
          author_role: string | null;
          message_text: string;
          is_client: boolean;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['project_messages']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['project_messages']['Insert']>;
      };

      intake_submissions: {
        Row: {
          id: string;
          org_id: string | null;
          services: string[];
          project_description: string;
          budget: string;
          timeline: string;
          company_name: string;
          contact_name: string;
          email: string;
          phone: string | null;
          file_urls: string[];
          status: 'pending' | 'approved' | 'declined' | 'contacted';
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['intake_submissions']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['intake_submissions']['Insert']>;
      };

      contacts: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          email: string;
          company: string | null;
          phone: string | null;
          job_title: string | null;
          ai_score: number;
          status: 'prospect' | 'lead' | 'customer' | 'contact';
          last_interaction: string | null;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['contacts']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['contacts']['Insert']>;
      };

      campaigns: {
        Row: {
          id: string;
          workspace_id: string;
          name: string;
          description: string | null;
          status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
          sent_count: number;
          opened_count: number;
          clicked_count: number;
          replied_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['campaigns']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['campaigns']['Insert']>;
      };
    };
  };
};

// Helper types for easier use
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];

// Specific table types
export type TeamMember = Tables<'team_members'>;
export type Project = Tables<'projects'>;
export type ProjectAssignee = Tables<'project_assignees'>;
export type ProjectMilestone = Tables<'project_milestones'>;
export type Approval = Tables<'approvals'>;
export type Deliverable = Tables<'deliverables'>;
export type ProjectMessage = Tables<'project_messages'>;
export type IntakeSubmission = Tables<'intake_submissions'>;
export type Organization = Tables<'organizations'>;
export type Workspace = Tables<'workspaces'>;
export type Contact = Tables<'contacts'>;
export type Campaign = Tables<'campaigns'>;

// Extended types with joins
export type ProjectWithAssignees = Project & {
  assignees: Array<{
    team_member: TeamMember;
  }>;
};

export type ProjectWithMilestones = Project & {
  milestones: ProjectMilestone[];
};

export type ProjectWithDeliverables = Project & {
  deliverables: Deliverable[];
};

export type ProjectFull = Project & {
  assignees: Array<{
    team_member: TeamMember;
  }>;
  milestones: ProjectMilestone[];
  deliverables: Deliverable[];
  messages: ProjectMessage[];
};
