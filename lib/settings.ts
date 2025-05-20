import { supabase } from "./supabase"
import type { Setting, SettingCategory, SettingWithCategory, SettingValue, SettingHistory } from "@/types/settings"

// Get all setting categories
export async function getSettingCategories(): Promise<SettingCategory[]> {
  const { data, error } = await supabase
    .from("settings_categories")
    .select("*")
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching setting categories:", error)
    throw error
  }

  return data as SettingCategory[]
}

// Get all settings
export async function getAllSettings(): Promise<SettingWithCategory[]> {
  const { data, error } = await supabase
    .from("settings")
    .select(`
      *,
      category:settings_categories(*)
    `)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching settings:", error)
    throw error
  }

  return data as unknown as SettingWithCategory[]
}

// Get settings by category
export async function getSettingsByCategory(categoryId: number): Promise<Setting[]> {
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: true })

  if (error) {
    console.error("Error fetching settings by category:", error)
    throw error
  }

  return data as Setting[]
}

// Get a single setting by key
export async function getSettingByKey(key: string): Promise<Setting | null> {
  const { data, error } = await supabase.from("settings").select("*").eq("key", key).single()

  if (error) {
    if (error.code === "PGRST116") {
      return null
    }
    console.error("Error fetching setting by key:", error)
    throw error
  }

  return data as Setting
}

// Get public settings as a key-value object
export async function getPublicSettings(): Promise<SettingValue> {
  const { data, error } = await supabase.from("settings").select("key, value, type").eq("is_public", true)

  if (error) {
    console.error("Error fetching public settings:", error)
    throw error
  }

  const settings: SettingValue = {}
  data.forEach((setting) => {
    try {
      // Parse the value based on type
      switch (setting.type) {
        case "boolean":
          settings[setting.key] = setting.value === "true" || setting.value === true
          break
        case "number":
          settings[setting.key] = Number(setting.value)
          break
        case "json":
          settings[setting.key] = typeof setting.value === "string" ? JSON.parse(setting.value) : setting.value
          break
        default:
          settings[setting.key] = setting.value
      }
    } catch (e) {
      console.error(`Error parsing setting ${setting.key}:`, e)
      settings[setting.key] = setting.value
    }
  })

  return settings
}

// Update a setting
export async function updateSetting(
  key: string,
  value: any,
  userId: string,
  clientInfo?: { ip_address?: string; user_agent?: string },
): Promise<void> {
  const { data: setting, error: fetchError } = await supabase
    .from("settings")
    .select("id, value")
    .eq("key", key)
    .single()

  if (fetchError) {
    console.error("Error fetching setting for update:", fetchError)
    throw fetchError
  }

  // Prepare the value based on the type
  let formattedValue = value
  if (typeof value === "object" && value !== null) {
    formattedValue = JSON.stringify(value)
  }

  // Update the setting
  const { error: updateError } = await supabase
    .from("settings")
    .update({ value: formattedValue, updated_at: new Date().toISOString() })
    .eq("key", key)

  if (updateError) {
    console.error("Error updating setting:", updateError)
    throw updateError
  }

  // Record the change in history
  const { error: historyError } = await supabase.from("settings_history").insert({
    setting_id: setting.id,
    setting_key: key,
    old_value: setting.value,
    new_value: formattedValue,
    changed_by: userId,
    ip_address: clientInfo?.ip_address || null,
    user_agent: clientInfo?.user_agent || null,
  })

  if (historyError) {
    console.error("Error recording setting history:", historyError)
    // Don't throw here, as the setting was updated successfully
  }
}

// Get setting history
export async function getSettingHistory(key: string): Promise<SettingHistory[]> {
  const { data, error } = await supabase
    .from("settings_history")
    .select(`
      *,
      changed_by:changed_by(email)
    `)
    .eq("setting_key", key)
    .order("changed_at", { ascending: false })

  if (error) {
    console.error("Error fetching setting history:", error)
    throw error
  }

  return data as unknown as SettingHistory[]
}
