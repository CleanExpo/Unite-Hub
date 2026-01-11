"use client";

/**
 * Synthex Design Studio Component
 * Main UI for AI-powered design generation and refinement
 * Emulates Google Stitch functionality
 */

import React, { useState, useCallback, useMemo } from "react";
import { UIGenerationRequest, UIGenerationResult } from "@/lib/synthex/stitch-inspired/ui-code-generator";
import { SocialMockupRequest } from "@/lib/synthex/stitch-inspired/social-mockup-generator";

export interface DesignStudioProps {
  workspaceId: string;
  projectId?: string;
  onDesignGenerated?: (result: UIGenerationResult) => void;
  onExport?: (code: string, format: "zip" | "github" | "vercel") => Promise<void>;
}

export interface DesignVersion {
  id: string;
  version: number;
  prompt: string;
  generatedCode: string;
  mockupImageUrl?: string;
  createdAt: string;
  refinements?: string[];
  status: "draft" | "in-review" | "approved" | "deployed";
}

export interface DesignComment {
  id: string;
  author: string;
  text: string;
  elementSelector?: string;
  resolved: boolean;
  createdAt: string;
}

/**
 * Design Studio Component
 */
export function DesignStudio(props: DesignStudioProps) {
  // State management
  const [prompt, setPrompt] = useState("");
  const [refinements, setRefinements] = useState<string[]>([]);
  const [currentRefinement, setCurrentRefinement] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState<number | null>(
    null
  );
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">(
    "desktop"
  );
  const [comments, setComments] = useState<DesignComment[]>([]);
  const [showComments, setShowComments] = useState(false);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [commentText, setCommentText] = useState("");
  const [iframeReady, setIframeReady] = useState(false);

  // Get viewport dimensions
  const viewportDimensions = useMemo(() => {
    const dims = {
      desktop: { width: 1920, height: 1080 },
      tablet: { width: 768, height: 1024 },
      mobile: { width: 375, height: 812 },
    };
    return dims[viewport];
  }, [viewport]);

  // ===== Generation Handlers =====

  const handleGenerateDesign = useCallback(async () => {
    if (!prompt.trim()) {
      alert("Please enter a design prompt");
      return;
    }

    setIsGenerating(true);
    try {
      const request: UIGenerationRequest = {
        prompt,
        framework: "nextjs",
        styling: "tailwind",
        refinements: refinements.length > 0 ? refinements : undefined,
      };

      const response = await fetch(
        `/api/synthex/design-studio/generate?workspaceId=${props.workspaceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to generate design");
      }

      const result = (await response.json()) as UIGenerationResult;
      setGeneratedCode(result.code);

      // Add to version history
      const newVersion: DesignVersion = {
        id: Math.random().toString(36).substr(2, 9),
        version: versions.length + 1,
        prompt,
        generatedCode: result.code,
        createdAt: new Date().toISOString(),
        refinements,
        status: "draft",
      };

      setVersions([...versions, newVersion]);
      setCurrentVersionIndex(versions.length);
      setRefinements([]);
      setCurrentRefinement("");

      props.onDesignGenerated?.(result);
    } catch (error) {
      console.error("Design generation failed:", error);
      alert("Failed to generate design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, refinements, versions.length, props]);

  const handleRefineDesign = useCallback(async () => {
    if (!currentRefinement.trim() || !generatedCode) {
      alert("Enter a refinement or generate a design first");
      return;
    }

    setIsGenerating(true);
    try {
      const request: UIGenerationRequest = {
        prompt,
        framework: "nextjs",
        styling: "tailwind",
        refinements: [currentRefinement],
        previousCode: generatedCode,
        previousVersion: versions.length,
      };

      const response = await fetch(
        `/api/synthex/design-studio/refine?workspaceId=${props.workspaceId}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(request),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to refine design");
      }

      const result = (await response.json()) as UIGenerationResult;
      setGeneratedCode(result.code);

      // Add refined version
      const newVersion: DesignVersion = {
        id: Math.random().toString(36).substr(2, 9),
        version: versions.length + 1,
        prompt,
        generatedCode: result.code,
        createdAt: new Date().toISOString(),
        refinements: [...refinements, currentRefinement],
        status: "draft",
      };

      setVersions([...versions, newVersion]);
      setCurrentVersionIndex(versions.length);
      setCurrentRefinement("");
    } catch (error) {
      console.error("Design refinement failed:", error);
      alert("Failed to refine design. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  }, [currentRefinement, generatedCode, prompt, refinements, versions.length]);

  // ===== Comment Handlers =====

  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    const newComment: DesignComment = {
      id: Math.random().toString(36).substr(2, 9),
      author: "Current User", // In real app, get from auth
      text: commentText,
      elementSelector: selectedElement || undefined,
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    setComments([...comments, newComment]);
    setCommentText("");
    setSelectedElement(null);
  }, [commentText, selectedElement, comments]);

  // ===== Export Handlers =====

  const handleExport = useCallback(
    async (format: "zip" | "github" | "vercel") => {
      if (!generatedCode) {
        alert("Generate a design first before exporting");
        return;
      }

      try {
        await props.onExport?.(generatedCode, format);
        alert(`Design exported as ${format.toUpperCase()}`);
      } catch (error) {
        console.error("Export failed:", error);
        alert(`Failed to export as ${format}`);
      }
    },
    [generatedCode, props]
  );

  // ===== Version Navigation =====

  const handleSelectVersion = useCallback((index: number) => {
    setCurrentVersionIndex(index);
    const version = versions[index];
    setGeneratedCode(version.generatedCode);
    setRefinements(version.refinements || []);
  }, [versions]);

  const currentVersion = currentVersionIndex !== null ? versions[currentVersionIndex] : null;

  // ===== Render =====

  return (
    <div className="flex h-screen bg-bg-base">
      {/* Left Sidebar - Prompt & Controls */}
      <div className="w-1/4 bg-bg-card border-r border-bg-border overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              Design Studio
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              AI-powered UI design generator
            </p>
          </div>

          {/* Prompt Input */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-text-primary">
              Design Brief
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the design you want: 'Modern landing page for plumbing business with hero, 3 features, CTA'"
              className="w-full h-24 p-3 bg-bg-input border border-bg-border rounded-lg text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-500"
              disabled={isGenerating}
            />
            <button
              onClick={handleGenerateDesign}
              disabled={isGenerating || !prompt.trim()}
              className="w-full py-2 bg-accent-500 text-white rounded-lg font-semibold hover:bg-accent-600 disabled:bg-bg-border disabled:text-text-disabled transition"
            >
              {isGenerating ? "Generating..." : "Generate Design"}
            </button>
          </div>

          {/* Refinement Input */}
          {generatedCode && (
            <div className="space-y-2 p-3 bg-bg-input rounded-lg border border-bg-border">
              <label className="block text-sm font-semibold text-text-primary">
                Refine
              </label>
              <input
                type="text"
                value={currentRefinement}
                onChange={(e) => setCurrentRefinement(e.target.value)}
                placeholder="e.g., 'Make headline bigger', 'Change color to blue'"
                className="w-full p-2 bg-bg-base border border-bg-border rounded text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-500"
                disabled={isGenerating}
              />
              <button
                onClick={handleRefineDesign}
                disabled={isGenerating || !currentRefinement.trim()}
                className="w-full py-2 bg-accent-500 text-white rounded font-semibold hover:bg-accent-600 disabled:bg-bg-border text-sm transition"
              >
                {isGenerating ? "Refining..." : "Refine"}
              </button>
            </div>
          )}

          {/* Version History */}
          {versions.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Version History
              </h3>
              <div className="space-y-1">
                {versions.map((v, i) => (
                  <button
                    key={v.id}
                    onClick={() => handleSelectVersion(i)}
                    className={`w-full text-left p-2 rounded text-sm transition ${
                      currentVersionIndex === i
                        ? "bg-accent-500 text-white"
                        : "bg-bg-input text-text-secondary hover:bg-bg-border"
                    }`}
                  >
                    v{v.version} • {new Date(v.createdAt).toLocaleTimeString()}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Buttons */}
          {generatedCode && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-text-primary">
                Export
              </h3>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleExport("zip")}
                  className="py-2 bg-bg-input text-text-primary rounded hover:bg-bg-border text-xs font-semibold transition"
                >
                  📦 ZIP
                </button>
                <button
                  onClick={() => handleExport("github")}
                  className="py-2 bg-bg-input text-text-primary rounded hover:bg-bg-border text-xs font-semibold transition"
                >
                  🐙 GitHub
                </button>
                <button
                  onClick={() => handleExport("vercel")}
                  className="py-2 bg-bg-input text-text-primary rounded hover:bg-bg-border text-xs font-semibold transition"
                >
                  ▲ Vercel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Center - Live Preview */}
      <div className="flex-1 bg-bg-base flex flex-col">
        {/* Viewport Selector */}
        <div className="bg-bg-card border-b border-bg-border px-6 py-3 flex items-center gap-2">
          {(["desktop", "tablet", "mobile"] as const).map((vp) => (
            <button
              key={vp}
              onClick={() => setViewport(vp)}
              className={`px-3 py-1 rounded text-sm font-semibold transition ${
                viewport === vp
                  ? "bg-accent-500 text-white"
                  : "bg-bg-input text-text-secondary hover:bg-bg-border"
              }`}
            >
              {vp === "desktop"
                ? "🖥️ Desktop"
                : vp === "tablet"
                  ? "📱 Tablet"
                  : "📱 Mobile"}
            </button>
          ))}
          <div className="ml-auto text-xs text-text-secondary">
            {viewportDimensions.width}×{viewportDimensions.height}px
          </div>
        </div>

        {/* Live Preview */}
        <div className="flex-1 overflow-auto bg-gray-100 p-6 flex items-center justify-center">
          {generatedCode ? (
            <div
              style={{
                width: viewportDimensions.width,
                height: viewportDimensions.height,
                border: "1px solid #ddd",
                borderRadius: "8px",
                backgroundColor: "white",
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
              }}
            >
              <iframe
                title="Design Preview"
                srcDoc={getIframeHTML(generatedCode)}
                style={{ width: "100%", height: "100%", border: "none" }}
                onLoad={() => setIframeReady(true)}
              />
            </div>
          ) : (
            <div className="text-center">
              <div className="text-text-disabled text-lg">
                👉 Create a design to see preview
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar - Comments & Actions */}
      <div className="w-1/4 bg-bg-card border-l border-bg-border overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Comments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-text-primary">
                Comments ({comments.length})
              </h3>
              <button
                onClick={() => setShowComments(!showComments)}
                className="text-xs text-accent-500 hover:underline"
              >
                {showComments ? "Hide" : "Show"}
              </button>
            </div>

            {showComments && (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-3 bg-bg-input rounded border border-bg-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold text-text-primary">
                        {comment.author}
                      </span>
                      <span className="text-xs text-text-disabled">
                        {new Date(comment.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary">{comment.text}</p>
                    {comment.elementSelector && (
                      <div className="mt-2 text-xs text-accent-500 font-mono">
                        {comment.elementSelector}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Comment */}
          {generatedCode && (
            <div className="space-y-2 p-3 bg-bg-input rounded-lg border border-bg-border">
              <label className="block text-sm font-semibold text-text-primary">
                Add Comment
              </label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Share feedback..."
                className="w-full h-16 p-2 bg-bg-base border border-bg-border rounded text-sm text-text-primary placeholder-text-disabled focus:outline-none focus:border-accent-500"
              />
              <button
                onClick={handleAddComment}
                disabled={!commentText.trim()}
                className="w-full py-2 bg-accent-500 text-white rounded font-semibold hover:bg-accent-600 disabled:bg-bg-border text-sm transition"
              >
                Comment
              </button>
            </div>
          )}

          {/* Actions */}
          {currentVersion && (
            <div className="space-y-2 p-3 bg-bg-input rounded-lg border border-bg-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">
                  Design Status
                </span>
                <select
                  value={currentVersion.status}
                  className="text-xs bg-bg-base border border-bg-border rounded text-text-primary"
                >
                  <option value="draft">Draft</option>
                  <option value="in-review">In Review</option>
                  <option value="approved">Approved</option>
                  <option value="deployed">Deployed</option>
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Functions
// ============================================================================

function getIframeHTML(code: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; }
    * { box-sizing: border-box; }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    import React from 'https://esm.sh/react@19.0.0';
    import ReactDOM from 'https://esm.sh/react-dom@19.0.0/client';

    const ComponentCode = \`${code.replace(/`/g, "\\`")}\`;
    const Component = eval(\`(React) => { \${ComponentCode} }\`)(React);

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(React.createElement(Component));
  </script>
</body>
</html>
  `.trim();
}
