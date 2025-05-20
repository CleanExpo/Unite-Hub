import { NextResponse } from "next/server"
import { Resend } from "resend"
import { ContactFormEmail } from "@/emails/contact-form-email"

// Initialize Resend with the API key
const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: Request) {
  try {
    // Parse the request body
    const body = await req.json()
    const { name, email, phone, organisation, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required" }, { status: 400 })
    }

    // Send email using Resend
    const { data, error } = await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>", // Update with your verified domain
      to: ["your-email@example.com"], // Update with your email address
      subject: `New contact form submission from ${name}`,
      react: ContactFormEmail({
        name,
        email,
        phone: phone || undefined,
        organisation: organisation || undefined,
        message,
      }),
      reply_to: email,
    })

    if (error) {
      console.error("Error sending email:", error)
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Email sent successfully",
      data,
    })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
