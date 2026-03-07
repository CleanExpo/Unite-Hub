"use client";

import React from "react";
import { Sparkles, FileText, Code, Image, Mic, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function AIToolsPage() {
  const tools = [
    {
      name: "Marketing Copy",
      description: "Generate compelling marketing copy with AI",
      icon: FileText,
      href: "/dashboard/ai-tools/marketing-copy",
      status: "Active",
    },
    {
      name: "Code Generator",
      description: "Generate code snippets and scripts",
      icon: Code,
      href: "/dashboard/ai-tools/code-generator",
      status: "Active",
    },
    {
      name: "Image Generation",
      description: "Create AI-generated images for campaigns",
      icon: Image,
      href: "/dashboard/ai-tools/images",
      status: "Coming Soon",
    },
    {
      name: "Voice Synthesis",
      description: "Generate voice content for videos and ads",
      icon: Mic,
      href: "/dashboard/ai-tools/voice",
      status: "Coming Soon",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-mono text-white/90 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AI Tools
        </h1>
        <p className="text-white/40">Powerful AI-powered tools for content creation</p>
      </div>

      {/* Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tools.map((tool) => (
          <div key={tool.name} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 hover:border-white/[0.12] transition-colors">
            <div className="mb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-sm bg-primary/10">
                    <tool.icon className="h-6 w-6 text-primary" />
                  </div>
                  <span className="font-mono font-bold text-white/90">{tool.name}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-sm font-mono ${
                  tool.status === "Active"
                    ? "bg-[#00FF88]/10 text-[#00FF88]"
                    : "bg-white/[0.04] text-white/30"
                }`}>
                  {tool.status}
                </span>
              </div>
              <p className="text-white/40 text-sm mt-2 ml-11">
                {tool.description}
              </p>
            </div>
            <button
              className="w-full bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5 disabled:opacity-30 hover:border-white/[0.12] transition-colors flex items-center justify-center gap-2"
              disabled={tool.status !== "Active"}
            >
              <Link href={tool.href} className="flex items-center gap-2">
                Open Tool <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
