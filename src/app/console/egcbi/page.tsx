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
        <p className="text-gray-400">Enterprise Governance, Compliance & Board Intelligence</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Active Policies</div>
          <div className="text-3xl font-bold">18</div>
        </div>
        <div className="bg-green-900/50 rounded-lg p-4">
          <div className="text-sm text-green-400">Compliance Score</div>
          <div className="text-3xl font-bold text-green-400">94%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Board Reports</div>
          <div className="text-3xl font-bold">12</div>
        </div>
        <div className="bg-yellow-900/50 rounded-lg p-4">
          <div className="text-sm text-yellow-400">Pending Audits</div>
          <div className="text-3xl font-bold text-yellow-400">3</div>
        </div>
      </div>

      {/* Policies */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Governance Policies</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="p-4">Policy Name</th>
              <th className="p-4">Type</th>
              <th className="p-4">Status</th>
              <th className="p-4">Compliance</th>
            </tr>
          </thead>
          <tbody>
            {policies.map((policy) => (
              <tr key={policy.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                <td className="p-4 font-medium">{policy.name}</td>
                <td className="p-4 text-gray-400 capitalize">{policy.type}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs ${
                    policy.status === 'active' ? 'bg-green-900 text-green-400' : 'bg-gray-700 text-gray-400'
                  }`}>
                    {policy.status}
                  </span>
                </td>
                <td className="p-4">
                  {policy.compliance > 0 ? (
                    <span className={policy.compliance >= 90 ? 'text-green-400' : 'text-yellow-400'}>
                      {policy.compliance}%
                    </span>
                  ) : (
                    <span className="text-gray-500">N/A</span>
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
