"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Mail, Plus, Search, Filter, MoreHorizontal, TrendingUp, Users, CheckCircle, Clock } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Container } from "@/components/layout/Container";
import { Tabs } from "@/components/patterns/Tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Sample campaign data
const SAMPLE_CAMPAIGNS = [
  {
    id: "1",
    name: "Summer Product Launch",
    status: "active",
    segments: 4500,
    opens: 1280,
    openRate: 28.4,
    clicks: 342,
    clickRate: 7.6,
    conversions: 42,
    createdAt: "2025-11-15",
  },
  {
    id: "2",
    name: "Black Friday Sale",
    status: "draft",
    segments: 0,
    opens: 0,
    openRate: 0,
    clicks: 0,
    clickRate: 0,
    conversions: 0,
    createdAt: "2025-11-28",
  },
  {
    id: "3",
    name: "Monthly Newsletter",
    status: "active",
    segments: 8200,
    opens: 2640,
    openRate: 32.2,
    clicks: 580,
    clickRate: 7.1,
    conversions: 125,
    createdAt: "2025-11-01",
  },
  {
    id: "4",
    name: "Welcome Series",
    status: "scheduled",
    segments: 12500,
    opens: 4500,
    openRate: 36.0,
    clicks: 1200,
    clickRate: 9.6,
    conversions: 320,
    createdAt: "2025-10-20",
  },
];

export default function CampaignsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter campaigns by search term
  const filteredCampaigns = SAMPLE_CAMPAIGNS.filter((campaign) =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeCampaigns = filteredCampaigns.filter((c) => c.status === "active");
  const draftCampaigns = filteredCampaigns.filter((c) => c.status === "draft");
  const scheduledCampaigns = filteredCampaigns.filter(
    (c) => c.status === "scheduled"
  );

  const CampaignTable = ({ campaigns }: { campaigns: typeof SAMPLE_CAMPAIGNS }) => (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-border-subtle hover:bg-bg-card/50">
            <TableHead className="text-text-secondary font-semibold">Campaign Name</TableHead>
            <TableHead className="text-text-secondary font-semibold">Segments</TableHead>
            <TableHead className="text-text-secondary font-semibold">Open Rate</TableHead>
            <TableHead className="text-text-secondary font-semibold">Click Rate</TableHead>
            <TableHead className="text-text-secondary font-semibold">Conversions</TableHead>
            <TableHead className="text-text-secondary font-semibold">Created</TableHead>
            <TableHead className="text-text-secondary font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {campaigns.map((campaign) => (
            <TableRow key={campaign.id} className="border-border-subtle hover:bg-bg-card/50 transition-colors">
              <TableCell>
                <div>
                  <p className="font-semibold text-text-primary">{campaign.name}</p>
                  <p className="text-sm text-text-secondary">ID: {campaign.id}</p>
                </div>
              </TableCell>
              <TableCell className="text-text-primary">
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-accent-500" />
                  {campaign.segments.toLocaleString()}
                </div>
              </TableCell>
              <TableCell>
                <Badge className="bg-success-500/20 text-success-400 border border-success-500/30">
                  {campaign.openRate}%
                </Badge>
              </TableCell>
              <TableCell>
                <Badge className="bg-accent-500/20 text-accent-400 border border-accent-500/30">
                  {campaign.clickRate}%
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-success-500" />
                  <span className="text-text-primary">{campaign.conversions}</span>
                </div>
              </TableCell>
              <TableCell className="text-text-secondary">
                {new Date(campaign.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost" className="hover:bg-bg-card/50">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-bg-card border-border-subtle">
                    <DropdownMenuItem className="text-text-primary hover:text-text-primary hover:bg-bg-card/80 cursor-pointer">
                      <Mail className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-text-primary hover:text-text-primary hover:bg-bg-card/80 cursor-pointer">
                      Edit Campaign
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-error-400 hover:text-error-300 hover:bg-error-400/10 cursor-pointer">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  const tabItems = [
    {
      id: "active",
      label: `Active (${activeCampaigns.length})`,
      content: <CampaignTable campaigns={activeCampaigns} />,
    },
    {
      id: "draft",
      label: `Drafts (${draftCampaigns.length})`,
      content: <CampaignTable campaigns={draftCampaigns} />,
    },
    {
      id: "scheduled",
      label: `Scheduled (${scheduledCampaigns.length})`,
      content: <CampaignTable campaigns={scheduledCampaigns} />,
    },
  ];

  return (
    <Container size="xl" padding="lg" className="space-y-8">
      <Breadcrumbs items={[{ label: "Campaigns" }]} />

      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Email Campaigns
          </h1>
          <p className="text-text-secondary">Create and manage your email marketing campaigns</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2">
          <Plus className="w-4 h-4" />
          New Campaign
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-text-secondary" />
          <Input
            placeholder="Search campaigns by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-bg-card border-border-subtle text-text-primary placeholder:text-text-secondary"
          />
        </div>
        <Button variant="outline" className="border-border-subtle bg-bg-card text-text-secondary hover:bg-bg-card/80 hover:border-border-subtle gap-2 h-12">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Campaign Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-bg-card border border-border-subtle">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Total Campaigns</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{SAMPLE_CAMPAIGNS.length}</p>
              </div>
              <Mail className="w-5 h-5 text-accent-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border border-border-subtle">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Active</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{activeCampaigns.length}</p>
              </div>
              <TrendingUp className="w-5 h-5 text-success-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border border-border-subtle">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Drafts</p>
                <p className="text-3xl font-bold text-text-primary mt-2">{draftCampaigns.length}</p>
              </div>
              <Clock className="w-5 h-5 text-warning-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-bg-card border border-border-subtle">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-text-secondary font-medium">Avg Open Rate</p>
                <p className="text-3xl font-bold text-text-primary mt-2">31.2%</p>
              </div>
              <CheckCircle className="w-5 h-5 text-accent-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table with Tabs */}
      <Card className="bg-bg-card border border-border-subtle">
        <CardHeader>
          <CardTitle className="text-text-primary">Campaigns</CardTitle>
          <CardDescription className="text-text-secondary">View and manage your email campaigns</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs items={tabItems} />
        </CardContent>
      </Card>
    </Container>
  );
}
