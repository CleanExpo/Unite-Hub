/**
 * Dynamic MindMap Visualization Wrapper
 * Phase 9 Performance Optimization - Zero Cost Improvement
 *
 * Uses next/dynamic for code splitting to reduce initial bundle size.
 * ReactFlow (~240KB) is only loaded when the component is used.
 */

"use client";

import dynamic from "next/dynamic";
import { Loader2 } from "lucide-react";

// Loading skeleton for mindmap
function MindMapSkeleton() {
  return (
    <div className="w-full h-[700px] bg-white rounded-lg shadow-sm border border-gray-200 flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500 mx-auto mb-3" />
        <p className="text-sm text-gray-500">Loading visualization...</p>
      </div>
    </div>
  );
}

// Dynamically import the heavy MindMapVisualization component
export const DynamicMindMapVisualization = dynamic(
  () => import("./MindMapVisualization").then((mod) => mod.MindMapVisualization),
  {
    loading: () => <MindMapSkeleton />,
    ssr: false, // ReactFlow doesn't support SSR
  }
);

// Dynamically import the InteractiveMindmap component
export const DynamicInteractiveMindmap = dynamic(
  () => import("./InteractiveMindmap").then((mod) => mod.InteractiveMindmap),
  {
    loading: () => <MindMapSkeleton />,
    ssr: false,
  }
);

// Re-export types for convenience
export type { MindMapVisualization } from "./MindMapVisualization";
export type { InteractiveMindmap } from "./InteractiveMindmap";
