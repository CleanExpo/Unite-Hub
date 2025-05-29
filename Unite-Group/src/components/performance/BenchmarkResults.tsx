/**
 * Benchmark Results Component
 * 
 * This component displays performance benchmark results in a visual dashboard.
 */

'use client'

import React, { useState } from 'react'
import { 
  BenchmarkResult, 
  PERFORMANCE_METRICS, 
  formatMetricValue, 
  getMetricScoreRange,
  getMetricScoreColor
} from '@/lib/performance/load-testing'

export interface BenchmarkResultsProps {
  /**
   * Benchmark results to display
   */
  results: BenchmarkResult[];
  
  /**
   * Whether to show detailed metrics for each run
   * @default false
   */
  showDetailedRuns?: boolean;
  
  /**
   * Whether to show Lighthouse scores
   * @default true
   */
  showLighthouseScores?: boolean;
  
  /**
   * Whether to show comparisons between results
   * @default true when multiple results are provided
   */
  showComparisons?: boolean;
  
  /**
   * Class name for the component
   */
  className?: string;
}

/**
 * Format date for display
 * @param timestamp Timestamp to format
 * @returns Formatted date string
 */
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleString();
}

/**
 * Calculate percent change between two values
 * @param oldValue Old value
 * @param newValue New value
 * @returns Percent change (positive = improvement)
 */
function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  
  // For most metrics, lower is better
  const percentChange = ((oldValue - newValue) / oldValue) * 100;
  
  return parseFloat(percentChange.toFixed(1));
}

/**
 * Display a change indicator with the percent change
 * @param percentChange Percent change
 * @param inverted Whether to invert the color (for metrics where higher is better)
 * @returns React element
 */
function ChangeIndicator({ 
  percentChange, 
  inverted = false 
}: { 
  percentChange: number; 
  inverted?: boolean; 
}): React.ReactElement {
  // Determine if this is an improvement or regression
  const isImprovement = inverted 
    ? percentChange < 0 
    : percentChange > 0;
  
  // Determine color and icon based on improvement
  const color = isImprovement ? 'text-green-500' : 'text-red-500';
  const icon = isImprovement ? '↑' : '↓';
  
  // Format the percent change (always show as positive)
  const formattedChange = `${Math.abs(percentChange)}%`;
  
  return (
    <span className={`inline-flex items-center ml-2 ${color}`}>
      {icon} {formattedChange}
    </span>
  );
}

/**
 * Benchmark Results Component
 */
export default function BenchmarkResults({
  results,
  showDetailedRuns = false,
  showLighthouseScores = true,
  showComparisons = results.length > 1,
  className = '',
}: BenchmarkResultsProps): React.ReactElement {
  // State to track the selected benchmark for detailed view
  const [selectedBenchmark, setSelectedBenchmark] = useState<string | null>(
    results.length > 0 ? results[0].id : null
  );
  
  // Get the selected benchmark result
  const selectedResult = results.find(result => result.id === selectedBenchmark) || results[0];
  
  // Get all metrics from the selected result's averages
  const metrics = Object.entries(selectedResult?.averages || {})
    .filter(([_, value]) => value !== undefined)
    .map(([key, value]) => ({
      key,
      metricKey: key as keyof typeof PERFORMANCE_METRICS,
      value: value as number,
      metric: PERFORMANCE_METRICS[key as keyof typeof PERFORMANCE_METRICS]
    }));
  
  return (
    <div className={`benchmark-results p-4 ${className}`}>
      <h2 className="text-2xl font-bold mb-4">Performance Benchmark Results</h2>
      
      {/* Benchmark selection tabs */}
      {results.length > 1 && (
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {results.map(result => (
            <button
              key={result.id}
              onClick={() => setSelectedBenchmark(result.id)}
              className={`px-4 py-2 rounded-md transition-colors ${
                selectedBenchmark === result.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600'
              }`}
            >
              {result.id}
            </button>
          ))}
        </div>
      )}
      
      {selectedResult && (
        <div className="space-y-6">
          {/* Benchmark info */}
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-md">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">URL</h3>
                <p className="truncate">{selectedResult.url}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Start Time</h3>
                <p>{formatDate(selectedResult.startTime)}</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400">Duration</h3>
                <p>{((selectedResult.endTime - selectedResult.startTime) / 1000).toFixed(2)}s</p>
              </div>
            </div>
          </div>
          
          {/* Core metrics */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Core Web Vitals</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {metrics
                .filter(({ metricKey }) => ['LCP', 'CLS', 'FID'].includes(metricKey))
                .map(({ metricKey, value, metric }) => {
                  const scoreRange = getMetricScoreRange(metricKey, value);
                  const color = getMetricScoreColor(scoreRange);
                  
                  // Find previous result for comparison if showing comparisons
                  const previousResult = showComparisons && results.length > 1
                    ? results.find(r => r.id !== selectedResult.id)
                    : null;
                  
                  const previousValue = previousResult?.averages[metricKey];
                  const percentChange = previousValue !== undefined && value !== undefined
                    ? calculatePercentChange(previousValue, value)
                    : null;
                  
                  return (
                    <div 
                      key={metricKey} 
                      className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow"
                    >
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {metric.name}
                      </h4>
                      <div className="flex items-baseline mt-1">
                        <p 
                          className="text-2xl font-bold" 
                          style={{ color }}
                        >
                          {formatMetricValue(value, metric.unit)}
                        </p>
                        
                        {percentChange !== null && (
                          <ChangeIndicator 
                            percentChange={percentChange} 
                            inverted={false} 
                          />
                        )}
                      </div>
                      <div 
                        className="text-sm mt-1" 
                        style={{ color }}
                      >
                        {scoreRange === 'good' 
                          ? 'Good' 
                          : scoreRange === 'needs-improvement' 
                            ? 'Needs Improvement' 
                            : 'Poor'}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Other metrics */}
          <div>
            <h3 className="text-xl font-semibold mb-3">Other Metrics</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {metrics
                .filter(({ metricKey }) => !['LCP', 'CLS', 'FID'].includes(metricKey))
                .map(({ metricKey, value, metric }) => {
                  const scoreRange = getMetricScoreRange(metricKey, value);
                  const color = getMetricScoreColor(scoreRange);
                  
                  // Find previous result for comparison if showing comparisons
                  const previousResult = showComparisons && results.length > 1
                    ? results.find(r => r.id !== selectedResult.id)
                    : null;
                  
                  const previousValue = previousResult?.averages[metricKey];
                  const percentChange = previousValue !== undefined && value !== undefined
                    ? calculatePercentChange(previousValue, value)
                    : null;
                  
                  return (
                    <div 
                      key={metricKey} 
                      className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow"
                    >
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {metric.name}
                      </h4>
                      <div className="flex items-baseline mt-1">
                        <p 
                          className="text-lg font-bold" 
                          style={{ color }}
                        >
                          {formatMetricValue(value, metric.unit)}
                        </p>
                        
                        {percentChange !== null && (
                          <ChangeIndicator 
                            percentChange={percentChange} 
                            inverted={false} 
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
          
          {/* Lighthouse scores */}
          {showLighthouseScores && selectedResult.lighthouseScore && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Lighthouse Scores</h3>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {Object.entries(selectedResult.lighthouseScore).map(([key, value]) => {
                  if (value === undefined) return null;
                  
                  // Determine color based on score
                  let color = '#999';
                  if (value >= 90) color = '#0cce6b';
                  else if (value >= 50) color = '#ffa400';
                  else color = '#ff4e42';
                  
                  // Format key for display
                  const displayKey = key === 'bestPractices' 
                    ? 'Best Practices' 
                    : key.charAt(0).toUpperCase() + key.slice(1);
                  
                  return (
                    <div 
                      key={key} 
                      className="bg-white dark:bg-gray-900 p-3 rounded-lg shadow"
                    >
                      <h4 className="text-sm font-semibold text-gray-500 dark:text-gray-400">
                        {displayKey}
                      </h4>
                      <p 
                        className="text-lg font-bold mt-1" 
                        style={{ color }}
                      >
                        {value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Detailed runs */}
          {showDetailedRuns && (
            <div>
              <h3 className="text-xl font-semibold mb-3">Individual Runs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white dark:bg-gray-900 rounded-lg shadow">
                  <thead>
                    <tr className="bg-gray-100 dark:bg-gray-800">
                      <th className="px-4 py-2 text-left">Run</th>
                      {Object.keys(selectedResult.runs[0]?.metrics || {}).map(metric => (
                        <th key={metric} className="px-4 py-2 text-left">
                          {metric}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selectedResult.runs.map((run) => (
                      <tr key={run.run} className="border-t border-gray-200 dark:border-gray-700">
                        <td className="px-4 py-2">Run {run.run}</td>
                        {Object.entries(run.metrics).map(([metric, value]) => {
                          if (value === undefined) return <td key={metric} className="px-4 py-2">-</td>;
                          
                          const metricDef = PERFORMANCE_METRICS[metric as keyof typeof PERFORMANCE_METRICS];
                          
                          return (
                            <td key={metric} className="px-4 py-2">
                              {formatMetricValue(value, metricDef?.unit || 'ms')}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
