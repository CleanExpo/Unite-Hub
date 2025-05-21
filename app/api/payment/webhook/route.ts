import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

// Required environment variables:
// - STRIPE_SECRET_KEY: Your Stripe secret key
// - STRIPE_WEBHOOK_SECRET: Webhook signing secret from Stripe

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
})

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature") as string

  let event: Stripe.Event

  try {
    // Verify the webhook signature
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (error) {
    console.error("Webhook signature verification failed:", error)
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  // Handle the event
  if (event.type === "checkout.session.completed") {
    try {
      const session = event.data.object as Stripe.Checkout.Session
      const customerEmail = session.customer_email!
      const projectId = session.metadata?.projectId!
      const userId = session.metadata?.userId!

      // In a real application, you would:
      // 1. Update your database to mark the project as paid
      // 2. Schedule a consultation meeting
      // 3. Send a confirmation email

      console.log(`Payment successful for project ${projectId} by user ${userId} (${customerEmail})`)

      // For now, we'll just return success
      return NextResponse.json({ success: true })
    } catch (error) {
      console.error("Webhook processing error:", error)
      return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
    }
  }

  // Return 200 for other event types
  return NextResponse.json({ received: true })
}
