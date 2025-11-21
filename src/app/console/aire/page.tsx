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
      case 'critical': return 'text-red-500';
      case 'high': return 'text-orange-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-blue-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <AlertCircle className="text-red-400" size={16} />;
      case 'resolving': return <Clock className="text-yellow-400" size={16} />;
      case 'resolved': return <CheckCircle className="text-green-400" size={16} />;
      default: return <XCircle className="text-gray-400" size={16} />;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Wrench className="text-orange-400" size={28} />
          <h1 className="text-3xl font-bold">AIRE</h1>
        </div>
        <p className="text-gray-400">Autonomous Incident Response & Remediation Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-red-900/50 rounded-lg p-4">
          <div className="text-sm text-red-400">Active Incidents</div>
          <div className="text-3xl font-bold text-red-400">3</div>
        </div>
        <div className="bg-yellow-900/50 rounded-lg p-4">
          <div className="text-sm text-yellow-400">Resolving</div>
          <div className="text-3xl font-bold text-yellow-400">5</div>
        </div>
        <div className="bg-green-900/50 rounded-lg p-4">
          <div className="text-sm text-green-400">Resolved (24h)</div>
          <div className="text-3xl font-bold text-green-400">28</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">MTTR</div>
          <div className="text-3xl font-bold">12m</div>
        </div>
      </div>

      {/* Incidents */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Recent Incidents</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="p-4">Type</th>
              <th className="p-4">Severity</th>
              <th className="p-4">Tenant</th>
              <th className="p-4">Status</th>
              <th className="p-4">Created</th>
            </tr>
          </thead>
          <tbody>
            {incidents.map((incident) => (
              <tr key={incident.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                <td className="p-4 font-medium">{incident.type.replace(/_/g, ' ')}</td>
                <td className={`p-4 capitalize ${getSeverityColor(incident.severity)}`}>{incident.severity}</td>
                <td className="p-4 text-gray-400">{incident.tenant}</td>
                <td className="p-4">
                  <span className="flex items-center gap-1 capitalize">
                    {getStatusIcon(incident.status)} {incident.status}
                  </span>
                </td>
                <td className="p-4 text-gray-500">{incident.created}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
