'use client';

import { useState } from 'react';
import { MapPin, Activity, Zap, Clock } from 'lucide-react';

export default function RAAOEPage() {
  const [operations] = useState([
    { id: 1, region: 'US', operation: 'data_sync', priority: 'high', status: 'completed', latency: 45 },
    { id: 2, region: 'EU', operation: 'backup', priority: 'medium', status: 'running', latency: 120 },
    { id: 3, region: 'APAC', operation: 'migration', priority: 'critical', status: 'queued', latency: 0 },
    { id: 4, region: 'AU', operation: 'cleanup', priority: 'low', status: 'completed', latency: 89 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success-900 text-success-400';
      case 'running': return 'bg-info-900 text-info-400';
      case 'queued': return 'bg-warning-900 text-warning-400';
      default: return 'bg-bg-elevated text-text-muted';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="text-rose-400" size={28} />
          <h1 className="text-3xl font-bold">RAAOE</h1>
        </div>
        <p className="text-text-muted">Region-Aware Autonomous Operations Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Active Regions</div>
          <div className="text-3xl font-bold">5</div>
        </div>
        <div className="bg-info-900/50 rounded-lg p-4">
          <div className="text-sm text-info-400">Running Ops</div>
          <div className="text-3xl font-bold text-info-400">12</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Avg Latency</div>
          <div className="text-3xl font-bold">67ms</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">Success Rate</div>
          <div className="text-3xl font-bold text-success-400">99.2%</div>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-bg-raised rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity size={20} />
            Regional Operations
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left text-sm text-text-muted">
              <th className="p-4">Region</th>
              <th className="p-4">Operation</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Latency</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id} className="border-b border-border-subtle/50 hover:bg-bg-hover">
                <td className="p-4 font-medium">{op.region}</td>
                <td className="p-4 text-text-muted">{op.operation.replace(/_/g, ' ')}</td>
                <td className="p-4">
                  <span className={`flex items-center gap-1 ${
                    op.priority === 'critical' ? 'text-error-400' :
                    op.priority === 'high' ? 'text-accent-400' :
                    op.priority === 'medium' ? 'text-warning-400' : 'text-text-muted'
                  }`}>
                    <Zap size={14} />
                    {op.priority}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${getStatusColor(op.status)}`}>
                    {op.status}
                  </span>
                </td>
                <td className="p-4">
                  {op.latency > 0 ? (
                    <span className="flex items-center gap-1 text-text-muted">
                      <Clock size={14} />
                      {op.latency}ms
                    </span>
                  ) : (
                    <span className="text-text-tertiary">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
