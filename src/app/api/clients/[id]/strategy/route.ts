import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/clients/[id]/strategy - Get marketing strategy for client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Apply rate limiting
    const rateLimitResult = await apiRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const { id } = await params;

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Check if client exists and verify workspace access
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (client.workspace_id !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get organization to check tier
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const organization = await db.organizations.getById(workspace.org_id);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    const plan = organization.plan || "starter";

    // In production, fetch strategy from database
    const strategy = {
      id: crypto.randomUUID(),
      client_id: id,
      version: 1,
      executive_summary: {
        overview: "Comprehensive marketing strategy for growth",
        key_objectives: [
          "Increase brand awareness by 50%",
          "Generate 100+ qualified leads per month",
          "Establish thought leadership",
        ],
        target_timeline: "Q1-Q4 2025",
      },
      market_analysis: {
        market_size: "Large and growing",
        trends: ["Digital transformation", "AI adoption", "Personalization"],
        opportunities: [
          "Untapped market segments",
          "Emerging technologies",
          "Strategic partnerships",
        ],
        threats: ["Increased competition", "Market saturation"],
      },
      target_audience: {
        primary: "Small to medium businesses",
        secondary: "Enterprise clients",
        demographics: "Tech-savvy decision makers, 25-55 years",
      },
      unique_value_proposition:
        "AI-powered automation that delivers results 24/7",
      content_pillars: [
        {
          name: "Educational Content",
          description: "How-to guides, tutorials, industry insights",
        },
        {
          name: "Case Studies",
          description: "Success stories and results",
        },
        {
          name: "Thought Leadership",
          description: "Industry trends and expert opinions",
        },
      ],
      channels: {
        primary: ["LinkedIn", "Email Marketing", "Content Marketing"],
        secondary: ["Instagram", "Facebook", "TikTok"],
        available_platforms:
          plan === "professional"
            ? ["facebook", "instagram", "tiktok", "linkedin"]
            : ["facebook"],
      },
      campaign_calendar: {
        q1: "Brand awareness and content creation",
        q2: "Lead generation and engagement",
        q3: "Conversion optimization",
        q4: "Retention and expansion",
      },
      budget_guidance: {
        recommended_monthly_budget:
          plan === "professional" ? "$5,000-$10,000" : "$2,000-$5,000",
        allocation: {
          content_creation: "30%",
          paid_advertising: "40%",
          tools_and_software: "20%",
          other: "10%",
        },
      },
      success_metrics: [
        "Website traffic increase",
        "Lead generation rate",
        "Conversion rate",
        "Customer acquisition cost",
        "Return on ad spend",
      ],
      generated_by: "claude-opus-4",
      created_at: new Date(),
      updated_at: new Date(),
    };

    return NextResponse.json({ strategy });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching strategy:", error);
    return NextResponse.json(
      { error: "Failed to fetch strategy" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/strategy - Generate or update strategy
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate user authentication
    const user = await validateUserAuth(request);

    // Check if client exists and verify workspace access
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Verify workspace access
    if (client.workspace_id !== user.orgId) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // Get workspace and organization
    const workspace = await db.workspaces.getById(client.workspace_id);
    if (!workspace) {
      return NextResponse.json(
        { error: "Workspace not found" },
        { status: 404 }
      );
    }

    const organization = await db.organizations.getById(workspace.org_id);
    if (!organization) {
      return NextResponse.json(
        { error: "Organization not found" },
        { status: 404 }
      );
    }

    // In production, call Claude AI to generate strategy
    // For now, return a generated strategy

    const strategy = {
      id: crypto.randomUUID(),
      client_id: id,
      version: 1,
      status: "active",
      generated_by: "claude-opus-4",
      created_at: new Date(),
    };

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "strategy_generated",
      resource: "strategy",
      resource_id: strategy.id,
      agent: "ai_agent",
      status: "success",
      details: { client_id: id, user_id: user.userId },
    });

    return NextResponse.json({ strategy }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error generating strategy:", error);
    return NextResponse.json(
      { error: "Failed to generate strategy" },
      { status: 500 }
    );
  }
}
