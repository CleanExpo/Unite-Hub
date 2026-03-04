"use client";

import React, { useState } from "react";
import { FileText, Sparkles, Target, Users, Calendar, ArrowRight } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { useAuth } from "@/contexts/AuthContext";

interface BriefSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  content: string;
  placeholder: string;
}

export default function SmartBriefPage() {
  const { user } = useAuth();
  const [briefName, setBriefName] = useState("");
  const [sections, setSections] = useState<BriefSection[]>([
    {
      id: "objective",
      title: "Campaign Objective",
      icon: <Target className="w-4 h-4" />,
      content: "",
      placeholder: "What do you want to achieve? (e.g., Increase brand awareness, drive sales, launch new product)",
    },
    {
      id: "audience",
      title: "Target Audience",
      icon: <Users className="w-4 h-4" />,
      content: "",
      placeholder: "Who are you trying to reach? (e.g., Young professionals 25-35, fashion enthusiasts)",
    },
    {
      id: "timeline",
      title: "Timeline & Budget",
      icon: <Calendar className="w-4 h-4" />,
      content: "",
      placeholder: "When should this launch? What's the budget range?",
    },
    {
      id: "tone",
      title: "Brand Voice & Tone",
      icon: <Sparkles className="w-4 h-4" />,
      content: "",
      placeholder: "How should the content feel? (e.g., Professional, playful, luxurious)",
    },
  ]);

  const handleSectionChange = (id: string, content: string) => {
    setSections(prev =>
      prev.map(section =>
        section.id === id ? { ...section, content } : section
      )
    );
  };

  const handleGenerateBrief = () => {
    alert("AI Brief Generation coming soon! This will use NEXUS to create a comprehensive campaign brief.");
  };

  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, rgba(8, 145, 178, 0.08) 0%, transparent 60%),
            linear-gradient(180deg, #0a1f2e 0%, #071318 100%)
          `,
        }}
      />

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(6, 182, 212, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(6, 182, 212, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Main container */}
      <div className="relative z-10 h-screen p-4 flex justify-center items-center">
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-[#0a1f2e]/40 backdrop-blur-xl rounded-2xl shadow-2xl flex overflow-hidden border border-cyan-800/20">
          {/* Left Sidebar */}
          <WorkspaceSidebar />

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-cyan-400" />
                  Smart Brief
                </h1>
                <p className="text-sm text-gray-400">
                  Create AI-powered campaign briefs for content generation
                </p>
              </div>
            </header>

            {/* Brief Form */}
            <div className="max-w-3xl">
              {/* Brief Name */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Brief Name
                </label>
                <input
                  type="text"
                  value={briefName}
                  onChange={(e) => setBriefName(e.target.value)}
                  placeholder="e.g., Summer 2025 Campaign Brief"
                  className="w-full bg-[#0d2137]/60 border border-cyan-900/30 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
              </div>

              {/* Brief Sections */}
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="bg-[#0d2137]/40 border border-cyan-900/20 rounded-xl p-4"
                  >
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-2">
                      <span className="text-cyan-400">{section.icon}</span>
                      {section.title}
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(section.id, e.target.value)}
                      placeholder={section.placeholder}
                      rows={3}
                      className="w-full bg-[#071318]/60 border border-cyan-900/20 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50 transition-colors resize-none"
                    />
                  </div>
                ))}
              </div>

              {/* Generate Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  className="flex items-center gap-2 bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-400 hover:to-green-400 text-black font-semibold px-6 py-3 rounded-lg transition-all shadow-lg shadow-lime-500/20"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate AI Brief
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
