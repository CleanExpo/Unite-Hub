import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// GET /api/clients/[id]/hooks - Get all hooks for client
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
    const category = searchParams.get("category");
    const platform = searchParams.get("platform");
    const limit = parseInt(searchParams.get("limit") || "50");

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
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

    // In production, fetch hooks from database
    // Generate hooks based on client's business and persona
    const hooks = [
      {
        id: crypto.randomUUID(),
        client_id: id,
        category: "attention_grabber",
        platform: "facebook",
        hook_text: "What if you could 10x your productivity in just 30 days?",
        script:
          "Start with the hook, explain the problem, present the solution, showcase benefits, call to action",
        performance_score: 0.85,
        is_favorite: false,
        generated_by: "claude-opus-4",
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        client_id: id,
        category: "curiosity",
        platform: "instagram",
        hook_text: "The secret technique nobody is talking about...",
        script:
          "Hook with curiosity, build anticipation, reveal the technique, explain application, drive engagement",
        performance_score: 0.78,
        is_favorite: false,
        generated_by: "claude-opus-4",
        created_at: new Date(),
      },
      {
        id: crypto.randomUUID(),
        client_id: id,
        category: "problem_solution",
        platform: "tiktok",
        hook_text: "Struggling with [problem]? Here's what worked for me.",
        script:
          "Relate to problem, share struggle, introduce solution, show results, encourage action",
        performance_score: 0.82,
        is_favorite: true,
        generated_by: "claude-opus-4",
        created_at: new Date(),
      },
    ];

    // Limit hooks for starter plan
    const maxHooks = plan === "starter" ? 20 : 999;
    let filteredHooks = hooks.slice(0, maxHooks);

    // Filter by category if provided
    if (category) {
      filteredHooks = filteredHooks.filter((h: any) => h.category === category);
    }

    // Filter by platform if provided
    if (platform) {
      filteredHooks = filteredHooks.filter((h: any) => h.platform === platform);
    }

    // Apply limit
    filteredHooks = filteredHooks.slice(0, limit);

    return NextResponse.json({
      hooks: filteredHooks,
      total: filteredHooks.length,
      plan_limit: maxHooks,
      has_unlimited_access: plan === "professional",
    });
  } catch (error) {
    console.error("Error fetching hooks:", error);
    return NextResponse.json(
      { error: "Failed to fetch hooks" },
      { status: 500 }
    );
  }
}

// POST /api/clients/[id]/hooks - Generate new hooks
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
    const { platform, category, count = 5 } = body;

    // Check if client exists
    const client = await db.contacts.getById(id);
    if (!client) {
      return NextResponse.json(
        { error: "Client not found" },
        { status: 404 }
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

    // Limit generation count based on tier
    const maxCount = plan === "starter" ? 5 : 20;
    const actualCount = Math.min(count, maxCount);

    // In production, call Claude AI to generate hooks
    const generatedHooks = Array.from({ length: actualCount }, (_, i) => ({
      id: crypto.randomUUID(),
      client_id: id,
      category: category || "attention_grabber",
      platform: platform || "facebook",
      hook_text: `Generated hook ${i + 1} for ${platform || "social media"}`,
      script: `Generated script for hook ${i + 1}`,
      performance_score: 0.7 + Math.random() * 0.3,
      is_favorite: false,
      generated_by: "claude-opus-4",
      created_at: new Date(),
    }));

    // Log audit
    await db.auditLogs.create({
      org_id: workspace.org_id,
      action: "hooks_generated",
      resource: "hooks",
      resource_id: id,
      agent: "ai_agent",
      status: "success",
      details: { count: actualCount, platform, category },
    });

    return NextResponse.json({ hooks: generatedHooks }, { status: 201 });
  } catch (error) {
    console.error("Error generating hooks:", error);
    return NextResponse.json(
      { error: "Failed to generate hooks" },
      { status: 500 }
    );
  }
}
