"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Plus, Play, Pause, MoreVertical } from "lucide-react";

export default function DripCampaignsPage() {
  const campaigns = [
    { name: "Welcome Series", status: "Active", enrolled: 234, completed: 189, rate: "81%" },
    { name: "Re-engagement Flow", status: "Active", enrolled: 156, completed: 98, rate: "63%" },
    { name: "Nurture Sequence", status: "Paused", enrolled: 89, completed: 45, rate: "51%" },
    { name: "Onboarding Drip", status: "Active", enrolled: 312, completed: 278, rate: "89%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Drip Campaigns</h1>
          <p className="text-slate-400 mt-1">Automated email sequences for lead nurturing</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      <div className="grid gap-4">
        {campaigns.map((campaign, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-slate-700 rounded-lg">
                    <Workflow className="h-5 w-5 text-cyan-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-white">{campaign.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                      <span>{campaign.enrolled} enrolled</span>
                      <span>{campaign.completed} completed</span>
                      <span>{campaign.rate} completion</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2 py-1 rounded ${
                    campaign.status === "Active"
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}>
                    {campaign.status}
                  </span>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    {campaign.status === "Active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-slate-400">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
