import { NextRequest, NextResponse } from "next/server";
import { validateUserAuth } from "@/lib/workspace-validation";
import { db } from "@/lib/db";
import { apiRateLimit } from "@/lib/rate-limit";

// GET /api/clients/[id]/persona - Get current persona for client
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

    // In production, fetch persona from database
    // For now, return mock data based on client info
    const persona = {
      id: crypto.randomUUID(),
      client_id: id,
      version: 1,
      demographics: {
        age_range: "25-45",
        gender: "All",
        location: client.company ? "Urban areas" : "Mixed",
        income_level: "Middle to Upper Middle",
      },
      psychographics: {
        interests: [],
        values: [],
        lifestyle: "",
        pain_points: [],
        goals: [],
      },
      buying_behavior: {
        decision_factors: [],
        purchase_frequency: "Monthly",
        preferred_channels: ["Online", "Social Media"],
        price_sensitivity: "Medium",
      },
      communication_preferences: {
        preferred_platforms: ["Email", "Instagram", "LinkedIn"],
        content_types: ["Educational", "Entertaining"],
        tone: "Professional yet approachable",
        timing: "Weekday evenings",
      },
      generated_by: "claude-opus-4",
      created_at: new Date(),
      updated_at: new Date(),
    };

    return NextResponse.json({ persona });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error fetching persona:", error);
    return NextResponse.json(
      { error: "Failed to fetch persona" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/persona - Generate or update persona
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

    // In production, call Claude AI to generate persona
    // For now, return a generated persona

    const persona = {
      id: crypto.randomUUID(),
      client_id: id,
      version: 1,
      status: "active",
      demographics: {
        age_range: "25-45",
        gender: "All",
        location: "Urban areas",
        income_level: "Middle to Upper Middle",
      },
      psychographics: {
        interests: ["Innovation", "Efficiency", "Growth"],
        values: ["Quality", "Reliability", "Transparency"],
        lifestyle: "Fast-paced, tech-savvy professionals",
        pain_points: [
          "Time constraints",
          "Information overload",
          "Need for personalization",
        ],
        goals: [
          "Increase productivity",
          "Stay ahead of competition",
          "Build meaningful connections",
        ],
      },
      buying_behavior: {
        decision_factors: ["ROI", "Ease of use", "Customer support"],
        purchase_frequency: "Monthly",
        preferred_channels: ["Online", "Direct sales", "Referrals"],
        price_sensitivity: "Medium",
      },
      communication_preferences: {
        preferred_platforms: ["Email", "LinkedIn", "Instagram"],
        content_types: ["Educational", "Case studies", "How-to guides"],
        tone: "Professional yet approachable",
        timing: "Weekday mornings and evenings",
      },
      generated_by: "claude-opus-4",
      created_at: new Date(),
      updated_at: new Date(),
    };

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "persona_generated",
      resource: "persona",
      resource_id: persona.id,
      agent: "ai_agent",
      status: "success",
      details: { client_id: id, version: persona.version, user_id: user.userId },
    });

    return NextResponse.json({ persona }, { status: 201 });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
    }
    console.error("Error generating persona:", error);
    return NextResponse.json(
      { error: "Failed to generate persona" },
      { status: 500 }
    );
  }
}
