"use client";

import { Button } from "@/components/ui/button";
import { FileText, Plus, Copy, Edit, Trash2 } from "lucide-react";

export default function EmailTemplatesPage() {
  const templates = [
    { name: "Welcome Email", category: "Onboarding", lastUsed: "2 days ago", uses: 234 },
    { name: "Follow-up Template", category: "Sales", lastUsed: "Yesterday", uses: 156 },
    { name: "Newsletter Header", category: "Marketing", lastUsed: "1 week ago", uses: 89 },
    { name: "Thank You Email", category: "Customer Success", lastUsed: "3 days ago", uses: 312 },
    { name: "Meeting Request", category: "Sales", lastUsed: "Today", uses: 67 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold font-mono text-white/90">Email Templates</h1>
          <p className="text-white/40 mt-1">Reusable email templates for campaigns</p>
        </div>
        <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <div key={index} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 hover:border-white/[0.10] transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 bg-white/[0.04] border border-white/[0.06] rounded-sm">
                <FileText className="h-5 w-5 text-[#00F5FF]" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest bg-white/[0.04] text-white/50 px-2 py-1 rounded-sm">
                {template.category}
              </span>
            </div>
            <h3 className="font-medium font-mono text-white/90 mb-1">{template.name}</h3>
            <p className="text-sm text-white/40 mb-4">
              {template.uses} uses • {template.lastUsed}
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/90">
                <Edit className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white/40 hover:text-white/90">
                <Copy className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className="text-white/40 hover:text-[#FF4444]">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
