export type SocialTemplate = {
  id: number
  user_id: string
  name: string
  description: string | null
  content: string
  variables: Record<string, string>
  category: string | null
  platforms: string[]
  is_public: boolean
  times_used: number
  created_at: string
  updated_at: string
}

export type SocialTemplateCategory = {
  id: number
  name: string
  description: string | null
  created_at: string
  updated_at: string
}

export type TemplateVariable = {
  key: string
  defaultValue: string
  description?: string
}
