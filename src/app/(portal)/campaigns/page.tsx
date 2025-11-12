"use client";

import React, { useState } from "react";
import { CampaignCard } from "@/components/campaigns/CampaignCard";
import { CampaignBuilder } from "@/components/campaigns/CampaignBuilder";
import { CampaignCalendar } from "@/components/campaigns/CampaignCalendar";
import { Plus, Grid, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CampaignsPage() {
  const [showBuilder, setShowBuilder] = useState(false);

  // TODO: Replace with actual Convex data
  const mockCampaigns = [
    {
      _id: "1",
      platform: "instagram" as const,
      campaignName: "Summer Product Launch",
      campaignThemes: ["Product Launch", "Summer Sale", "Limited Offer"],
      status: "active" as const,
      createdAt: Date.now() - 86400000,
      timeline: {
        startDate: Date.now(),
        endDate: Date.now() + 30 * 86400000,
      },
    },
    {
      _id: "2",
      platform: "facebook" as const,
      campaignName: "Brand Awareness Campaign",
      campaignThemes: ["Brand Building", "Community"],
      status: "draft" as const,
      createdAt: Date.now() - 172800000,
    },
  ];

  const mockContentCalendar = [
    {
      date: Date.now(),
      contentType: "Instagram Post",
      description: "Product showcase",
      status: "scheduled" as const,
      platform: "instagram",
    },
    {
      date: Date.now() + 86400000,
      contentType: "Facebook Ad",
      description: "Awareness campaign",
      status: "draft" as const,
      platform: "facebook",
    },
  ];

  if (showBuilder) {
    return (
      <div className="space-y-6">
        <Button
          onClick={() => setShowBuilder(false)}
          variant="outline"
          className="gap-2"
        >
          Cancel
        </Button>
        <CampaignBuilder
          onSave={(campaign) => {
            console.log("Save campaign:", campaign);
            setShowBuilder(false);
          }}
          onCancel={() => setShowBuilder(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campaigns</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your social media campaigns
          </p>
        </div>
        <Button
          onClick={() => setShowBuilder(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Campaign
        </Button>
      </div>

      <Tabs defaultValue="campaigns">
        <TabsList>
          <TabsTrigger value="campaigns" className="gap-2">
            <Grid className="h-4 w-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Content Calendar
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {mockCampaigns.map((campaign) => (
              <CampaignCard
                key={campaign._id}
                campaign={campaign}
                onView={(id) => console.log("View:", id)}
                onEdit={(id) => console.log("Edit:", id)}
                onToggleStatus={(id) => console.log("Toggle:", id)}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="calendar" className="mt-6">
          <CampaignCalendar
            contentCalendar={mockContentCalendar}
            onDateClick={(date) => console.log("Date clicked:", date)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
