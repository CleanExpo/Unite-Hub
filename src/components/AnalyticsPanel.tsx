"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function AnalyticsPanel() {
  // Mock data - in production, fetch from Convex
  const campaigns = [
    {
      id: 1,
      name: "Q4 Holiday Campaign",
      sent: 245,
      opened: 58,
      clicked: 12,
      replied: 5,
      converted: 2,
      status: "active",
    },
    {
      id: 2,
      name: "Welcome Series",
      sent: 189,
      opened: 45,
      clicked: 8,
      replied: 3,
      converted: 1,
      status: "completed",
    },
    {
      id: 3,
      name: "Nurture Sequence",
      sent: 312,
      opened: 74,
      clicked: 15,
      replied: 7,
      converted: 3,
      status: "active",
    },
  ];

  const calculateRate = (numerator: number, denominator: number) => {
    return ((numerator / denominator) * 100).toFixed(1);
  };

  const totals = campaigns.reduce(
    (acc, camp) => ({
      sent: acc.sent + camp.sent,
      opened: acc.opened + camp.opened,
      clicked: acc.clicked + camp.clicked,
      replied: acc.replied + camp.replied,
      converted: acc.converted + camp.converted,
    }),
    { sent: 0, opened: 0, clicked: 0, replied: 0, converted: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Top Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <MetricCard
          title="Total Sent"
          value={totals.sent}
          icon="📧"
          color="bg-blue-600"
        />
        <MetricCard
          title="Opened"
          value={`${calculateRate(totals.opened, totals.sent)}%`}
          icon="👁️"
          color="bg-green-600"
        />
        <MetricCard
          title="Clicked"
          value={`${calculateRate(totals.clicked, totals.sent)}%`}
          icon="🔗"
          color="bg-purple-600"
        />
        <MetricCard
          title="Replied"
          value={`${calculateRate(totals.replied, totals.sent)}%`}
          icon="💬"
          color="bg-orange-600"
        />
        <MetricCard
          title="Converted"
          value={`${calculateRate(totals.converted, totals.sent)}%`}
          icon="🎯"
          color="bg-pink-600"
        />
      </div>

      {/* Campaign Breakdown */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">📊 Campaign Performance</CardTitle>
          <CardDescription>Detailed metrics by campaign</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <div key={campaign.id} className="bg-slate-700 rounded p-4 border border-slate-600">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-white">{campaign.name}</h4>
                    <p className="text-xs text-slate-400">
                      Sent {campaign.sent} emails
                    </p>
                  </div>
                  <Badge
                    className={
                      campaign.status === "active"
                        ? "bg-green-600"
                        : "bg-slate-600"
                    }
                  >
                    {campaign.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-5 gap-2 text-xs">
                  <div>
                    <div className="text-slate-400 mb-1">Open Rate</div>
                    <div className="font-bold text-white">
                      {calculateRate(campaign.opened, campaign.sent)}%
                    </div>
                    <Progress
                      value={parseFloat(calculateRate(campaign.opened, campaign.sent))}
                      className="mt-1 h-1"
                    />
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Click Rate</div>
                    <div className="font-bold text-white">
                      {calculateRate(campaign.clicked, campaign.sent)}%
                    </div>
                    <Progress
                      value={parseFloat(calculateRate(campaign.clicked, campaign.sent))}
                      className="mt-1 h-1"
                    />
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Reply Rate</div>
                    <div className="font-bold text-white">
                      {calculateRate(campaign.replied, campaign.sent)}%
                    </div>
                    <Progress
                      value={parseFloat(calculateRate(campaign.replied, campaign.sent))}
                      className="mt-1 h-1"
                    />
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Conversions</div>
                    <div className="font-bold text-white">
                      {campaign.converted}
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400 mb-1">Conv. Rate</div>
                    <div className="font-bold text-white">
                      {calculateRate(campaign.converted, campaign.sent)}%
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">💡 Recommendations</CardTitle>
          <CardDescription>AI-powered insights</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="bg-blue-600/10 border border-blue-600/30 rounded p-3">
              <p className="text-sm text-blue-300 font-semibold mb-1">
                ✓ Subject Line Performance
              </p>
              <p className="text-xs text-slate-400">
                "Quick question" subjects show 32% higher open rates. Consider A/B testing this approach.
              </p>
            </div>
            <div className="bg-green-600/10 border border-green-600/30 rounded p-3">
              <p className="text-sm text-green-300 font-semibold mb-1">
                ✓ Send Time Optimization
              </p>
              <p className="text-xs text-slate-400">
                Tuesday 10am sends show 28% better engagement. Schedule high-priority campaigns then.
              </p>
            </div>
            <div className="bg-purple-600/10 border border-purple-600/30 rounded p-3">
              <p className="text-sm text-purple-300 font-semibold mb-1">
                ✓ Segment Strategy
              </p>
              <p className="text-xs text-slate-400">
                Tech decision-makers respond 45% better to technical benefits. Personalize by industry.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MetricCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: string;
  color: string;
}) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <div className="space-y-2">
          <div className="flex justify-between items-start">
            <p className="text-slate-400 text-xs">{title}</p>
            <span className="text-2xl">{icon}</span>
          </div>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
