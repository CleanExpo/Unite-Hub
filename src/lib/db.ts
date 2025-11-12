import { supabase, supabaseServer } from "./supabase";

// Organizations
export const db = {
  organizations: {
    create: async (data: any) => {
      const { data: org, error } = await supabaseServer
        .from("organizations")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return org;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    update: async (id: string, data: any) => {
      const { data: org, error } = await supabaseServer
        .from("organizations")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return org;
    },
    getByStripeCustomerId: async (customerId: string) => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .eq("stripe_customer_id", customerId)
        .single();
      if (error) throw error;
      return data;
    },
    listAll: async () => {
      const { data, error } = await supabase
        .from("organizations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return { data };
    },
  },

  // Workspaces
  workspaces: {
    create: async (data: any) => {
      const { data: workspace, error } = await supabaseServer
        .from("workspaces")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return workspace;
    },
    listByOrg: async (orgId: string) => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("org_id", orgId);
      if (error) throw error;
      return data;
    },
  },

  // Contacts
  contacts: {
    create: async (data: any) => {
      const { data: contact, error } = await supabaseServer
        .from("contacts")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return contact;
    },
    createIfNotExists: async (data: any) => {
      // Check if contact exists by email
      const { data: existing } = await supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", data.workspace_id)
        .eq("email", data.email)
        .single();

      if (existing) {
        return existing;
      }

      // Create new contact with defaults
      const { data: contact, error } = await supabaseServer
        .from("contacts")
        .insert([{
          ...data,
          ai_score: 0.5,
          status: "contact",
          tags: [],
        }])
        .select()
        .single();

      if (error) throw error;
      return contact;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    listByWorkspace: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("ai_score", { ascending: false });
      if (error) throw error;
      return data;
    },
    updateScore: async (id: string, score: number) => {
      const { data, error } = await supabaseServer
        .from("contacts")
        .update({ ai_score: score, updated_at: new Date() })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    updateIntelligence: async (id: string, intelligence: any) => {
      const { data, error } = await supabaseServer
        .from("contacts")
        .update({
          ...intelligence,
          last_analysis_at: new Date(),
          updated_at: new Date(),
        })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    getWithEmails: async (id: string) => {
      const contact = await db.contacts.getById(id);
      const emails = await db.emails.getByContact(id);
      return { ...contact, emails };
    },
    getHighestScored: async (workspaceId: string, limit = 10) => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("ai_score", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    getByEmail: async (email: string, workspaceId: string) => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("email", email)
        .eq("workspace_id", workspaceId)
        .single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows found
      return data || null;
    },
  },

  // Emails
  emails: {
    create: async (data: any) => {
      const { data: email, error } = await supabaseServer
        .from("emails")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return email;
    },
    getByContact: async (contactId: string) => {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("contact_id", contactId)
        .order("received_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    getUnprocessed: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from("emails")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("is_processed", false);
      if (error) throw error;
      return data;
    },
    markProcessed: async (id: string) => {
      const { error } = await supabaseServer
        .from("emails")
        .update({ is_processed: true, updated_at: new Date() })
        .eq("id", id);
      if (error) throw error;
    },
    updateSentiment: async (id: string, sentiment: any) => {
      const { error } = await supabaseServer
        .from("emails")
        .update(sentiment)
        .eq("id", id);
      if (error) throw error;
    },
  },

  // Generated Content
  content: {
    create: async (data: any) => {
      const { data: content, error } = await supabaseServer
        .from("generated_content")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return content;
    },
    getDrafts: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("status", "draft");
      if (error) throw error;
      return data;
    },
    listByWorkspace: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    approve: async (id: string) => {
      const { error } = await supabaseServer
        .from("generated_content")
        .update({ status: "approved", updated_at: new Date() })
        .eq("id", id);
      if (error) throw error;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("generated_content")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    updateStatus: async (id: string, status: string) => {
      const { error } = await supabaseServer
        .from("generated_content")
        .update({ status, updated_at: new Date() })
        .eq("id", id);
      if (error) throw error;
    },
  },

  // Email Variants (A/B Testing)
  emailVariants: {
    create: async (data: any) => {
      const { data: variant, error } = await supabaseServer
        .from("email_variants")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return variant;
    },
    getByContent: async (contentId: string) => {
      const { data, error } = await supabase
        .from("email_variants")
        .select("*")
        .eq("content_id", contentId);
      if (error) throw error;
      return data || [];
    },
  },

  // Campaigns
  campaigns: {
    create: async (data: any) => {
      const { data: campaign, error } = await supabaseServer
        .from("campaigns")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return campaign;
    },
    listByWorkspace: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  },

  // Contact Interactions
  interactions: {
    create: async (data: any) => {
      const { error } = await supabaseServer
        .from("contact_interactions")
        .insert([data]);
      if (error) throw error;
    },
    getByContact: async (contactId: string) => {
      const { data, error } = await supabase
        .from("contact_interactions")
        .select("*")
        .eq("contact_id", contactId)
        .order("interaction_date", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  },

  // Audit Logs
  auditLogs: {
    create: async (data: any) => {
      const { error } = await supabaseServer
        .from("audit_logs")
        .insert([data]);
      if (error) throw error;
    },
    getByOrg: async (orgId: string, limit = 50) => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .eq("org_id", orgId)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
    logAgentRun: async (orgId: string, agentName: string, details: any) => {
      await db.auditLogs.create({
        org_id: orgId,
        action: "agent_run",
        resource: "ai_agent",
        agent: agentName,
        status: details.status || "success",
        details,
        error_message: details.error,
      });
    },
  },

  // Email Integrations (Gmail, Outlook, etc.)
  emailIntegrations: {
    create: async (data: any) => {
      const { data: integration, error } = await supabaseServer
        .from("email_integrations")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return integration;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("email_integrations")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    getByOrg: async (orgId: string) => {
      const { data, error } = await supabase
        .from("email_integrations")
        .select("*")
        .eq("org_id", orgId)
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    update: async (id: string, data: any) => {
      const { error } = await supabaseServer
        .from("email_integrations")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
  },

  // Sent Emails (Email Tracking)
  sentEmails: {
    create: async (data: any) => {
      const { data: email, error } = await supabaseServer
        .from("sent_emails")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return email;
    },
    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("sent_emails")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },
    recordOpen: async (sentEmailId: string, metadata: any) => {
      await supabaseServer
        .from("email_opens")
        .insert([{ sent_email_id: sentEmailId, ...metadata }]);

      // Increment opens count
      const email = await db.sentEmails.getById(sentEmailId);
      await supabaseServer
        .from("sent_emails")
        .update({
          opens: (email.opens || 0) + 1,
          first_open_at: email.first_open_at || new Date(),
        })
        .eq("id", sentEmailId);
    },
    recordClick: async (sentEmailId: string, linkUrl: string, metadata: any) => {
      await supabaseServer
        .from("email_clicks")
        .insert([
          {
            sent_email_id: sentEmailId,
            link_url: linkUrl,
            ...metadata,
          },
        ]);

      // Increment clicks count
      const email = await db.sentEmails.getById(sentEmailId);
      await supabaseServer
        .from("sent_emails")
        .update({
          clicks: (email.clicks || 0) + 1,
          first_click_at: email.first_click_at || new Date(),
        })
        .eq("id", sentEmailId);
    },
  },

  // Drip Campaigns
  dripCampaigns: {
    create: async (data: any) => {
      const { data: campaign, error } = await supabaseServer
        .from("drip_campaigns")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return campaign;
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("drip_campaigns")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    listByWorkspace: async (workspaceId: string) => {
      const { data, error } = await supabase
        .from("drip_campaigns")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    update: async (id: string, data: any) => {
      const { error } = await supabaseServer
        .from("drip_campaigns")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },

    delete: async (id: string) => {
      const { error } = await supabaseServer
        .from("drip_campaigns")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
  },

  // Campaign Steps
  campaignSteps: {
    create: async (data: any) => {
      const { data: step, error } = await supabaseServer
        .from("campaign_steps")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return step;
    },

    getByCampaign: async (campaignId: string) => {
      const { data, error } = await supabase
        .from("campaign_steps")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("step_number");
      if (error) throw error;
      return data || [];
    },

    update: async (id: string, data: any) => {
      const { error } = await supabaseServer
        .from("campaign_steps")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },

    delete: async (id: string) => {
      const { error } = await supabaseServer
        .from("campaign_steps")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
  },

  // Campaign Enrollments
  campaignEnrollments: {
    create: async (data: any) => {
      const { data: enrollment, error } = await supabaseServer
        .from("campaign_enrollments")
        .insert([data])
        .select()
        .single();
      if (error) throw error;
      return enrollment;
    },

    getByContactAndCampaign: async (contactId: string, campaignId: string) => {
      const { data, error } = await supabase
        .from("campaign_enrollments")
        .select("*")
        .eq("contact_id", contactId)
        .eq("campaign_id", campaignId)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },

    getByCampaign: async (campaignId: string) => {
      const { data, error } = await supabase
        .from("campaign_enrollments")
        .select("*")
        .eq("campaign_id", campaignId);
      if (error) throw error;
      return data || [];
    },

    update: async (id: string, data: any) => {
      const { error } = await supabaseServer
        .from("campaign_enrollments")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
  },

  // Client Emails (Multiple emails per contact)
  clientEmails: {
    create: async (data: any) => {
      const { data: email, error } = await supabaseServer
        .from("client_emails")
        .insert([data])
        .select()
        .single();
      if (error) throw error;

      // Update email count on contact
      await db.clientEmails.updateCount(data.contact_id);
      return email;
    },

    getById: async (id: string) => {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*")
        .eq("id", id)
        .single();
      if (error) throw error;
      return data;
    },

    getByContact: async (contactId: string) => {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*")
        .eq("contact_id", contactId)
        .eq("is_active", true)
        .order("is_primary", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },

    getPrimary: async (contactId: string) => {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*")
        .eq("contact_id", contactId)
        .eq("is_primary", true)
        .eq("is_active", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },

    getByEmail: async (email: string, workspaceId: string) => {
      const { data, error } = await supabase
        .from("client_emails")
        .select("*, contacts!inner(*)")
        .eq("email", email)
        .eq("contacts.workspace_id", workspaceId)
        .eq("is_active", true)
        .single();
      if (error && error.code !== "PGRST116") throw error;
      return data;
    },

    setPrimary: async (id: string, contactId: string) => {
      // First, unset all primary emails for this contact
      await supabaseServer
        .from("client_emails")
        .update({ is_primary: false })
        .eq("contact_id", contactId);

      // Then set the new primary
      const { data, error } = await supabaseServer
        .from("client_emails")
        .update({ is_primary: true })
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },

    update: async (id: string, data: any) => {
      const { data: email, error } = await supabaseServer
        .from("client_emails")
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return email;
    },

    delete: async (id: string) => {
      // Soft delete - set is_active to false
      const { error } = await supabaseServer
        .from("client_emails")
        .update({ is_active: false })
        .eq("id", id);
      if (error) throw error;

      // Get contact_id to update count
      const email = await db.clientEmails.getById(id);
      if (email) {
        await db.clientEmails.updateCount(email.contact_id);
      }
    },

    recordContact: async (id: string) => {
      const { error } = await supabaseServer
        .from("client_emails")
        .update({ last_contacted: new Date() })
        .eq("id", id);
      if (error) throw error;
    },

    recordBounce: async (id: string) => {
      const email = await db.clientEmails.getById(id);
      const newBounceCount = (email.bounce_count || 0) + 1;

      const { error } = await supabaseServer
        .from("client_emails")
        .update({
          bounce_count: newBounceCount,
          is_active: newBounceCount >= 5 ? false : email.is_active,
        })
        .eq("id", id);
      if (error) throw error;
    },

    verify: async (id: string) => {
      const { error } = await supabaseServer
        .from("client_emails")
        .update({ is_verified: true, verified_at: new Date() })
        .eq("id", id);
      if (error) throw error;
    },

    updateCount: async (contactId: string) => {
      const emails = await db.clientEmails.getByContact(contactId);
      const { error } = await supabaseServer
        .from("contacts")
        .update({ email_count: emails.length })
        .eq("id", contactId);
      if (error) throw error;
    },
  },
};
