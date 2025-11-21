'use client';

import { useState } from 'react';
import { CreditCard, Package, BarChart3, AlertCircle } from 'lucide-react';

export default function TCPQELPage() {
  const [plan] = useState({
    name: 'Professional',
    price: 199,
    engines: ['maos', 'mcse', 'asrs', 'upewe', 'aire', 'sorie', 'gslpie']
  });

  const [usage] = useState([
    { engine: 'MAOS', used: 7500, limit: 10000, percentage: 75 },
    { engine: 'MCSE', used: 3200, limit: 5000, percentage: 64 },
    { engine: 'ASRS', used: 4100, limit: 5000, percentage: 82 },
    { engine: 'UPEWE', used: 890, limit: 2000, percentage: 44.5 },
    { engine: 'AIRE', used: 125, limit: 500, percentage: 25 },
    { engine: 'SORIE', used: 89, limit: 200, percentage: 44.5 },
    { engine: 'GSLPIE', used: 4200, limit: 5000, percentage: 84 },
  ]);

  return (
    <div className="p-6">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <CreditCard className="text-blue-400" size={28} />
          <h1 className="text-3xl font-bold">TCPQEL</h1>
        </div>
        <p className="text-gray-400">Tenant Commercial Plans, Quotas & Engine Licensing</p>
      </div>

      {/* Current Plan */}
      <div className="bg-gradient-to-r from-blue-900 to-purple-900 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-blue-200">Current Plan</div>
            <div className="text-3xl font-bold">{plan.name}</div>
            <div className="text-blue-200 mt-1">{plan.engines.length} engines included</div>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">${plan.price}</div>
            <div className="text-blue-200">/month</div>
          </div>
        </div>
      </div>

      {/* Usage Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <Package size={16} />
            <span className="text-sm">Total Operations</span>
          </div>
          <div className="text-2xl font-bold">20,106</div>
          <div className="text-sm text-gray-500">of 27,700 limit</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <BarChart3 size={16} />
            <span className="text-sm">Average Usage</span>
          </div>
          <div className="text-2xl font-bold">72.6%</div>
          <div className="text-sm text-gray-500">across all engines</div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4">
          <div className="flex items-center gap-2 text-gray-400 mb-2">
            <AlertCircle size={16} />
            <span className="text-sm">Near Limit</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">2</div>
          <div className="text-sm text-gray-500">engines above 80%</div>
        </div>
      </div>

      {/* Usage by Engine */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Usage by Engine</h2>

        <div className="space-y-4">
          {usage.map((item) => (
            <div key={item.engine}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium">{item.engine}</span>
                <span className="text-sm text-gray-400">
                  {item.used.toLocaleString()} / {item.limit.toLocaleString()}
                </span>
              </div>
              <div className="h-3 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all ${
                    item.percentage > 80 ? 'bg-yellow-500' :
                    item.percentage > 60 ? 'bg-blue-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
              <div className="text-right text-xs text-gray-500 mt-1">
                {item.percentage.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-8 bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-lg font-semibold mb-2">Need more capacity?</h3>
        <p className="text-gray-400 mb-4">
          Upgrade to Enterprise for unlimited operations and all engines.
        </p>
        <button className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg font-medium">
          Upgrade to Enterprise
        </button>
      </div>
    </div>
  );
}
