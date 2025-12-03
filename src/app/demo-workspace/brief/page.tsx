"use client";

import React from "react";
import { FileText, Sparkles, Target, Clock, ArrowRight } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SmartBriefPage() {
  const briefs = [
    {
      id: "brief-1",
      title: "Summer Campaign 2025",
      objective: "Increase brand awareness and drive sales for summer collection",
      targetAudience: "Fashion-conscious millennials, 25-34",
      platforms: ["TikTok", "Instagram", "Meta"],
      status: "active",
      createdAt: "2 days ago",
    },
    {
      id: "brief-2",
      title: "Product Launch - New Line",
      objective: "Generate buzz for upcoming product launch",
      targetAudience: "Early adopters and tech enthusiasts",
      platforms: ["YouTube", "LinkedIn", "Twitter"],
      status: "draft",
      createdAt: "1 week ago",
    },
  ];

  return (
    <div className="min-h-screen bg-bg-base relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #0a1f2e 0%, #071318 100%)
          `,
        }}
      />

      {/* Main container */}
      <div className="relative z-10 h-screen p-4 flex justify-center items-center">
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-bg-raised/40 backdrop-blur-xl rounded-2xl shadow-2xl flex overflow-hidden border border-cyan-800/20">
          {/* Left Sidebar */}
          <WorkspaceSidebar />

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Smart Brief</h1>
              </div>
              <p className="text-sm text-gray-400">
                Create AI-powered marketing briefs that guide content generation
              </p>
            </header>

            {/* Create New Brief */}
            <Card className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border-cyan-500/30 mb-8">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-500/20 rounded-xl">
                      <Sparkles className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">Create New Brief</h3>
                      <p className="text-sm text-gray-400">
                        Let AI help you define your campaign objectives
                      </p>
                    </div>
                  </div>
                  <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                    Start Brief <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Briefs */}
            <h2 className="text-lg font-semibold text-white mb-4">Your Briefs</h2>
            <div className="grid gap-4">
              {briefs.map((brief) => (
                <Card key={brief.id} className="bg-bg-card/60 border-cyan-900/30 hover:border-cyan-500/30 transition-colors">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-white text-lg">{brief.title}</CardTitle>
                        <CardDescription className="text-gray-400 mt-1">
                          {brief.objective}
                        </CardDescription>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        brief.status === "active"
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-gray-500/20 text-gray-400 border border-gray-500/30"
                      }`}>
                        {brief.status}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2 text-gray-400">
                        <Target className="w-4 h-4 text-cyan-400" />
                        <span>{brief.targetAudience}</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <span className="text-cyan-400">{brief.platforms.length} platforms</span>
                      </div>
                      <div className="flex items-center gap-2 text-gray-400">
                        <Clock className="w-4 h-4" />
                        <span>{brief.createdAt}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
