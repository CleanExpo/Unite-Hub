export type Client = {
  id: number
  company_name: string | null
  industry: string | null
  website: string | null
  address: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  country: string | null
  annual_revenue: number | null
  employee_count: number | null
  source: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export type Contact = {
  id: number
  client_id: number
  first_name: string
  last_name: string
  job_title: string | null
  email: string | null
  phone: string | null
  mobile: string | null
  is_primary: boolean
  is_decision_maker: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export type PipelineStage = {
  id: number
  name: string
  description: string | null
  display_order: number
  color: string | null
  created_at: string
  updated_at: string
}

export type Opportunity = {
  id: number
  client_id: number
  primary_contact_id: number | null
  title: string
  description: string | null
  stage_id: number | null
  value: number | null
  probability: number | null
  expected_close_date: string | null
  assigned_to: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Interaction = {
  id: number
  client_id: number
  contact_id: number | null
  opportunity_id: number | null
  type: string
  subject: string
  description: string | null
  date: string
  duration: number | null
  location: string | null
  outcome: string | null
  next_steps: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export type Task = {
  id: number
  client_id: number
  contact_id: number | null
  opportunity_id: number | null
  title: string
  description: string | null
  due_date: string | null
  priority: string | null
  status: string
  assigned_to: string | null
  created_by: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export type ClientForm = {
  id: number
  title: string
  description: string | null
  is_active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export type FormField = {
  id: number
  form_id: number
  label: string
  type: string
  options: any | null
  placeholder: string | null
  help_text: string | null
  is_required: boolean
  validation_regex: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export type FormSubmission = {
  id: number
  form_id: number
  client_id: number | null
  contact_id: number | null
  data: any
  submitted_at: string
  submitted_by: string | null
  ip_address: string | null
  user_agent: string | null
}

export type ClientWithContacts = Client & {
  contacts: Contact[]
}

export type OpportunityWithDetails = Opportunity & {
  client: Client
  primary_contact: Contact | null
  stage: PipelineStage | null
}
