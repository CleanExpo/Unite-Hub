import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Contact Intelligence API
 *
 * GET /api/intelligence/contact?contactId=xxx&workspaceId=xxx
 *
 * Returns comprehensive intelligence data for a specific contact:
 * - All ideas extracted from their emails
 * - All business goals
 * - All pain points
 * - All requirements
 * - Sentiment timeline
 * - Energy/Decision readiness trends
 * - Email-by-email breakdown
 */
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { validateUserAuth, validateWorkspaceAccess } = await import("@/lib/workspace-validation");
    const user = await validateUserAuth(req);

    const workspaceId = req.nextUrl.searchParams.get("workspaceId");
    const contactId = req.nextUrl.searchParams.get("contactId");

    if (!workspaceId || !contactId) {
      return NextResponse.json(
        { error: "workspaceId and contactId are required" },
        { status: 400 }
      );
    }

    await validateWorkspaceAccess(workspaceId, user.orgId);

    const supabase = await getSupabaseServer();

    // Fetch contact details
    const { data: contact, error: contactError } = await supabase
      .from("contacts")
      .select("*")
      .eq("id", contactId)
      .eq("workspace_id", workspaceId)
      .maybeSingle();

    if (contactError || !contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    // Fetch all intelligence for this contact
    const { data: intelligence, error: intelligenceError } = await supabase
      .from("email_intelligence")
      .select(`
        *,
        email:client_emails(id, subject, from_email, received_at, snippet)
      `)
      .eq("contact_id", contactId)
      .eq("workspace_id", workspaceId)
      .order("analyzed_at", { ascending: false });

    if (intelligenceError) {
      console.error("[contact-intelligence] Error:", intelligenceError);
      return NextResponse.json(
        { error: "Failed to fetch intelligence data" },
        { status: 500 }
      );
    }

    if (!intelligence || intelligence.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          contact,
          summary: {
            emailsAnalyzed: 0,
            totalIdeas: 0,
            totalGoals: 0,
            totalPainPoints: 0,
            totalRequirements: 0,
          },
          allIdeas: [],
          allGoals: [],
          allPainPoints: [],
          allRequirements: [],
          sentimentTimeline: [],
          emailBreakdown: [],
        },
      });
    }

    // Aggregate all intelligence
    const allIdeas = [];
    const allGoals = [];
    const allPainPoints = [];
    const allRequirements = [];
    const sentimentTimeline = [];
    const emailBreakdown = [];

    let totalIdeas = 0;
    let totalGoals = 0;
    let totalPainPoints = 0;
    let totalRequirements = 0;

    for (const record of intelligence) {
      // Collect all unique items
      if (record.ideas) {
        for (const idea of record.ideas) {
          if (!allIdeas.includes(idea)) {
            allIdeas.push({
              text: idea,
              source: record.email?.subject,
              date: record.email?.received_at,
            });
          }
        }
        totalIdeas += record.ideas.length;
      }

      if (record.business_goals) {
        for (const goal of record.business_goals) {
          if (!allGoals.some(g => g.text === goal)) {
            allGoals.push({
              text: goal,
              source: record.email?.subject,
              date: record.email?.received_at,
            });
          }
        }
        totalGoals += record.business_goals.length;
      }

      if (record.pain_points) {
        for (const pain of record.pain_points) {
          if (!allPainPoints.some(p => p.text === pain)) {
            allPainPoints.push({
              text: pain,
              source: record.email?.subject,
              date: record.email?.received_at,
            });
          }
        }
        totalPainPoints += record.pain_points.length;
      }

      if (record.requirements) {
        for (const req of record.requirements) {
          if (!allRequirements.some(r => r.text === req)) {
            allRequirements.push({
              text: req,
              source: record.email?.subject,
              date: record.email?.received_at,
            });
          }
        }
        totalRequirements += record.requirements.length;
      }

      // Sentiment timeline
      sentimentTimeline.push({
        date: record.email?.received_at,
        sentiment: record.sentiment,
        energyLevel: record.energy_level,
        decisionReadiness: record.decision_readiness,
        emailSubject: record.email?.subject,
      });

      // Email breakdown
      emailBreakdown.push({
        emailId: record.email?.id,
        subject: record.email?.subject,
        date: record.email?.received_at,
        snippet: record.email?.snippet?.substring(0, 200),
        sentiment: record.sentiment,
        energyLevel: record.energy_level,
        decisionReadiness: record.decision_readiness,
        ideas: record.ideas || [],
        goals: record.business_goals || [],
        painPoints: record.pain_points || [],
        requirements: record.requirements || [],
        questionsAsked: record.questions_asked || [],
        decisionsMade: record.decisions_made || [],
      });
    }

    // Sort timeline chronologically (oldest first)
    sentimentTimeline.reverse();

    // Return comprehensive intelligence
    return NextResponse.json({
      success: true,
      data: {
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
          company: contact.company,
          jobTitle: contact.job_title,
          status: contact.status,
        },
        summary: {
          emailsAnalyzed: intelligence.length,
          totalIdeas,
          totalGoals,
          totalPainPoints,
          totalRequirements,
          avgEnergy: parseFloat(
            (intelligence.reduce((sum, r) => sum + (r.energy_level || 0), 0) / intelligence.length).toFixed(1)
          ),
          avgDecisionReadiness: parseFloat(
            (intelligence.reduce((sum, r) => sum + (r.decision_readiness || 0), 0) / intelligence.length).toFixed(1)
          ),
          sentimentBreakdown: {
            positive: intelligence.filter(r => r.sentiment === "positive").length,
            neutral: intelligence.filter(r => r.sentiment === "neutral").length,
            negative: intelligence.filter(r => r.sentiment === "negative").length,
          },
        },
        allIdeas,
        allGoals,
        allPainPoints,
        allRequirements,
        sentimentTimeline,
        emailBreakdown,
      },
    });
  } catch (error) {
    console.error("[contact-intelligence] Error:", error);

    if (error instanceof Error) {
      if (error.message.includes("Unauthorized")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message.includes("Forbidden")) {
        return NextResponse.json({ error: "Access denied" }, { status: 403 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
