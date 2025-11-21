"use client";

import { useClientContext } from "@/contexts/ClientContext";
import { useCallback, useState, useEffect } from "react";

/**
 * Return type for the useFeatureClient hook
 *
 * @interface UseFeatureClientReturn
 * @property {Id<"clients"> | null} currentClientId - The currently selected client ID (null if none selected)
 * @property {boolean} isLoading - True while client data is loading from Convex
 * @property {string | null} error - Error message if validation fails
 * @property {boolean} isEmpty - True if no client is currently selected
 * @property {() => boolean} validateClientExists - Validates that a client is selected, returns false and sets error if not
 * @property {() => void} handleMissingClient - Sets error message when client is missing
 */
export interface UseFeatureClientReturn {
  currentClientId: string | null;
  isLoading: boolean;
  error: string | null;
  isEmpty: boolean;
  validateClientExists: () => boolean;
  handleMissingClient: () => void;
}

/**
 * Standard hook for ALL feature pages that require a client context
 *
 * This hook enforces consistent client handling across the entire application,
 * providing a unified way to:
 * - Access the current client ID
 * - Check if a client is selected
 * - Validate client existence before operations
 * - Handle loading and error states
 *
 * **Usage Pattern:**
 * Every feature page should use this hook as the first step to ensure
 * a valid client context exists before rendering feature-specific content.
 *
 * @example
 * ```tsx
 * function MyFeaturePage() {
 *   const { currentClientId, isEmpty, validateClientExists } = useFeatureClient();
 *
 *   if (isEmpty) {
 *     return <EmptyClientState featureName="My Feature" />;
 *   }
 *
 *   const handleAction = () => {
 *     if (!validateClientExists()) return;
 *     // Proceed with action - clientId is guaranteed valid
 *   };
 *
 *   return <div>Feature content for client {currentClientId}</div>;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With form submission
 * function MyForm() {
 *   const { currentClientId, validateClientExists, error } = useFeatureClient();
 *
 *   const onSubmit = async (data: FormData) => {
 *     if (!validateClientExists()) return;
 *
 *     await convexMutation({
 *       ...data,
 *       clientId: currentClientId!
 *     });
 *   };
 *
 *   return (
 *     <form onSubmit={onSubmit}>
 *       {error && <ErrorAlert>{error}</ErrorAlert>}
 *       // form fields
 *     </form>
 *   );
 * }
 * ```
 *
 * @returns {UseFeatureClientReturn} Object containing client state and validation functions
 *
 * @throws {Error} If used outside of ClientProvider context
 */
export function useFeatureClient(): UseFeatureClientReturn {
  const { currentClientId, isLoading: contextLoading } = useClientContext();
  const [error, setError] = useState<string | null>(null);

  // Derive empty state - true if no client is selected
  const isEmpty = !currentClientId;

  /**
   * Clear any error when client changes
   */
  useEffect(() => {
    if (currentClientId) {
      setError(null);
    }
  }, [currentClientId]);

  /**
   * Validates that a client is currently selected
   *
   * Use this before any operation that requires a client ID.
   * Sets an error message if validation fails.
   *
   * @returns {boolean} True if client exists, false otherwise
   */
  const validateClientExists = useCallback((): boolean => {
    if (!currentClientId) {
      setError("Please select or create a client first");
      return false;
    }
    setError(null);
    return true;
  }, [currentClientId]);

  /**
   * Sets an error message when a client is required but missing
   *
   * Use this to proactively show an error message when the user
   * attempts to access a feature without selecting a client.
   */
  const handleMissingClient = useCallback(() => {
    if (!currentClientId) {
      setError("Please select or create a client to use this feature");
    }
  }, [currentClientId]);

  return {
    currentClientId,
    isLoading: contextLoading,
    error,
    isEmpty,
    validateClientExists,
    handleMissingClient,
  };
}
