/**
 * Founder Marketing Engine Dashboard
 * Unified hub for Social Playbooks, Decision Maps, and Visual Demos
 */

"use client";

import { useState, useEffect } from "react";
import { PageContainer, Section, ChatbotSafeZone } from "@/ui/layout/AppGrid";
import { SectionHeader } from "@/ui/components/SectionHeader";
import { Card, CardHeader, CardTitle, CardContent } from "@/ui/components/Card";
import {
  Megaphone,
  BookOpen,
  Map,
  Sparkles,
  TrendingUp,
  Users,
  Video,
  Loader2,
  ArrowRight,
  Plus,
} from "lucide-react";
import Link from "next/link";

interface MarketingStats {
  playbooks: { total: number; active: number; draft: number };
  decisionMaps: { total: number; byStage: Record<string, number> };
  visualDemos: { total: number; byCategory: Record<string, number> };
  socialAssets: { total: number; published: number; scheduled: number };
}

export default function MarketingDashboardPage() {
  const [stats, setStats] = useState<MarketingStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/founder/marketing/stats");
      if (res.ok) {
        setStats(await res.json());
      } else {
        // Mock data for development
        setStats({
          playbooks: { total: 3, active: 2, draft: 1 },
          decisionMaps: { total: 5, byStage: { awareness: 2, consideration: 2, conversion: 1 } },
          visualDemos: { total: 12, byCategory: { hero: 4, section: 3, card: 3, gallery: 2 } },
          socialAssets: { total: 24, published: 12, scheduled: 5 },
        });
      }
    } catch (err) {
      console.error("Failed to fetch marketing stats:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageContainer>
      <ChatbotSafeZone>
        <SectionHeader
          icon={Megaphone}
          title="Marketing Engine"
          description="Unified hub for social playbooks, decision moment maps, and visual demos"
        />

        {loading ? (
          <Section className="mt-6">
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-accent-600 animate-spin" />
            </div>
          </Section>
        ) : (
          <>
            {/* Quick Stats */}
            <Section className="mt-6">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  icon={BookOpen}
                  label="Social Playbooks"
                  value={stats?.playbooks.total || 0}
                  subtext={`${stats?.playbooks.active || 0} active`}
                  color="blue"
                />
                <StatCard
                  icon={Map}
                  label="Decision Maps"
                  value={stats?.decisionMaps.total || 0}
                  subtext="Funnel journeys"
                  color="purple"
                />
                <StatCard
                  icon={Sparkles}
                  label="Visual Demos"
                  value={stats?.visualDemos.total || 0}
                  subtext="Animation presets"
                  color="amber"
                />
                <StatCard
                  icon={Video}
                  label="Social Assets"
                  value={stats?.socialAssets.total || 0}
                  subtext={`${stats?.socialAssets.published || 0} published`}
                  color="green"
                />
              </div>
            </Section>

            {/* Main Modules */}
            <Section className="mt-8">
              <h2 className="text-sm font-medium text-text-tertiary mb-4">Marketing Modules</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <ModuleCard
                  href="/founder/marketing/playbooks"
                  icon={BookOpen}
                  title="Social Playbooks"
                  description="Create multi-platform content strategies with hooks, scripts, and thumbnails"
                  stats={[
                    { label: "Active", value: stats?.playbooks.active || 0 },
                    { label: "Draft", value: stats?.playbooks.draft || 0 },
                  ]}
                  color="blue"
                />
                <ModuleCard
                  href="/founder/marketing/decision-maps"
                  icon={Map}
                  title="Decision Moment Maps"
                  description="Map customer journey touchpoints with objection handling and proof assets"
                  stats={[
                    { label: "Awareness", value: stats?.decisionMaps.byStage?.awareness || 0 },
                    { label: "Conversion", value: stats?.decisionMaps.byStage?.conversion || 0 },
                  ]}
                  color="purple"
                />
                <ModuleCard
                  href="/founder/marketing/visual-demos"
                  icon={Sparkles}
                  title="Visual Demo Library"
                  description="Browse animation presets, hero styles, and visual inspiration for landing pages"
                  stats={[
                    { label: "Heroes", value: stats?.visualDemos.byCategory?.hero || 0 },
                    { label: "Sections", value: stats?.visualDemos.byCategory?.section || 0 },
                  ]}
                  color="amber"
                />
              </div>
            </Section>

            {/* Quick Actions */}
            <Section className="mt-8">
              <h2 className="text-sm font-medium text-text-tertiary mb-4">Quick Actions</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <QuickAction
                  href="/founder/marketing/playbooks?new=true"
                  icon={Plus}
                  label="New Playbook"
                />
                <QuickAction
                  href="/founder/marketing/decision-maps?new=true"
                  icon={Plus}
                  label="New Decision Map"
                />
                <QuickAction
                  href="/founder/visual-engine"
                  icon={Sparkles}
                  label="Animation Wizard"
                />
                <QuickAction
                  href="/founder/seo"
                  icon={TrendingUp}
                  label="SEO Intelligence"
                />
              </div>
            </Section>

            {/* Recent Activity */}
            <Section className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-text-tertiary">Recent Activity</h2>
              </div>
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <ActivityItem
                      icon={BookOpen}
                      title="New playbook created"
                      description="Q1 LinkedIn Campaign Strategy"
                      time="2 hours ago"
                    />
                    <ActivityItem
                      icon={Video}
                      title="Social asset published"
                      description="YouTube intro video script"
                      time="5 hours ago"
                    />
                    <ActivityItem
                      icon={Map}
                      title="Decision map updated"
                      description="Added conversion objections"
                      time="1 day ago"
                    />
                  </div>
                </CardContent>
              </Card>
            </Section>

            {/* Info Notice */}
            <Section className="mt-8">
              <div className="p-4 bg-accent-50 dark:bg-accent-900/20 rounded-lg border border-accent-200 dark:border-accent-800">
                <p className="text-sm text-accent-700 dark:text-accent-300">
                  <strong>Synthex Marketing Engine:</strong> This unified hub connects social playbooks,
                  decision moment mapping, and visual experience design for cohesive multi-channel campaigns.
                </p>
              </div>
            </Section>
          </>
        )}
      </ChatbotSafeZone>
    </PageContainer>
  );
}

interface StatCardProps {
  icon: typeof Megaphone;
  label: string;
  value: number;
  subtext: string;
  color: "blue" | "purple" | "amber" | "green";
}

function StatCard({ icon: Icon, label, value, subtext, color }: StatCardProps) {
  const colors = {
    blue: "text-info-600 bg-info-100 dark:bg-info-900/30",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    amber: "text-warning-600 bg-warning-100 dark:bg-warning-900/30",
    green: "text-success-600 bg-success-100 dark:bg-success-900/30",
  };

  return (
    <Card>
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors[color]}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm text-text-tertiary">{label}</p>
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-muted">{subtext}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ModuleCardProps {
  href: string;
  icon: typeof Megaphone;
  title: string;
  description: string;
  stats: { label: string; value: number }[];
  color: "blue" | "purple" | "amber";
}

function ModuleCard({ href, icon: Icon, title, description, stats, color }: ModuleCardProps) {
  const colors = {
    blue: "text-info-600 bg-info-100 dark:bg-info-900/30",
    purple: "text-purple-600 bg-purple-100 dark:bg-purple-900/30",
    amber: "text-warning-600 bg-warning-100 dark:bg-warning-900/30",
  };

  const borderColors = {
    blue: "hover:border-info-500",
    purple: "hover:border-purple-500",
    amber: "hover:border-warning-500",
  };

  return (
    <Link href={href}>
      <Card className={`h-full transition-colors border-2 border-transparent ${borderColors[color]}`}>
        <CardContent className="pt-6">
          <div className={`w-12 h-12 rounded-lg ${colors[color]} flex items-center justify-center mb-4`}>
            <Icon className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
          <p className="text-sm text-text-secondary mb-4">{description}</p>
          <div className="flex gap-4">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="text-lg font-bold text-text-primary">{stat.value}</p>
                <p className="text-xs text-text-muted">{stat.label}</p>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center text-sm text-accent-600 font-medium">
            Open Module <ArrowRight className="w-4 h-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

interface QuickActionProps {
  href: string;
  icon: typeof Plus;
  label: string;
}

function QuickAction({ href, icon: Icon, label }: QuickActionProps) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-3 bg-bg-card border border-border-subtle rounded-lg hover:border-accent-500 transition-colors"
    >
      <div className="p-2 rounded-lg bg-accent-100 dark:bg-accent-900/30 text-accent-600">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-sm font-medium text-text-secondary">{label}</span>
    </Link>
  );
}

interface ActivityItemProps {
  icon: typeof Megaphone;
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ icon: Icon, title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3 py-2 border-b border-border-subtle last:border-0">
      <div className="p-1.5 rounded bg-bg-hover text-text-tertiary">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-text-primary">{title}</p>
        <p className="text-xs text-text-tertiary truncate">{description}</p>
      </div>
      <span className="text-xs text-text-muted whitespace-nowrap">{time}</span>
    </div>
  );
}
