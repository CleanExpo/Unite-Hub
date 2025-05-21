import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { generateArchitecturePDF, generateCustomPDF } from "@/lib/pdf-generator-enhanced"
import { type PDFBrandingSettings, defaultBrandingSettings } from "@/types/pdf-branding"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Get the authenticated user
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const projectId = params.id

    // Get the template ID from the query parameters
    const { searchParams } = new URL(request.url)
    const templateId = searchParams.get("templateId")

    // In a real application, you would fetch the project from your database
    // For now, we'll use sample data (same as in the project detail page)
    const project = getSampleProjectDetail(projectId)

    // If a template ID is provided, fetch the template settings
    let pdfBlob

    if (templateId) {
      // In a real app, fetch the template from your database
      // For demo, we'll use mock data
      const template = getMockTemplate(templateId)

      if (template) {
        // Generate the PDF with custom settings
        pdfBlob = await generateCustomPDF(project, template)
      } else {
        // Fallback to default if template not found
        pdfBlob = await generateArchitecturePDF(project)
      }
    } else {
      // Use default template
      const defaultTemplate = getMockTemplate("default") || defaultBrandingSettings
      pdfBlob = await generateCustomPDF(project, defaultTemplate)
    }

    // Return the PDF with appropriate headers
    return new NextResponse(pdfBlob, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="architecture-blueprint-${projectId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating PDF:", error)
    return NextResponse.json({ error: "Failed to generate PDF" }, { status: 500 })
  }
}

// Get mock template by ID
function getMockTemplate(id: string): PDFBrandingSettings | null {
  const mockTemplates: PDFBrandingSettings[] = [
    {
      id: "default",
      name: "Default Template",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: true,
      primaryColor: "#2c3e50",
      secondaryColor: "#3498db",
      accentColor: "#e74c3c",
      fontFamily: "helvetica",
      includeTimestamp: true,
      includePageNumbers: true,
      includeCoverPage: true,
      templateStyle: "classic",
    },
    {
      id: "modern",
      name: "Modern Template",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      primaryColor: "#1a202c",
      secondaryColor: "#4299e1",
      accentColor: "#f56565",
      fontFamily: "arial",
      headerTitle: "Architecture Blueprint",
      footerText: "Confidential & Proprietary",
      includeTimestamp: true,
      includePageNumbers: true,
      includeCoverPage: true,
      templateStyle: "modern",
      companyName: "Modern Solutions Inc.",
    },
    {
      id: "minimal",
      name: "Minimal Template",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isDefault: false,
      primaryColor: "#000000",
      secondaryColor: "#718096",
      accentColor: "#f56565",
      fontFamily: "helvetica",
      includeTimestamp: false,
      includePageNumbers: true,
      includeCoverPage: false,
      templateStyle: "minimal",
    },
  ]

  return mockTemplates.find((t) => t.id === id) || null
}

// Sample data for demonstration
function getSampleProjectDetail(id: string) {
  return {
    id,
    name: "E-commerce Platform Redesign",
    status: "completed",
    createdAt: "2023-10-15T09:30:00Z",
    updatedAt: "2023-11-01T14:20:00Z",
    meetingDate: "2023-10-18T10:00:00Z",
    deliveryDate: "2023-10-25T15:00:00Z",
    totalPoints: 89,
    totalHours: 445,
    budget: 75000,
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
          {
            name: "Checkout Process",
            description: "Multi-step checkout with payment integration",
            priority: "high",
            complexity: "l",
            points: 13,
            hours: 65,
          },
          {
            name: "Order Management",
            description: "View and manage orders for customers and admins",
            priority: "medium",
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
          {
            name: "Personalized Recommendations",
            description: "Show product recommendations based on user behavior",
            priority: "low",
            complexity: "l",
            points: 13,
            hours: 65,
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
        {
          name: "Algolia",
          purpose: "Fast and relevant product search",
          apiDocumentation: "https://www.algolia.com/doc/api-reference/",
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
      {
        name: "Manager Mike",
        role: "Store Admin",
        goals: "Efficiently manage inventory, process orders quickly, and access sales reports",
        painPoints: "Complex admin interface, manual order processing, limited reporting",
      },
    ],
    technicalConstraints: "Must support IE11, mobile responsive, and load times under 3 seconds",
    businessConstraints: "Must launch before holiday season (November), budget cap of $75,000",
    preferredTechnologies: "React, Node.js, PostgreSQL, AWS",
    realityCheck:
      "Your MVP scope slightly exceeds your budget by about 15%. Minor adjustments may be needed to stay within budget constraints.",
  }
}
