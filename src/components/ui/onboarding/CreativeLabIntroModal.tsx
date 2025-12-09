"use client";

/**
 * Creative Lab Intro Modal
 * Phase 34: Client Honest Experience Integration
 *
 * First-time onboarding modal that explains the Creative Lab with honesty
 */

import { useState, useEffect } from "react";
import { X, Sparkles, AlertTriangle, CheckCircle } from "lucide-react";

interface CreativeLabIntroModalProps {
  userId: string;
  onComplete?: () => void;
}

export default function CreativeLabIntroModal({
  userId,
  onComplete,
}: CreativeLabIntroModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfSeen();
  }, [userId]);

  const checkIfSeen = async () => {
    try {
      const response = await fetch(
        `/api/client/feature-flags?flag=seen_creative_lab_intro`
      );
      const data = await response.json();

      if (!data.value) {
        setIsOpen(true);
      }
    } catch (error) {
      console.error("Error checking feature flag:", error);
      setIsOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await fetch("/api/client/feature-flags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          flag: "seen_creative_lab_intro",
          value: true,
        }),
      });
    } catch (error) {
      console.error("Error saving feature flag:", error);
    }

    setIsOpen(false);
    onComplete?.();
  };

  if (loading || !isOpen) {
return null;
}

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-lg mx-4 bg-bg-card rounded-xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-teal-600" />
            <h2 className="text-xl font-bold text-text-primary">
              Welcome to Your Creative Lab
            </h2>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This is your <strong>Creative Lab</strong> — everything you see is
            generated in real time based on your inputs.
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                AI-generated concepts to spark ideas and give direction
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Starting points for wireframes, copy, and brand explorations
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Your approval required before anything goes live
              </p>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                All visuals and suggestions shown here are AI-generated concepts
                for inspiration only. These are not final deliverables or
                guaranteed outcomes.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border-subtle">
          <button
            onClick={handleDismiss}
            className="w-full px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium"
          >
            Start Exploring
          </button>
        </div>
      </div>
    </div>
  );
}
