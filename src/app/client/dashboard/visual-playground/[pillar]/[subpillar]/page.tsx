"use client";

/**
 * Sub-Pillar Concept Generator Page
 * Phase 33: Honest Visual Playground
 *
 * Generate AI concepts for specific sub-pillar
 */

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getPillar, getSubPillar, DISCLAIMERS } from "@/lib/content/pillars-config";
import { ArrowLeft, AlertTriangle, Sparkles, Loader2, Info } from "lucide-react";

export default function SubPillarPage() {
  const router = useRouter();
  const params = useParams();
  const pillarId = params.pillar as string;
  const subPillarId = params.subpillar as string;

  const pillar = getPillar(pillarId);
  const subPillar = getSubPillar(pillarId, subPillarId);

  const [generating, setGenerating] = useState(false);
  const [concepts, setConcepts] = useState<
    Array<{
      id: string;
      title: string;
      content: string;
      disclaimer: string;
      generatedBy: string;
    }>
  >([]);

  if (!pillar || !subPillar) {
    return (
      <div className="min-h-screen bg-bg-raised flex items-center justify-center">
        <div className="text-center">
          <p className="text-text-secondary">Content not found</p>
          <button
            onClick={() => router.push("/client/dashboard/visual-playground")}
            className="mt-4 text-accent-600 hover:text-accent-700"
          >
            Back to Playground
          </button>
        </div>
      </div>
    );
  }

  const handleGenerate = async () => {
    setGenerating(true);

    // Simulate AI generation (would call actual AI bridges in production)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const newConcept = {
      id: Date.now().toString(),
      title: `${subPillar.title} Concept`,
      content: `This is an AI-generated concept preview for "${subPillar.title}".

In a production environment, this would contain actual generated content from our AI tools (OpenAI, Gemini, etc.) based on your brand context and requirements.

Key elements that would be included:
• Structural layout suggestions
• Content direction and tone
• Visual hierarchy recommendations
• Platform-specific optimizations

Remember: This is a starting point for exploration, not a final deliverable.`,
      disclaimer: subPillar.disclaimer,
      generatedBy: "AI Concept Generator",
    };

    setConcepts((prev) => [newConcept, ...prev]);
    setGenerating(false);
  };

  return (
    <div className="min-h-screen bg-bg-raised">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() =>
            router.push(`/client/dashboard/visual-playground/${pillarId}`)
          }
          className="flex items-center gap-2 text-text-tertiary hover:text-text-secondary mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {pillar.title}
        </button>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-accent-600" />
            <h1 className="text-2xl font-bold text-text-primary">
              {subPillar.title}
            </h1>
          </div>
          <p className="text-text-secondary">
            {subPillar.description}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="mb-8 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-warning-800 dark:text-warning-200">
                {subPillar.disclaimer}
              </p>
              <p className="text-xs text-warning-700 dark:text-warning-300 mt-1">
                {DISCLAIMERS.general}
              </p>
            </div>
          </div>
        </div>

        {/* Generate Button */}
        <div className="mb-8">
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="flex items-center gap-2 px-6 py-3 bg-accent-600 text-white rounded-lg hover:bg-accent-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Concept...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Concept Preview
              </>
            )}
          </button>
        </div>

        {/* Generated Concepts */}
        {concepts.length > 0 && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-text-primary">
              Generated Concepts
            </h2>

            {concepts.map((concept) => (
              <div
                key={concept.id}
                className="bg-bg-card rounded-lg border border-border-subtle p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="font-medium text-text-primary">
                    {concept.title}
                  </h3>
                  <span className="text-xs text-text-secondary">
                    {concept.generatedBy}
                  </span>
                </div>

                <div className="prose prose-sm dark:prose-invert max-w-none mb-4">
                  <pre className="whitespace-pre-wrap text-sm text-text-secondary bg-bg-hover p-4 rounded-lg">
                    {concept.content}
                  </pre>
                </div>

                <div className="flex items-center gap-2 text-xs text-warning-600 dark:text-warning-400">
                  <Info className="w-3 h-3" />
                  {concept.disclaimer}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {concepts.length === 0 && !generating && (
          <div className="text-center py-12 bg-bg-card rounded-lg border border-border-subtle">
            <Sparkles className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-secondary">
              Click &quot;Generate Concept Preview&quot; to create AI-generated ideas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
