'use client';

import { useState, useCallback } from 'react';
import type {
  ImageGenerationConfig,
  IconGenerationConfig,
  GeneratedImage,
  GeneratedIcon,
  AspectRatio,
  ImageCategory,
} from '@/lib/image-generation/types';

/* ----------------------------------------
   Hook State Types
   ---------------------------------------- */
interface UseImageGenerationState {
  isGenerating: boolean;
  error: string | null;
  lastGenerated: GeneratedImage | GeneratedIcon | null;
}

interface UseImageGenerationReturn extends UseImageGenerationState {
  generateHeroImage: (
    prompt: string,
    options?: Partial<ImageGenerationConfig>
  ) => Promise<GeneratedImage | null>;
  generateFeatureIcon: (
    description: string,
    options?: Partial<IconGenerationConfig>
  ) => Promise<GeneratedIcon | null>;
  generateAvatar: (
    context: string,
    options?: Partial<ImageGenerationConfig>
  ) => Promise<GeneratedImage | null>;
  generateIllustration: (
    scene: string,
    options?: Partial<ImageGenerationConfig>
  ) => Promise<GeneratedImage | null>;
  generateCustomImage: (config: ImageGenerationConfig) => Promise<GeneratedImage | null>;
  generateCustomIcon: (config: IconGenerationConfig) => Promise<GeneratedIcon | null>;
  checkAPIStatus: () => Promise<{ configured: boolean; message: string }>;
  clearError: () => void;
}

/* ----------------------------------------
   Default Configurations
   ---------------------------------------- */
const DEFAULT_BRAND_COLORS = [
  'hsl(221.2 83.2% 53.3%)', // Primary
  'hsl(262 83% 58%)', // Secondary
  'hsl(173 80% 40%)', // Accent
];

const DEFAULT_IMAGE_CONFIG: Partial<ImageGenerationConfig> = {
  brandColors: DEFAULT_BRAND_COLORS,
  aspectRatio: '16:9',
  resolution: '2K',
  style: 'modern',
  category: 'illustration',
};

const DEFAULT_ICON_CONFIG: Partial<IconGenerationConfig> = {
  style: 'filled',
  primaryColor: 'hsl(221.2 83.2% 53.3%)',
  size: 48,
  background: 'transparent',
};

/* ----------------------------------------
   API Helper
   ---------------------------------------- */
async function callGenerationAPI<T>(
  type: 'image' | 'icon',
  config: ImageGenerationConfig | IconGenerationConfig,
  save = false
): Promise<T> {
  const response = await fetch('/api/generate-image', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type,
      config,
      options: { save },
    }),
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Generation failed');
  }

  return type === 'image' ? data.image : data.icon;
}

/* ----------------------------------------
   useImageGeneration Hook
   ---------------------------------------- */
export function useImageGeneration(): UseImageGenerationReturn {
  const [state, setState] = useState<UseImageGenerationState>({
    isGenerating: false,
    error: null,
    lastGenerated: null,
  });

  const setGenerating = useCallback((isGenerating: boolean) => {
    setState((prev) => ({ ...prev, isGenerating }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error, isGenerating: false }));
  }, []);

  const setLastGenerated = useCallback((lastGenerated: GeneratedImage | GeneratedIcon | null) => {
    setState((prev) => ({ ...prev, lastGenerated, isGenerating: false }));
  }, []);

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  /* ----------------------------------------
     Check API Status
     ---------------------------------------- */
  const checkAPIStatus = useCallback(async () => {
    try {
      const response = await fetch('/api/generate-image');
      return await response.json();
    } catch {
      return { configured: false, message: 'Failed to check API status' };
    }
  }, []);

  /* ----------------------------------------
     Generate Hero Image
     ---------------------------------------- */
  const generateHeroImage = useCallback(
    async (
      prompt: string,
      options?: Partial<ImageGenerationConfig>
    ): Promise<GeneratedImage | null> => {
      setGenerating(true);
      clearError();

      try {
        const config: ImageGenerationConfig = {
          prompt,
          context: 'Hero section of a landing page',
          ...DEFAULT_IMAGE_CONFIG,
          aspectRatio: '16:9' as AspectRatio,
          category: 'hero' as ImageCategory,
          ...options,
        } as ImageGenerationConfig;

        const result = await callGenerationAPI<GeneratedImage>('image', config);
        setLastGenerated(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to generate hero image');
        return null;
      }
    },
    [setGenerating, clearError, setError, setLastGenerated]
  );

  /* ----------------------------------------
     Generate Feature Icon
     ---------------------------------------- */
  const generateFeatureIcon = useCallback(
    async (
      description: string,
      options?: Partial<IconGenerationConfig>
    ): Promise<GeneratedIcon | null> => {
      setGenerating(true);
      clearError();

      try {
        const config: IconGenerationConfig = {
          description,
          ...DEFAULT_ICON_CONFIG,
          ...options,
        } as IconGenerationConfig;

        const result = await callGenerationAPI<GeneratedIcon>('icon', config);
        setLastGenerated(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to generate icon');
        return null;
      }
    },
    [setGenerating, clearError, setError, setLastGenerated]
  );

  /* ----------------------------------------
     Generate Avatar
     ---------------------------------------- */
  const generateAvatar = useCallback(
    async (
      context: string,
      options?: Partial<ImageGenerationConfig>
    ): Promise<GeneratedImage | null> => {
      setGenerating(true);
      clearError();

      try {
        const config: ImageGenerationConfig = {
          prompt: `Professional avatar for ${context}`,
          context,
          ...DEFAULT_IMAGE_CONFIG,
          aspectRatio: '1:1' as AspectRatio,
          category: 'avatar' as ImageCategory,
          ...options,
        } as ImageGenerationConfig;

        const result = await callGenerationAPI<GeneratedImage>('image', config);
        setLastGenerated(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to generate avatar');
        return null;
      }
    },
    [setGenerating, clearError, setError, setLastGenerated]
  );

  /* ----------------------------------------
     Generate Illustration
     ---------------------------------------- */
  const generateIllustration = useCallback(
    async (
      scene: string,
      options?: Partial<ImageGenerationConfig>
    ): Promise<GeneratedImage | null> => {
      setGenerating(true);
      clearError();

      try {
        const config: ImageGenerationConfig = {
          prompt: scene,
          context: 'Custom illustration',
          ...DEFAULT_IMAGE_CONFIG,
          aspectRatio: '4:3' as AspectRatio,
          category: 'illustration' as ImageCategory,
          ...options,
        } as ImageGenerationConfig;

        const result = await callGenerationAPI<GeneratedImage>('image', config);
        setLastGenerated(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to generate illustration');
        return null;
      }
    },
    [setGenerating, clearError, setError, setLastGenerated]
  );

  /* ----------------------------------------
     Generate Custom Image
     ---------------------------------------- */
  const generateCustomImage = useCallback(
    async (config: ImageGenerationConfig): Promise<GeneratedImage | null> => {
      setGenerating(true);
      clearError();

      try {
        const result = await callGenerationAPI<GeneratedImage>('image', config);
        setLastGenerated(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to generate image');
        return null;
      }
    },
    [setGenerating, clearError, setError, setLastGenerated]
  );

  /* ----------------------------------------
     Generate Custom Icon
     ---------------------------------------- */
  const generateCustomIcon = useCallback(
    async (config: IconGenerationConfig): Promise<GeneratedIcon | null> => {
      setGenerating(true);
      clearError();

      try {
        const result = await callGenerationAPI<GeneratedIcon>('icon', config);
        setLastGenerated(result);
        return result;
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Failed to generate icon');
        return null;
      }
    },
    [setGenerating, clearError, setError, setLastGenerated]
  );

  return {
    ...state,
    generateHeroImage,
    generateFeatureIcon,
    generateAvatar,
    generateIllustration,
    generateCustomImage,
    generateCustomIcon,
    checkAPIStatus,
    clearError,
  };
}

export default useImageGeneration;
