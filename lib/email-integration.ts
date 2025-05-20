// Types
export interface EmailParticipant {
  email: string
  name?: string
}

export interface EmailThread {
  id: string
  subject: string
  snippet: string
  participants: EmailParticipant[]
  unread: boolean
  lastMessageAt: string
  folder: string
  labels: string[]
}

export interface EmailMessage {
  id: string
  threadId: string
  from: EmailParticipant
  to: EmailParticipant[]
  cc?: EmailParticipant[]
  bcc?: EmailParticipant[]
  subject: string
  body: string
  bodyHtml?: string
  attachments?: {
    id: string
    name: string
    size: number
    contentType: string
    url: string
  }[]
  sentAt: string
  readAt?: string
}

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  body: string
  isShared: boolean
  createdAt: string
  updatedAt: string
}

// API Functions
export async function getEmailThreads({
  folder = "inbox",
  label = "",
  search = "",
  page = 1,
  limit = 20,
}: {
  folder?: string
  label?: string
  search?: string
  page?: number
  limit?: number
}): Promise<EmailThread[]> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('email_threads')
    //   .select('*')
    //   .eq('user_id', userId)
    //   .eq('folder', folder)
    //   .order('last_message_at', { ascending: false })
    //   .range((page - 1) * limit, page * limit - 1)

    // if (error) throw error
    // return data.map(mapThreadFromDb)

    // For now, return empty array
    return []
  } catch (error) {
    console.error("Error fetching email threads:", error)
    return []
  }
}

export async function getEmailThread(threadId: string): Promise<EmailThread | null> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('email_threads')
    //   .select('*')
    //   .eq('id', threadId)
    //   .single()

    // if (error) throw error
    // return mapThreadFromDb(data)

    // For now, return null
    return null
  } catch (error) {
    console.error("Error fetching email thread:", error)
    return null
  }
}

export async function getEmailMessages(threadId: string): Promise<EmailMessage[]> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = createClient()
    // const { data, error } = await supabase
    //   .from('email_messages')
    //   .select('*')
    //   .eq('thread_id', threadId)
    //   .order('sent_at', { ascending: true })

    // if (error) throw error
    // return data.map(mapMessageFromDb)

    // For now, return empty array
    return []
  } catch (error) {
    console.error("Error fetching email messages:", error)
    return []
  }
}

export async function sendEmail({
  to,
  cc,
  bcc,
  subject,
  body,
  threadId,
  attachments,
}: {
  to: EmailParticipant[]
  cc?: EmailParticipant[]
  bcc?: EmailParticipant[]
  subject: string
  body: string
  threadId?: string
  attachments?: File[]
}): Promise<{ success: boolean; messageId?: string; threadId?: string; error?: string }> {
  try {
    // In a real implementation, we would send via API and store in Supabase
    // For now, return success
    return {
      success: true,
      messageId: "msg_" + Math.random().toString(36).substring(2, 15),
      threadId: threadId || "thread_" + Math.random().toString(36).substring(2, 15),
    }
  } catch (error) {
    console.error("Error sending email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getEmailTemplates(): Promise<EmailTemplate[]> {
  try {
    // In a real implementation, we would fetch from Supabase
    // For now, return empty array
    return []
  } catch (error) {
    console.error("Error fetching email templates:", error)
    return []
  }
}

export async function saveEmailTemplate({
  id,
  name,
  subject,
  body,
  isShared,
}: {
  id?: string
  name: string
  subject: string
  body: string
  isShared: boolean
}): Promise<{ success: boolean; templateId?: string; error?: string }> {
  try {
    // In a real implementation, we would save to Supabase
    // For now, return success
    return {
      success: true,
      templateId: id || "template_" + Math.random().toString(36).substring(2, 15),
    }
  } catch (error) {
    console.error("Error saving email template:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function deleteEmailTemplate(templateId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, we would delete from Supabase
    // For now, return success
    return { success: true }
  } catch (error) {
    console.error("Error deleting email template:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}
