import { supabase } from "./supabase"
import type { Opportunity } from "@/types/crm"

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
