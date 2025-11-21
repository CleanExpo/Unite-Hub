'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Brain, AlertTriangle, Activity, Wrench, Target,
  Building2, Globe, MapPin, Gauge, Scale, CreditCard, FileCheck,
  CheckCircle, AlertCircle, Clock
} from 'lucide-react';

interface EngineStatus {
  name: string;
  status: 'healthy' | 'warning' | 'error';
  lastCheck: string;
  metrics: {
    operations: number;
    errors: number;
    latency: number;
  };
}

const engineIcons: Record<string, any> = {
  ASRS: Shield, MCSE: Brain, UPEWE: AlertTriangle, AIRE: Wrench,
  SORIE: Target, EGCBI: Building2, GRH: Globe, RAAOE: MapPin,
  GSLPIE: Gauge, AGLBASE: Scale, TCPQEL: CreditCard, UCSCEL: FileCheck
};

export default function ConsolePage() {
  const [engines, setEngines] = useState<EngineStatus[]>([
    { name: 'ASRS', status: 'healthy', lastCheck: 'Just now', metrics: { operations: 1250, errors: 2, latency: 45 } },
    { name: 'MCSE', status: 'healthy', lastCheck: '1m ago', metrics: { operations: 890, errors: 0, latency: 120 } },
    { name: 'UPEWE', status: 'warning', lastCheck: '2m ago', metrics: { operations: 450, errors: 5, latency: 200 } },
    { name: 'AIRE', status: 'healthy', lastCheck: 'Just now', metrics: { operations: 23, errors: 0, latency: 80 } },
    { name: 'SORIE', status: 'healthy', lastCheck: '5m ago', metrics: { operations: 156, errors: 0, latency: 150 } },
    { name: 'EGCBI', status: 'healthy', lastCheck: '3m ago', metrics: { operations: 78, errors: 1, latency: 90 } },
    { name: 'GRH', status: 'healthy', lastCheck: '1m ago', metrics: { operations: 340, errors: 0, latency: 60 } },
    { name: 'RAAOE', status: 'healthy', lastCheck: 'Just now', metrics: { operations: 2100, errors: 3, latency: 35 } },
    { name: 'GSLPIE', status: 'healthy', lastCheck: '30s ago', metrics: { operations: 5600, errors: 8, latency: 25 } },
    { name: 'AGLBASE', status: 'healthy', lastCheck: '1m ago', metrics: { operations: 890, errors: 1, latency: 55 } },
    { name: 'TCPQEL', status: 'healthy', lastCheck: '2m ago', metrics: { operations: 450, errors: 0, latency: 40 } },
    { name: 'UCSCEL', status: 'healthy', lastCheck: '4m ago', metrics: { operations: 120, errors: 0, latency: 70 } },
  ]);

  const healthyCount = engines.filter(e => e.status === 'healthy').length;
  const warningCount = engines.filter(e => e.status === 'warning').length;
  const errorCount = engines.filter(e => e.status === 'error').length;

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">System Overview</h1>
        <p className="text-gray-400">Unite-Hub Engine Status Dashboard</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Total Engines</div>
          <div className="text-3xl font-bold">{engines.length}</div>
        </div>
        <div className="bg-green-900/50 rounded-lg p-4">
          <div className="text-sm text-green-400">Healthy</div>
          <div className="text-3xl font-bold text-green-400">{healthyCount}</div>
        </div>
        <div className="bg-yellow-900/50 rounded-lg p-4">
          <div className="text-sm text-yellow-400">Warning</div>
          <div className="text-3xl font-bold text-yellow-400">{warningCount}</div>
        </div>
        <div className="bg-red-900/50 rounded-lg p-4">
          <div className="text-sm text-red-400">Error</div>
          <div className="text-3xl font-bold text-red-400">{errorCount}</div>
        </div>
      </div>

      {/* Health Score */}
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">System Health Score</h2>
        <div className="flex items-center gap-4">
          <div className="text-5xl font-bold text-green-400">
            {Math.round((healthyCount / engines.length) * 100)}%
          </div>
          <div className="flex-1">
            <div className="h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${(healthyCount / engines.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Engine Grid */}
      <h2 className="text-xl font-semibold mb-4">Engine Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {engines.map((engine) => {
          const Icon = engineIcons[engine.name] || Activity;
          const StatusIcon = engine.status === 'healthy' ? CheckCircle :
                            engine.status === 'warning' ? AlertCircle : AlertCircle;
          const statusColor = engine.status === 'healthy' ? 'text-green-400' :
                             engine.status === 'warning' ? 'text-yellow-400' : 'text-red-400';

          return (
            <div key={engine.name} className="bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon size={20} className="text-blue-400" />
                  <span className="font-semibold">{engine.name}</span>
                </div>
                <StatusIcon size={18} className={statusColor} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm">
                <div>
                  <div className="text-gray-500">Ops</div>
                  <div className="font-medium">{engine.metrics.operations}</div>
                </div>
                <div>
                  <div className="text-gray-500">Errors</div>
                  <div className="font-medium">{engine.metrics.errors}</div>
                </div>
                <div>
                  <div className="text-gray-500">Latency</div>
                  <div className="font-medium">{engine.metrics.latency}ms</div>
                </div>
              </div>

              <div className="mt-3 text-xs text-gray-500 flex items-center gap-1">
                <Clock size={12} />
                {engine.lastCheck}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
