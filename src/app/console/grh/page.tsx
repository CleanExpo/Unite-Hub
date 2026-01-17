'use client';

import { useState } from 'react';
import { Globe, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

export default function GRHPage() {
  const [regions] = useState([
    { region: 'US', regulations: 12, harmonised: true, score: 98 },
    { region: 'EU', regulations: 18, harmonised: true, score: 95 },
    { region: 'UK', regulations: 15, harmonised: true, score: 92 },
    { region: 'APAC', regulations: 8, harmonised: false, score: 78 },
    { region: 'AU', regulations: 10, harmonised: true, score: 88 },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe className="text-cyan-400" size={28} />
          <h1 className="text-3xl font-bold">GRH</h1>
        </div>
        <p className="text-text-muted">Global Regulatory Harmonisation & Region-Aware Policy Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Active Regions</div>
          <div className="text-3xl font-bold">7</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Total Regulations</div>
          <div className="text-3xl font-bold">63</div>
        </div>
        <div className="bg-success-900/50 rounded-lg p-4">
          <div className="text-sm text-success-400">Harmonised</div>
          <div className="text-3xl font-bold text-success-400">6</div>
        </div>
        <div className="bg-bg-raised rounded-lg p-4">
          <div className="text-sm text-text-muted">Avg Compliance</div>
          <div className="text-3xl font-bold">90%</div>
        </div>
      </div>

      {/* Regional Status */}
      <div className="bg-bg-raised rounded-lg overflow-hidden">
        <div className="p-4 border-b border-border-subtle">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <MapPin size={20} />
            Regional Compliance Status
          </h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border-subtle text-left text-sm text-text-muted">
              <th className="p-4">Region</th>
              <th className="p-4">Regulations</th>
              <th className="p-4">Harmonised</th>
              <th className="p-4">Score</th>
            </tr>
          </thead>
          <tbody>
            {regions.map((r) => (
              <tr key={r.region} className="border-b border-border-subtle/50 hover:bg-bg-hover">
                <td className="p-4 font-medium">{r.region}</td>
                <td className="p-4">{r.regulations}</td>
                <td className="p-4">
                  {r.harmonised ? (
                    <span className="flex items-center gap-1 text-success-400">
                      <CheckCircle size={16} /> Yes
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-warning-400">
                      <AlertTriangle size={16} /> Pending
                    </span>
                  )}
                </td>
                <td className="p-4">
                  <span className={r.score >= 90 ? 'text-success-400' : r.score >= 80 ? 'text-warning-400' : 'text-error-400'}>
                    {r.score}%
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
