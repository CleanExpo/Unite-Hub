'use client';

import { useState } from 'react';
import { Scale, Server, TrendingUp, Zap } from 'lucide-react';

export default function AGLBASEPage() {
  const [pools] = useState([
    { name: 'orchestrator', region: 'US', capacity: 100, used: 72, health: 98 },
    { name: 'content-agent', region: 'US', capacity: 50, used: 35, health: 100 },
    { name: 'email-agent', region: 'EU', capacity: 30, used: 28, health: 85 },
    { name: 'analysis-agent', region: 'APAC', capacity: 40, used: 15, health: 100 },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Scale className="text-accent-400" size={28} />
          <h1 className="text-3xl font-bold">AGLBASE</h1>
        </div>
        <p className="text-text-muted">Autonomous Global Load Balancing & Agent Scaling Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Agent Pools</div>
          <div className="text-3xl font-bold">8</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Total Capacity</div>
          <div className="text-3xl font-bold">420</div>
        </div>
        <div className="bg-info-900/50 rounded-lg p-4">
          <div className="text-sm text-info-400">Utilization</div>
          <div className="text-3xl font-bold text-info-400">68%</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">Health Score</div>
          <div className="text-3xl font-bold text-success-400">96</div>
        </div>
      </div>

      {/* Agent Pools */}
      <div className="bg-bg-raised rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Server size={20} />
          Agent Pools
        </h2>
        <div className="space-y-4">
          {pools.map((pool) => (
            <div key={pool.name} className="border border-border-subtle rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <span className="font-medium">{pool.name}</span>
                  <span className="text-text-tertiary text-sm ml-2">({pool.region})</span>
                </div>
                <span className={`text-sm ${pool.health >= 95 ? 'text-success-400' : pool.health >= 80 ? 'text-warning-400' : 'text-error-400'}`}>
                  Health: {pool.health}%
                </span>
              </div>
              <div className="mb-2">
                <div className="h-3 bg-bg-elevated rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      (pool.used / pool.capacity) * 100 >= 90 ? 'bg-error-500' :
                      (pool.used / pool.capacity) * 100 >= 70 ? 'bg-warning-500' : 'bg-success-500'
                    }`}
                    style={{ width: `${(pool.used / pool.capacity) * 100}%` }}
                  />
                </div>
              </div>
              <div className="flex items-center justify-between text-sm text-text-muted">
                <span>{pool.used} / {pool.capacity} agents</span>
                <span>{((pool.used / pool.capacity) * 100).toFixed(0)}% used</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
