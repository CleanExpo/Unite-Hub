'use client';

/**
 * SafetyLedgerTable - Historical safety interventions audit log
 *
 * Displays:
 * - Past interventions with action, risk reduction, timestamp
 * - Sortable by date, action type, risk reduction
 * - Detailed reason and affected agents
 */

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, History } from 'lucide-react';
import { useSafetyStore } from '@/lib/stores/useSafetyStore';

type SortField = 'timestamp' | 'action' | 'riskReduction';
type SortOrder = 'asc' | 'desc';

export const SafetyLedgerTable: React.FC = () => {
  const { ledger, isLoading } = useSafetyStore();
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  if (isLoading && ledger.length === 0) {
    return (
      <div className="flex items-center justify-center p-8">
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading ledger...</p>
      </div>
    );
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const sortedLedger = [...ledger].sort((a, b) => {
    let aVal: any;
    let bVal: any;

    if (sortField === 'timestamp') {
      aVal = new Date(a.createdAt).getTime();
      bVal = new Date(b.createdAt).getTime();
    } else if (sortField === 'action') {
      aVal = a.action;
      bVal = b.action;
    } else if (sortField === 'riskReduction') {
      aVal = a.riskReduction;
      bVal = b.riskReduction;
    }

    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'block_agent':
        return 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300';
      case 'pause_workflow':
        return 'bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-300';
      case 'halt_autonomy':
        return 'bg-red-100 text-red-900 dark:bg-red-900/30 dark:text-red-300';
      case 'require_approval':
        return 'bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'throttle':
        return 'bg-blue-100 text-blue-900 dark:bg-blue-900/30 dark:text-blue-300';
      case 'override':
        return 'bg-purple-100 text-purple-900 dark:bg-purple-900/30 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-900 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  const getRiskColor = (riskBefore: number, riskAfter: number) => {
    const reduction = riskBefore - riskAfter;
    if (reduction >= 30) return 'text-green-600 dark:text-green-400';
    if (reduction >= 15) return 'text-blue-600 dark:text-blue-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <History className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Intervention History
        </h3>
        <span className="ml-auto text-sm text-gray-600 dark:text-gray-400">
          {ledger.length} action{ledger.length !== 1 ? 's' : ''}
        </span>
      </div>

      {ledger.length === 0 ? (
        <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">No interventions recorded</p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-lg">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('timestamp')}
                    className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    Time
                    {sortField === 'timestamp' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">
                  <button
                    onClick={() => handleSort('action')}
                    className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400"
                  >
                    Action
                    {sortField === 'action' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-center">
                  <button
                    onClick={() => handleSort('riskReduction')}
                    className="flex items-center gap-1 font-semibold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-400 ml-auto"
                  >
                    Risk Reduction
                    {sortField === 'riskReduction' && (
                      sortOrder === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left">Reason</th>
              </tr>
            </thead>
            <tbody>
              {sortedLedger.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                >
                  <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                    {new Date(entry.createdAt).toLocaleTimeString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-3 py-1 rounded text-xs font-medium ${getActionBadgeColor(entry.action)}`}>
                      {entry.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-center font-semibold ${getRiskColor(entry.riskBefore, entry.riskAfter)}`}>
                    -{entry.riskReduction}%
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 max-w-xs truncate">
                    {entry.reason}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ledger.length > 0 && (
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Actions</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{ledger.length}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Avg Risk Reduction</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {Math.round(ledger.reduce((sum, e) => sum + e.riskReduction, 0) / ledger.length)}%
            </p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-3 rounded border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-600 dark:text-gray-400">Total Reduced</p>
            <p className="text-xl font-bold text-gray-900 dark:text-white">
              {ledger.reduce((sum, e) => sum + e.riskReduction, 0)}%
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
