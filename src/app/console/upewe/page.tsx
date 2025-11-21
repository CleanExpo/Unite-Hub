'use client';

import { useState } from 'react';
import { AlertTriangle, Clock, TrendingUp, Bell } from 'lucide-react';

export default function UPEWEPage() {
  const [forecasts] = useState([
    { id: 1, window: '5m', event: 'High load spike', probability: 0.82, confidence: 0.91, signals: 4 },
    { id: 2, window: '1h', event: 'Database connection pool exhaustion', probability: 0.45, confidence: 0.78, signals: 2 },
    { id: 3, window: '24h', event: 'Storage threshold breach', probability: 0.67, confidence: 0.85, signals: 3 },
    { id: 4, window: '1h', event: 'API rate limit approach', probability: 0.38, confidence: 0.72, signals: 2 },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <AlertTriangle className="text-yellow-400" size={28} />
          <h1 className="text-3xl font-bold">UPEWE</h1>
        </div>
        <p className="text-gray-400">Unified Prediction & Early-Warning Engine</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Active Forecasts</div>
          <div className="text-3xl font-bold">24</div>
        </div>
        <div className="bg-yellow-900/50 rounded-lg p-4">
          <div className="text-sm text-yellow-400">High Probability</div>
          <div className="text-3xl font-bold text-yellow-400">8</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Avg Confidence</div>
          <div className="text-3xl font-bold">82%</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="text-sm text-gray-400">Prevented Incidents</div>
          <div className="text-3xl font-bold text-green-400">47</div>
        </div>
      </div>

      {/* Active Forecasts */}
      <div className="bg-gray-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Bell size={20} />
            Active Forecasts
          </h2>
        </div>
        <div className="divide-y divide-gray-700">
          {forecasts.map((f) => (
            <div key={f.id} className="p-4 hover:bg-gray-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{f.event}</span>
                <span className="flex items-center gap-1 text-sm text-gray-400">
                  <Clock size={14} />
                  {f.window}
                </span>
              </div>
              <div className="flex items-center gap-6 text-sm">
                <div>
                  <span className="text-gray-400">Probability: </span>
                  <span className={f.probability >= 0.7 ? 'text-red-400' : f.probability >= 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                    {(f.probability * 100).toFixed(0)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-400">Confidence: </span>
                  <span className="text-blue-400">{(f.confidence * 100).toFixed(0)}%</span>
                </div>
                <div>
                  <span className="text-gray-400">Signals: </span>
                  <span>{f.signals}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
