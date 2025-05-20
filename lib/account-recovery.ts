import { supabase } from "./supabase"
import type { SecurityQuestion, RecoveryMethod } from "@/types/account-recovery"
import { createHash } from "crypto"

// Get all security questions
export async function getSecurityQuestions() {
  const { data, error } = await supabase.from("security_questions").select("*").order("question", { ascending: true })

  if (error) {
    console.error("Error fetching security questions:", error)
    return []
  }

  return data as SecurityQuestion[]
}

// Get user's security questions
export async function getUserSecurityQuestions(userId: string) {
  const { data, error } = await supabase
    .from("user_security_answers")
    .select("question_id, security_questions(id, question)")
    .eq("user_id", userId)

  if (error) {
    console.error("Error fetching user security questions:", error)
    return []
  }

  return data.map((item) => item.security_questions) as SecurityQuestion[]
}

// Save user's security question answers
export async function saveSecurityQuestionAnswers(userId: string, answers: { questionId: number; answer: string }[]) {
  // First, delete existing answers
  await supabase.from("user_security_answers").delete().eq("user_id", userId)

  // Then, insert new answers
  const inserts = answers.map((answer) => ({
    user_id: userId,
    question_id: answer.questionId,
    answer_hash: hashAnswer(answer.answer),
  }))

  const { error } = await supabase.from("user_security_answers").insert(inserts)

  if (error) {
    console.error("Error saving security question answers:", error)
    throw error
  }

  // Add security_questions as a recovery method
  await addRecoveryMethod(userId, "security_questions", null, true)

  return true
}

// Verify security question answers
export async function verifySecurityQuestionAnswers(userId: string, answers: { questionId: number; answer: string }[]) {
  let correctAnswers = 0

  for (const answer of answers) {
    const { data, error } = await supabase
      .from("user_security_answers")
      .select("answer_hash")
      .eq("user_id", userId)
      .eq("question_id", answer.questionId)
      .single()

    if (error || !data) {
      continue
    }

    if (data.answer_hash === hashAnswer(answer.answer)) {
      correctAnswers++
    }
  }

  // Require at least 2 correct answers or all if less than 2 questions
  return correctAnswers >= Math.min(2, answers.length)
}

// Get user's recovery methods
export async function getUserRecoveryMethods(userId: string) {
  const { data, error } = await supabase.from("recovery_methods").select("*").eq("user_id", userId)

  if (error) {
    console.error("Error fetching recovery methods:", error)
    return []
  }

  return data as RecoveryMethod[]
}

// Add a recovery method
export async function addRecoveryMethod(
  userId: string,
  methodType: "email" | "phone" | "security_questions" | "recovery_codes",
  identifier: string | null,
  isVerified = false,
) {
  // Check if method already exists
  const { data: existingMethod } = await supabase
    .from("recovery_methods")
    .select("id")
    .eq("user_id", userId)
    .eq("method_type", methodType)
    .eq("identifier", identifier || "")
    .maybeSingle()

  if (existingMethod) {
    // Update existing method
    const { error } = await supabase
      .from("recovery_methods")
      .update({
        is_verified: isVerified,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingMethod.id)

    if (error) {
      console.error("Error updating recovery method:", error)
      throw error
    }
  } else {
    // Insert new method
    const { error } = await supabase.from("recovery_methods").insert([
      {
        user_id: userId,
        method_type: methodType,
        identifier,
        is_verified: isVerified,
        is_primary: false,
      },
    ])

    if (error) {
      console.error("Error adding recovery method:", error)
      throw error
    }
  }

  return true
}

// Set primary recovery method
export async function setPrimaryRecoveryMethod(userId: string, methodId: number) {
  // First, set all methods to non-primary
  await supabase.from("recovery_methods").update({ is_primary: false }).eq("user_id", userId)

  // Then, set the selected method as primary
  const { error } = await supabase.from("recovery_methods").update({ is_primary: true }).eq("id", methodId)

  if (error) {
    console.error("Error setting primary recovery method:", error)
    throw error
  }

  return true
}

// Remove a recovery method
export async function removeRecoveryMethod(methodId: number) {
  const { error } = await supabase.from("recovery_methods").delete().eq("id", methodId)

  if (error) {
    console.error("Error removing recovery method:", error)
    throw error
  }

  return true
}

// Generate recovery codes
export async function generateRecoveryCodes(userId: string, count = 10) {
  // First, delete existing unused codes
  await supabase.from("recovery_codes").delete().eq("user_id", userId).eq("is_used", false)

  // Generate new codes
  const codes = Array.from({ length: count }, () => generateRecoveryCode())
  const codeHashes = codes.map((code) => ({
    user_id: userId,
    code_hash: hashRecoveryCode(code),
  }))

  const { error } = await supabase.from("recovery_codes").insert(codeHashes)

  if (error) {
    console.error("Error generating recovery codes:", error)
    throw error
  }

  // Add recovery_codes as a recovery method
  await addRecoveryMethod(userId, "recovery_codes", null, true)

  return codes
}

// Verify recovery code
export async function verifyRecoveryCode(userId: string, code: string) {
  const codeHash = hashRecoveryCode(code)

  const { data, error } = await supabase
    .from("recovery_codes")
    .select("id")
    .eq("user_id", userId)
    .eq("code_hash", codeHash)
    .eq("is_used", false)
    .single()

  if (error || !data) {
    return false
  }

  // Mark code as used
  await supabase
    .from("recovery_codes")
    .update({
      is_used: true,
      used_at: new Date().toISOString(),
    })
    .eq("id", data.id)

  return true
}

// Log recovery attempt
export async function logRecoveryAttempt(
  email: string,
  methodType: string,
  status: "initiated" | "verified" | "completed" | "failed",
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
) {
  const { error } = await supabase.from("recovery_attempts").insert([
    {
      user_id: userId || null,
      email,
      method_type: methodType,
      status,
      ip_address: ipAddress || null,
      user_agent: userAgent || null,
      completed_at: status === "completed" || status === "failed" ? new Date().toISOString() : null,
    },
  ])

  if (error) {
    console.error("Error logging recovery attempt:", error)
  }
}

// Helper functions
function hashAnswer(answer: string): string {
  return createHash("sha256").update(answer.trim().toLowerCase()).digest("hex")
}

function hashRecoveryCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex")
}

function generateRecoveryCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  let code = ""
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code.slice(0, 5) + "-" + code.slice(5)
}
