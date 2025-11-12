import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/clients/[id]/campaigns - Get all campaigns for client
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const platform = searchParams.get("platform");
    const status = searchParams.get("status");

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // In production, fetch campaigns from database
    // For now, return mock campaigns
    let campaigns = [
      {
        id: crypto.randomUUID(),
        client_id: id,
        workspace_id: client.workspace_id,
        name: "Q1 Brand Awareness",
        platform: "facebook",
        status: "active",
        objective: "Brand awareness",
        start_date: new Date("2025-01-01"),
        end_date: new Date("2025-03-31"),
        posts: [
          {
            id: crypto.randomUUID(),
            scheduled_date: new Date("2025-01-15"),
            content: "Sample post content",
            image_url: null,
            status: "scheduled",
          },
        ],
        performance: {
          impressions: 15000,
          engagement: 450,
          clicks: 120,
          spend: 500,
        },
        created_at: new Date(),
        updated_at: new Date(),
      },
    ];

    // Filter by platform if provided
    if (platform) {
      campaigns = campaigns.filter((c: any) => c.platform === platform);
    }

    // Filter by status if provided
    if (status) {
      campaigns = campaigns.filter((c: any) => c.status === status);
    }

    return NextResponse.json({
      campaigns,
      total: campaigns.length,
    });
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/campaigns - Create new campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
      );
    }

    // Get organization to check tier limits
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

    // Validate platform access based on tier
    const { platform, name, objective, start_date, end_date, posts } = body;

    if (!platform || !name) {
      return NextResponse.json(
        { error: "Missing required fields: platform, name" },
        { status: 400 }
      );
    }

    // Check platform access
    if (plan === "starter" && platform !== "facebook") {
      return NextResponse.json(
        {
          error:
            "Only Facebook campaigns are available in Starter plan. Upgrade to Professional for multi-platform campaigns.",
        },
        { status: 403 }
      );
    }

    // Create campaign
    const campaign = {
      id: crypto.randomUUID(),
      client_id: id,
      workspace_id: client.workspace_id,
      name,
      platform,
      status: "draft",
      objective: objective || "awareness",
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      posts: posts || [],
      performance: {
        impressions: 0,
        engagement: 0,
        clicks: 0,
        spend: 0,
      },
      created_at: new Date(),
      updated_at: new Date(),
    };

    // In production, save to database
    // await db.campaigns.create(campaign);

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "campaign_created",
      resource: "campaign",
      resource_id: campaign.id,
      agent: "user",
      status: "success",
      details: { campaign_name: name, platform },
    });

    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
