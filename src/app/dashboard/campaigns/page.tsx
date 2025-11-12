"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, MailIcon, TrendingUp, Pause, Play, Trash2 } from "lucide-react";

export default function CampaignsPage() {
  const [campaigns] = useState([
    {
      id: 1,
      name: "Q4 Holiday Campaign",
      workspace: "Duncan's Marketing",
      status: "active",
      sent: 245,
      opened: 58,
      clicked: 12,
      replied: 5,
      startDate: "2024-11-01",
      endDate: null,
    },
    {
      id: 2,
      name: "New Year Promo",
      workspace: "Tech StartUp Co",
      status: "scheduled",
      sent: 0,
      opened: 0,
      clicked: 0,
      replied: 0,
      startDate: "2024-12-26",
      endDate: "2025-01-15",
    },
    {
      id: 3,
      name: "Product Launch",
      workspace: "eCommerce Solutions",
      status: "completed",
      sent: 512,
      opened: 147,
      clicked: 35,
      replied: 12,
      startDate: "2024-10-15",
      endDate: "2024-10-31",
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Campaigns</h1>
          <p className="text-slate-400">Manage all your marketing campaigns</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Active Campaigns"
          value="3"
          icon={<MailIcon className="w-5 h-5" />}
          color="bg-blue-600"
        />
        <StatCard
          title="Total Sent"
          value="757"
          icon={<MailIcon className="w-5 h-5" />}
          color="bg-green-600"
        />
        <StatCard
          title="Avg Open Rate"
          value="24.3%"
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-purple-600"
        />
        <StatCard
          title="Conversions"
          value="47"
          icon={<TrendingUp className="w-5 h-5" />}
          color="bg-orange-600"
        />
      </div>

      {/* Campaigns Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Campaigns</CardTitle>
          <CardDescription>View and manage your campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300">Campaign</TableHead>
                <TableHead className="text-slate-300">Workspace</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Performance</TableHead>
                <TableHead className="text-slate-300">Sent</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => {
                const openRate = campaign.sent > 0 ? ((campaign.opened / campaign.sent) * 100).toFixed(1) : 0;
                return (
                  <TableRow key={campaign.id} className="border-slate-700 hover:bg-slate-700/50">
                    <TableCell className="text-white font-semibold">{campaign.name}</TableCell>
                    <TableCell className="text-slate-400">{campaign.workspace}</TableCell>
                    <TableCell>
                      <Badge
                        className={
                          campaign.status === "active"
                            ? "bg-green-600"
                            : campaign.status === "scheduled"
                            ? "bg-blue-600"
                            : "bg-slate-600"
                        }
                      >
                        {campaign.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Open: {openRate}%</span>
                        </div>
                        <Progress value={parseFloat(openRate as string)} className="h-1 w-20" />
                      </div>
                    </TableCell>
                    <TableCell className="text-white font-semibold">{campaign.sent}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {campaign.status === "active" && (
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:text-amber-300">
                            <Pause className="w-4 h-4" />
                          </Button>
                        )}
                        {campaign.status === "scheduled" && (
                          <Button size="sm" variant="ghost" className="text-green-400 hover:text-green-300">
                            <Play className="w-4 h-4" />
                          </Button>
                        )}
                        <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <Card className={`${color}/10 border-${color}/30 border`}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-3xl font-bold text-white mt-2">{value}</p>
          </div>
          <div className={`${color} p-3 rounded text-white`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
