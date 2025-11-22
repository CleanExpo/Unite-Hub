"use client";

import { Card, CardContent } from "@/components/ui/card";
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
          <h1 className="text-3xl font-bold text-white">Email Templates</h1>
          <p className="text-slate-400 mt-1">Reusable email templates for campaigns</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Template
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700 hover:border-slate-600 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <FileText className="h-5 w-5 text-cyan-500" />
                </div>
                <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">
                  {template.category}
                </span>
              </div>
              <h3 className="font-medium text-white mb-1">{template.name}</h3>
              <p className="text-sm text-slate-400 mb-4">
                {template.uses} uses • {template.lastUsed}
              </p>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Edit className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Copy className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-red-400">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
