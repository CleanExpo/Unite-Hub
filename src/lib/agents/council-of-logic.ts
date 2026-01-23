/**
 * Council of Logic - Mathematical First Principles Deliberation Engine
 *
 * A meta-reasoning layer that evaluates all AI operations through the lens of
 * four legendary mathematicians/scientists:
 * - Alan Turing: Algorithmic efficiency & computational bounds
 * - John von Neumann: System architecture & game theory
 * - Pierre Bézier: Frontend physics & animation curves
 * - Claude Shannon: Information theory & token economy
 *
 * @example
 * const council = new CouncilOfLogic();
 * const verdict = await council.deliberate({
 *   operation: 'generate_campaign',
 *   code: campaignCode,
 *   context: { userCount: 1000, targetConversion: 0.05 }
 * });
 */

import Anthropic from "@anthropic-ai/sdk";

// ============================================================================
// Types
// ============================================================================

export type CouncilMember =
  | "Alan_Turing"
  | "John_von_Neumann"
  | "Pierre_Bezier"
  | "Claude_Shannon";

export type ComplexityClass =
  | "O(1)"
  | "O(log n)"
  | "O(n)"
  | "O(n log n)"
  | "O(n^2)"
  | "O(n^3)"
  | "O(2^n)"
  | "O(n!)";

export interface CouncilMemberProfile {
  role: string;
  focus: string;
  icon: string;
  color: string;
  evaluationCriteria: string[];
}

export interface MemberVerdict {
  member: CouncilMember;
  approved: boolean;
  score: number; // 0-100
  reasoning: string;
  recommendations: string[];
  metrics: Record<string, number | string>;
}

export interface CouncilDeliberation {
  id: string;
  operation: string;
  startedAt: Date;
  completedAt?: Date;
  phase: "proof" | "solve" | "verify" | "complete";
  verdicts: MemberVerdict[];
  consensus: boolean;
  overallScore: number;
  finalVerdict: "approved" | "rejected" | "needs_revision";
  mathematicalModel?: string;
  complexityAnalysis?: {
    time: ComplexityClass;
    space: ComplexityClass;
    acceptable: boolean;
  };
}

export interface DeliberationRequest {
  operation: string;
  code?: string;
  prompt?: string;
  context?: Record<string, unknown>;
  skipMembers?: CouncilMember[];
}

// ============================================================================
// Council Member Profiles
// ============================================================================

export const COUNCIL_PROFILES: Record<CouncilMember, CouncilMemberProfile> = {
  Alan_Turing: {
    role: "Algorithmic Efficiency & Logic",
    focus:
      "Reduce code complexity. If a function is O(n²), reject it. Demand O(n) or O(log n).",
    icon: "cpu",
    color: "#3b82f6",
    evaluationCriteria: [
      "Time complexity analysis",
      "Space complexity bounds",
      "Halting problem considerations",
      "Computability constraints",
    ],
  },
  John_von_Neumann: {
    role: "System Architecture & Game Theory",
    focus:
      "Optimise agent workflow. Treat user interactions as game theory moves to maximise conversion.",
    icon: "network",
    color: "#8b5cf6",
    evaluationCriteria: [
      "Nash equilibrium in user flows",
      "Minimax decision trees",
      "Expected value calculations",
      "Strategic dominance",
    ],
  },
  Pierre_Bezier: {
    role: "Frontend Physics & Animation",
    focus:
      "Interpolation curves for UI. No linear transitions. Use physics-based springs for luxury feel.",
    icon: "bezier-curve",
    color: "#ec4899",
    evaluationCriteria: [
      "Cubic bezier continuity",
      "Spring physics parameters",
      "Perceptual smoothness",
      "60fps guarantee",
    ],
  },
  Claude_Shannon: {
    role: "Information Theory (Token Economy)",
    focus:
      "Maximum signal, minimum noise. Compress prompts and data structures to save token costs.",
    icon: "binary",
    color: "#10b981",
    evaluationCriteria: [
      "Shannon entropy analysis",
      "Compression ratio",
      "Signal-to-noise ratio",
      "Channel capacity utilisation",
    ],
  },
};

// ============================================================================
// Complexity Analysis
// ============================================================================

const COMPLEXITY_HIERARCHY: ComplexityClass[] = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
  "O(n^2)",
  "O(n^3)",
  "O(2^n)",
  "O(n!)",
];

const ACCEPTABLE_TIME_COMPLEXITY: ComplexityClass[] = [
  "O(1)",
  "O(log n)",
  "O(n)",
  "O(n log n)",
];

export function isAcceptableComplexity(complexity: ComplexityClass): boolean {
  return ACCEPTABLE_TIME_COMPLEXITY.includes(complexity);
}

export function compareComplexity(
  a: ComplexityClass,
  b: ComplexityClass
): number {
  return COMPLEXITY_HIERARCHY.indexOf(a) - COMPLEXITY_HIERARCHY.indexOf(b);
}

// ============================================================================
// Council of Logic Engine
// ============================================================================

let anthropicClient: Anthropic | null = null;
let clientTimestamp = 0;
const CLIENT_TTL = 60000;

function getClient(): Anthropic {
  const now = Date.now();
  if (!anthropicClient || now - clientTimestamp > CLIENT_TTL) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    clientTimestamp = now;
  }
  return anthropicClient;
}

export class CouncilOfLogic {
  private deliberations: Map<string, CouncilDeliberation> = new Map();

  /**
   * Run full council deliberation on an operation
   */
  async deliberate(request: DeliberationRequest): Promise<CouncilDeliberation> {
    const id = `col-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const deliberation: CouncilDeliberation = {
      id,
      operation: request.operation,
      startedAt: new Date(),
      phase: "proof",
      verdicts: [],
      consensus: false,
      overallScore: 0,
      finalVerdict: "needs_revision",
    };

    this.deliberations.set(id, deliberation);

    try {
      // STEP 1: THE PROOF - Establish mathematical model
      deliberation.mathematicalModel = await this.establishProof(request);
      deliberation.phase = "solve";

      // STEP 2: THE SOLVE - Analyse complexity
      deliberation.complexityAnalysis = await this.analyseComplexity(request);
      deliberation.phase = "verify";

      // STEP 3: THE VERIFY - Council votes
      const members = (Object.keys(COUNCIL_PROFILES) as CouncilMember[]).filter(
        (m) => !request.skipMembers?.includes(m)
      );

      for (const member of members) {
        const verdict = await this.getMemberVerdict(member, request, deliberation);
        deliberation.verdicts.push(verdict);
      }

      // Calculate consensus
      const approvals = deliberation.verdicts.filter((v) => v.approved).length;
      const totalMembers = deliberation.verdicts.length;
      deliberation.consensus = approvals / totalMembers >= 0.75;

      // Calculate overall score (weighted)
      const weights: Record<CouncilMember, number> = {
        Alan_Turing: 0.3,
        John_von_Neumann: 0.25,
        Pierre_Bezier: 0.2,
        Claude_Shannon: 0.25,
      };

      let weightedSum = 0;
      let totalWeight = 0;
      for (const verdict of deliberation.verdicts) {
        const weight = weights[verdict.member] || 0.25;
        weightedSum += verdict.score * weight;
        totalWeight += weight;
      }
      deliberation.overallScore = Math.round(weightedSum / totalWeight);

      // Check for Turing veto (complexity too high)
      const turingVerdict = deliberation.verdicts.find(
        (v) => v.member === "Alan_Turing"
      );
      const turingVeto = turingVerdict && !turingVerdict.approved && turingVerdict.score < 40;

      // Final verdict
      if (turingVeto) {
        deliberation.finalVerdict = "rejected";
      } else if (deliberation.consensus && deliberation.overallScore >= 70) {
        deliberation.finalVerdict = "approved";
      } else if (deliberation.overallScore >= 50) {
        deliberation.finalVerdict = "needs_revision";
      } else {
        deliberation.finalVerdict = "rejected";
      }

      deliberation.phase = "complete";
      deliberation.completedAt = new Date();
    } catch (error) {
      console.error("[CouncilOfLogic] Deliberation error:", error);
      deliberation.finalVerdict = "needs_revision";
      deliberation.phase = "complete";
      deliberation.completedAt = new Date();
    }

    return deliberation;
  }

  /**
   * STEP 1: THE PROOF - Establish mathematical model
   */
  private async establishProof(request: DeliberationRequest): Promise<string> {
    const client = getClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 500,
      messages: [
        {
          role: "user",
          content: `As a mathematical logician, identify the core mathematical/logical model for this operation:

Operation: ${request.operation}
${request.code ? `Code snippet:\n\`\`\`\n${request.code.slice(0, 1000)}\n\`\`\`` : ""}
${request.prompt ? `Prompt:\n${request.prompt.slice(0, 500)}` : ""}

Respond with ONLY the mathematical model name and a one-line description. Example:
"Graph traversal (BFS) - Finding shortest path in user interaction flow"`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return textBlock?.text || "General computation model";
  }

  /**
   * STEP 2: Analyse complexity
   */
  private async analyseComplexity(
    request: DeliberationRequest
  ): Promise<{ time: ComplexityClass; space: ComplexityClass; acceptable: boolean }> {
    if (!request.code) {
      return { time: "O(n)", space: "O(1)", acceptable: true };
    }

    const client = getClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 200,
      messages: [
        {
          role: "user",
          content: `Analyse the time and space complexity of this code. Respond in EXACTLY this format:
TIME: O(?)
SPACE: O(?)

Code:
\`\`\`
${request.code.slice(0, 2000)}
\`\`\``,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text || "";

    const timeMatch = text.match(/TIME:\s*O\(([^)]+)\)/i);
    const spaceMatch = text.match(/SPACE:\s*O\(([^)]+)\)/i);

    const time = this.parseComplexity(timeMatch?.[1] || "n");
    const space = this.parseComplexity(spaceMatch?.[1] || "1");

    return {
      time,
      space,
      acceptable: isAcceptableComplexity(time),
    };
  }

  private parseComplexity(raw: string): ComplexityClass {
    const normalized = raw.toLowerCase().replace(/\s/g, "");
    if (normalized === "1") {
return "O(1)";
}
    if (normalized.includes("logn") || normalized.includes("log n")) {
return "O(log n)";
}
    if (normalized === "n") {
return "O(n)";
}
    if (normalized.includes("nlogn") || normalized.includes("n log n")) {
return "O(n log n)";
}
    if (normalized.includes("n^2") || normalized.includes("n²")) {
return "O(n^2)";
}
    if (normalized.includes("n^3") || normalized.includes("n³")) {
return "O(n^3)";
}
    if (normalized.includes("2^n")) {
return "O(2^n)";
}
    if (normalized.includes("n!")) {
return "O(n!)";
}
    return "O(n)";
  }

  /**
   * Get individual council member verdict
   */
  private async getMemberVerdict(
    member: CouncilMember,
    request: DeliberationRequest,
    deliberation: CouncilDeliberation
  ): Promise<MemberVerdict> {
    const profile = COUNCIL_PROFILES[member];
    const client = getClient();

    const systemPrompt = this.buildMemberSystemPrompt(member, profile);
    const userPrompt = this.buildMemberUserPrompt(member, request, deliberation);

    try {
      const response = await client.messages.create({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 600,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      });

      const textBlock = response.content.find((b) => b.type === "text");
      const text = textBlock?.text || "";

      return this.parseMemberResponse(member, text);
    } catch (error) {
      console.error(`[CouncilOfLogic] ${member} evaluation error:`, error);
      return {
        member,
        approved: false,
        score: 50,
        reasoning: "Evaluation failed - defaulting to cautious review",
        recommendations: ["Manual review recommended"],
        metrics: {},
      };
    }
  }

  private buildMemberSystemPrompt(member: CouncilMember, profile: CouncilMemberProfile): string {
    const personas: Record<CouncilMember, string> = {
      Alan_Turing: `You are Alan Turing, evaluating code for computational efficiency.
Your standards are extremely high. You reject anything O(n²) or worse without strong justification.
You value elegant algorithms, deterministic behaviour, and provable correctness.`,

      John_von_Neumann: `You are John von Neumann, evaluating system architecture through game theory.
You see every user interaction as a strategic move. You optimise for Nash equilibrium.
You demand systems that maximise expected value and identify dominant strategies.`,

      Pierre_Bezier: `You are Pierre Bézier, evaluating UI physics and animation.
You HATE linear transitions. Everything must have physics-based springs or cubic-bezier curves.
You demand 60fps, smooth interpolation, and the "luxury" feel of high-end interfaces.`,

      Claude_Shannon: `You are Claude Shannon, evaluating information density and token economy.
You measure everything in bits. Maximum signal, minimum noise.
You demand compressed prompts, efficient data structures, and optimal channel utilisation.`,
    };

    return `${personas[member]}

Your evaluation criteria: ${profile.evaluationCriteria.join(", ")}

Respond in this EXACT format:
APPROVED: [YES/NO]
SCORE: [0-100]
REASONING: [One paragraph]
RECOMMENDATIONS: [Bullet list]
METRICS: [Key metrics as "key: value" pairs]`;
  }

  private buildMemberUserPrompt(
    member: CouncilMember,
    request: DeliberationRequest,
    deliberation: CouncilDeliberation
  ): string {
    let prompt = `Evaluate this operation from your perspective:\n\nOperation: ${request.operation}`;

    if (deliberation.mathematicalModel) {
      prompt += `\nMathematical model: ${deliberation.mathematicalModel}`;
    }

    if (deliberation.complexityAnalysis) {
      prompt += `\nComplexity: Time ${deliberation.complexityAnalysis.time}, Space ${deliberation.complexityAnalysis.space}`;
    }

    if (request.code) {
      prompt += `\n\nCode snippet:\n\`\`\`\n${request.code.slice(0, 1500)}\n\`\`\``;
    }

    if (request.prompt) {
      prompt += `\n\nPrompt:\n${request.prompt.slice(0, 800)}`;
    }

    if (request.context) {
      prompt += `\n\nContext: ${JSON.stringify(request.context, null, 2).slice(0, 500)}`;
    }

    return prompt;
  }

  private parseMemberResponse(member: CouncilMember, text: string): MemberVerdict {
    const approvedMatch = text.match(/APPROVED:\s*(YES|NO)/i);
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const reasoningMatch = text.match(/REASONING:\s*(.+?)(?=RECOMMENDATIONS:|METRICS:|$)/is);
    const recommendationsMatch = text.match(/RECOMMENDATIONS:\s*(.+?)(?=METRICS:|$)/is);
    const metricsMatch = text.match(/METRICS:\s*(.+?)$/is);

    const approved = approvedMatch?.[1]?.toUpperCase() === "YES";
    const score = Math.min(100, Math.max(0, parseInt(scoreMatch?.[1] || "50", 10)));
    const reasoning = reasoningMatch?.[1]?.trim() || "No reasoning provided";

    const recommendations: string[] = [];
    if (recommendationsMatch?.[1]) {
      const bullets = recommendationsMatch[1].split(/[-•*]\s*/);
      for (const bullet of bullets) {
        const trimmed = bullet.trim();
        if (trimmed) {
recommendations.push(trimmed);
}
      }
    }

    const metrics: Record<string, string | number> = {};
    if (metricsMatch?.[1]) {
      const pairs = metricsMatch[1].split(/\n/);
      for (const pair of pairs) {
        const [key, value] = pair.split(":").map((s) => s.trim());
        if (key && value) {
          metrics[key] = isNaN(Number(value)) ? value : Number(value);
        }
      }
    }

    return {
      member,
      approved,
      score,
      reasoning,
      recommendations,
      metrics,
    };
  }

  /**
   * Get current deliberation status
   */
  getDeliberation(id: string): CouncilDeliberation | undefined {
    return this.deliberations.get(id);
  }

  /**
   * Quick evaluation without full deliberation (for real-time feedback)
   */
  async quickEvaluate(
    member: CouncilMember,
    content: string
  ): Promise<{ score: number; feedback: string }> {
    const profile = COUNCIL_PROFILES[member];
    const client = getClient();

    const response = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 150,
      messages: [
        {
          role: "user",
          content: `As ${member.replace("_", " ")} (${profile.role}), rate this from 0-100 and give ONE sentence feedback:
${content.slice(0, 500)}

Format: SCORE: [number] | FEEDBACK: [sentence]`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const text = textBlock?.text || "";
    const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
    const feedbackMatch = text.match(/FEEDBACK:\s*(.+)/i);

    return {
      score: parseInt(scoreMatch?.[1] || "50", 10),
      feedback: feedbackMatch?.[1]?.trim() || "No feedback",
    };
  }
}

// ============================================================================
// Singleton Export
// ============================================================================

let councilInstance: CouncilOfLogic | null = null;

export function getCouncilOfLogic(): CouncilOfLogic {
  if (!councilInstance) {
    councilInstance = new CouncilOfLogic();
  }
  return councilInstance;
}

export default CouncilOfLogic;
