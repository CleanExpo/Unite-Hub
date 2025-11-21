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
      case 'completed': return 'bg-green-900 text-green-400';
      case 'running': return 'bg-blue-900 text-blue-400';
      case 'queued': return 'bg-yellow-900 text-yellow-400';
      default: return 'bg-gray-700 text-gray-400';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <MapPin className="text-rose-400" size={28} />
          <h1 className="text-3xl font-bold">RAAOE</h1>
        </div>
        <p className="text-gray-400">Region-Aware Autonomous Operations Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Active Regions</div>
          <div className="text-3xl font-bold">5</div>
        </div>
        <div className="bg-blue-900/50 rounded-lg p-4">
          <div className="text-sm text-blue-400">Running Ops</div>
          <div className="text-3xl font-bold text-blue-400">12</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Latency</div>
          <div className="text-3xl font-bold">67ms</div>
        </div>
        <div className="bg-green-900/50 rounded-lg p-4">
          <div className="text-sm text-green-400">Success Rate</div>
          <div className="text-3xl font-bold text-green-400">99.2%</div>
        </div>
      </div>

      {/* Operations */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Activity size={20} />
            Regional Operations
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="p-4">Region</th>
              <th className="p-4">Operation</th>
              <th className="p-4">Priority</th>
              <th className="p-4">Status</th>
              <th className="p-4">Latency</th>
            </tr>
          </thead>
          <tbody>
            {operations.map((op) => (
              <tr key={op.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                <td className="p-4 font-medium">{op.region}</td>
                <td className="p-4 text-gray-400">{op.operation.replace(/_/g, ' ')}</td>
                <td className="p-4">
                  <span className={`flex items-center gap-1 ${
                    op.priority === 'critical' ? 'text-red-400' :
                    op.priority === 'high' ? 'text-orange-400' :
                    op.priority === 'medium' ? 'text-yellow-400' : 'text-gray-400'
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
                    <span className="flex items-center gap-1 text-gray-400">
                      <Clock size={14} />
                      {op.latency}ms
                    </span>
                  ) : (
                    <span className="text-gray-500">-</span>
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
