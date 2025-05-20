import { createClient } from "@/lib/supabase"
import type { EmailAccount, EmailThread, EmailMessage, EmailTemplate, EmailStats } from "@/types/email-integration"

export type EmailAttachment = {
  id: string
  message_id: string
  filename: string
  content_type: string
  size: number
  storage_path: string
  created_at: string
}

export type EmailTracking = {
  id: string
  message_id: string
  event_type: "open" | "click" | "bounce" | "delivery"
  occurred_at: string
  ip_address?: string
  user_agent?: string
  link_url?: string
  created_at: string
}

// Email Account Management
export async function getEmailAccounts() {
  const supabase = createClient()
  const { data, error } = await supabase.from("email_accounts").select("*").order("is_primary", { ascending: false })

  if (error) {
    console.error("Error fetching email accounts:", error)
    return []
  }

  return data as EmailAccount[]
}

export async function getPrimaryEmailAccount(): Promise<EmailAccount | null> {
  const supabase = createClient()
  const { data, error } = await supabase.from("email_accounts").select("*").eq("is_primary", true).single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    console.error("Error fetching primary email account:", error)
    throw error
  }

  return data as EmailAccount | null
}

export async function addEmailAccount(account: Omit<EmailAccount, "id" | "connected_at">): Promise<EmailAccount> {
  const supabase = createClient()

  // If this is marked as primary, we need to update all other accounts to not be primary
  if (account.is_primary) {
    const { error: updateError } = await supabase
      .from("email_accounts")
      .update({ is_primary: false })
      .eq("user_id", account.user_id)

    if (updateError) {
      console.error("Error updating existing email accounts:", updateError)
    }
  }

  // Insert the new account
  const { data, error } = await supabase
    .from("email_accounts")
    .insert({
      ...account,
      connected_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) {
    console.error("Error connecting email account:", error)
    throw new Error("Failed to connect email account")
  }

  return data as EmailAccount
}

export async function setPrimaryEmailAccount(accountId: string): Promise<void> {
  // First, set all accounts to non-primary
  const supabase = createClient()
  const { error: updateError } = await supabase
    .from("email_accounts")
    .update({ is_primary: false })
    .neq("id", "placeholder")

  if (updateError) {
    console.error("Error updating email accounts:", updateError)
    throw updateError
  }

  // Then set the selected account to primary
  const { error } = await supabase.from("email_accounts").update({ is_primary: true }).eq("id", accountId)

  if (error) {
    console.error("Error setting primary email account:", error)
    throw error
  }
}

export async function removeEmailAccount(accountId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("email_accounts").delete().eq("id", accountId)

  if (error) {
    console.error("Error removing email account:", error)
    throw error
  }
}

// Email Threads
export async function getEmailThreads(options?: {
  clientId?: number
  opportunityId?: number
  contactId?: number
  limit?: number
  offset?: number
}) {
  const supabase = createClient()
  let query = supabase.from("email_threads").select("*").order("last_message_date", { ascending: false })

  if (options?.clientId) {
    query = query.eq("client_id", options.clientId)
  }

  if (options?.opportunityId) {
    query = query.eq("opportunity_id", options.opportunityId)
  }

  if (options?.contactId) {
    query = query.eq("contact_id", options.contactId)
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching email threads:", error)
    return []
  }

  return data as EmailThread[]
}

export async function getEmailThread(threadId: string): Promise<EmailThread> {
  const supabase = createClient()
  const { data, error } = await supabase.from("email_threads").select("*").eq("id", threadId).single()

  if (error) {
    console.error(`Error fetching email thread ${threadId}:`, error)
    throw error
  }

  return data as EmailThread
}

// Email Messages
export async function getEmailMessages(threadId: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("email_messages")
    .select("*")
    .eq("thread_id", threadId)
    .order("sent_at", { ascending: true })

  if (error) {
    console.error("Error fetching email messages:", error)
    return []
  }

  return data as EmailMessage[]
}

export async function sendEmail(message: Omit<EmailMessage, "id" | "created_at" | "updated_at">) {
  const supabase = createClient()

  // First, check if this is part of an existing thread
  let threadId = message.thread_id

  if (!threadId) {
    // Create a new thread
    const { data: threadData, error: threadError } = await supabase
      .from("email_threads")
      .insert({
        user_id: message.user_id,
        client_id: message.client_id,
        opportunity_id: message.opportunity_id,
        contact_id: message.contact_id,
        subject: message.subject,
        snippet: message.body_text?.substring(0, 100) + "...",
        is_read: true,
        has_attachments: message.has_attachments,
        last_message_date: new Date().toISOString(),
        message_count: 1,
      })
      .select()
      .single()

    if (threadError) {
      console.error("Error creating email thread:", threadError)
      throw new Error("Failed to create email thread")
    }

    threadId = threadData.id
  } else {
    // Update the existing thread
    const { error: updateError } = await supabase
      .from("email_threads")
      .update({
        last_message_date: new Date().toISOString(),
        message_count: supabase.rpc("increment", {
          row_id: threadId,
          table_name: "email_threads",
          column_name: "message_count",
        }),
        has_attachments: message.has_attachments
          ? true
          : supabase.rpc("get_column_value", {
              row_id: threadId,
              table_name: "email_threads",
              column_name: "has_attachments",
            }),
      })
      .eq("id", threadId)

    if (updateError) {
      console.error("Error updating email thread:", updateError)
    }
  }

  // Now insert the message
  const { data: messageData, error: messageError } = await supabase
    .from("email_messages")
    .insert({
      ...message,
      thread_id: threadId,
      sent_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (messageError) {
    console.error("Error creating email message:", messageError)
    throw new Error("Failed to create email message")
  }

  return messageData as EmailMessage
}

// Email Templates
export async function getEmailTemplates() {
  const supabase = createClient()
  const { data, error } = await supabase.from("email_templates").select("*").order("name", { ascending: true })

  if (error) {
    console.error("Error fetching email templates:", error)
    return []
  }

  return data as EmailTemplate[]
}

export async function getEmailTemplate(templateId: string): Promise<EmailTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase.from("email_templates").select("*").eq("id", templateId).single()

  if (error) {
    console.error(`Error fetching email template ${templateId}:`, error)
    throw error
  }

  return data as EmailTemplate
}

export async function createEmailTemplate(
  template: Omit<EmailTemplate, "id" | "created_at" | "updated_at">,
): Promise<EmailTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("email_templates")
    .insert([
      {
        ...template,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) {
    console.error("Error creating email template:", error)
    throw error
  }

  return data[0] as EmailTemplate
}

export async function updateEmailTemplate(
  templateId: string,
  updates: Partial<Omit<EmailTemplate, "id" | "created_at" | "updated_at">>,
): Promise<EmailTemplate> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("email_templates")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)
    .select()

  if (error) {
    console.error(`Error updating email template ${templateId}:`, error)
    throw error
  }

  return data[0] as EmailTemplate
}

export async function deleteEmailTemplate(templateId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("email_templates").delete().eq("id", templateId)

  if (error) {
    console.error(`Error deleting email template ${templateId}:`, error)
    throw error
  }
}

// Email Stats
export async function getEmailStats(options?: {
  clientId?: number
  opportunityId?: number
  contactId?: number
  startDate?: string
  endDate?: string
}): Promise<EmailStats> {
  // This would typically be a complex query or RPC call to calculate stats
  // For now, we'll return mock data
  const supabase = createClient()
  return {
    total_sent: 42,
    total_received: 38,
    open_rate: 0.76,
    response_rate: 0.68,
    average_response_time: 3.2, // hours
  }
}

// Helper function to format email addresses
export function formatEmailRecipients(recipients: { email: string; name?: string }[]): string {
  const supabase = createClient()
  return recipients.map((r) => (r.name ? `${r.name} <${r.email}>` : r.email)).join(", ")
}

// Helper function to parse email addresses
export function parseEmailRecipients(recipientString: string): { email: string; name?: string }[] {
  const supabase = createClient()
  return recipientString.split(",").map((recipient) => {
    recipient = recipient.trim()
    const match = recipient.match(/(.*)<(.*)>/)

    if (match) {
      return {
        name: match[1].trim(),
        email: match[2].trim(),
      }
    }

    return {
      email: recipient,
    }
  })
}

// Create or update an email template
export async function saveEmailTemplate(
  template: Omit<EmailTemplate, "id" | "created_at" | "updated_at"> & { id?: string },
) {
  const supabase = createClient()

  if (template.id) {
    // Update existing template
    const { data, error } = await supabase
      .from("email_templates")
      .update({
        name: template.name,
        subject: template.subject,
        body: template.body,
        is_shared: template.is_shared,
      })
      .eq("id", template.id)
      .select()
      .single()

    if (error) {
      console.error("Error updating email template:", error)
      throw new Error("Failed to update email template")
    }

    return data as EmailTemplate
  } else {
    // Create new template
    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        user_id: template.user_id,
        name: template.name,
        subject: template.subject,
        body: template.body,
        is_shared: template.is_shared,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating email template:", error)
      throw new Error("Failed to create email template")
    }

    return data as EmailTemplate
  }
}

// Mark a message as read
export async function markMessageAsRead(messageId: string) {
  const supabase = createClient()

  const { error } = await supabase.from("email_messages").update({ is_read: true }).eq("id", messageId)

  if (error) {
    console.error("Error marking message as read:", error)
    return false
  }

  return true
}

// Mark a thread as read
export async function markThreadAsRead(threadId: string) {
  const supabase = createClient()

  // Update the thread
  const { error: threadError } = await supabase.from("email_threads").update({ is_read: true }).eq("id", threadId)

  if (threadError) {
    console.error("Error marking thread as read:", threadError)
    return false
  }

  // Update all messages in the thread
  const { error: messagesError } = await supabase
    .from("email_messages")
    .update({ is_read: true })
    .eq("thread_id", threadId)

  if (messagesError) {
    console.error("Error marking messages as read:", messagesError)
    return false
  }

  return true
}

// Track email open
export async function trackEmailOpen(messageId: string, ipAddress?: string, userAgent?: string) {
  const supabase = createClient()

  const { error } = await supabase.from("email_tracking").insert({
    message_id: messageId,
    event_type: "open",
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (error) {
    console.error("Error tracking email open:", error)
    return false
  }

  return true
}

// Track email link click
export async function trackEmailClick(messageId: string, linkUrl: string, ipAddress?: string, userAgent?: string) {
  const supabase = createClient()

  const { error } = await supabase.from("email_tracking").insert({
    message_id: messageId,
    event_type: "click",
    link_url: linkUrl,
    ip_address: ipAddress,
    user_agent: userAgent,
  })

  if (error) {
    console.error("Error tracking email click:", error)
    return false
  }

  return true
}
