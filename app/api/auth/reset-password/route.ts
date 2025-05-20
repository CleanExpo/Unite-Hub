import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase"
import PasswordResetEmail from "@/emails/password-reset-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create a Supabase client with admin privileges
    const supabase = createClient()

    // Generate a password reset link with OTP
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/reset-password`,
      },
    })

    if (error) {
      console.error("Error generating password reset link:", error)
      return NextResponse.json({ error: "Failed to generate password reset link" }, { status: 500 })
    }

    // Send the password reset email using Resend
    const result = await resend.emails.send({
      from: "UNITE Group <noreply@unitegroup.com>",
      to: email,
      subject: "Reset your password",
      react: PasswordResetEmail({
        userEmail: email,
        resetUrl: data.properties.action_link,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending password reset email:", error)
    return NextResponse.json({ error: "Failed to send password reset email" }, { status: 500 })
  }
}
