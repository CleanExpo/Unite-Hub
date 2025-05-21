import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateCustomPDF } from "@/lib/pdf-generator-enhanced"

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the settings from the request body
    const { settings } = await request.json()

    if (!settings) {
      return NextResponse.json({ error: "Missing settings" }, { status: 400 })
    }

    // Use sample project data for the preview
    const sampleProject = getSampleProjectForPreview()

    // Generate the PDF with custom settings
    const pdfBlob = await generateCustomPDF(sampleProject, settings)

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "inline; filename=preview.pdf",
      },
    })
  } catch (error) {
    console.error("Error generating PDF preview:", error)
    return NextResponse.json({ error: "Failed to generate PDF preview" }, { status: 500 })
  }
}

// Sample data for preview
function getSampleProjectForPreview() {
  return {
    id: "preview",
    name: "Sample Project Preview",
    status: "completed",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    meetingDate: new Date().toISOString(),
    deliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    totalPoints: 42,
    totalHours: 210,
    budget: 50000,
    roadmap: {
      mvp: {
        features: [
          {
            name: "User Authentication",
            description: "Allow users to sign up, log in, and manage their accounts",
            priority: "high",
            complexity: "m",
            points: 8,
            hours: 40,
          },
          {
            name: "Product Catalog",
            description: "Display products with filtering and sorting options",
            priority: "high",
            complexity: "l",
            points: 13,
            hours: 65,
          },
          {
            name: "Shopping Cart",
            description: "Add, remove, and update items in the cart",
            priority: "high",
            complexity: "m",
            points: 8,
            hours: 40,
          },
        ],
      },
      future: {
        features: [
          {
            name: "Wishlist",
            description: "Allow users to save products for later",
            priority: "low",
            complexity: "s",
            points: 5,
            hours: 25,
          },
          {
            name: "Product Reviews",
            description: "Allow customers to leave reviews and ratings",
            priority: "medium",
            complexity: "m",
            points: 8,
            hours: 40,
          },
        ],
      },
      integrations: [
        {
          name: "Stripe",
          purpose: "Payment processing for customer orders",
          apiDocumentation: "https://stripe.com/docs/api",
        },
        {
          name: "Mailchimp",
          purpose: "Email marketing and customer communications",
          apiDocumentation: "https://mailchimp.com/developer/",
        },
      ],
    },
    personas: [
      {
        name: "Shopping Sarah",
        role: "Regular Customer",
        goals: "Find products quickly, get the best deals, and have a smooth checkout experience",
        painPoints: "Slow website, complicated checkout, hard to find products",
      },
    ],
    technicalConstraints: "Must support IE11, mobile responsive, and load times under 3 seconds",
    businessConstraints: "Must launch before holiday season (November), budget cap of $75,000",
    preferredTechnologies: "React, Node.js, PostgreSQL, AWS",
    realityCheck:
      "Your MVP scope slightly exceeds your budget by about 15%. Minor adjustments may be needed to stay within budget constraints.",
  }
}
