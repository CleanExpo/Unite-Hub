export type EmailThread = {
  id: string
  client_id: number
  opportunity_id?: number
  contact_id?: number
  subject: string
  snippet: string
  is_read: boolean
  has_attachments: boolean
  last_message_date: string
  message_count: number
}

export type EmailMessage = {
  id: string
  thread_id: string
  from: {
    email: string
    name?: string
  }
  to: {
    email: string
    name?: string
  }[]
  cc?: {
    email: string
    name?: string
  }[]
  bcc?: {
    email: string
    name?: string
  }[]
  subject: string
  body_html: string
  body_text: string
  sent_at: string
  received_at?: string
  is_read: boolean
  has_attachments: boolean
  attachments?: EmailAttachment[]
  is_draft: boolean
  is_sent_by_user: boolean
}

export type EmailAttachment = {
  id: string
  filename: string
  content_type: string
  size: number
  url: string
}

export type EmailTemplate = {
  id: string
  name: string
  subject: string
  body: string
  created_at: string
  updated_at: string
  created_by: string
  is_shared: boolean
}

export type EmailAccount = {
  id: string
  email: string
  name: string
  is_primary: boolean
  is_verified: boolean
  provider: "gmail" | "outlook" | "custom"
  connected_at: string
}

export type EmailStats = {
  total_sent: number
  total_received: number
  open_rate: number
  response_rate: number
  average_response_time: number
}

export type EmailDraft = Omit<EmailMessage, "id" | "thread_id" | "sent_at" | "received_at" | "is_read"> & {
  id?: string
  thread_id?: string
  client_id?: number
  opportunity_id?: number
  contact_id?: number
  scheduled_for?: string
}
