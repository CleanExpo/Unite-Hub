'use client';

import { useState } from 'react';
import { Shield, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

export default function ASRSPage() {
  const [riskEvents] = useState([
    { id: 1, action: 'delete_data', risk_score: 85, blocked: true, tenant: 'tenant-1', timestamp: '2m ago' },
    { id: 2, action: 'export_all', risk_score: 72, blocked: true, tenant: 'tenant-2', timestamp: '5m ago' },
    { id: 3, action: 'update_config', risk_score: 35, blocked: false, tenant: 'tenant-1', timestamp: '8m ago' },
    { id: 4, action: 'bulk_modify', risk_score: 68, blocked: true, tenant: 'tenant-3', timestamp: '12m ago' },
    { id: 5, action: 'read_data', risk_score: 15, blocked: false, tenant: 'tenant-2', timestamp: '15m ago' },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="text-info-400" size={28} />
          <h1 className="text-3xl font-bold">ASRS</h1>
        </div>
        <p className="text-text-muted">Autonomous Safety & Risk Supervisor</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Total Evaluations</div>
          <div className="text-3xl font-bold">1,247</div>
        </div>
        <div className="bg-error-900/50 rounded-lg p-4">
          <div className="text-sm text-error-400">Blocked</div>
          <div className="text-3xl font-bold text-error-400">156</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">Allowed</div>
          <div className="text-3xl font-bold text-success-400">1,091</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Avg Risk Score</div>
          <div className="text-3xl font-bold">42</div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-bg-raised rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-semibold">Recent Risk Evaluations</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left text-sm text-text-muted">
              <th className="p-4">Action</th>
              <th className="p-4">Tenant</th>
              <th className="p-4">Risk Score</th>
              <th className="p-4">Decision</th>
              <th className="p-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {riskEvents.map((event) => (
              <tr key={event.id} className="border-b border-border-subtle/50 hover:bg-bg-hover">
                <td className="p-4 font-medium">{event.action}</td>
                <td className="p-4 text-text-muted">{event.tenant}</td>
                <td className="p-4">
                  <span className={`font-bold ${
                    event.risk_score >= 70 ? 'text-error-400' :
                    event.risk_score >= 40 ? 'text-warning-400' : 'text-success-400'
                  }`}>
                    {event.risk_score}
                  </span>
                </td>
                <td className="p-4">
                  {event.blocked ? (
                    <span className="flex items-center gap-1 text-error-400">
                      <XCircle size={16} /> Blocked
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-success-400">
                      <CheckCircle size={16} /> Allowed
                    </span>
                  )}
                </td>
                <td className="p-4 text-text-tertiary">{event.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
