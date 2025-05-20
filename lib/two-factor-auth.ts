import { authenticator } from "otplib"
import { supabase } from "./supabase"

// Configure authenticator
authenticator.options = {
  digits: 6,
  step: 30,
  window: 1, // Allow 1 step before/after for clock drift
}

// Generate a new secret for a user
export async function generateTOTPSecret(userId: string) {
  const secret = authenticator.generateSecret()

  // Store the secret in the database
  const { error } = await supabase.from("two_factor_auth").upsert({
    user_id: userId,
    secret,
    verified: false,
    updated_at: new Date().toISOString(),
  })

  if (error) {
    console.error("Error storing TOTP secret:", error)
    throw error
  }

  return secret
}

// Get the TOTP secret for a user
export async function getTOTPSecret(userId: string) {
  const { data, error } = await supabase
    .from("two_factor_auth")
    .select("secret, verified")
    .eq("user_id", userId)
    .single()

  if (error && error.code !== "PGRST116") {
    // PGRST116 is "no rows returned"
    console.error("Error getting TOTP secret:", error)
    throw error
  }

  return data
}

// Verify a TOTP token
export function verifyTOTP(token: string, secret: string) {
  try {
    return authenticator.verify({ token, secret })
  } catch (error) {
    console.error("Error verifying TOTP:", error)
    return false
  }
}

// Generate a TOTP URI for QR code
export function generateTOTPUri(secret: string, email: string) {
  return authenticator.keyuri(email, "UNITE Group", secret)
}

// Mark 2FA as verified for a user
export async function markTOTPAsVerified(userId: string) {
  const { error } = await supabase
    .from("two_factor_auth")
    .update({
      verified: true,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)

  if (error) {
    console.error("Error marking TOTP as verified:", error)
    throw error
  }

  return true
}

// Disable 2FA for a user
export async function disableTOTP(userId: string) {
  const { error } = await supabase.from("two_factor_auth").delete().eq("user_id", userId)

  if (error) {
    console.error("Error disabling TOTP:", error)
    throw error
  }

  // Also delete any backup codes
  await deleteBackupCodes(userId)

  return true
}

// Check if 2FA is enabled for a user
export async function isTOTPEnabled(userId: string) {
  const { data, error } = await supabase.from("two_factor_auth").select("verified").eq("user_id", userId).single()

  if (error && error.code !== "PGRST116") {
    console.error("Error checking if TOTP is enabled:", error)
    throw error
  }

  return data?.verified || false
}

// Generate backup codes for a user
export async function generateBackupCodes(userId: string) {
  // Delete any existing backup codes
  await deleteBackupCodes(userId)

  // Generate 10 random backup codes
  const codes = Array.from(
    { length: 10 },
    () =>
      Math.random().toString(36).substring(2, 6).toUpperCase() +
      "-" +
      Math.random().toString(36).substring(2, 6).toUpperCase(),
  )

  // Store the backup codes in the database
  const promises = codes.map((code) =>
    supabase.from("backup_codes").insert({
      user_id: userId,
      code,
      used: false,
    }),
  )

  await Promise.all(promises)

  return codes
}

// Get backup codes for a user
export async function getBackupCodes(userId: string) {
  const { data, error } = await supabase
    .from("backup_codes")
    .select("code, used")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error getting backup codes:", error)
    throw error
  }

  return data || []
}

// Verify a backup code
export async function verifyBackupCode(userId: string, code: string) {
  // Get the backup code
  const { data, error } = await supabase
    .from("backup_codes")
    .select("id")
    .eq("user_id", userId)
    .eq("code", code)
    .eq("used", false)
    .single()

  if (error || !data) {
    return false
  }

  // Mark the backup code as used
  await supabase
    .from("backup_codes")
    .update({
      used: true,
      used_at: new Date().toISOString(),
    })
    .eq("id", data.id)

  return true
}

// Delete all backup codes for a user
export async function deleteBackupCodes(userId: string) {
  const { error } = await supabase.from("backup_codes").delete().eq("user_id", userId)

  if (error) {
    console.error("Error deleting backup codes:", error)
    throw error
  }

  return true
}
