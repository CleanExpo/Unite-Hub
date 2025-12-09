/**
 * PATCH FILE: Add these methods to db.emailIntegrations in src/lib/db.ts
 *
 * IMPORTANT: Also fix all uses of `supabaseServer` to call `getSupabaseServer()` first
 */

// Add to db.emailIntegrations object:

export const emailIntegrationsPatch = {
  create: async (data: any) => {
    const supabaseServer = getSupabaseServer();
    const { data: integration, error } = await supabaseServer
      .from("email_integrations")
      .insert([data])
      .select()
      .single();
    if (error) {
throw error;
}
    return integration;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
throw error;
}
    return data;
  },

  getByOrg: async (orgId: string) => {
    const { data, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("org_id", orgId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) {
throw error;
}
    return data || [];
  },

  getByWorkspace: async (workspaceId: string) => {
    const { data, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true)
      .order("created_at", { ascending: true });
    if (error) {
throw error;
}
    return data || [];
  },

  // NEW: Get integration by email address
  getByEmail: async (
    workspaceId: string,
    provider: string,
    emailAddress: string
  ) => {
    const { data, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("provider", provider)
      .eq("email_address", emailAddress)
      .single();
    if (error && error.code !== "PGRST116") {
throw error;
} // PGRST116 = not found
    return data;
  },

  // NEW: Get primary integration for workspace
  getPrimary: async (workspaceId: string) => {
    const { data, error } = await supabase
      .from("email_integrations")
      .select("*")
      .eq("workspace_id", workspaceId)
      .eq("is_primary", true)
      .eq("is_active", true)
      .single();
    if (error && error.code !== "PGRST116") {
throw error;
} // PGRST116 = not found
    return data;
  },

  update: async (id: string, data: any) => {
    const supabaseServer = getSupabaseServer();
    const { error } = await supabaseServer
      .from("email_integrations")
      .update(data)
      .eq("id", id);
    if (error) {
throw error;
}
  },
};

// Also add to db.sentEmails:

export const sentEmailsPatch = {
  create: async (data: any) => {
    const supabaseServer = getSupabaseServer();
    const { data: email, error } = await supabaseServer
      .from("sent_emails")
      .insert([data])
      .select()
      .single();
    if (error) {
throw error;
}
    return email;
  },

  getById: async (id: string) => {
    const { data, error } = await supabase
      .from("sent_emails")
      .select("*")
      .eq("id", id)
      .single();
    if (error) {
throw error;
}
    return data;
  },

  getByWorkspace: async (workspaceId: string, limit = 50) => {
    const { data, error } = await supabase
      .from("sent_emails")
      .select("*, contacts(name, email)")
      .eq("workspace_id", workspaceId)
      .order("sent_at", { ascending: false })
      .limit(limit);
    if (error) {
throw error;
}
    return data || [];
  },

  recordOpen: async (sentEmailId: string, metadata: any) => {
    const supabaseServer = getSupabaseServer();
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

  recordClick: async (
    sentEmailId: string,
    linkUrl: string,
    metadata: any
  ) => {
    const supabaseServer = getSupabaseServer();
    await supabaseServer.from("email_clicks").insert([
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
};
