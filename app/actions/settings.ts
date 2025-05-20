"use server"

import { revalidatePath } from "next/cache"
import { cookies, headers } from "next/headers"
import { updateSetting } from "@/lib/settings"
import { createServerClient } from "@supabase/ssr"

export async function updateSettingAction(key: string, value: any) {
  try {
    // Get the current user
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.set({ name, value: "", ...options })
          },
        },
      },
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return { success: false, message: "Unauthorized" }
    }

    // Get client info
    const headersList = headers()
    const userAgent = headersList.get("user-agent") || ""
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || "unknown"

    // Update the setting
    await updateSetting(key, value, user.id, {
      ip_address: ip,
      user_agent: userAgent,
    })

    // Revalidate paths that might use this setting
    revalidatePath("/admin/settings")
    revalidatePath("/")

    return { success: true, message: "Setting updated successfully" }
  } catch (error) {
    console.error("Error updating setting:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "An unknown error occurred",
    }
  }
}
