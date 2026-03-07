"use client";

import React, { useState } from "react";
import { FileText, Sparkles, Target, Users, Calendar, ArrowRight } from "lucide-react";
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
    <div className="min-h-screen bg-[#050505] relative overflow-hidden">
      {/* Main container */}
      <div className="relative z-10 h-screen p-4 flex justify-center items-center">
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-white/[0.02] rounded-sm shadow-2xl flex overflow-hidden border border-white/[0.06]">
          {/* Left Sidebar */}
          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <header className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-xl font-bold font-mono text-white/90 mb-1 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#00F5FF]" />
                  Smart Brief
                </h1>
                <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">
                  Create AI-powered campaign briefs for content generation
                </p>
              </div>
            </header>

            {/* Brief Form */}
            <div className="max-w-3xl">
              {/* Brief Name */}
              <div className="mb-6">
                <label className="block text-sm font-mono font-medium text-white/50 mb-2">
                  Brief Name
                </label>
                <input
                  type="text"
                  value={briefName}
                  onChange={(e) => setBriefName(e.target.value)}
                  placeholder="e.g., Summer 2025 Campaign Brief"
                  className="w-full bg-[#050505] border border-white/[0.06] rounded-sm px-4 py-3 text-white/90 placeholder-white/20 focus:outline-none focus:border-[#00F5FF]/50 transition-colors font-mono text-sm"
                />
              </div>

              {/* Brief Sections */}
              <div className="space-y-4">
                {sections.map((section) => (
                  <div
                    key={section.id}
                    className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4"
                  >
                    <label className="flex items-center gap-2 text-sm font-mono font-medium text-white/50 mb-2">
                      <span className="text-[#00F5FF]">{section.icon}</span>
                      {section.title}
                    </label>
                    <textarea
                      value={section.content}
                      onChange={(e) => handleSectionChange(section.id, e.target.value)}
                      placeholder={section.placeholder}
                      rows={3}
                      className="w-full bg-[#050505] border border-white/[0.06] rounded-sm px-4 py-3 text-white/90 placeholder-white/20 focus:outline-none focus:border-[#00F5FF]/50 transition-colors resize-none font-mono text-sm"
                    />
                  </div>
                ))}
              </div>

              {/* Generate Button */}
              <div className="mt-8 flex justify-end">
                <button
                  type="button"
                  onClick={handleGenerateBrief}
                  className="flex items-center gap-2 bg-[#00FF88] text-[#050505] font-mono font-bold px-6 py-3 rounded-sm hover:bg-[#00FF88]/90 transition-colors"
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
