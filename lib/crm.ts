import { supabase } from "./supabase"
import type {
  Contact,
  PipelineStage,
  Interaction,
  Task,
  ClientForm,
  FormField,
  FormSubmission,
  ClientWithContacts,
} from "@/types/crm"

export type Opportunity = {
  id: string
  name: string
  company: string
  value: number
  stage: string
  owner: string
  createdAt: string
  updatedAt: string
  contactEmail?: string
  contactPhone?: string
  notes?: string
  tags?: string[]
}

export type Client = {
  id: string
  name: string
  company: string
  email: string
  phone?: string
  address?: string
  createdAt: string
  updatedAt: string
  notes?: string
  tags?: string[]
}

// Client functions
// export async function getClients() {
//   const { data, error } = await supabase.from("clients").select("*").order("company_name")

//   if (error) {
//     console.error("Error fetching clients:", error)
//     throw error
//   }

//   return data as Client[]
// }

export async function getClients(): Promise<Client[]> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('clients')
    //   .select('*')
    //   .order('created_at', { ascending: false })

    // if (error) throw error
    // return data

    // For now, return sample data
    return [
      {
        id: "1",
        name: "John Smith",
        company: "Acme Inc",
        email: "john@acme.com",
        phone: "(555) 123-4567",
        address: "123 Main St, Anytown, USA",
        createdAt: "2023-01-10T10:30:00Z",
        updatedAt: "2023-01-15T14:20:00Z",
        tags: ["retail", "long-term"],
      },
      {
        id: "2",
        name: "Sarah Johnson",
        company: "XYZ Corp",
        email: "sarah@xyz.com",
        phone: "(555) 987-6543",
        createdAt: "2023-01-12T09:15:00Z",
        updatedAt: "2023-01-12T09:15:00Z",
        tags: ["technology"],
      },
      {
        id: "3",
        name: "Michael Brown",
        company: "Tech Startup",
        email: "michael@techstartup.com",
        phone: "(555) 555-5555",
        address: "456 Innovation Way, Tech City, USA",
        createdAt: "2023-01-05T11:45:00Z",
        updatedAt: "2023-01-08T16:30:00Z",
        tags: ["startup", "technology"],
      },
      {
        id: "4",
        name: "Emily Davis",
        company: "Local Business",
        email: "emily@localbusiness.com",
        createdAt: "2023-01-03T13:20:00Z",
        updatedAt: "2023-01-07T10:10:00Z",
        tags: ["local", "small-business"],
      },
      {
        id: "5",
        name: "David Wilson",
        company: "Retail Chain",
        email: "david@retailchain.com",
        phone: "(555) 111-2222",
        address: "789 Shopping Blvd, Commerce City, USA",
        createdAt: "2023-01-01T15:00:00Z",
        updatedAt: "2023-01-05T11:30:00Z",
        tags: ["retail", "enterprise"],
      },
    ]
  } catch (error) {
    console.error("Error fetching clients:", error)
    return []
  }
}

// export async function getClientById(id: number) {
//   const { data, error } = await supabase.from("clients").select("*").eq("id", id).single()

//   if (error) {
//     console.error(`Error fetching client with id ${id}:`, error)
//     throw error
//   }

//   return data as Client
// }

export async function getClient(id: string): Promise<Client | null> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('clients')
    //   .select('*')
    //   .eq('id', id)
    //   .single()

    // if (error) throw error
    // return data

    // For now, return sample data
    const clients = await getClients()
    return clients.find((client) => client.id === id) || null
  } catch (error) {
    console.error(`Error fetching client ${id}:`, error)
    return null
  }
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

// export async function createClient(client: Omit<Client, "id" | "created_at" | "updated_at">) {
//   const { data, error } = await supabase
//     .from("clients")
//     .insert([{ ...client, updated_at: new Date().toISOString() }])
//     .select()

//   if (error) {
//     console.error("Error creating client:", error)
//     throw error
//   }

//   return data[0] as Client
// }

export async function createClient(
  client: Omit<Client, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // In a real implementation, we would insert into Supabase
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('clients')
    //   .insert([
    //     {
    //       ...client,
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString()
    //     }
    //   ])
    //   .select()

    // if (error) throw error
    // return { success: true, id: data[0].id }

    // For now, return success
    return {
      success: true,
      id: Math.random().toString(36).substring(2, 15),
    }
  } catch (error) {
    console.error("Error creating client:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// export async function updateClient(id: number, client: Partial<Omit<Client, "id" | "created_at" | "updated_at">>) {
//   const { data, error } = await supabase
//     .from("clients")
//     .update({ ...client, updated_at: new Date().toISOString() })
//     .eq("id", id)
//     .select()

//   if (error) {
//     console.error(`Error updating client with id ${id}:`, error)
//     throw error
//   }

//   return data[0] as Client
// }

export async function updateClient(
  id: string,
  updates: Partial<Client>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, we would update in Supabase
    // const supabase = getSupabaseClient()
    // const { error } = await supabase
    //   .from('clients')
    //   .update({
    //     ...updates,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', id)

    // if (error) throw error

    // For now, return success
    return { success: true }
  } catch (error) {
    console.error(`Error updating client ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// export async function deleteClient(id: number) {
//   const { error } = await supabase.from("clients").delete().eq("id", id)

//   if (error) {
//     console.error(`Error deleting client with id ${id}:`, error)
//     throw error
//   }

//   return true
// }

export async function deleteClient(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, we would delete from Supabase
    // const supabase = getSupabaseClient()
    // const { error } = await supabase
    //   .from('clients')
    //   .delete()
    //   .eq('id', id)

    // if (error) throw error

    // For now, return success
    return { success: true }
  } catch (error) {
    console.error(`Error deleting client ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
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
// export async function getOpportunities() {
//   const { data, error } = await supabase
//     .from("opportunities")
//     .select(
//       `
//       *,
//       client:clients(*),
//       primary_contact:contacts(*),
//       stage:pipeline_stages(*)
//     `,
//     )
//     .order("created_at", { ascending: false })

//   if (error) {
//     console.error("Error fetching opportunities:", error)
//     throw error
//   }

//   return data as OpportunityWithDetails[]
// }

export async function getOpportunities(): Promise<Opportunity[]> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('opportunities')
    //   .select('*')
    //   .order('created_at', { ascending: false })

    // if (error) throw error
    // return data

    // For now, return sample data
    return [
      {
        id: "1",
        name: "Website Redesign",
        company: "Acme Inc",
        value: 15000,
        stage: "proposal",
        owner: "John Doe",
        createdAt: "2023-01-15T10:30:00Z",
        updatedAt: "2023-01-20T14:20:00Z",
        contactEmail: "contact@acme.com",
        contactPhone: "(555) 123-4567",
        tags: ["design", "high-value"],
      },
      {
        id: "2",
        name: "Marketing Campaign",
        company: "XYZ Corp",
        value: 8500,
        stage: "discovery",
        owner: "Jane Smith",
        createdAt: "2023-01-18T09:15:00Z",
        updatedAt: "2023-01-18T09:15:00Z",
        contactEmail: "marketing@xyz.com",
        tags: ["marketing"],
      },
      {
        id: "3",
        name: "Mobile App Development",
        company: "Tech Startup",
        value: 45000,
        stage: "negotiation",
        owner: "John Doe",
        createdAt: "2023-01-10T11:45:00Z",
        updatedAt: "2023-01-17T16:30:00Z",
        contactEmail: "ceo@techstartup.com",
        contactPhone: "(555) 987-6543",
        tags: ["development", "high-value"],
      },
      {
        id: "4",
        name: "SEO Optimization",
        company: "Local Business",
        value: 3000,
        stage: "closed_won",
        owner: "Jane Smith",
        createdAt: "2023-01-05T13:20:00Z",
        updatedAt: "2023-01-12T10:10:00Z",
        contactEmail: "owner@localbusiness.com",
        tags: ["marketing", "seo"],
      },
      {
        id: "5",
        name: "E-commerce Integration",
        company: "Retail Chain",
        value: 12000,
        stage: "closed_lost",
        owner: "John Doe",
        createdAt: "2023-01-02T15:00:00Z",
        updatedAt: "2023-01-09T11:30:00Z",
        contactEmail: "it@retailchain.com",
        contactPhone: "(555) 555-5555",
        tags: ["e-commerce", "integration"],
      },
    ]
  } catch (error) {
    console.error("Error fetching opportunities:", error)
    return []
  }
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

// export async function createOpportunity(opportunity: Omit<Opportunity, "id" | "created_at" | "updated_at">) {
//   const { data, error } = await supabase
//     .from("opportunities")
//     .insert([{ ...opportunity, updated_at: new Date().toISOString() }])
//     .select()

//   if (error) {
//     console.error("Error creating opportunity:", error)
//     throw error
//   }

//   return data[0] as Opportunity
// }

export async function createOpportunity(
  opportunity: Omit<Opportunity, "id" | "createdAt" | "updatedAt">,
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    // In a real implementation, we would insert into Supabase
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('opportunities')
    //   .insert([
    //     {
    //       ...opportunity,
    //       created_at: new Date().toISOString(),
    //       updated_at: new Date().toISOString()
    //     }
    //   ])
    //   .select()

    // if (error) throw error
    // return { success: true, id: data[0].id }

    // For now, return success
    return {
      success: true,
      id: Math.random().toString(36).substring(2, 15),
    }
  } catch (error) {
    console.error("Error creating opportunity:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// export async function updateOpportunity(
//   id: number,
//   opportunity: Partial<Omit<Opportunity, "id" | "created_at" | "updated_at">>,
// ) {
//   const { data, error } = await supabase
//     .from("opportunities")
//     .update({ ...opportunity, updated_at: new Date().toISOString() })
//     .eq("id", id)
//     .select()

//   if (error) {
//     console.error(`Error updating opportunity with id ${id}:`, error)
//     throw error
//   }

//   return data[0] as Opportunity
// }

export async function updateOpportunity(
  id: string,
  updates: Partial<Opportunity>,
): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, we would update in Supabase
    // const supabase = getSupabaseClient()
    // const { error } = await supabase
    //   .from('opportunities')
    //   .update({
    //     ...updates,
    //     updated_at: new Date().toISOString()
    //   })
    //   .eq('id', id)

    // if (error) throw error

    // For now, return success
    return { success: true }
  } catch (error) {
    console.error(`Error updating opportunity ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

// export async function deleteOpportunity(id: number) {
//   const { error } = await supabase.from("opportunities").delete().eq("id", id)

//   if (error) {
//     console.error(`Error deleting opportunity with id ${id}:`, error)
//     throw error
//   }

//   return true
// }

export async function deleteOpportunity(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    // In a real implementation, we would delete from Supabase
    // const supabase = getSupabaseClient()
    // const { error } = await supabase
    //   .from('opportunities')
    //   .delete()
    //   .eq('id', id)

    // if (error) throw error

    // For now, return success
    return { success: true }
  } catch (error) {
    console.error(`Error deleting opportunity ${id}:`, error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    }
  }
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  try {
    // In a real implementation, we would fetch from Supabase
    // const supabase = getSupabaseClient()
    // const { data, error } = await supabase
    //   .from('opportunities')
    //   .select('*')
    //   .eq('id', id)
    //   .single()

    // if (error) throw error
    // return data

    // For now, return sample data
    const opportunities = await getOpportunities()
    return opportunities.find((opp) => opp.id === id) || null
  } catch (error) {
    console.error(`Error fetching opportunity ${id}:`, error)
    return null
  }
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
