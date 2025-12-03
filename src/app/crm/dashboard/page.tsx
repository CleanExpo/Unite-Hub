'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  TrendingUp,
  Mail,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useStaffCheck } from '@/hooks/useStaffCheck';
import { createClient } from '@/lib/supabase/client';

interface DashboardStats {
  totalClients: number;
  activeClients: number;
  totalCampaigns: number;
  pendingStaff: number;
}

export default function CRMDashboardPage() {
  const { isOwner, staffUser } = useStaffCheck();
  const [stats, setStats] = useState<DashboardStats>({
    totalClients: 0,
    activeClients: 0,
    totalCampaigns: 0,
    pendingStaff: 0,
  });
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch client count
        const { count: clientCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true });

        // Fetch active client count
        const { count: activeCount } = await supabase
          .from('clients')
          .select('*', { count: 'exact', head: true })
          .eq('onboarding_complete', true);

        // Fetch pending staff count (owner only)
        let pendingCount = 0;
        if (isOwner) {
          const { count } = await supabase
            .from('staff_users')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'pending');
          pendingCount = count || 0;
        }

        setStats({
          totalClients: clientCount || 0,
          activeClients: activeCount || 0,
          totalCampaigns: 0,
          pendingStaff: pendingCount,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [isOwner, supabase]);

  const statCards = [
    {
      title: 'Total Clients',
      value: stats.totalClients,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/crm/clients',
    },
    {
      title: 'Active Clients',
      value: stats.activeClients,
      icon: TrendingUp,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      href: '/crm/clients?filter=active',
    },
    {
      title: 'Campaigns',
      value: stats.totalCampaigns,
      icon: Mail,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/crm/campaigns',
    },
  ];

  // Add pending staff card for owner
  if (isOwner) {
    statCards.push({
      title: 'Pending Approvals',
      value: stats.pendingStaff,
      icon: Users,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      href: '/crm/staff',
    });
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Welcome back, {staffUser?.email?.split('@')[0]}
          </p>
        </div>
        <div className="flex gap-3">
          <Link href="/crm/clients/new">
            <Button className="bg-accent-500 hover:bg-accent-600">
              <Plus className="w-4 h-4 mr-2" />
              Add Client
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="bg-bg-card border-border-subtle hover:border-accent-500/30 transition-colors p-6">
              <div className="flex items-start justify-between">
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <ArrowUpRight className="w-4 h-4 text-text-tertiary" />
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-text-primary">
                  {loading ? '...' : stat.value}
                </p>
                <p className="text-sm text-text-secondary mt-1">{stat.title}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="bg-bg-card border-border-subtle p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Recent Activity
          </h2>
          <div className="space-y-4">
            <p className="text-text-secondary text-sm">
              No recent activity to display.
            </p>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-bg-card border-border-subtle p-6">
          <h2 className="text-lg font-semibold text-text-primary mb-4">
            Quick Actions
          </h2>
          <div className="space-y-3">
            <Link href="/crm/clients/new">
              <Button variant="outline" className="w-full justify-start">
                <Users className="w-4 h-4 mr-2" />
                Add New Client
              </Button>
            </Link>
            <Link href="/crm/campaigns/new">
              <Button variant="outline" className="w-full justify-start">
                <Mail className="w-4 h-4 mr-2" />
                Create Campaign
              </Button>
            </Link>
            {isOwner && (
              <Link href="/crm/staff">
                <Button variant="outline" className="w-full justify-start">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Staff
                  {stats.pendingStaff > 0 && (
                    <span className="ml-auto bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {stats.pendingStaff}
                    </span>
                  )}
                </Button>
              </Link>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
