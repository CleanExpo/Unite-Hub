'use client';

/**
 * KPI Health Dashboard
 * Phase: D61
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, AlertTriangle, Plus, Activity } from 'lucide-react';

interface KPI {
  id: string;
  slug: string;
  name: string;
  description?: string;
  category: string;
  unit?: string;
  direction: string;
  is_active: boolean;
}

interface KPISnapshot {
  value?: number;
  delta?: number;
  period_start: string;
}

export default function KPIPage() {
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [snapshots, setSnapshots] = useState<Record<string, KPISnapshot[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/unite/kpi/definitions?limit=50');
      const data = await response.json();
      if (response.ok) {
        setKpis(data.kpis || []);
        data.kpis?.forEach((kpi: KPI) => fetchSnapshotsForKPI(kpi.id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSnapshotsForKPI = async (kpiId: string) => {
    try {
      const response = await fetch(`/api/unite/kpi/snapshots?kpi_id=${kpiId}&limit=10`);
      const data = await response.json();
      if (response.ok) {
        setSnapshots(prev => ({ ...prev, [kpiId]: data.snapshots || [] }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const getLatestValue = (kpiId: string) => {
    const snap = snapshots[kpiId]?.[0];
    return snap?.value?.toFixed(2) || 'N/A';
  };

  const getDelta = (kpiId: string) => {
    const snap = snapshots[kpiId]?.[0];
    return snap?.delta || 0;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      revenue: 'bg-green-500',
      engagement: 'bg-blue-500',
      conversion: 'bg-purple-500',
      retention: 'bg-orange-500',
      satisfaction: 'bg-pink-500',
    };
    return colors[category] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-bg-primary p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-text-primary mb-2">KPI Health Dashboard</h1>
            <p className="text-text-secondary">Monitor business metrics and health indicators</p>
          </div>
          <Button className="bg-accent-500 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Add KPI
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-text-secondary">Loading KPIs...</div>
        ) : kpis.length === 0 ? (
          <div className="text-center py-12 bg-bg-card rounded-lg border border-border-primary">
            <Activity className="w-16 h-16 mx-auto mb-4 text-text-tertiary" />
            <p className="text-text-secondary">No KPIs configured</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi) => {
              const delta = getDelta(kpi.id);
              const isPositive = delta >= 0;
              const isGood = kpi.direction === 'higher_is_better' ? isPositive : !isPositive;

              return (
                <div key={kpi.id} className="p-6 bg-bg-card rounded-lg border border-border-primary hover:border-accent-500 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getCategoryColor(kpi.category)}`} />
                      <h3 className="text-lg font-semibold text-text-primary">{kpi.name}</h3>
                    </div>
                    {!kpi.is_active && (
                      <span className="px-2 py-1 text-xs bg-gray-500/10 text-gray-400 rounded">Inactive</span>
                    )}
                  </div>

                  <div className="mb-4">
                    <div className="flex items-baseline gap-2">
                      <span className="text-4xl font-bold text-text-primary">{getLatestValue(kpi.id)}</span>
                      {kpi.unit && <span className="text-text-secondary">{kpi.unit}</span>}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 text-sm ${isGood ? 'text-green-400' : 'text-red-400'}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span>{delta > 0 ? '+' : ''}{delta.toFixed(2)}%</span>
                    </div>
                    <span className="text-xs text-text-tertiary">{kpi.category}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
