import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";

/**
 * Intelligence Dashboard API
 *
 * GET /api/intelligence/dashboard?workspaceId=xxx
 *
 * Returns aggregated intelligence data for dashboard visualization:
 * - Total ideas, goals, pain points, requirements
 * - Sentiment distribution
 * - Energy levels
 * - Decision readiness
 * - Recent intelligence
 * - Contact-level breakdowns
 */
export async function GET(req: NextRequest) {
  try {
    // Validate authentication
    const { validateUserAuth, validateWorkspaceAccess } = await import("@/lib/workspace-validation");
    const user = await validateUserAuth(req);

    const workspaceId = req.nextUrl.searchParams.get("workspaceId");

    if (!workspaceId) {
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );
    }

    await validateWorkspaceAccess(workspaceId, user.orgId);

    const supabase = await getSupabaseServer();

    // Fetch all intelligence records for workspace
    const { data: intelligence, error: intelligenceError } = await supabase
      .from("email_intelligence")
      .select(`
        *,
        email:client_emails(id, subject, from_email, received_at),
        contact:contacts(id, name, email, company)
      `)
      .eq("workspace_id", workspaceId)
      .order("analyzed_at", { ascending: false });

    if (intelligenceError) {
      console.error("[intelligence-dashboard] Error:", intelligenceError);
      return NextResponse.json(
        { error: "Failed to fetch intelligence data" },
        { status: 500 }
      );
    }

    if (!intelligence || intelligence.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          summary: {
            totalEmails: 0,
            totalIdeas: 0,
            totalGoals: 0,
            totalPainPoints: 0,
            totalRequirements: 0,
          },
          sentimentDistribution: { positive: 0, neutral: 0, negative: 0 },
          averageEnergy: 0,
          averageDecisionReadiness: 0,
          recentIntelligence: [],
          contactBreakdown: [],
        },
      });
    }

    // Calculate summary statistics
    let totalIdeas = 0;
    let totalGoals = 0;
    let totalPainPoints = 0;
    let totalRequirements = 0;
    let totalEnergy = 0;
    let totalDecisionReadiness = 0;
    const sentimentCounts = { positive: 0, neutral: 0, negative: 0 };

    for (const record of intelligence) {
      totalIdeas += record.ideas?.length || 0;
      totalGoals += record.business_goals?.length || 0;
      totalPainPoints += record.pain_points?.length || 0;
      totalRequirements += record.requirements?.length || 0;
      totalEnergy += record.energy_level || 0;
      totalDecisionReadiness += record.decision_readiness || 0;

      if (record.sentiment === "positive") {
sentimentCounts.positive++;
} else if (record.sentiment === "negative") {
sentimentCounts.negative++;
} else {
sentimentCounts.neutral++;
}
    }

    // Calculate contact-level breakdown
    const contactMap = new Map();

    for (const record of intelligence) {
      if (!record.contact) {
continue;
}

      const contactId = record.contact.id;

      if (!contactMap.has(contactId)) {
        contactMap.set(contactId, {
          contactId,
          name: record.contact.name,
          email: record.contact.email,
          company: record.contact.company,
          emailsAnalyzed: 0,
          ideas: 0,
          goals: 0,
          painPoints: 0,
          requirements: 0,
          avgEnergy: 0,
          avgDecisionReadiness: 0,
          sentimentBreakdown: { positive: 0, neutral: 0, negative: 0 },
          energySum: 0,
          decisionSum: 0,
        });
      }

      const contact = contactMap.get(contactId);
      contact.emailsAnalyzed++;
      contact.ideas += record.ideas?.length || 0;
      contact.goals += record.business_goals?.length || 0;
      contact.painPoints += record.pain_points?.length || 0;
      contact.requirements += record.requirements?.length || 0;
      contact.energySum += record.energy_level || 0;
      contact.decisionSum += record.decision_readiness || 0;

      if (record.sentiment === "positive") {
contact.sentimentBreakdown.positive++;
} else if (record.sentiment === "negative") {
contact.sentimentBreakdown.negative++;
} else {
contact.sentimentBreakdown.neutral++;
}
    }

    // Calculate averages for contacts
    const contactBreakdown = Array.from(contactMap.values()).map((contact) => ({
      contactId: contact.contactId,
      name: contact.name,
      email: contact.email,
      company: contact.company,
      emailsAnalyzed: contact.emailsAnalyzed,
      ideas: contact.ideas,
      goals: contact.goals,
      painPoints: contact.painPoints,
      requirements: contact.requirements,
      avgEnergy: parseFloat((contact.energySum / contact.emailsAnalyzed).toFixed(1)),
      avgDecisionReadiness: parseFloat((contact.decisionSum / contact.emailsAnalyzed).toFixed(1)),
      sentimentBreakdown: contact.sentimentBreakdown,
    }));

    // Sort contacts by total intelligence (ideas + goals + painPoints)
    contactBreakdown.sort((a, b) => {
      const aTotal = a.ideas + a.goals + a.painPoints;
      const bTotal = b.ideas + b.goals + b.painPoints;
      return bTotal - aTotal;
    });

    // Get recent intelligence (last 10)
    const recentIntelligence = intelligence.slice(0, 10).map((record) => ({
      id: record.id,
      emailSubject: record.email?.subject,
      emailFrom: record.email?.from_email,
      emailDate: record.email?.received_at,
      contactName: record.contact?.name,
      sentiment: record.sentiment,
      energyLevel: record.energy_level,
      decisionReadiness: record.decision_readiness,
      ideasCount: record.ideas?.length || 0,
      goalsCount: record.business_goals?.length || 0,
      painPointsCount: record.pain_points?.length || 0,
      ideas: record.ideas?.slice(0, 3), // Show first 3
      goals: record.business_goals?.slice(0, 3),
      painPoints: record.pain_points?.slice(0, 3),
      analyzedAt: record.analyzed_at,
    }));

    // Return dashboard data
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          totalEmails: intelligence.length,
          totalIdeas,
          totalGoals,
          totalPainPoints,
          totalRequirements,
        },
        sentimentDistribution: sentimentCounts,
        averageEnergy: parseFloat((totalEnergy / intelligence.length).toFixed(1)),
        averageDecisionReadiness: parseFloat((totalDecisionReadiness / intelligence.length).toFixed(1)),
        recentIntelligence,
        contactBreakdown,
      },
    });
  } catch (error) {
    console.error("[intelligence-dashboard] Error:", error);

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
