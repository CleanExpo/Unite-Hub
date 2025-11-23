/**
 * Client Reality Score
 * Phase 36: MVP Client Truth Layer
 *
 * Honest snapshot of where the client currently stands
 */

export interface RealityScoreResult {
  overallScore: number;
  subScores: {
    technicalHealth: number;
    contentDepth: number;
    localPresence: number;
    experimentationActivity: number;
  };
  explanation: string;
  dataPoints: number;
  lastCalculated: string;
}

export interface ScoreInputs {
  websiteAudits?: { score: number; date: string }[];
  usageMetrics?: { logins: number; actionsThisMonth: number };
  contentCounts?: { concepts: number; approved: number };
  geoPresence?: { gmbClaimed: boolean; localCitations: number };
}

/**
 * Calculate client reality score
 * Returns honest assessment based on available data
 */
export function calculateRealityScore(inputs: ScoreInputs): RealityScoreResult {
  let dataPoints = 0;
  const subScores = {
    technicalHealth: 0,
    contentDepth: 0,
    localPresence: 0,
    experimentationActivity: 0,
  };

  // Technical Health (from audits)
  if (inputs.websiteAudits && inputs.websiteAudits.length > 0) {
    const latestAudit = inputs.websiteAudits[0];
    subScores.technicalHealth = latestAudit.score;
    dataPoints++;
  }

  // Content Depth (from content counts)
  if (inputs.contentCounts) {
    const { concepts, approved } = inputs.contentCounts;
    const approvalRate = concepts > 0 ? (approved / concepts) * 100 : 0;
    subScores.contentDepth = Math.min(100, concepts * 5 + approvalRate * 0.5);
    dataPoints++;
  }

  // Local Presence (from GEO data)
  if (inputs.geoPresence) {
    const { gmbClaimed, localCitations } = inputs.geoPresence;
    subScores.localPresence = (gmbClaimed ? 50 : 0) + Math.min(50, localCitations * 5);
    dataPoints++;
  }

  // Experimentation Activity (from usage)
  if (inputs.usageMetrics) {
    const { logins, actionsThisMonth } = inputs.usageMetrics;
    subScores.experimentationActivity = Math.min(100, logins * 10 + actionsThisMonth * 2);
    dataPoints++;
  }

  // Calculate overall score (weighted average of available sub-scores)
  const availableScores = Object.values(subScores).filter((s) => s > 0);
  const overallScore = availableScores.length > 0
    ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
    : 0;

  // Generate explanation
  let explanation = "";
  if (dataPoints === 0) {
    explanation = "Not enough data yet. Complete an audit or generate some concepts to see your Reality Score.";
  } else if (overallScore < 30) {
    explanation = "Early stage. There's significant room for improvement across most areas.";
  } else if (overallScore < 60) {
    explanation = "Building momentum. Some foundations are in place, with opportunities to strengthen.";
  } else if (overallScore < 80) {
    explanation = "Good progress. Core elements are solid with specific areas to optimize.";
  } else {
    explanation = "Strong position. Maintaining and fine-tuning will keep you competitive.";
  }

  return {
    overallScore,
    subScores,
    explanation,
    dataPoints,
    lastCalculated: new Date().toISOString(),
  };
}

/**
 * Get score label and color
 */
export function getScoreLabel(score: number): { label: string; color: string } {
  if (score < 30) return { label: "Early Stage", color: "text-red-600" };
  if (score < 60) return { label: "Building", color: "text-yellow-600" };
  if (score < 80) return { label: "Progressing", color: "text-blue-600" };
  return { label: "Strong", color: "text-green-600" };
}
