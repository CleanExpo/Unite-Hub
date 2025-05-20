import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    // Validate email
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    // Here you would typically add the email to your newsletter service
    // For example, using a service like Mailchimp, ConvertKit, etc.

    // For now, we'll just log the email and return a success response
    console.log("Newsletter subscription:", { email })

    return NextResponse.json(
      { success: true, message: "Thank you for subscribing to our newsletter!" },
      { status: 200 },
    )
  } catch (error) {
    console.error("Error processing newsletter subscription:", error)
    return NextResponse.json({ error: "An error occurred while processing your request" }, { status: 500 })
  }
}
