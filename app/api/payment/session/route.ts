import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Required environment variables:
// - STRIPE_SECRET_KEY: Your Stripe secret key

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16",
})

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const sessionId = searchParams.get("id")

  if (!sessionId) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["customer", "payment_intent"],
    })

    // Return only the data we need to avoid exposing sensitive information
    return NextResponse.json({
      id: session.id,
      status: session.status,
      customerEmail: session.customer_email,
      amountTotal: session.amount_total,
      currency: session.currency,
      paymentStatus: session.payment_status,
      projectId: session.metadata?.projectId,
    })
  } catch (error: any) {
    console.error("Error retrieving session:", error)
    return NextResponse.json({ error: "Failed to retrieve session details" }, { status: 500 })
  }
}
