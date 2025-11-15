"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";
import { supabaseBrowser } from "@/lib/supabase";

export interface OnboardingStatus {
  id: string;
  user_id: string;
  step_1_complete: boolean;
  step_2_complete: boolean;
  step_3_complete: boolean;
  step_4_complete: boolean;
  step_5_complete: boolean;
  current_step: number;
  completed_at: string | null;
  skipped: boolean;
  onboarding_data: Record<string, any>;
  created_at: string;
  updated_at: string;
}

interface OnboardingContextType {
  status: OnboardingStatus | null;
  loading: boolean;
  isOnboarding: boolean;
  isComplete: boolean;
  currentStep: number;
  completionPercentage: number;
  startOnboarding: () => Promise<void>;
  completeStep: (step: number, data?: Record<string, any>) => Promise<void>;
  skipOnboarding: () => Promise<void>;
  goToStep: (step: number) => Promise<void>;
  refreshStatus: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [status, setStatus] = useState<OnboardingStatus | null>(null);
  const [loading, setLoading] = useState(true);

  // Calculate if onboarding should be shown
  const isOnboarding = status !== null && !status.completed_at && !status.skipped;
  const isComplete = status?.completed_at !== null || status?.skipped === true;

  // Calculate current step
  const currentStep = status?.current_step || 1;

  // Calculate completion percentage (step 4 is optional, so max 4 steps)
  const completionPercentage = status
    ? Math.round(
        ((status.step_1_complete ? 1 : 0) +
          (status.step_2_complete ? 1 : 0) +
          (status.step_3_complete ? 1 : 0) +
          (status.step_5_complete ? 1 : 0)) *
          25 // 100% / 4 required steps
      )
    : 0;

  // Fetch onboarding status
  const fetchStatus = useCallback(async () => {
    if (!user) {
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabaseBrowser
        .from("user_onboarding")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116" && error.code !== "PGRST205") {
        // PGRST116 = no rows returned
        // PGRST205 = table not found (migration not applied yet)
        throw error;
      }

      setStatus(data);
    } catch (error) {
      console.error("Error fetching onboarding status:", error);
      // Silently fail if table doesn't exist - user needs to apply migration
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Refresh status
  const refreshStatus = useCallback(async () => {
    await fetchStatus();
  }, [fetchStatus]);

  // Start onboarding (create record if doesn't exist)
  const startOnboarding = useCallback(async () => {
    if (!user || status) return;

    try {
      const { data, error } = await supabaseBrowser
        .from("user_onboarding")
        .insert({
          user_id: user.id,
          current_step: 1,
          onboarding_data: {},
        })
        .select()
        .single();

      if (error) throw error;
      setStatus(data);
    } catch (error) {
      console.error("Error starting onboarding:", error);
      throw error;
    }
  }, [user, status]);

  // Complete a step
  const completeStep = useCallback(
    async (step: number, data?: Record<string, any>) => {
      if (!user || !status) return;

      try {
        const stepKey = `step_${step}_complete` as keyof OnboardingStatus;
        const nextStep = step < 5 ? step + 1 : 5;

        const updatedData = {
          ...status.onboarding_data,
          ...(data || {}),
        };

        const { data: updatedStatus, error } = await supabaseBrowser
          .from("user_onboarding")
          .update({
            [stepKey]: true,
            current_step: nextStep,
            onboarding_data: updatedData,
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        setStatus(updatedStatus);
      } catch (error) {
        console.error("Error completing step:", error);
        throw error;
      }
    },
    [user, status]
  );

  // Skip onboarding
  const skipOnboarding = useCallback(async () => {
    if (!user || !status) return;

    try {
      const { data: updatedStatus, error } = await supabaseBrowser
        .from("user_onboarding")
        .update({
          skipped: true,
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      setStatus(updatedStatus);
    } catch (error) {
      console.error("Error skipping onboarding:", error);
      throw error;
    }
  }, [user, status]);

  // Go to specific step
  const goToStep = useCallback(
    async (step: number) => {
      if (!user || !status) return;

      try {
        const { data: updatedStatus, error } = await supabaseBrowser
          .from("user_onboarding")
          .update({
            current_step: step,
          })
          .eq("user_id", user.id)
          .select()
          .single();

        if (error) throw error;
        setStatus(updatedStatus);
      } catch (error) {
        console.error("Error updating step:", error);
        throw error;
      }
    },
    [user, status]
  );

  // Initialize onboarding status
  useEffect(() => {
    if (!authLoading) {
      fetchStatus();
    }
  }, [authLoading, fetchStatus]);

  const value = {
    status,
    loading,
    isOnboarding,
    isComplete,
    currentStep,
    completionPercentage,
    startOnboarding,
    completeStep,
    skipOnboarding,
    goToStep,
    refreshStatus,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
}
