import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    // Validate the required fields
    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email, and message are required fields" }, { status: 400 })
    }

    // Here you would typically send the data to your email service or CRM
    // For example, using a service like SendGrid, Mailchimp, etc.

    // For now, we'll just log the data and return a success response
    console.log("Contact form submission:", { name, email, phone, subject, message })

    return NextResponse.json(
      { success: true, message: "Thank you for your message. We will get back to you soon!" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing contact form:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
