"use client";

import React, { ReactNode } from "react";
import { useFeatureClient } from "@/hooks/useFeatureClient";
import EmptyClientState from "@/components/client/EmptyClientState";
import { Loader2 } from "lucide-react";

/**
 * Props for the FeaturePageWrapper component
 *
 * @interface FeaturePageWrapperProps
 * @property {(clientId: Id<"clients">) => ReactNode} children - Render prop that receives validated clientId
 * @property {string} featureName - Name of the feature (displayed in empty/loading states)
 * @property {string} [description] - Optional description shown in empty state
 * @property {React.ReactNode} [icon] - Optional icon shown in empty state
 */
interface FeaturePageWrapperProps {
  children: (clientId: string) => ReactNode;
  featureName: string;
  description?: string;
  icon?: React.ReactNode;
}

/**
 * Standard wrapper component for ALL feature pages
 *
 * This component enforces the correct flow for client-dependent features:
 * 1. **Empty State Check**: Shows EmptyClientState if no client selected
 * 2. **Loading State**: Shows loading spinner while client data loads
 * 3. **Error State**: Shows error message if validation fails
 * 4. **Content Render**: Renders children with guaranteed valid clientId
 *
 * **Benefits:**
 * - Eliminates boilerplate client checking code
 * - Ensures consistent UX across all features
 * - Prevents rendering with invalid/null clientId
 * - Type-safe: children receive non-null clientId
 * - Single source of truth for client validation logic
 *
 * **Usage Pattern:**
 * Wrap your entire feature page with this component. Your feature component
 * will ONLY render when a valid client is selected, and will receive the
 * clientId as a parameter.
 *
 * @example
 * ```tsx
 * // Basic usage
 * export default function MyFeaturePage() {
 *   return (
 *     <FeaturePageWrapper featureName="My Feature">
 *       {(clientId) => (
 *         <MyFeatureContent clientId={clientId} />
 *       )}
 *     </FeaturePageWrapper>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom icon and description
 * import { Sparkles } from "lucide-react";
 *
 * export default function AIFeaturePage() {
 *   return (
 *     <FeaturePageWrapper
 *       featureName="AI Content Generator"
 *       description="Select a client to generate AI-powered content"
 *       icon={<Sparkles className="h-20 w-20 text-blue-500" />}
 *     >
 *       {(clientId) => (
 *         <AIContentGenerator clientId={clientId} />
 *       )}
 *     </FeaturePageWrapper>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Inline feature implementation
 * export default function QuickFeaturePage() {
 *   return (
 *     <FeaturePageWrapper featureName="Quick Feature">
 *       {(clientId) => (
 *         <div>
 *           <h1>Feature Content</h1>
 *           <p>Client ID: {clientId}</p>
 *         </div>
 *       )}
 *     </FeaturePageWrapper>
 *   );
 * }
 * ```
 *
 * @param {FeaturePageWrapperProps} props - Component props
 * @returns {ReactNode} Rendered feature content or appropriate state UI
 */
export function FeaturePageWrapper({
  children,
  featureName,
  description,
  icon,
}: FeaturePageWrapperProps): ReactNode {
  const { currentClientId, isEmpty, error, isLoading } = useFeatureClient();

  // Step 1: Check if client is selected
  // If not, show the empty state UI prompting user to select/create a client
  if (isEmpty) {
    return (
      <EmptyClientState
        featureName={featureName}
        description={description || `Select a client to use ${featureName}`}
        icon={icon}
      />
    );
  }

  // Step 2: Show loading state while client data is being fetched
  // This prevents flickering and provides feedback during async operations
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-slate-400">Loading {featureName}...</p>
        </div>
      </div>
    );
  }

  // Step 3: Show error state if validation failed
  // This catches any edge cases where clientId is invalid or client doesn't exist
  if (error) {
    return (
      <div className="p-4 bg-red-950/50 border border-red-800 rounded-lg m-4">
        <p className="text-red-400 font-medium mb-1">Error</p>
        <p className="text-red-300">{error}</p>
      </div>
    );
  }

  // Step 4: Render feature content with guaranteed valid clientId
  // At this point, TypeScript knows currentClientId is non-null
  // The non-null assertion is safe here due to the checks above
  return <>{children(currentClientId!)}</>;
}
