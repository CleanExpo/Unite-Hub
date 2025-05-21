import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"

// Required environment variables:
// - STRIPE_SECRET_KEY: Your Stripe secret key
// - NEXT_PUBLIC_APP_URL: Your application's URL

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2023-10-16", // Use the latest API version
})

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { projectId, customerEmail } = await request.json()

    if (!projectId) {
      return NextResponse.json({ error: "Project ID is required" }, { status: 400 })
    }

    // Use the authenticated user's email if customerEmail is not provided
    const email = customerEmail || session.user.email

    if (!email) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 })
    }

    // Create Stripe checkout session
    const stripeSession = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
              name: "Architecture Blueprint",
              description: "Detailed architecture blueprint for your software project",
            },
            unit_amount: 55000, // $550.00 in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cancel?project_id=${projectId}`,
      customer_email: email,
      metadata: {
        projectId,
        userId: session.user.id,
      },
    })

    // In a real application, you would save the session ID to your database
    // Here we're assuming you have your own CRM/database system

    return NextResponse.json({ url: stripeSession.url })
  } catch (error: any) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Failed to create checkout session", details: error.message }, { status: 500 })
  }
}
