"use client";

/**
 * Progress and Impact Graphs
 * Phase 32: Agency Experience Layer
 *
 * Simple KPI visuals for actions implemented, tests running, etc.
 */

import { BarChart3, CheckSquare, FlaskConical, Lightbulb } from "lucide-react";

interface KPI {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  description: string;
}

export default function ProgressAndImpactGraphs() {
  // This would be fetched from usage tables and analytics
  const kpis: KPI[] = [
    {
      label: "Actions Implemented",
      value: 24,
      icon: <CheckSquare className="w-5 h-5" />,
      color: "text-green-600 bg-green-100",
      description: "This month",
    },
    {
      label: "Tests Running",
      value: 3,
      icon: <FlaskConical className="w-5 h-5" />,
      color: "text-purple-600 bg-purple-100",
      description: "Active experiments",
    },
    {
      label: "Open Suggestions",
      value: 8,
      icon: <Lightbulb className="w-5 h-5" />,
      color: "text-yellow-600 bg-yellow-100",
      description: "Ready to review",
    },
    {
      label: "Audits Completed",
      value: 12,
      icon: <BarChart3 className="w-5 h-5" />,
      color: "text-blue-600 bg-blue-100",
      description: "This month",
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-5 h-5 text-teal-600" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Progress & Impact
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {kpis.map((kpi, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-2 rounded-lg ${kpi.color}`}>
                {kpi.icon}
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {kpi.value}
            </div>
            <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {kpi.label}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {kpi.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
