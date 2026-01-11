/**
 * Founder Intelligence React Hooks
 * Client-side hooks for F09-F12 integration
 */

"use client";

import { useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

/**
 * Hook for triggering cognitive load signals from client components
 */
export function useCognitiveLoad() {
  const { user } = useAuth();

  const recordTaskCount = useCallback(
    async (taskCount: number, context?: string) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/cognitive-load-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: user.id,
            signalType: "task_count",
            taskCount,
            context,
          }),
        });
      } catch (error) {
        console.error("Failed to record task count:", error);
      }
    },
    [user?.id]
  );

  const recordContextSwitch = useCallback(
    async (switchCount: number) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/cognitive-load-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: user.id,
            signalType: "context_switch",
            switchCount,
          }),
        });
      } catch (error) {
        console.error("Failed to record context switch:", error);
      }
    },
    [user?.id]
  );

  const recordInterruption = useCallback(
    async (interruptionCount: number, context?: string) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/cognitive-load-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: user.id,
            signalType: "interruption",
            interruptionCount,
            context,
          }),
        });
      } catch (error) {
        console.error("Failed to record interruption:", error);
      }
    },
    [user?.id]
  );

  return {
    recordTaskCount,
    recordContextSwitch,
    recordInterruption,
  };
}

/**
 * Hook for triggering energy mapping signals
 */
export function useEnergyMapping() {
  const { user } = useAuth();

  const recordEnergyLevel = useCallback(
    async (energyLevel: number, measurementType: string, context?: string) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/energy-mapping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: user.id,
            energyLevel,
            measurementType,
            activityContext: context,
          }),
        });
      } catch (error) {
        console.error("Failed to record energy level:", error);
      }
    },
    [user?.id]
  );

  const recordFocusDepth = useCallback(
    async (focusDepth: number) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/energy-mapping-integration", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tenantId: user.id,
            signalType: "focus_depth",
            focusDepth,
          }),
        });
      } catch (error) {
        console.error("Failed to record focus depth:", error);
      }
    },
    [user?.id]
  );

  return {
    recordEnergyLevel,
    recordFocusDepth,
  };
}

/**
 * Hook for triggering intent signals
 */
export function useIntentRouter() {
  const { user } = useAuth();

  const recordIntent = useCallback(
    async (
      intentType: string,
      signalSource: string,
      signalData: any,
      confidenceScore: number
    ) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/intent-router", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: user.id,
            intentType,
            signalSource,
            signalData,
            confidenceScore,
          }),
        });
      } catch (error) {
        console.error("Failed to record intent:", error);
      }
    },
    [user?.id]
  );

  const recordBreakRequest = useCallback(
    async (reason: string, urgency: string = "moderate") => {
      if (!user?.id) {
return;
}

      await recordIntent(
        "break_request",
        "user_initiated",
        { reason, urgency },
        95
      );
    },
    [user?.id, recordIntent]
  );

  const recordDeepWorkRequest = useCallback(
    async (duration: number, task: string) => {
      if (!user?.id) {
return;
}

      await recordIntent(
        "deep_work_request",
        "user_initiated",
        { duration, task },
        90
      );
    },
    [user?.id, recordIntent]
  );

  return {
    recordIntent,
    recordBreakRequest,
    recordDeepWorkRequest,
  };
}

/**
 * Hook for triggering recovery protocol signals
 */
export function useRecoveryProtocols() {
  const { user } = useAuth();

  const recordRecoveryState = useCallback(
    async (
      recoveryScore: number,
      fatigueLevel?: number,
      stressLevel?: number,
      sleepQuality?: number
    ) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/recovery-protocols", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: user.id,
            recoveryScore,
            fatigueLevel,
            stressLevel,
            sleepQuality,
          }),
        });
      } catch (error) {
        console.error("Failed to record recovery state:", error);
      }
    },
    [user?.id]
  );

  const markActionTaken = useCallback(
    async (actionId: string, effectivenessRating: number, notes?: string) => {
      if (!user?.id) {
return;
}

      try {
        await fetch("/api/founder/recovery-protocols", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: user.id,
            actionId,
            effectivenessRating,
            notes,
          }),
        });
      } catch (error) {
        console.error("Failed to mark action taken:", error);
      }
    },
    [user?.id]
  );

  return {
    recordRecoveryState,
    markActionTaken,
  };
}

/**
 * Combined hook for all founder intelligence features
 */
export function useFounderIntelligence() {
  const cognitiveLoad = useCognitiveLoad();
  const energyMapping = useEnergyMapping();
  const intentRouter = useIntentRouter();
  const recoveryProtocols = useRecoveryProtocols();

  return {
    cognitiveLoad,
    energyMapping,
    intentRouter,
    recoveryProtocols,
  };
}
