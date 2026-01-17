'use client';

import { useState } from 'react';
import { Target, Flag, TrendingUp, Calendar } from 'lucide-react';

export default function SORIEPage() {
  const [objectives] = useState([
    { id: 1, title: 'Q1 Revenue Target', progress: 78, priority: 'critical', status: 'on_track', due: '2025-03-31' },
    { id: 2, title: 'Customer Retention 95%', progress: 92, priority: 'high', status: 'ahead', due: '2025-12-31' },
    { id: 3, title: 'Platform Expansion APAC', progress: 45, priority: 'high', status: 'at_risk', due: '2025-06-30' },
    { id: 4, title: 'Security Certification', progress: 100, priority: 'critical', status: 'completed', due: '2025-01-31' },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ahead': return 'bg-success-900 text-success-400';
      case 'on_track': return 'bg-info-900 text-info-400';
      case 'at_risk': return 'bg-warning-900 text-warning-400';
      case 'completed': return 'bg-purple-900 text-purple-400';
      default: return 'bg-bg-elevated text-text-muted';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="text-success-400" size={28} />
          <h1 className="text-3xl font-bold">SORIE</h1>
        </div>
        <p className="text-text-muted">Strategic Objective & Roadmap Intelligence Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Active Objectives</div>
          <div className="text-3xl font-bold">12</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">On Track</div>
          <div className="text-3xl font-bold text-success-400">8</div>
        </div>
        <div className="bg-warning-900/50 rounded-lg p-4">
          <div className="text-sm text-warning-400">At Risk</div>
          <div className="text-3xl font-bold text-warning-400">3</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Avg Progress</div>
          <div className="text-3xl font-bold">67%</div>
        </div>
      </div>

      {/* Objectives */}
      <div className="bg-bg-raised rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Strategic Objectives</h2>
        <div className="space-y-4">
          {objectives.map((obj) => (
            <div key={obj.id} className="border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Flag size={16} className={obj.priority === 'critical' ? 'text-error-400' : 'text-warning-400'} />
                  <span className="font-medium">{obj.title}</span>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(obj.status)}`}>
                  {obj.status.replace(/_/g, ' ')}
                </span>
              </div>
              <div className="mb-2">
                <div className="h-2 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full ${obj.progress >= 80 ? 'bg-green-500' : obj.progress >= 50 ? 'bg-blue-500' : 'bg-yellow-500'}`}
                    style={{ width: `${obj.progress}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>{obj.progress}% complete</span>
                <span className="flex items-center gap-1">
                  <Calendar size={14} />
                  {obj.due}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
