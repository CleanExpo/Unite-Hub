'use client';

import { useState } from 'react';
import { Gauge, Globe, TrendingUp, TrendingDown, Minus, AlertTriangle } from 'lucide-react';

interface RegionMetric {
  region: string;
  latency: number;
  errorRate: number;
  throughput: number;
  trend: 'improving' | 'stable' | 'degrading';
  status: 'healthy' | 'warning' | 'critical';
}

export default function GSLPIEPage() {
  const [regions] = useState<RegionMetric[]>([
    { region: 'US', latency: 45, errorRate: 0.01, throughput: 1200, trend: 'stable', status: 'healthy' },
    { region: 'EU', latency: 78, errorRate: 0.02, throughput: 890, trend: 'improving', status: 'healthy' },
    { region: 'APAC', latency: 120, errorRate: 0.03, throughput: 450, trend: 'degrading', status: 'warning' },
    { region: 'AU', latency: 95, errorRate: 0.01, throughput: 320, trend: 'stable', status: 'healthy' },
    { region: 'CA', latency: 52, errorRate: 0.01, throughput: 280, trend: 'improving', status: 'healthy' },
  ]);

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === 'improving') {
return <TrendingUp className="text-success-400" size={16} />;
}
    if (trend === 'degrading') {
return <TrendingDown className="text-error-400" size={16} />;
}
    return <Minus className="text-text-muted" size={16} />;
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Gauge className="text-info-400" size={28} />
          <h1 className="text-3xl font-bold">GSLPIE</h1>
        </div>
        <p className="text-text-muted">Global SLA, Latency & Performance Intelligence Engine</p>
      </div>

      {/* Global Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Avg Latency</div>
          <div className="text-3xl font-bold">78ms</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">P95 Latency</div>
          <div className="text-3xl font-bold">145ms</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Error Rate</div>
          <div className="text-3xl font-bold">0.02%</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Total Throughput</div>
          <div className="text-3xl font-bold">3,140/s</div>
        </div>
      </div>

      {/* Region Table */}
      <div className="bg-bg-raised rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Globe size={20} />
            Regional Performance
          </h2>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left text-sm text-text-muted">
              <th className="p-4">Region</th>
              <th className="p-4">Latency</th>
              <th className="p-4">Error Rate</th>
              <th className="p-4">Throughput</th>
              <th className="p-4">Trend</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((region) => (
              <tr key={region.region} className="border-b border-border-subtle/50 hover:bg-bg-hover">
                <td className="p-4 font-medium">{region.region}</td>
                <td className="p-4">{region.latency}ms</td>
                <td className="p-4">{(region.errorRate * 100).toFixed(2)}%</td>
                <td className="p-4">{region.throughput}/s</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={region.trend} />
                    <span className="capitalize text-sm">{region.trend}</span>
                  </div>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    region.status === 'healthy' ? 'bg-success-900 text-success-400' :
                    region.status === 'warning' ? 'bg-warning-900 text-warning-400' :
                    'bg-error-900 text-error-400'
                  }`}>
                    {region.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* SLA Alerts */}
      <div className="mt-8 bg-warning-900/30 border border-warning-700 rounded-lg p-4">
        <div className="flex items-center gap-2 text-warning-400 mb-2">
          <AlertTriangle size={20} />
          <span className="font-semibold">SLA Warning</span>
        </div>
        <p className="text-sm text-text-secondary">
          APAC region latency is degrading. Current: 120ms, Threshold: 100ms.
          Consider routing traffic to alternative regions.
        </p>
      </div>
    </div>
  );
}
