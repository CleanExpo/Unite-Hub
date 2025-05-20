export type SettingType = "string" | "number" | "boolean" | "json" | "color" | "image" | "select"

export type SettingCategory = {
  id: number
  name: string
  description: string | null
  icon: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export type Setting = {
  id: number
  key: string
  value: any
  type: SettingType
  category_id: number
  label: string
  description: string | null
  options: any | null
  is_public: boolean
  is_required: boolean
  validation_regex: string | null
  display_order: number
  created_at: string
  updated_at: string
}

export type SettingHistory = {
  id: number
  setting_id: number
  setting_key: string
  old_value: any
  new_value: any
  changed_by: string | null
  changed_at: string
  ip_address: string | null
  user_agent: string | null
}

export type SettingWithCategory = Setting & {
  category: SettingCategory
}

export type SettingValue = {
  [key: string]: any
}
