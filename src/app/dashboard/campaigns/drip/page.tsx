"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Workflow, Mail, Clock, Target, ArrowRight } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import Link from "next/link";

export default function DripCampaignsPage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs
        items={[
          { label: "Campaigns", href: "/dashboard/campaigns" },
          { label: "Drip Campaigns" }
        ]}
      />

      {/* Coming Soon Hero */}
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center space-y-8">
        {/* Icon */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full blur-3xl opacity-20 animate-pulse"></div>
          <div className="relative h-24 w-24 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/50">
            <Workflow className="h-12 w-12 text-white" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent">
            Drip Campaigns
          </h1>
          <p className="text-xl text-slate-300">
            Coming Soon
          </p>
          <p className="text-slate-400 text-lg">
            Build sophisticated automated email sequences with conditional logic,
            smart triggers, and personalized timing. Perfect for nurturing leads at scale.
          </p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl pt-8">
          <FeatureCard
            icon={Mail}
            title="Email Sequences"
            description="Create multi-step email workflows with drag-and-drop builder"
            gradient="from-blue-500 to-cyan-500"
          />
          <FeatureCard
            icon={Clock}
            title="Smart Timing"
            description="Optimize send times based on recipient behavior and timezone"
            gradient="from-purple-500 to-pink-500"
          />
          <FeatureCard
            icon={Target}
            title="Triggers & Conditions"
            description="Launch campaigns based on actions, tags, or scoring thresholds"
            gradient="from-green-500 to-emerald-500"
          />
          <FeatureCard
            icon={Workflow}
            title="Visual Builder"
            description="Design complex workflows with branches, delays, and actions"
            gradient="from-orange-500 to-red-500"
          />
        </div>

        {/* CTA */}
        <div className="pt-8">
          <Link href="/dashboard/contacts">
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all gap-2 px-8 py-6 text-lg">
              Manage Contacts Instead
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  gradient,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all group">
      <CardContent className="p-6 space-y-4">
        <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-white">{title}</h3>
          <p className="text-sm text-slate-400">{description}</p>
        </div>
      </CardContent>
    </Card>
  );
}
