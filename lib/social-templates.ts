import { supabase } from "./supabase"
import type { SocialTemplate, SocialTemplateCategory } from "@/types/social-templates"

// Get all templates for the current user
export async function getUserTemplates(userId: string) {
  const { data, error } = await supabase
    .from("social_templates")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching user templates:", error)
    return []
  }

  return data as SocialTemplate[]
}

// Get public templates
export async function getPublicTemplates() {
  const { data, error } = await supabase
    .from("social_templates")
    .select("*")
    .eq("is_public", true)
    .order("times_used", { ascending: false })

  if (error) {
    console.error("Error fetching public templates:", error)
    return []
  }

  return data as SocialTemplate[]
}

// Get template by ID
export async function getTemplateById(templateId: number) {
  const { data, error } = await supabase.from("social_templates").select("*").eq("id", templateId).single()

  if (error) {
    console.error("Error fetching template:", error)
    return null
  }

  return data as SocialTemplate
}

// Create a new template
export async function createTemplate(
  template: Omit<SocialTemplate, "id" | "created_at" | "updated_at" | "times_used">,
) {
  const { data, error } = await supabase
    .from("social_templates")
    .insert([
      {
        ...template,
        times_used: 0,
        updated_at: new Date().toISOString(),
      },
    ])
    .select()

  if (error) {
    console.error("Error creating template:", error)
    throw error
  }

  return data[0] as SocialTemplate
}

// Update an existing template
export async function updateTemplate(
  templateId: number,
  updates: Partial<Omit<SocialTemplate, "id" | "created_at" | "updated_at" | "user_id">>,
) {
  const { data, error } = await supabase
    .from("social_templates")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", templateId)
    .select()

  if (error) {
    console.error("Error updating template:", error)
    throw error
  }

  return data[0] as SocialTemplate
}

// Delete a template
export async function deleteTemplate(templateId: number) {
  const { error } = await supabase.from("social_templates").delete().eq("id", templateId)

  if (error) {
    console.error("Error deleting template:", error)
    throw error
  }

  return true
}

// Increment the times_used counter for a template
export async function incrementTemplateUsage(templateId: number) {
  const { error } = await supabase
    .from("social_templates")
    .update({
      times_used: supabase.rpc("increment", {
        row_id: templateId,
        table_name: "social_templates",
        column_name: "times_used",
      }),
    })
    .eq("id", templateId)

  if (error) {
    console.error("Error incrementing template usage:", error)
  }
}

// Get all template categories
export async function getTemplateCategories() {
  const { data, error } = await supabase
    .from("social_template_categories")
    .select("*")
    .order("name", { ascending: true })

  if (error) {
    console.error("Error fetching template categories:", error)
    return []
  }

  return data as SocialTemplateCategory[]
}

// Apply template variables to content
export function applyTemplateVariables(content: string, variables: Record<string, string>) {
  let result = content

  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value)
  }

  return result
}

// Extract variable placeholders from content
export function extractVariables(content: string): string[] {
  const regex = /\{\{([^}]+)\}\}/g
  const variables: string[] = []
  let match

  while ((match = regex.exec(content)) !== null) {
    variables.push(match[1])
  }

  return [...new Set(variables)] // Remove duplicates
}
