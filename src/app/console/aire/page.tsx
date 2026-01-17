'use client';

import { useState } from 'react';
import { Wrench, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';

export default function AIREPage() {
  const [incidents] = useState([
    { id: 1, type: 'service_outage', severity: 'critical', status: 'active', tenant: 'tenant-1', created: '5m ago' },
    { id: 2, type: 'performance_degradation', severity: 'high', status: 'resolving', tenant: 'tenant-2', created: '15m ago' },
    { id: 3, type: 'error_spike', severity: 'medium', status: 'resolved', tenant: 'tenant-1', created: '1h ago' },
    { id: 4, type: 'connection_failure', severity: 'high', status: 'resolved', tenant: 'tenant-3', created: '2h ago' },
  ]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-error-500';
      case 'high': return 'text-accent-400';
      case 'medium': return 'text-warning-400';
      default: return 'text-info-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="text-error-400" size={16} />;
      case 'resolving': return <Clock className="text-warning-400" size={16} />;
      case 'resolved': return <CheckCircle className="text-success-400" size={16} />;
      default: return <XCircle className="text-text-muted" size={16} />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="text-accent-400" size={28} />
          <h1 className="text-3xl font-bold">AIRE</h1>
        </div>
        <p className="text-text-muted">Autonomous Incident Response & Remediation Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-error-900/50 rounded-lg p-4">
          <div className="text-sm text-error-400">Active Incidents</div>
          <div className="text-3xl font-bold text-error-400">3</div>
        </div>
        <div className="bg-warning-900/50 rounded-lg p-4">
          <div className="text-sm text-warning-400">Resolving</div>
          <div className="text-3xl font-bold text-warning-400">5</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">Resolved (24h)</div>
          <div className="text-3xl font-bold text-success-400">28</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">MTTR</div>
          <div className="text-3xl font-bold">12m</div>
        </div>
      </div>

      {/* Incidents */}
      <div className="bg-bg-raised rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-semibold">Recent Incidents</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left text-sm text-text-muted">
              <th className="p-4">Type</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Tenant</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-b border-border-subtle/50 hover:bg-bg-hover">
                <td className="p-4 font-medium">{incident.type.replace(/_/g, ' ')}</td>
                <td className={`p-4 capitalize ${getSeverityColor(incident.severity)}`}>{incident.severity}</td>
                <td className="p-4 text-text-muted">{incident.tenant}</td>
                <td className="p-4">
                  <span className="flex items-center gap-1 capitalize">
                    {getStatusIcon(incident.status)} {incident.status}
                  </span>
                </td>
                <td className="p-4 text-text-tertiary">{incident.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
