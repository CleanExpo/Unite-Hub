export type SecurityQuestion = {
  id: number
  question: string
  created_at: string
}

export type UserSecurityAnswer = {
  id: number
  user_id: string
  question_id: number
  answer_hash: string
  created_at: string
  updated_at: string
}

export type RecoveryMethod = {
  id: number
  user_id: string
  method_type: "email" | "phone" | "security_questions" | "recovery_codes"
  identifier: string | null
  is_verified: boolean
  is_primary: boolean
  created_at: string
  updated_at: string
}

export type RecoveryCode = {
  id: number
  user_id: string
  code_hash: string
  is_used: boolean
  used_at: string | null
  created_at: string
}

export type RecoveryAttempt = {
  id: number
  user_id: string | null
  email: string | null
  method_type: string
  status: "initiated" | "verified" | "completed" | "failed"
  ip_address: string | null
  user_agent: string | null
  created_at: string
  completed_at: string | null
}
