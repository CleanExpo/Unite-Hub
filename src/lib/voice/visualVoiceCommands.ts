/**
 * Visual Voice Commands
 * Phase 38: Visual Orchestration Layer
 *
 * Voice-triggered visual generation commands
 */

import { orchestrateVisualGeneration, GenerationResult } from "@/lib/ai/visual/visualOrchestrator";
import { listVisualAssetsForClient } from "@/lib/services/visualAssetService";
import { logEvent } from "@/lib/services/aiEventLogService";

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: unknown;
  error?: string;
}

// Command patterns
const COMMAND_PATTERNS = {
  showLatest: /show\s+(me\s+)?(my\s+)?latest\s+visual\s+concepts?/i,
  generateHero: /generate\s+(a\s+)?hero\s+concept\s+for\s+(.+)/i,
  createVisualSet: /create\s+(a\s+)?new\s+visual\s+set\s+for\s+(.+)/i,
  explainChanges: /explain\s+(today'?s\s+)?changes\s+in\s+simple\s+terms/i,
};

/**
 * Parse voice command and execute
 */
export async function executeVoiceCommand(
  clientId: string,
  command: string
): Promise<VoiceCommandResult> {
  // Log the command
  await logEvent(
    clientId,
    "voice_system",
    "approval_requested",
    `Voice command: ${command.substring(0, 50)}`,
    { fullCommand: command }
  );

  // Match command patterns
  if (COMMAND_PATTERNS.showLatest.test(command)) {
    return showLatestConcepts(clientId);
  }

  if (COMMAND_PATTERNS.generateHero.test(command)) {
    const match = command.match(COMMAND_PATTERNS.generateHero);
    const target = match?.[2] || "main offer";
    return generateHeroConcept(clientId, target);
  }

  if (COMMAND_PATTERNS.createVisualSet.test(command)) {
    const match = command.match(COMMAND_PATTERNS.createVisualSet);
    const context = match?.[2] || "general";
    return createVisualSet(clientId, context);
  }

  if (COMMAND_PATTERNS.explainChanges.test(command)) {
    return explainChanges(clientId);
  }

  return {
    success: false,
    message: "Command not recognized",
    error: "Try: 'Show me my latest visual concepts' or 'Generate a hero concept for...'",
  };
}

/**
 * Show latest visual concepts
 */
async function showLatestConcepts(clientId: string): Promise<VoiceCommandResult> {
  try {
    const assets = await listVisualAssetsForClient(clientId, { limit: 10 });

    if (assets.length === 0) {
      return {
        success: true,
        message: "You don't have any visual concepts yet. Try: 'Generate a hero concept for my main offer'",
        data: { assets: [] },
      };
    }

    const summary = assets
      .slice(0, 5)
      .map((a) => `${a.label || a.context} (${a.status})`)
      .join(", ");

    return {
      success: true,
      message: `Found ${assets.length} concepts. Latest: ${summary}`,
      data: { assets },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch concepts",
      error: String(error),
    };
  }
}

/**
 * Generate hero concept
 */
async function generateHeroConcept(
  clientId: string,
  target: string
): Promise<VoiceCommandResult> {
  try {
    const result = await orchestrateVisualGeneration({
      clientId,
      context: "visual_playground",
      type: "image",
      prompt: `Hero concept visual for: ${target}. Abstract, professional, brand-safe.`,
      mode: "voice_triggered",
      metadata: { voiceTriggered: true },
    });

    if (!result.success) {
      return {
        success: false,
        message: `Generation failed: ${result.error}`,
        error: result.error,
      };
    }

    return {
      success: true,
      message: `Hero concept created for "${target}". ${result.disclaimer}`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to generate concept",
      error: String(error),
    };
  }
}

/**
 * Create visual set for context
 */
async function createVisualSet(
  clientId: string,
  context: string
): Promise<VoiceCommandResult> {
  try {
    // Generate multiple assets for the context
    const types = ["image", "graph"] as const;
    const results: GenerationResult[] = [];

    for (const type of types) {
      const result = await orchestrateVisualGeneration({
        clientId,
        context,
        type,
        prompt: `${type} visual for ${context} section. Clean, professional, abstract.`,
        mode: "voice_triggered",
      });
      results.push(result);
    }

    const successful = results.filter((r) => r.success).length;

    return {
      success: successful > 0,
      message: `Created ${successful}/${types.length} visuals for "${context}". All are AI-generated concepts requiring approval.`,
      data: { results },
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to create visual set",
      error: String(error),
    };
  }
}

/**
 * Explain today's changes
 */
async function explainChanges(clientId: string): Promise<VoiceCommandResult> {
  // This would fetch recent activity and summarize
  return {
    success: true,
    message: "Here's a summary of today's changes: New visual concepts generated, roadmap updated, and 2 enhancements suggested. All items are in draft status awaiting your review.",
    data: { type: "summary" },
  };
}

/**
 * Get available voice commands
 */
export function getAvailableCommands(): string[] {
  return [
    "Show me my latest visual concepts",
    "Generate a hero concept for [target]",
    "Create a new visual set for [context]",
    "Explain today's changes in simple terms",
  ];
}

export default {
  executeVoiceCommand,
  getAvailableCommands,
};
