"use client";

import React from "react";
import { MindMapVisualization } from "@/components/mindmap/MindMapVisualization";
import { MindMapControls } from "@/components/mindmap/MindMapControls";
import { Lightbulb, Info } from "lucide-react";

export default function MindMapPage() {
  // TODO: Replace with actual Convex data
  const mockMindMapData = {
    rootNode: {
      id: "root-1",
      label: "Your Business",
      type: "business" as const,
    },
    branches: [
      {
        id: "branch-1",
        parentId: "root-1",
        label: "Products & Services",
        category: "product" as const,
        color: "#3B82F6",
        subNodes: [
          { id: "sub-1-1", label: "Core Product", details: "Main offering" },
          { id: "sub-1-2", label: "Premium Service", details: "High-tier option" },
        ],
        createdAt: Date.now(),
      },
      {
        id: "branch-2",
        parentId: "root-1",
        label: "Target Audience",
        category: "audience" as const,
        color: "#8B5CF6",
        subNodes: [
          { id: "sub-2-1", label: "Tech Professionals", details: "Primary segment" },
          { id: "sub-2-2", label: "Small Business Owners", details: "Secondary segment" },
        ],
        createdAt: Date.now(),
      },
      {
        id: "branch-3",
        parentId: "root-1",
        label: "Key Challenges",
        category: "challenge" as const,
        color: "#EF4444",
        subNodes: [
          { id: "sub-3-1", label: "Market Competition", details: "High competition" },
          { id: "sub-3-2", label: "Customer Acquisition", details: "Cost concerns" },
        ],
        createdAt: Date.now(),
      },
      {
        id: "branch-4",
        parentId: "root-1",
        label: "Opportunities",
        category: "opportunity" as const,
        color: "#10B981",
        subNodes: [
          { id: "sub-4-1", label: "Digital Marketing", details: "Growing channel" },
          { id: "sub-4-2", label: "AI Automation", details: "Emerging tech" },
        ],
        createdAt: Date.now(),
      },
    ],
    autoExpandedFromEmails: [],
    version: 1,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Business Mind Map</h1>
        <p className="text-gray-600 mt-1">
          AI-powered visual representation of your business ecosystem
        </p>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm text-blue-900 font-medium">Auto-Expanding Mind Map</p>
          <p className="text-sm text-blue-700 mt-1">
            This mind map automatically expands based on insights from your emails and
            interactions. Click the "AI Expand" button to trigger manual expansion.
          </p>
        </div>
      </div>

      {/* Mind Map */}
      <div className="relative">
        <MindMapVisualization
          data={mockMindMapData}
          onNodeClick={(nodeId) => console.log("Node clicked:", nodeId)}
          onExpandNode={(nodeId) => console.log("Expand node:", nodeId)}
        />
        <MindMapControls
          onZoomIn={() => console.log("Zoom in")}
          onZoomOut={() => console.log("Zoom out")}
          onFitView={() => console.log("Fit view")}
          onExport={() => console.log("Export")}
          onRefresh={() => console.log("Refresh")}
          onAIExpand={() => console.log("AI Expand")}
          autoExpandEnabled={true}
          version={mockMindMapData.version}
        />
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Category Legend</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <LegendItem color="#3B82F6" label="Products & Services" />
          <LegendItem color="#8B5CF6" label="Target Audience" />
          <LegendItem color="#EF4444" label="Challenges" />
          <LegendItem color="#10B981" label="Opportunities" />
          <LegendItem color="#F59E0B" label="Competitors" />
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }} />
      <span className="text-sm text-gray-700">{label}</span>
    </div>
  );
}
