import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

const TEMPLATES = {
  welcome: {
    name: "Welcome Email Campaign",
    description: "Send a warm introduction to new contacts",
    steps: [
      {
        step_order: 1,
        step_type: "email",
        name: "Welcome Email",
        config: {
          subject: "Welcome! Let's get started",
          body: "Hi {{contact.name}},\n\nWelcome to our community! We're excited to have you here.\n\nBest regards,\n{{user.name}}",
        },
      },
    ],
  },
  followup: {
    name: "Follow-up Sequence",
    description: "3-email nurture sequence for prospects",
    steps: [
      {
        step_order: 1,
        step_type: "email",
        name: "Initial Contact",
        config: {
          subject: "Quick question about {{contact.company}}",
          body: "Hi {{contact.name}},\n\nI noticed you work at {{contact.company}}. I'd love to learn more about your current challenges.\n\nBest,\n{{user.name}}",
        },
      },
      {
        step_order: 2,
        step_type: "wait",
        name: "Wait 3 days",
        config: {
          wait_type: "days",
          wait_value: 3,
        },
      },
      {
        step_order: 3,
        step_type: "email",
        name: "Value Proposition",
        config: {
          subject: "How we can help {{contact.company}}",
          body: "Hi {{contact.name}},\n\nI wanted to share how we've helped companies like yours.\n\nWould you be open to a brief call?\n\nBest,\n{{user.name}}",
        },
      },
      {
        step_order: 4,
        step_type: "wait",
        name: "Wait 5 days",
        config: {
          wait_type: "days",
          wait_value: 5,
        },
      },
      {
        step_order: 5,
        step_type: "email",
        name: "Final Touch",
        config: {
          subject: "Last follow-up",
          body: "Hi {{contact.name}},\n\nI don't want to be a bother, but I genuinely think we could add value.\n\nLet me know if you're interested.\n\nBest,\n{{user.name}}",
        },
      },
    ],
  },
  reengagement: {
    name: "Re-engagement Campaign",
    description: "Win back cold contacts",
    steps: [
      {
        step_order: 1,
        step_type: "email",
        name: "We Miss You",
        config: {
          subject: "We'd love to reconnect",
          body: "Hi {{contact.name}},\n\nIt's been a while since we last connected. I wanted to reach out and see how things are going.\n\nBest,\n{{user.name}}",
        },
      },
      {
        step_order: 2,
        step_type: "wait",
        name: "Wait 7 days",
        config: {
          wait_type: "days",
          wait_value: 7,
        },
      },
      {
        step_order: 3,
        step_type: "email",
        name: "Special Offer",
        config: {
          subject: "Exclusive offer for past connections",
          body: "Hi {{contact.name}},\n\nWe're offering something special to our valued past connections.\n\nInterested in learning more?\n\nBest,\n{{user.name}}",
        },
      },
    ],
  },
};

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServer();

    // Get authenticated user from session
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { template } = body;

    if (!template || !TEMPLATES[template as keyof typeof TEMPLATES]) {
      return NextResponse.json(
        { error: "Invalid template" },
        { status: 400 }
      );
    }

    const templateData = TEMPLATES[template as keyof typeof TEMPLATES];

    // Get user's workspace
    const { data: userOrgs, error: orgError } = await supabase
      .from("user_organizations")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("is_active", true)
      .limit(1)
      .single();

    if (orgError || !userOrgs) {
      return NextResponse.json(
        { error: "No active organization found" },
        { status: 404 }
      );
    }

    const { data: workspaces, error: workspaceError } = await supabase
      .from("workspaces")
      .select("id")
      .eq("org_id", userOrgs.org_id)
      .limit(1)
      .single();

    if (workspaceError || !workspaces) {
      return NextResponse.json(
        { error: "No workspace found" },
        { status: 404 }
      );
    }

    const workspaceId = workspaces.id;

    // Create drip campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("drip_campaigns")
      .insert({
        workspace_id: workspaceId,
        name: templateData.name,
        description: templateData.description,
        trigger_type: "manual",
        status: "active",
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Error creating campaign:", campaignError);
      return NextResponse.json(
        { error: "Failed to create campaign" },
        { status: 500 }
      );
    }

    // Create campaign steps
    const stepsToInsert = templateData.steps.map((step) => ({
      campaign_id: campaign.id,
      step_order: step.step_order,
      step_type: step.step_type,
      name: step.name,
      config: step.config,
    }));

    const { error: stepsError } = await supabase
      .from("campaign_steps")
      .insert(stepsToInsert);

    if (stepsError) {
      console.error("Error creating campaign steps:", stepsError);
      // Rollback campaign creation
      await supabase
        .from("drip_campaigns")
        .delete()
        .eq("id", campaign.id);

      return NextResponse.json(
        { error: "Failed to create campaign steps" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "Campaign created successfully",
      data: campaign,
    });
  } catch (error) {
    console.error("Unexpected error creating campaign:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
