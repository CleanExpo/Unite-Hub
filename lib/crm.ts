import { supabase } from "./supabase"
import type {
  Client,
  Contact,
  PipelineStage,
  Opportunity,
  Interaction,
  Task,
  ClientForm,
  FormField,
  FormSubmission,
  ClientWithContacts,
  OpportunityWithDetails,
} from "@/types/crm"

// Client functions
export async function getClients() {
  const { data, error } = await supabase.from("clients").select("*").order("company_name")

  if (error) {
    console.error("Error fetching clients:", error)
    throw error
  }

  return data as Client[]
}

export async function getClientById(id: number) {
  const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

  if (error) {
    console.error(`Error fetching client with id ${id}:`, error)
    throw error
  }

  return data as Client
}

export async function getClientWithContacts(id: number) {
  const { data, error } = await supabase
    .from("clients")
    .select(
      `
      *,
      contacts(*)
    `,
    )
    .eq("id", id)
    .single()

  if (error) {
    console.error(`Error fetching client with contacts for id ${id}:`, error)
    throw error
  }

  return data as ClientWithContacts
}

export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("clients")
    .insert([{ ...client, updated_at: new Date().toISOString() }])
    .select()

  if (error) {
    console.error("Error creating client:", error)
    throw error
  }

  return data[0] as Client
}

export async function updateClient(id: number, client: Partial<Omit<Client, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase
    .from("clients")
    .update({ ...client, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()

  if (error) {
    console.error(`Error updating client with id ${id}:`, error)
    throw error
  }

  return data[0] as Client
}

export async function deleteClient(id: number) {
  const { error } = await supabase.from("clients").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting client with id ${id}:`, error)
    throw error
  }

  return true
}

// Contact functions
export async function getContactsByClientId(clientId: number) {
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("client_id", clientId)
    .order("is_primary", { ascending: false })
    .order("last_name")

  if (error) {
    console.error(`Error fetching contacts for client ${clientId}:`, error)
    throw error
  }

  return data as Contact[]
}

export async function createContact(contact: Omit<Contact, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("contacts")
    .insert([{ ...contact, updated_at: new Date().toISOString() }])
    .select()

  if (error) {
    console.error("Error creating contact:", error)
    throw error
  }

  return data[0] as Contact
}

export async function updateContact(id: number, contact: Partial<Omit<Contact, "id" | "created_at" | "updated_at">>) {
  const { data, error } = await supabase
    .from("contacts")
    .update({ ...contact, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()

  if (error) {
    console.error(`Error updating contact with id ${id}:`, error)
    throw error
  }

  return data[0] as Contact
}

export async function deleteContact(id: number) {
  const { error } = await supabase.from("contacts").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting contact with id ${id}:`, error)
    throw error
  }

  return true
}

// Pipeline stage functions
export async function getPipelineStages() {
  const { data, error } = await supabase.from("pipeline_stages").select("*").order("display_order")

  if (error) {
    console.error("Error fetching pipeline stages:", error)
    throw error
  }

  return data as PipelineStage[]
}

// Opportunity functions
export async function getOpportunities() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      client:clients(*),
      primary_contact:contacts(*),
      stage:pipeline_stages(*)
    `,
    )
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching opportunities:", error)
    throw error
  }

  return data as OpportunityWithDetails[]
}

export async function getOpportunitiesByClientId(clientId: number) {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      *,
      stage:pipeline_stages(*)
    `,
    )
    .eq("client_id", clientId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching opportunities for client ${clientId}:`, error)
    throw error
  }

  return data as (Opportunity & { stage: PipelineStage | null })[]
}

export async function createOpportunity(opportunity: Omit<Opportunity, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("opportunities")
    .insert([{ ...opportunity, updated_at: new Date().toISOString() }])
    .select()

  if (error) {
    console.error("Error creating opportunity:", error)
    throw error
  }

  return data[0] as Opportunity
}

export async function updateOpportunity(
  id: number,
  opportunity: Partial<Omit<Opportunity, "id" | "created_at" | "updated_at">>,
) {
  const { data, error } = await supabase
    .from("opportunities")
    .update({ ...opportunity, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()

  if (error) {
    console.error(`Error updating opportunity with id ${id}:`, error)
    throw error
  }

  return data[0] as Opportunity
}

export async function deleteOpportunity(id: number) {
  const { error } = await supabase.from("opportunities").delete().eq("id", id)

  if (error) {
    console.error(`Error deleting opportunity with id ${id}:`, error)
    throw error
  }

  return true
}

// Form functions
export async function getClientForms() {
  const { data, error } = await supabase.from("client_forms").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching client forms:", error)
    throw error
  }

  return data as ClientForm[]
}

export async function getClientFormWithFields(formId: number) {
  const { data, error } = await supabase
    .from("client_forms")
    .select(
      `
      *,
      fields:form_fields(*)
    `,
    )
    .eq("id", formId)
    .single()

  if (error) {
    console.error(`Error fetching client form with fields for id ${formId}:`, error)
    throw error
  }

  return { ...data, fields: data.fields.sort((a: FormField, b: FormField) => a.display_order - b.display_order) }
}

export async function createFormSubmission(submission: Omit<FormSubmission, "id" | "submitted_at">) {
  const { data, error } = await supabase
    .from("form_submissions")
    .insert([{ ...submission, submitted_at: new Date().toISOString() }])
    .select()

  if (error) {
    console.error("Error creating form submission:", error)
    throw error
  }

  return data[0] as FormSubmission
}

// Task functions
export async function getTasksByClientId(clientId: number) {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("client_id", clientId)
    .order("due_date", { ascending: true })
    .order("created_at", { ascending: false })

  if (error) {
    console.error(`Error fetching tasks for client ${clientId}:`, error)
    throw error
  }

  return data as Task[]
}

export async function createTask(task: Omit<Task, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("tasks")
    .insert([{ ...task, updated_at: new Date().toISOString() }])
    .select()

  if (error) {
    console.error("Error creating task:", error)
    throw error
  }

  return data[0] as Task
}

export async function updateTaskStatus(id: number, status: string, completedAt?: string | null) {
  const { data, error } = await supabase
    .from("tasks")
    .update({
      status,
      completed_at: status === "completed" ? completedAt || new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()

  if (error) {
    console.error(`Error updating task status for id ${id}:`, error)
    throw error
  }

  return data[0] as Task
}

// Interaction functions
export async function getInteractionsByClientId(clientId: number) {
  const { data, error } = await supabase
    .from("interactions")
    .select("*")
    .eq("client_id", clientId)
    .order("date", { ascending: false })

  if (error) {
    console.error(`Error fetching interactions for client ${clientId}:`, error)
    throw error
  }

  return data as Interaction[]
}

export async function createInteraction(interaction: Omit<Interaction, "id" | "created_at" | "updated_at">) {
  const { data, error } = await supabase
    .from("interactions")
    .insert([{ ...interaction, updated_at: new Date().toISOString() }])
    .select()

  if (error) {
    console.error("Error creating interaction:", error)
    throw error
  }

  return data[0] as Interaction
}
