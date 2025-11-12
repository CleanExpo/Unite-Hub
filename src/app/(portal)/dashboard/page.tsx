"use client";

import React from "react";
import {
  Mail,
  FileText,
  Users,
  Megaphone,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function DashboardPage() {
  // TODO: Replace with actual Convex data
  const stats = {
    emailsReceived: 42,
    assetsUploaded: 8,
    activeCampaigns: 3,
    personasGenerated: 2,
  };

  const recentActivity = [
    {
      id: 1,
      type: "email",
      message: "New email received from john@example.com",
      timestamp: "2 hours ago",
      status: "new",
    },
    {
      id: 2,
      type: "campaign",
      message: "Summer Campaign published on Instagram",
      timestamp: "5 hours ago",
      status: "success",
    },
    {
      id: 3,
      type: "persona",
      message: "Customer Persona v2 generated",
      timestamp: "1 day ago",
      status: "success",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h1 className="text-3xl font-bold mb-2">Welcome back!</h1>
        <p className="text-lg opacity-90">
          Here's what's happening with your marketing automation
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Mail}
          label="Emails Analyzed"
          value={stats.emailsReceived}
          color="blue"
          href="/portal/emails"
        />
        <StatCard
          icon={FileText}
          label="Assets Uploaded"
          value={stats.assetsUploaded}
          color="purple"
          href="/portal/assets"
        />
        <StatCard
          icon={Megaphone}
          label="Active Campaigns"
          value={stats.activeCampaigns}
          color="green"
          href="/portal/campaigns"
        />
        <StatCard
          icon={Users}
          label="Personas Created"
          value={stats.personasGenerated}
          color="orange"
          href="/portal/persona"
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickActionButton
            href="/portal/emails"
            label="View Emails"
            icon={Mail}
          />
          <QuickActionButton
            href="/portal/assets"
            label="Upload Assets"
            icon={FileText}
          />
          <QuickActionButton
            href="/portal/campaigns"
            label="Create Campaign"
            icon={Megaphone}
          />
          <QuickActionButton
            href="/portal/strategy"
            label="View Strategy"
            icon={TrendingUp}
          />
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div
                className={`p-2 rounded-lg ${
                  activity.status === "new"
                    ? "bg-blue-100"
                    : activity.status === "success"
                    ? "bg-green-100"
                    : "bg-orange-100"
                }`}
              >
                {activity.status === "new" ? (
                  <AlertCircle className="h-5 w-5 text-blue-700" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-green-700" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-gray-900">{activity.message}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  <span className="text-sm text-gray-600">{activity.timestamp}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">AI Automation Status</h3>
          <div className="space-y-3">
            <StatusItem label="Email Monitoring" status="active" />
            <StatusItem label="Auto-Reply Generation" status="active" />
            <StatusItem label="Persona Analysis" status="active" />
            <StatusItem label="Mind Map Expansion" status="active" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Next Steps</h3>
          <ul className="space-y-2">
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-600 font-bold mt-1">1.</span>
              <span>Upload your brand assets and business materials</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-600 font-bold mt-1">2.</span>
              <span>Review and refine your customer persona</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-600 font-bold mt-1">3.</span>
              <span>Explore your AI-generated marketing strategy</span>
            </li>
            <li className="flex items-start gap-2 text-gray-700">
              <span className="text-blue-600 font-bold mt-1">4.</span>
              <span>Launch your first social media campaign</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  color,
  href,
}: {
  icon: any;
  label: string;
  value: number;
  color: string;
  href: string;
}) {
  const colorMap: Record<string, string> = {
    blue: "from-blue-600 to-blue-700",
    purple: "from-purple-600 to-purple-700",
    green: "from-green-600 to-green-700",
    orange: "from-orange-600 to-orange-700",
  };

  return (
    <Link href={href}>
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all cursor-pointer">
        <div
          className={`p-3 rounded-lg bg-gradient-to-br ${colorMap[color]} inline-flex mb-3`}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>
        <p className="text-3xl font-bold text-gray-900 mb-1">{value}</p>
        <p className="text-sm text-gray-600">{label}</p>
      </div>
    </Link>
  );
}

function QuickActionButton({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: any;
}) {
  return (
    <Link href={href}>
      <Button variant="outline" className="w-full justify-start gap-3 h-auto py-4">
        <Icon className="h-5 w-5" />
        <span>{label}</span>
      </Button>
    </Link>
  );
}

function StatusItem({ label, status }: { label: string; status: "active" | "inactive" }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{label}</span>
      <Badge
        variant={status === "active" ? "default" : "secondary"}
        className={
          status === "active"
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-700"
        }
      >
        {status === "active" ? "Active" : "Inactive"}
      </Badge>
    </div>
  );
}
