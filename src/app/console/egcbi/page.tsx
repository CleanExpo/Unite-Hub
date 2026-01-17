'use client';

import { useState } from 'react';
import { Building2, FileCheck, AlertTriangle, CheckCircle } from 'lucide-react';

export default function EGCBIPage() {
  const [policies] = useState([
    { id: 1, name: 'Data Retention Policy', type: 'data', status: 'active', compliance: 95 },
    { id: 2, name: 'Access Control Policy', type: 'security', status: 'active', compliance: 88 },
    { id: 3, name: 'Financial Reporting', type: 'finance', status: 'draft', compliance: 0 },
    { id: 4, name: 'Privacy Policy', type: 'privacy', status: 'active', compliance: 100 },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="text-indigo-400" size={28} />
          <h1 className="text-3xl font-bold">EGCBI</h1>
        </div>
        <p className="text-text-muted">Enterprise Governance, Compliance & Board Intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Active Policies</div>
          <div className="text-3xl font-bold">18</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">Compliance Score</div>
          <div className="text-3xl font-bold text-success-400">94%</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Board Reports</div>
          <div className="text-3xl font-bold">12</div>
        </div>
        <div className="bg-warning-900/50 rounded-lg p-4">
          <div className="text-sm text-warning-400">Pending Audits</div>
          <div className="text-3xl font-bold text-warning-400">3</div>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-bg-raised rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-semibold">Governance Policies</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left text-sm text-text-muted">
              <th className="p-4">Policy Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="border-b border-border-subtle/50 hover:bg-bg-hover">
                <td className="p-4 font-medium">{policy.name}</td>
                <td className="p-4 text-text-muted capitalize">{policy.type}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    policy.status === 'active' ? 'bg-success-900 text-success-400' : 'bg-bg-elevated text-text-muted'
                  }`}>
                    {policy.status}
                  </span>
                </td>
                <td className="p-4">
                  {policy.compliance > 0 ? (
                    <span className={policy.compliance >= 90 ? 'text-success-400' : 'text-warning-400'}>
                      {policy.compliance}%
                    </span>
                  ) : (
                    <span className="text-text-tertiary">N/A</span>
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
