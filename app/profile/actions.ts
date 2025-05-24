"use server"

import { createServerClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function updateProfile(formData: FormData) {
  const supabase = createServerClient()

  // Get the current user
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return { success: false, error: "Not authenticated" }
  }

  try {
    const first_name = formData.get("first_name") as string
    const last_name = formData.get("last_name") as string
    const role = formData.get("role") as string
    const bio = formData.get("bio") as string

    const { error } = await supabase.from("profiles").upsert({
      id: user.id,
      first_name,
      last_name,
      role,
      bio,
      updated_at: new Date().toISOString(),
    })

    if (error) throw error

    revalidatePath("/profile")
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
