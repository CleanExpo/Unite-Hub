'use client';

import { useState } from 'react';
import { Brain, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

export default function MCSEPage() {
  const [validations] = useState([
    { id: 1, agent: 'content-agent', logic_score: 92, hallucination_score: 8, valid: true, timestamp: '1m ago' },
    { id: 2, agent: 'email-agent', logic_score: 85, hallucination_score: 12, valid: true, timestamp: '3m ago' },
    { id: 3, agent: 'analysis-agent', logic_score: 45, hallucination_score: 55, valid: false, timestamp: '7m ago' },
    { id: 4, agent: 'content-agent', logic_score: 88, hallucination_score: 15, valid: true, timestamp: '10m ago' },
    { id: 5, agent: 'summary-agent', logic_score: 78, hallucination_score: 22, valid: true, timestamp: '14m ago' },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Brain className="text-purple-400" size={28} />
          <h1 className="text-3xl font-bold">MCSE</h1>
        </div>
        <p className="text-gray-400">MAOS Cognitive Supervisor Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Validations</div>
          <div className="text-3xl font-bold">3,892</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Logic Score</div>
          <div className="text-3xl font-bold text-green-400">84%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Hallucination Rate</div>
          <div className="text-3xl font-bold text-yellow-400">18%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Valid Outputs</div>
          <div className="text-3xl font-bold">3,654</div>
        </div>
      </div>

      {/* Recent Validations */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Recent Cognitive Validations</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700 text-left text-sm text-gray-400">
              <th className="p-4">Agent</th>
              <th className="p-4">Logic Score</th>
              <th className="p-4">Hallucination</th>
              <th className="p-4">Result</th>
              <th className="p-4">Time</th>
            </tr>
          </thead>
          <tbody>
            {validations.map((v) => (
              <tr key={v.id} className="border-b border-gray-700/50 hover:bg-gray-700/50">
                <td className="p-4 font-medium">{v.agent}</td>
                <td className="p-4">
                  <span className={v.logic_score >= 70 ? 'text-green-400' : 'text-red-400'}>
                    {v.logic_score}%
                  </span>
                </td>
                <td className="p-4">
                  <span className={v.hallucination_score <= 20 ? 'text-green-400' : 'text-yellow-400'}>
                    {v.hallucination_score}%
                  </span>
                </td>
                <td className="p-4">
                  {v.valid ? (
                    <span className="flex items-center gap-1 text-green-400">
                      <CheckCircle size={16} /> Valid
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-red-400">
                      <XCircle size={16} /> Invalid
                    </span>
                  )}
                </td>
                <td className="p-4 text-gray-500">{v.timestamp}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
