import { NextResponse } from "next/server"
import { Resend } from "resend"
import { createClient } from "@/lib/supabase"
import VerificationEmail from "@/emails/verification-email"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create a Supabase client with admin privileges
    const supabase = createClient()

    // Generate a signup link with OTP
    const { data, error } = await supabase.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/verify`,
      },
    })

    if (error) {
      console.error("Error generating verification link:", error)
      return NextResponse.json({ error: "Failed to generate verification link" }, { status: 500 })
    }

    // Send the verification email using Resend
    const result = await resend.emails.send({
      from: "UNITE Group <noreply@unitegroup.com>",
      to: email,
      subject: "Verify your email address",
      react: VerificationEmail({
        userEmail: email,
        verificationUrl: data.properties.action_link,
      }),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error sending verification email:", error)
    return NextResponse.json({ error: "Failed to send verification email" }, { status: 500 })
  }
}
