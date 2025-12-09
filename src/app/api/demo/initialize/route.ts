import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import { publicRateLimit } from "@/lib/rate-limit";

/**
 * DEMO INITIALIZATION API
 * Creates complete demo environment with organization, workspace, contacts, and sample data
 */

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (public endpoint)
    const rateLimitResult = await publicRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();

    console.log("Starting demo initialization...");

    // Step 1: Create or get demo organization
    console.log("Creating demo organization...");

    const { data: existingOrg } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("email", "demo@unite-hub.com")
      .single();

    let orgId: string;

    if (existingOrg) {
      orgId = existingOrg.id;
      console.log("Demo organization already exists:", orgId);
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from("organizations")
        .insert({
          name: "Demo Organization",
          email: "demo@unite-hub.com",
          phone: "+1-555-DEMO-123",
          website: "https://demo.unite-hub.com",
          team_size: "1-10",
          industry: "Technology",
          plan: "professional",
          status: "trial",
          trial_ends_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        })
        .select()
        .single();

      if (orgError || !newOrg) {
        throw new Error(`Failed to create demo organization: ${orgError?.message}`);
      }

      orgId = newOrg.id;
      console.log("Demo organization created:", orgId);
    }

    // Step 2: Create or get demo workspace
    console.log("Creating demo workspace...");

    const { data: existingWorkspace } = await supabase
      .from("workspaces")
      .select("id")
      .eq("org_id", orgId)
      .eq("name", "Demo Workspace")
      .single();

    let workspaceId: string;

    if (existingWorkspace) {
      workspaceId = existingWorkspace.id;
      console.log("Demo workspace already exists:", workspaceId);
    } else {
      const { data: newWorkspace, error: workspaceError } = await supabase
        .from("workspaces")
        .insert({
          org_id: orgId,
          name: "Demo Workspace",
          description: "Sample workspace for testing Unite-Hub features",
        })
        .select()
        .single();

      if (workspaceError || !newWorkspace) {
        throw new Error(`Failed to create demo workspace: ${workspaceError?.message}`);
      }

      workspaceId = newWorkspace.id;
      console.log("Demo workspace created:", workspaceId);
    }

    // Step 3: Create sample contacts
    console.log("Creating demo contacts...");

    const sampleContacts = [
      {
        workspace_id: workspaceId,
        name: "Sarah Johnson",
        email: "sarah.johnson@example.com",
        company: "TechStart Inc",
        job_title: "CEO",
        phone: "+1-555-0101",
        industry: "Technology",
        ai_score: 85,
        status: "lead",
        tags: ["demo", "hot-lead"],
        custom_fields: {
          source: "demo",
          interests: ["SaaS", "AI", "Automation"],
        },
      },
      {
        workspace_id: workspaceId,
        name: "Michael Chen",
        email: "michael.chen@example.com",
        company: "Growth Marketing Co",
        job_title: "CMO",
        phone: "+1-555-0102",
        industry: "Marketing",
        ai_score: 72,
        status: "prospect",
        tags: ["demo", "warm-lead"],
        custom_fields: {
          source: "demo",
          interests: ["Marketing Automation", "Analytics"],
        },
      },
      {
        workspace_id: workspaceId,
        name: "Emily Rodriguez",
        email: "emily.rodriguez@example.com",
        company: "E-Commerce Plus",
        job_title: "Operations Director",
        phone: "+1-555-0103",
        industry: "E-commerce",
        ai_score: 65,
        status: "prospect",
        tags: ["demo"],
        custom_fields: {
          source: "demo",
          interests: ["CRM", "Sales Automation"],
        },
      },
    ];

    const { data: contacts, error: contactsError } = await supabase
      .from("contacts")
      .upsert(sampleContacts, {
        onConflict: "workspace_id,email",
        ignoreDuplicates: false
      })
      .select();

    if (contactsError) {
      console.error("Failed to create demo contacts:", contactsError);
    }

    console.log("Demo contacts created:", contacts?.length || 0);

    // Step 4: Create sample drip campaign
    console.log("Creating demo drip campaign...");

    const { data: campaign, error: campaignError } = await supabase
      .from("drip_campaigns")
      .insert({
        workspace_id: workspaceId,
        name: "Welcome Sequence - New Leads",
        description: "Automated 5-email welcome sequence for new leads",
        sequence_type: "lead_nurture",
        goal: "Convert prospects to qualified leads",
        status: "draft",
        total_steps: 5,
        tags: ["demo", "onboarding"],
      })
      .select()
      .single();

    if (campaignError) {
      console.error("Failed to create demo campaign:", campaignError);
    }

    const campaignId: string | null = campaign?.id || null;

    // Step 5: Create sample campaign steps
    if (campaignId) {
      console.log("Creating demo campaign steps...");

      const steps = [
        {
          campaign_id: campaignId,
          step_number: 1,
          step_name: "Welcome Email",
          day_delay: 0,
          subject_line: "Welcome to {{company_name}}!",
          email_body: "Hi {{first_name}},\n\nWelcome! We're excited to help you grow your business...",
          email_body_html: "<p>Hi {{first_name}},</p><p>Welcome! We're excited to help you grow your business...</p>",
          cta: { text: "Get Started", url: "https://demo.unite-hub.com/start", type: "button" },
          ai_generated: true,
        },
        {
          campaign_id: campaignId,
          step_number: 2,
          step_name: "Product Introduction",
          day_delay: 2,
          subject_line: "Here's how {{company_name}} can help",
          email_body: "Hi {{first_name}},\n\nLet me show you our key features...",
          cta: { text: "Watch Demo", url: "https://demo.unite-hub.com/demo", type: "button" },
          ai_generated: true,
        },
        {
          campaign_id: campaignId,
          step_number: 3,
          step_name: "Case Study Share",
          day_delay: 5,
          subject_line: "How {{similar_company}} achieved 300% growth",
          email_body: "Hi {{first_name}},\n\nThought you'd find this interesting...",
          cta: { text: "Read Case Study", url: "https://demo.unite-hub.com/case-study", type: "button" },
          ai_generated: true,
        },
        {
          campaign_id: campaignId,
          step_number: 4,
          step_name: "Value Proposition",
          day_delay: 7,
          subject_line: "Save 10+ hours per week with automation",
          email_body: "Hi {{first_name}},\n\nLet's talk about your time savings...",
          cta: { text: "Schedule Call", url: "https://demo.unite-hub.com/book", type: "button" },
          ai_generated: true,
        },
        {
          campaign_id: campaignId,
          step_number: 5,
          step_name: "Final Offer",
          day_delay: 14,
          subject_line: "Last chance: 20% off for early adopters",
          email_body: "Hi {{first_name}},\n\nDon't miss this opportunity...",
          cta: { text: "Claim Offer", url: "https://demo.unite-hub.com/offer", type: "button" },
          ai_generated: true,
        },
      ];

      const { data: createdSteps, error: stepsError } = await supabase
        .from("campaign_steps")
        .insert(steps)
        .select();

      if (stepsError) {
        console.error("Failed to create demo campaign steps:", stepsError);
      }

      console.log("Demo campaign steps created:", createdSteps?.length || 0);
    }

    // Step 6: Create sample emails
    console.log("Creating demo emails...");

    if (contacts && contacts.length > 0) {
      const sampleEmails = [
        {
          workspace_id: workspaceId,
          contact_id: contacts[0].id,
          from: contacts[0].email,
          to: "demo@unite-hub.com",
          subject: "Interested in your CRM platform",
          body: "Hi, I came across your platform and I'm interested in learning more about how it can help our sales team...",
          ai_summary: "Lead expressing interest in CRM capabilities for sales team. High buying intent detected.",
          is_processed: true,
          metadata: {
            sentiment: "positive",
            intent: "product_inquiry",
            priority: "high",
          },
        },
        {
          workspace_id: workspaceId,
          contact_id: contacts[1].id,
          from: contacts[1].email,
          to: "demo@unite-hub.com",
          subject: "Question about pricing",
          body: "Hello, can you send me information about your pricing plans? We're a team of 15...",
          ai_summary: "Pricing inquiry for 15-person team. Ready to evaluate options.",
          is_processed: true,
          metadata: {
            sentiment: "neutral",
            intent: "pricing_inquiry",
            priority: "medium",
          },
        },
      ];

      const { data: emails, error: emailsError } = await supabase
        .from("emails")
        .insert(sampleEmails)
        .select();

      if (emailsError) {
        console.error("Failed to create demo emails:", emailsError);
      }

      console.log("Demo emails created:", emails?.length || 0);
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "Demo environment initialized successfully",
        data: {
          orgId,
          workspaceId,
          contactsCount: contacts?.length || 0,
          campaignId,
          campaignStepsCount: campaignId ? 5 : 0,
        },
        demo: {
          organizationName: "Demo Organization",
          workspaceName: "Demo Workspace",
          contactsGenerated: contacts?.length || 0,
          campaignName: "Welcome Sequence - New Leads",
          emailsGenerated: 2,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Demo initialization error:", error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize demo",
        message: error.message || "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/demo/initialize
 * Check demo status
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await getSupabaseServer();

    // Query for demo organization
    const { data: demoOrg } = await supabase
      .from("organizations")
      .select("id, name")
      .eq("email", "demo@unite-hub.com")
      .single();

    if (!demoOrg) {
      return NextResponse.json({
        initialized: false,
        message: "Demo not initialized. Call POST to create demo environment.",
      });
    }

    // Get demo workspace
    const { data: workspace } = await supabase
      .from("workspaces")
      .select("id, name")
      .eq("org_id", demoOrg.id)
      .eq("name", "Demo Workspace")
      .single();

    if (!workspace) {
      return NextResponse.json({
        initialized: false,
        hasOrg: true,
        message: "Demo organization exists but no workspace. Call POST to complete setup.",
      });
    }

    // Get demo data stats
    const { count: contactsCount } = await supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);

    const { count: campaignsCount } = await supabase
      .from("drip_campaigns")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);

    const { count: emailsCount } = await supabase
      .from("emails")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", workspace.id);

    return NextResponse.json({
      initialized: true,
      demo: {
        orgId: demoOrg.id,
        orgName: demoOrg.name,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
        contactsCount: contactsCount || 0,
        campaignsCount: campaignsCount || 0,
        emailsCount: emailsCount || 0,
      },
      message: "Demo environment is fully initialized",
    });
  } catch (error: any) {
    console.error("Demo status check error:", error);

    return NextResponse.json(
      {
        error: "Failed to check demo status",
        message: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/demo/initialize
 * Clean up demo data (for testing)
 */

export async function DELETE(request: NextRequest) {
  try {
    // Apply rate limiting
    const rateLimitResult = await publicRateLimit(request);
    if (rateLimitResult) {
      return rateLimitResult;
    }

    const supabase = await getSupabaseServer();

    console.log("Cleaning up demo data...");

    // Delete demo organization (cascade will handle workspaces, contacts, etc.)
    const { error: deleteError } = await supabase
      .from("organizations")
      .delete()
      .eq("email", "demo@unite-hub.com");

    if (deleteError) {
      console.error("Failed to delete demo organization:", deleteError);
      return NextResponse.json(
        {
          error: "Failed to cleanup demo",
          message: deleteError.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Demo data cleaned up successfully",
      note: "All demo organization data has been removed (cascaded deletion)",
    });
  } catch (error: any) {
    console.error("Demo cleanup error:", error);

    return NextResponse.json(
      {
        error: "Failed to cleanup demo",
        message: error.message,
      },
      { status: 500 }
    );
  }
}
