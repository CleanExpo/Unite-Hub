"use client";

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
          <div className="relative h-24 w-24 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 flex items-center justify-center">
            <Workflow className="h-12 w-12 text-[#00F5FF]" />
          </div>
        </div>

        {/* Title */}
        <div className="space-y-4 max-w-2xl">
          <h1 className="text-5xl font-bold font-mono text-white/90">
            Drip Campaigns
          </h1>
          <p className="text-xl text-white/70">
            Coming Soon
          </p>
          <p className="text-white/50 text-lg">
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
            accentColor="text-[#00F5FF]"
            bgColor="bg-[#00F5FF]/10"
          />
          <FeatureCard
            icon={Clock}
            title="Smart Timing"
            description="Optimize send times based on recipient behavior and timezone"
            accentColor="text-[#FF00FF]"
            bgColor="bg-[#FF00FF]/10"
          />
          <FeatureCard
            icon={Target}
            title="Triggers & Conditions"
            description="Launch campaigns based on actions, tags, or scoring thresholds"
            accentColor="text-[#00FF88]"
            bgColor="bg-[#00FF88]/10"
          />
          <FeatureCard
            icon={Workflow}
            title="Visual Builder"
            description="Design complex workflows with branches, delays, and actions"
            accentColor="text-[#FFB800]"
            bgColor="bg-[#FFB800]/10"
          />
        </div>

        {/* CTA */}
        <div className="pt-8">
          <Link href="/dashboard/contacts">
            <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-8 py-4 flex items-center gap-2">
              Manage Contacts Instead
              <ArrowRight className="w-5 h-5" />
            </button>
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
  accentColor,
  bgColor,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  accentColor: string;
  bgColor: string;
}) {
  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 space-y-4">
      <div className={`h-12 w-12 rounded-sm ${bgColor} flex items-center justify-center`}>
        <Icon className={`h-6 w-6 ${accentColor}`} />
      </div>
      <div className="space-y-2">
        <h3 className="text-lg font-semibold font-mono text-white/90">{title}</h3>
        <p className="text-sm text-white/40">{description}</p>
      </div>
    </div>
  );
}
