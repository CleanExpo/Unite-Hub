/**
 * Founder Intelligence Integration Service
 * Handles cross-phase data flows between F01-F12
 */

if (typeof window !== "undefined") {
  throw new Error("founderIntegrationService must only run on server");
}

import { supabaseAdmin } from "@/src/lib/supabase";
import {
  recordCognitiveLoad,
  getCurrentCognitiveLoad,
  type CognitiveLoadSignalType,
} from "./cognitiveLoadService";
import {
  recordEnergyReading,
  detectEnergyPatterns,
  type EnergyMeasurementType,
} from "./energyMappingService";
import {
  recordIntentSignal,
  updateIntentRouting,
  type FounderIntentType,
} from "./intentRouterService";
import {
  recordRecoveryState,
  autoRecommendRecovery,
  recommendRecoveryAction,
} from "./recoveryProtocolsService";

/**
 * F09 Integration: Cognitive Load Monitor
 */

// Triggered by F02 (Task Routing) - High task count signals cognitive load
export async function handleTaskCountSignal(tenantId: string, taskCount: number): Promise<void> {
  // Record cognitive load from task count
  const loadValue = Math.min(100, taskCount * 5); // 20 tasks = 100 load
  await recordCognitiveLoad({
    tenantId,
    signalType: "task_count",
    signalValue: taskCount,
    context: `Active task count: ${taskCount}`,
  });

  // Check if overload detected
  const currentLoad = await getCurrentCognitiveLoad(tenantId, 60);
  if (currentLoad.recovery_needed) {
    // Trigger F11 intent router - break request
    await recordIntentSignal({
      tenantId,
      intentType: "break_request",
      signalSource: "cognitive_load_monitor",
      signalData: {
        load: currentLoad.current_avg_load,
        intensity: currentLoad.current_intensity,
        trigger: "task_overload",
      },
      confidenceScore: 90,
      interpretation: `High cognitive load detected (${currentLoad.current_avg_load.toFixed(1)}). Break recommended.`,
    });

    // Trigger F12 recovery protocols
    await triggerRecoveryFromOverload(tenantId, currentLoad.current_avg_load);
  }
}

// Triggered by F06 (Distraction Shield) - Interruption signals
export async function handleInterruptionSignal(
  tenantId: string,
  interruptionCount: number,
  context?: string
): Promise<void> {
  const loadValue = Math.min(100, interruptionCount * 8); // 12 interruptions = 96 load
  await recordCognitiveLoad({
    tenantId,
    signalType: "interruption",
    signalValue: interruptionCount,
    context: context || `Interruptions in last hour: ${interruptionCount}`,
  });
}

// Triggered by F04 (Priority Arbiter) - Decision fatigue
export async function handleDecisionSignal(
  tenantId: string,
  decisionCount: number
): Promise<void> {
  const loadValue = Math.min(100, decisionCount * 10); // 10 decisions = 100 load
  await recordCognitiveLoad({
    tenantId,
    signalType: "decision_count",
    signalValue: decisionCount,
    context: `Decisions made in last hour: ${decisionCount}`,
  });
}

// Triggered by context switching detection
export async function handleContextSwitchSignal(
  tenantId: string,
  switchCount: number
): Promise<void> {
  await recordCognitiveLoad({
    tenantId,
    signalType: "context_switch",
    signalValue: switchCount,
    context: `Context switches detected: ${switchCount}`,
  });
}

/**
 * F10 Integration: Energy Mapping Engine
 */

// Triggered by F05 (Focus Engine) - Focus depth as energy indicator
export async function handleFocusDepthSignal(
  tenantId: string,
  focusDepth: number
): Promise<void> {
  // Convert focus depth (0-100) to energy level
  const energyLevel = focusDepth;
  await recordEnergyReading({
    tenantId,
    energyLevel,
    measurementType: "focus_depth",
    activityContext: "Derived from focus session depth",
  });
}

// Triggered by F07 (Time Block Orchestrator) - Time block energy
export async function handleTimeBlockEnergySignal(
  tenantId: string,
  energyLevel: number,
  activityContext?: string
): Promise<void> {
  await recordEnergyReading({
    tenantId,
    energyLevel,
    measurementType: "activity_inferred",
    activityContext: activityContext || "Time block energy reading",
  });
}

// Triggered by F02 (Task Routing) - Task completion rate as productivity score
export async function handleTaskCompletionSignal(
  tenantId: string,
  completionRate: number
): Promise<void> {
  const energyLevel = completionRate; // 0-100
  await recordEnergyReading({
    tenantId,
    energyLevel,
    measurementType: "productivity_score",
    activityContext: `Task completion rate: ${completionRate.toFixed(0)}%`,
  });
}

// Update optimal work windows and send to F07
export async function syncEnergyPatternsToTimeBlocks(tenantId: string): Promise<any[]> {
  const patterns = await detectEnergyPatterns(tenantId, 70);

  // Return patterns for F07 to use in scheduling
  return patterns.map((pattern) => ({
    time_start: pattern.time_start,
    time_end: pattern.time_end,
    avg_energy: pattern.avg_energy_level,
    recommendation: pattern.recommendation,
    confidence: pattern.confidence,
  }));
}

/**
 * F11 Integration: Intent Router
 */

// Route intent to appropriate F01-F12 system
export async function routeIntentToSystem(
  intentId: string,
  intentType: FounderIntentType,
  routedTo: string
): Promise<void> {
  // Update routing status
  await updateIntentRouting({
    signalId: intentId,
    routingStatus: "routed",
    routedTo,
  });

  // TODO: Add actual routing logic to target systems
  // This would integrate with F02, F05, F07, F12, etc.
}

// Auto-route based on intent type
export async function autoRouteIntent(tenantId: string, intentId: string): Promise<void> {
  const { data: intent } = await supabaseAdmin
    .from("founder_intent_signals")
    .select("*")
    .eq("id", intentId)
    .eq("tenant_id", tenantId)
    .single();

  if (!intent) return;

  // Route based on intent type (auto-routing already done in migration function)
  await updateIntentRouting({
    signalId: intentId,
    routingStatus: "routed",
  });
}

/**
 * F12 Integration: Recovery Protocols
 */

// Triggered by F09 - Cognitive overload
export async function triggerRecoveryFromOverload(
  tenantId: string,
  loadValue: number
): Promise<void> {
  // Calculate recovery state based on cognitive load
  const recoveryScore = Math.max(0, 100 - loadValue);
  const fatigueLevel = Math.min(100, loadValue);

  await recordRecoveryState({
    tenantId,
    recoveryScore,
    fatigueLevel,
    contributingFactors: [
      { factor: "cognitive_overload", severity: loadValue },
    ],
  });

  // Get auto-recommendations
  const recommendations = await autoRecommendRecovery(tenantId);

  // Create break intent for critical actions
  if (recommendations.recommendations?.length > 0) {
    const criticalActions = recommendations.recommendations.filter(
      (rec: any) => rec.urgency === "critical" || rec.urgency === "high"
    );

    for (const action of criticalActions) {
      await recordIntentSignal({
        tenantId,
        intentType: "break_request",
        signalSource: "recovery_protocols",
        signalData: {
          action_type: action.action_type,
          urgency: action.urgency,
          description: action.description,
        },
        confidenceScore: 95,
        interpretation: `Critical recovery action recommended: ${action.description}`,
      });
    }
  }
}

// Triggered by F05 - Declining focus depth
export async function triggerRecoveryFromFocusDecline(
  tenantId: string,
  averageFocusDepth: number
): Promise<void> {
  if (averageFocusDepth < 40) {
    const recoveryScore = averageFocusDepth;
    const fatigueLevel = 100 - averageFocusDepth;

    await recordRecoveryState({
      tenantId,
      recoveryScore,
      fatigueLevel,
      contributingFactors: [
        { factor: "declining_focus", avg_depth: averageFocusDepth },
      ],
    });
  }
}

// Triggered by F07 - Low energy readings in time blocks
export async function triggerRecoveryFromLowEnergy(
  tenantId: string,
  energyLevel: number
): Promise<void> {
  if (energyLevel < 30) {
    const recoveryScore = energyLevel;
    const fatigueLevel = 100 - energyLevel;

    await recordRecoveryState({
      tenantId,
      recoveryScore,
      fatigueLevel,
      contributingFactors: [
        { factor: "low_energy", energy_level: energyLevel },
      ],
    });
  }
}

// Mark recovery action as taken and create completion intent
export async function completeRecoveryAction(
  actionId: string,
  effectivenessRating: number,
  notes?: string
): Promise<void> {
  // Get action details
  const { data: action } = await supabaseAdmin
    .from("founder_recovery_actions")
    .select("*")
    .eq("id", actionId)
    .single();

  if (!action) return;

  // Update action as taken
  await supabaseAdmin
    .from("founder_recovery_actions")
    .update({
      taken: true,
      taken_at: new Date().toISOString(),
      effectiveness_rating: effectivenessRating,
      notes,
    })
    .eq("id", actionId);

  // Update intent routing if this was triggered by an intent
  // This would require tracking the intent_id when creating the action
}

/**
 * Cross-Phase Aggregation
 */

// Get unified founder state (for F13 in future)
export async function getUnifiedFounderState(tenantId: string): Promise<any> {
  // Aggregate current state from all phases
  const [cognitiveLoad, energySummary, intentSummary, recoverySummary] = await Promise.all([
    getCurrentCognitiveLoad(tenantId, 60),
    supabaseAdmin.rpc("get_energy_summary", { p_tenant_id: tenantId, p_days: 7 }),
    supabaseAdmin.rpc("get_intent_routing_summary", { p_tenant_id: tenantId, p_days: 7 }),
    supabaseAdmin.rpc("get_recovery_summary", { p_tenant_id: tenantId, p_days: 7 }),
  ]);

  return {
    cognitive: {
      avg_load: cognitiveLoad.current_avg_load,
      intensity: cognitiveLoad.current_intensity,
      recovery_needed: cognitiveLoad.recovery_needed,
    },
    energy: {
      avg_energy: energySummary.data?.avg_energy || 50,
      peak_count: energySummary.data?.peak_count || 0,
    },
    intents: {
      total_signals: intentSummary.data?.total_signals || 0,
      completion_rate:
        intentSummary.data?.completed_count / (intentSummary.data?.total_signals || 1),
    },
    recovery: {
      current_state: recoverySummary.data?.current_state || "normal",
      current_score: recoverySummary.data?.current_score || 60,
      critical_actions: recoverySummary.data?.critical_actions || 0,
    },
  };
}

/**
 * Batch Integration Helpers
 */

// Process all pending integrations for a tenant
export async function processPendingIntegrations(tenantId: string): Promise<void> {
  // Sync energy patterns to time blocks
  await syncEnergyPatternsToTimeBlocks(tenantId);

  // Check cognitive load and trigger recovery if needed
  const currentLoad = await getCurrentCognitiveLoad(tenantId, 60);
  if (currentLoad.recovery_needed) {
    await triggerRecoveryFromOverload(tenantId, currentLoad.current_avg_load);
  }

  // Auto-recommend recovery actions
  const recommendations = await autoRecommendRecovery(tenantId);

  // Route high-priority recovery actions to intent router
  if (recommendations.recommendations?.length > 0) {
    const highPriority = recommendations.recommendations.filter(
      (rec: any) => rec.urgency === "critical" || rec.urgency === "high"
    );

    for (const rec of highPriority) {
      await recordIntentSignal({
        tenantId,
        intentType: "break_request",
        signalSource: "recovery_protocols",
        signalData: rec,
        confidenceScore: 90,
      });
    }
  }
}
