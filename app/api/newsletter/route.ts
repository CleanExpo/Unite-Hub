import { NextResponse } from "next/server"
import { Resend } from "resend"
import { NewsletterEmail } from "@/emails/newsletter-email"
import { createClient } from "@/lib/supabase"

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json()
    const { email } = body

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient()

    // Store the email in Supabase
    const { error: dbError } = await supabase.from("newsletter_subscribers").insert([{ email }])

    if (dbError) {
      console.error("Error storing email in database:", dbError)

      // Check if it's a duplicate email error
      if (dbError.code === "23505") {
        return NextResponse.json({ error: "You're already subscribed to our newsletter" }, { status: 400 })
      }

      return NextResponse.json({ error: "Failed to subscribe to newsletter" }, { status: 500 })
    }

    // Send confirmation email using Resend
    const { data, error: emailError } = await resend.emails.send({
      from: "Newsletter <onboarding@resend.dev>", // Update with your verified domain
      to: ["your-email@example.com"], // Update with your email address
      subject: "New Newsletter Subscription",
      react: NewsletterEmail({ email }),
    })

    if (emailError) {
      console.error("Error sending email:", emailError)
      // We don't want to fail the subscription if just the email fails
      // So we log the error but still return success
    }

    return NextResponse.json({
      success: true,
      message: "Successfully subscribed to newsletter",
      data,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
