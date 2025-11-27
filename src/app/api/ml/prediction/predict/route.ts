/**
 * Prediction API
 * POST /api/ml/prediction/predict
 * Generates conversion and churn predictions for leads
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase";
import {
  getPredictionEngine,
  LeadDataPoint,
} from "@/lib/ml/prediction-engine";
import {
  getLeadScoringFramework,
  LeadScoringInput,
} from "@/lib/ml/lead-scoring";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    let userId: string;
    let workspaceId: string;

    if (token) {
      const { supabaseBrowser } = await import("@/lib/supabase");
      const { data, error } = await supabaseBrowser.auth.getUser(token);
      if (error || !data.user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = data.user.id;
    } else {
      const supabase = await getSupabaseServer();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      userId = data.user.id;
    }

    workspaceId = req.nextUrl.searchParams.get("workspaceId") || "";
    if (!workspaceId)
      return NextResponse.json(
        { error: "workspaceId is required" },
        { status: 400 }
      );

    const body = await req.json();
    const { leads, predictionType = "conversion" } = body;

    if (!Array.isArray(leads) || leads.length === 0) {
      return NextResponse.json(
        { error: "leads array is required" },
        { status: 400 }
      );
    }

    const engine = getPredictionEngine();
    const predictions = engine.batchPredict(leads);

    // Store predictions in database
    const supabase = await getSupabaseServer();
    for (const prediction of predictions) {
      await supabase.from("alert_predictions").insert({
        workspace_id: workspaceId,
        lead_id: prediction.leadId,
        prediction_type: predictionType,
        conversion_probability: prediction.conversionProbability,
        churn_risk: prediction.churnRisk,
        lead_score: prediction.leadScore,
        confidence: prediction.confidence,
        confidence_lower: prediction.confidenceInterval.lower,
        confidence_upper: prediction.confidenceInterval.upper,
        recommended_actions: prediction.recommendedActions,
        risk_factors: prediction.riskFactors,
        opportunity_factors: prediction.opportunityFactors,
        timeline_weeks: prediction.predictedTimelineWeeks,
        created_at: new Date().toISOString(),
      });
    }

    // Calculate summary
    const avgConversion =
      predictions.reduce((sum, p) => sum + p.conversionProbability, 0) /
      predictions.length;
    const avgChurn =
      predictions.reduce((sum, p) => sum + p.churnRisk, 0) / predictions.length;
    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.confidence, 0) / predictions.length;

    const hotLeads = predictions.filter(
      (p) => p.conversionProbability > 0.7
    ).length;
    const warmLeads = predictions.filter(
      (p) =>
        p.conversionProbability > 0.4 && p.conversionProbability <= 0.7
    ).length;
    const coldLeads = predictions.filter(
      (p) => p.conversionProbability <= 0.4
    ).length;

    return NextResponse.json(
      {
        success: true,
        predictions: predictions.map((p) => ({
          leadId: p.leadId,
          conversionProbability: p.conversionProbability.toFixed(3),
          churnRisk: p.churnRisk.toFixed(3),
          leadScore: p.leadScore,
          confidence: p.confidence.toFixed(3),
          recommendedActions: p.recommendedActions,
          timelineWeeks: p.predictedTimelineWeeks,
        })),
        summary: {
          totalLeads: predictions.length,
          avgConversion: avgConversion.toFixed(3),
          avgChurn: avgChurn.toFixed(3),
          avgConfidence: avgConfidence.toFixed(3),
          distribution: {
            hot: hotLeads,
            warm: warmLeads,
            cold: coldLeads,
          },
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Prediction error:", error);
    return NextResponse.json(
      { error: "Prediction failed", details: error.message },
      { status: 500 }
    );
  }
}
