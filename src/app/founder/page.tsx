/**
 * Founder OS Dashboard
 *
 * Main dashboard showing:
 * - Portfolio overview with all businesses
 * - Aggregate health score
 * - Recent signals feed
 * - Quick actions grid
 */

'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Building2,
  TrendingUp,
  AlertCircle,
  Plus,
  Sparkles,
  Activity,
  BarChart3,
  Brain
} from 'lucide-react';
import Link from 'next/link';
import { PageContainer, Section } from '@/ui/layout/AppGrid';
import { getFounderDashboardSummary } from '@/lib/founder/oversightService';

interface BusinessSummary {
  id: string;
  name: string;
  industry: string;
  healthScore: number;
  recentSignals: number;
  status: 'healthy' | 'attention' | 'critical';
}

export default function FounderOSDashboard() {
  const [loading, setLoading] = useState(true);
  const [businesses, setBusinesses] = useState<BusinessSummary[]>([]);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    async function loadData() {
      try {
        // TODO: Replace with actual API call
        // For now, use mock data
        const mockBusinesses: BusinessSummary[] = [
          {
            id: '1',
            name: 'Balustrade Co.',
            industry: 'Construction',
            healthScore: 87,
            recentSignals: 12,
            status: 'healthy',
          },
          {
            id: '2',
            name: 'Tech Startup',
            industry: 'SaaS',
            healthScore: 65,
            recentSignals: 8,
            status: 'attention',
          },
          {
            id: '3',
            name: 'E-commerce Store',
            industry: 'Retail',
            healthScore: 92,
            recentSignals: 5,
            status: 'healthy',
          },
        ];

        setBusinesses(mockBusinesses);

        // Load dashboard summary
        const workspaceId = 'default-workspace'; // TODO: Get from auth context
        const { data } = await getFounderDashboardSummary(workspaceId);
        setDashboardData(data);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const aggregateHealthScore = businesses.length > 0
    ? Math.round(businesses.reduce((sum, b) => sum + b.healthScore, 0) / businesses.length)
    : 0;

  const totalSignals = businesses.reduce((sum, b) => sum + b.recentSignals, 0);

  const getHealthColor = (score: number) => {
    if (score >= 80) {
return 'text-success-400';
}
    if (score >= 60) {
return 'text-warning-400';
}
    return 'text-error-400';
  };

  const getStatusBadge = (status: BusinessSummary['status']) => {
    const colors = {
      healthy: 'bg-success-500/20 text-success-400 border-success-500/30',
      attention: 'bg-warning-500/20 text-warning-400 border-warning-500/30',
      critical: 'bg-error-500/20 text-error-400 border-error-500/30',
    };
    const labels = {
      healthy: 'Healthy',
      attention: 'Needs Attention',
      critical: 'Critical',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-md border ${colors[status]}`}>
        {labels[status]}
      </span>
    );
  };

  if (loading) {
    return (
      <PageContainer>
        <Section>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-info-500" />
          </div>
        </Section>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      {/* Header */}
      <Section>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Founder OS</h1>
            <p className="text-text-muted mt-2">
              Manage your business portfolio and AI-powered insights
            </p>
          </div>
          <Link href="/founder/businesses/new">
            <Button className="bg-info-600 hover:bg-info-700">
              <Plus className="w-4 h-4 mr-2" />
              Add Business
            </Button>
          </Link>
        </div>
      </Section>

      {/* Key Metrics */}
      <Section>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-bg-raised/50 border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Total Businesses</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {businesses.length}
                </p>
              </div>
              <Building2 className="w-10 h-10 text-info-400" />
            </div>
          </Card>

          <Card className="bg-bg-raised/50 border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Avg Health Score</p>
                <p className={`text-3xl font-bold mt-1 ${getHealthColor(aggregateHealthScore)}`}>
                  {aggregateHealthScore}
                </p>
              </div>
              <Activity className="w-10 h-10 text-success-400" />
            </div>
          </Card>

          <Card className="bg-bg-raised/50 border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">Recent Signals</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {totalSignals}
                </p>
              </div>
              <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
          </Card>

          <Card className="bg-bg-raised/50 border-border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">AI Insights</p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {dashboardData?.usage.marketingOutputs || 0}
                </p>
              </div>
              <Brain className="w-10 h-10 text-warning-400" />
            </div>
          </Card>
        </div>
      </Section>

      {/* Business Cards */}
      <Section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Your Businesses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {businesses.map((business) => (
            <Link key={business.id} href={`/founder/businesses/${business.id}`}>
              <Card className="bg-bg-raised/50 border-border p-6 hover:bg-bg-raised/70 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">
                      {business.name}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">{business.industry}</p>
                  </div>
                  {getStatusBadge(business.status)}
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-text-muted">Health Score</span>
                      <span className={`text-sm font-semibold ${getHealthColor(business.healthScore)}`}>
                        {business.healthScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-bg-elevated rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          business.healthScore >= 80
                            ? 'bg-success-500'
                            : business.healthScore >= 60
                            ? 'bg-warning-500'
                            : 'bg-error-500'
                        }`}
                        style={{ width: `${business.healthScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-text-muted">Recent Signals</span>
                    <span className="text-text-primary font-medium">
                      {business.recentSignals}
                    </span>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </Section>

      {/* Quick Actions */}
      <Section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/founder/ai-phill">
            <Card className="bg-gradient-to-br from-info-600/20 to-purple-600/20 border-info-500/30 p-6 hover:from-info-600/30 hover:to-purple-600/30 transition-all cursor-pointer">
              <Sparkles className="w-8 h-8 text-info-400 mb-3" />
              <h3 className="text-lg font-semibold text-text-primary">AI Phill</h3>
              <p className="text-sm text-text-muted mt-1">
                Chat with your AI business advisor
              </p>
            </Card>
          </Link>

          <Link href="/founder/insights">
            <Card className="bg-gradient-to-br from-success-600/20 to-accent-600/20 border-success-500/30 p-6 hover:from-success-600/30 hover:to-accent-600/30 transition-all cursor-pointer">
              <BarChart3 className="w-8 h-8 text-success-400 mb-3" />
              <h3 className="text-lg font-semibold text-text-primary">Insights</h3>
              <p className="text-sm text-text-muted mt-1">
                View AI-generated business insights
              </p>
            </Card>
          </Link>

          <Link href="/founder/journal">
            <Card className="bg-gradient-to-br from-warning-600/20 to-accent-600/20 border-warning-500/30 p-6 hover:from-warning-600/30 hover:to-accent-600/30 transition-all cursor-pointer">
              <AlertCircle className="w-8 h-8 text-warning-400 mb-3" />
              <h3 className="text-lg font-semibold text-text-primary">Journal</h3>
              <p className="text-sm text-text-muted mt-1">
                Review your business journal entries
              </p>
            </Card>
          </Link>

          <Link href="/founder/businesses">
            <Card className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-purple-500/30 p-6 hover:from-purple-600/30 hover:to-pink-600/30 transition-all cursor-pointer">
              <Building2 className="w-8 h-8 text-purple-400 mb-3" />
              <h3 className="text-lg font-semibold text-text-primary">All Businesses</h3>
              <p className="text-sm text-text-muted mt-1">
                Manage your business portfolio
              </p>
            </Card>
          </Link>
        </div>
      </Section>

      {/* Recent Activity Feed */}
      <Section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">Recent Signals</h2>
        <Card className="bg-bg-raised/50 border-border">
          <div className="divide-y divide-border-subtle">
            {[
              { business: 'Balustrade Co.', signal: 'Positive customer review', time: '2 hours ago', type: 'positive' },
              { business: 'Tech Startup', signal: 'New competitor detected', time: '5 hours ago', type: 'warning' },
              { business: 'E-commerce Store', signal: 'Sales milestone reached', time: '1 day ago', type: 'positive' },
              { business: 'Balustrade Co.', signal: 'Website traffic spike', time: '2 days ago', type: 'positive' },
            ].map((item, idx) => (
              <div key={idx} className="p-4 hover:bg-bg-raised/30 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      item.type === 'positive' ? 'bg-success-400' : 'bg-warning-400'
                    }`} />
                    <div>
                      <p className="text-sm text-text-primary font-medium">{item.signal}</p>
                      <p className="text-xs text-text-muted mt-1">{item.business}</p>
                    </div>
                  </div>
                  <span className="text-xs text-text-tertiary">{item.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Section>
    </PageContainer>
  );
}
