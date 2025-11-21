'use client';

import { useState } from 'react';
import { FileCheck, Shield, AlertTriangle, CheckCircle } from 'lucide-react';

export default function UCSCELPage() {
  const [contracts] = useState([
    { id: 1, tenant: 'tenant-1', type: 'Enterprise', sla: '99.9%', compliant: true, violations: 0 },
    { id: 2, tenant: 'tenant-2', type: 'Professional', sla: '99.5%', compliant: true, violations: 1 },
    { id: 3, tenant: 'tenant-3', type: 'Enterprise', sla: '99.9%', compliant: false, violations: 3 },
    { id: 4, tenant: 'tenant-4', type: 'Starter', sla: '99.0%', compliant: true, violations: 0 },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <FileCheck className="text-amber-400" size={28} />
          <h1 className="text-3xl font-bold">UCSCEL</h1>
        </div>
        <p className="text-gray-400">Unified Compliance, SLA & Contract Enforcement Layer</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Active Contracts</div>
          <div className="text-3xl font-bold">156</div>
        </div>
        <div className="bg-green-900/50 rounded-lg p-4">
          <div className="text-sm text-green-400">Compliant</div>
          <div className="text-3xl font-bold text-green-400">148</div>
        </div>
        <div className="bg-red-900/50 rounded-lg p-4">
          <div className="text-sm text-red-400">Violations</div>
          <div className="text-3xl font-bold text-red-400">12</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg SLA</div>
          <div className="text-3xl font-bold">99.7%</div>
        </div>
      </div>

      {/* Contracts */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Shield size={20} />
            Contract Compliance
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="p-4">Tenant</th>
              <th className="p-4">Contract Type</th>
              <th className="p-4">SLA Target</th>
              <th className="p-4">Status</th>
              <th className="p-4">Violations</th>
            </tr>
          </thead>
          <tbody>
            {contracts.map((c) => (
              <tr key={c.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                <td className="p-4 font-medium">{c.tenant}</td>
                <td className="p-4 text-gray-400">{c.type}</td>
                <td className="p-4">{c.sla}</td>
                <td className="p-4">
                  {c.compliant ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle size={16} /> Compliant
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle size={16} /> Non-compliant
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className={c.violations > 0 ? 'text-yellow-400' : 'text-gray-500'}>
                    {c.violations}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
