// React hooks for Claude AI integration
'use client';

import { useState, useCallback } from 'react';
import type {
  AutoReplyResult,
  PersonaResult,
  StrategyResult,
  CampaignResult,
  HooksResult,
  MindmapResult,
  EmailData,
  AssetData,
} from './types';
import {
  generateAutoReply,
  generatePersona,
  generateStrategy,
  generateCampaign,
  generateHooks,
  generateMindmap,
} from './client-helpers';

interface UseAIState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseAIReturn<T> extends UseAIState<T> {
  execute: (...args: any[]) => Promise<void>;
  reset: () => void;
}

// Generic AI hook
function useAI<T>(): UseAIReturn<T> {
  const [state, setState] = useState<UseAIState<T>>({
    data: null,
    loading: false,
    error: null,
  });

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null,
    });
  }, []);

  return {
    ...state,
    execute: async () => {},
    reset,
  };
}

// Auto-reply hook
export function useAutoReply() {
  const [state, setState] = useState<UseAIState<AutoReplyResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params: {
      from: string;
      subject: string;
      body: string;
      context?: string;
      contactId?: string;
    }) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await generateAutoReply(params);
        setState({ data: response.data, loading: false, error: null });
      } catch (error: any) {
        setState({ data: null, loading: false, error: error.message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Persona hook
export function usePersona() {
  const [state, setState] = useState<UseAIState<PersonaResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params: {
      emails: EmailData[];
      businessDescription?: string;
      assets?: AssetData[];
      notes?: string;
      contactId?: string;
    }) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await generatePersona(params);
        setState({ data: response.data, loading: false, error: null });
      } catch (error: any) {
        setState({ data: null, loading: false, error: error.message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Strategy hook
export function useStrategy() {
  const [state, setState] = useState<UseAIState<StrategyResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params: {
      persona: any;
      businessGoals: string;
      budget?: string;
      timeline?: string;
      competitors?: string[];
      contactId?: string;
    }) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await generateStrategy(params);
        setState({ data: response.data, loading: false, error: null });
      } catch (error: any) {
        setState({ data: null, loading: false, error: error.message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Campaign hook
export function useCampaign() {
  const [state, setState] = useState<UseAIState<CampaignResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params: {
      strategy: any;
      platforms: string[];
      budget: string;
      duration: string;
      objective: string;
      contactId?: string;
    }) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await generateCampaign(params);
        setState({ data: response.data, loading: false, error: null });
      } catch (error: any) {
        setState({ data: null, loading: false, error: error.message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Hooks hook
export function useHooks() {
  const [state, setState] = useState<UseAIState<HooksResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params: {
      persona: any;
      business: string;
      platforms: string[];
      toneOfVoice?: string;
      contactId?: string;
    }) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await generateHooks(params);
        setState({ data: response.data, loading: false, error: null });
      } catch (error: any) {
        setState({ data: null, loading: false, error: error.message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Mindmap hook
export function useMindmap() {
  const [state, setState] = useState<UseAIState<MindmapResult>>({
    data: null,
    loading: false,
    error: null,
  });

  const execute = useCallback(
    async (params: {
      emails: EmailData[];
      focusArea?: string;
      contactId?: string;
    }) => {
      setState({ data: null, loading: true, error: null });

      try {
        const response = await generateMindmap(params);
        setState({ data: response.data, loading: false, error: null });
      } catch (error: any) {
        setState({ data: null, loading: false, error: error.message });
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, execute, reset };
}

// Complete pipeline hook - generates everything in sequence
export function useAIPipeline() {
  const [state, setState] = useState<{
    persona: PersonaResult | null;
    strategy: StrategyResult | null;
    campaign: CampaignResult | null;
    hooks: HooksResult | null;
    loading: boolean;
    error: string | null;
    currentStep: 'idle' | 'persona' | 'strategy' | 'campaign' | 'hooks' | 'complete';
  }>({
    persona: null,
    strategy: null,
    campaign: null,
    hooks: null,
    loading: false,
    error: null,
    currentStep: 'idle',
  });

  const execute = useCallback(
    async (params: {
      emails: EmailData[];
      businessDescription?: string;
      businessGoals: string;
      platforms: string[];
      budget: string;
      duration: string;
      objective: string;
      contactId?: string;
    }) => {
      setState((prev) => ({ ...prev, loading: true, error: null, currentStep: 'persona' }));

      try {
        // Step 1: Generate Persona
        const personaResponse = await generatePersona({
          emails: params.emails,
          businessDescription: params.businessDescription,
          contactId: params.contactId,
        });

        setState((prev) => ({
          ...prev,
          persona: personaResponse.data,
          currentStep: 'strategy',
        }));

        // Step 2: Generate Strategy
        const strategyResponse = await generateStrategy({
          persona: personaResponse.data.persona,
          businessGoals: params.businessGoals,
          budget: params.budget,
          contactId: params.contactId,
        });

        setState((prev) => ({
          ...prev,
          strategy: strategyResponse.data,
          currentStep: 'campaign',
        }));

        // Step 3: Generate Campaign
        const campaignResponse = await generateCampaign({
          strategy: strategyResponse.data.strategy,
          platforms: params.platforms,
          budget: params.budget,
          duration: params.duration,
          objective: params.objective,
          contactId: params.contactId,
        });

        setState((prev) => ({
          ...prev,
          campaign: campaignResponse.data,
          currentStep: 'hooks',
        }));

        // Step 4: Generate Hooks
        const hooksResponse = await generateHooks({
          persona: personaResponse.data.persona,
          business: params.businessDescription || '',
          platforms: params.platforms,
          contactId: params.contactId,
        });

        setState((prev) => ({
          ...prev,
          hooks: hooksResponse.data,
          loading: false,
          currentStep: 'complete',
        }));
      } catch (error: any) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: error.message,
          currentStep: 'idle',
        }));
      }
    },
    []
  );

  const reset = useCallback(() => {
    setState({
      persona: null,
      strategy: null,
      campaign: null,
      hooks: null,
      loading: false,
      error: null,
      currentStep: 'idle',
    });
  }, []);

  return { ...state, execute, reset };
}
