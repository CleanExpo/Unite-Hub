/**
 * Feature Integration Components
 *
 * Central export point for feature integration infrastructure.
 * Use these components to ensure consistent client context handling
 * across all features in Unite-Group.
 *
 * @module features
 */

export { FeaturePageWrapper } from "./FeaturePageWrapper";
export type { UseFeatureClientReturn } from "@/hooks/useFeatureClient";
export { useFeatureClient } from "@/hooks/useFeatureClient";
