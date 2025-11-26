'use client';

/**
 * CONVEX Strategy Dashboard Page
 *
 * Main entry point for CONVEX module
 * - Strategy generation interface
 * - Recent strategies list
 * - Workspace statistics
 * - Framework filtering
 * - Compliance status tracking
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  Eye,
  Trash2,
} from 'lucide-react';
import { ConvexStrategyDashboard } from '@/components/convex/ConvexStrategyDashboard';
import { logger } from '@/lib/logging';

// ============================================================================
// TYPES
// ============================================================================

interface WorkspaceStats {
  totalStrategies: number;
  avgScore: number;
  passCount: number;
  needsRevisionCount: number;
  failCount: number;
  byFramework: Record<string, number>;
}

interface StrategyItem {
  id: string;
  strategy_id: string;
  framework: string;
  businessName: string;
  convex_score: number;
  compliance_status: string;
  created_at: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export default function ConvexPage() {
  const [stats, setStats] = useState<WorkspaceStats | null>(null);
  const [strategies, setStrategies] = useState<StrategyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState<string | null>(null);
  const [selectedCompliance, setSelectedCompliance] = useState<string | null>(null);

  // Load statistics and strategies
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    logger.info('[CONVEX-PAGE] Loading dashboard data');

    try {
      // Get workspace ID from auth context or URL params
      const workspaceId = new URLSearchParams(window.location.search).get('workspaceId') || 'default-workspace';

      const [statsRes, strategiesRes] = await Promise.all([
        fetch(`/api/convex/stats?workspaceId=${workspaceId}`),
        fetch(`/api/convex/list?workspaceId=${workspaceId}`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (strategiesRes.ok) {
        const strategiesData = await strategiesRes.json();
        setStrategies(strategiesData);
      }
    } catch (error) {
      logger.error('[CONVEX-PAGE] Failed to load data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStrategyGenerated = () => {
    setShowGenerator(false);
    loadData();
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-50 dark:bg-green-900/20';
      case 'needs_revision':
        return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
      case 'fail':
        return 'text-red-600 bg-red-50 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getComplianceIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'needs_revision':
        return <AlertCircle className="h-4 w-4" />;
      case 'fail':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (showGenerator) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => setShowGenerator(false)}>
          ← Back to Dashboard
        </Button>
        <ConvexStrategyDashboard />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            CONVEX Strategy Module
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-400">
            Generate high-conversion marketing strategies using CONVEX frameworks
          </p>
        </div>
        <Button
          onClick={() => setShowGenerator(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white"
          size="lg"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Strategy
        </Button>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalStrategies}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Total Strategies</div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.avgScore}</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Avg Score</div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                  <div className="text-2xl font-bold text-green-600">{stats.passCount}</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Pass</div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <AlertCircle className="h-6 w-6 text-yellow-600" />
                  <div className="text-2xl font-bold text-yellow-600">{stats.needsRevisionCount}</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Revisions</div>
              </div>
            </CardContent>
          </Card>

          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  <XCircle className="h-6 w-6 text-red-600" />
                  <div className="text-2xl font-bold text-red-600">{stats.failCount}</div>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">Fail</div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      {stats && Object.keys(stats.byFramework).length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Compliance Distribution */}
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Compliance Distribution</CardTitle>
              <CardDescription>Pass / Needs Revision / Fail breakdown</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Pass', value: stats.passCount },
                      { name: 'Needs Revision', value: stats.needsRevisionCount },
                      { name: 'Fail', value: stats.failCount },
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                    <Cell fill="#ef4444" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Strategies by Framework */}
          <Card className="dark:bg-gray-900 dark:border-gray-800">
            <CardHeader>
              <CardTitle>Strategies by Framework</CardTitle>
              <CardDescription>Distribution across CONVEX frameworks</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={Object.entries(stats.byFramework).map(([framework, count]) => ({
                    name: framework,
                    count,
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Strategies List */}
      <Card className="dark:bg-gray-900 dark:border-gray-800">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Recent Strategies</CardTitle>
              <CardDescription>Your generated CONVEX strategies</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="mr-2 h-4 w-4" />
                Filter
              </Button>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {strategies.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 mb-4">No strategies yet</p>
              <Button onClick={() => setShowGenerator(true)}>Create Your First Strategy</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Business
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Framework
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Score
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Created
                    </th>
                    <th className="text-right py-3 px-4 font-semibold text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {strategies.map((strategy) => (
                    <tr
                      key={strategy.id}
                      className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                    >
                      <td className="py-3 px-4 text-gray-900 dark:text-gray-100">
                        <div className="font-medium">{strategy.businessName}</div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400">
                        <Badge variant="outline">{strategy.framework}</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="text-lg font-bold text-blue-600">{strategy.convex_score}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">/100</div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className={`flex items-center gap-2 px-2 py-1 rounded w-fit ${getComplianceColor(strategy.compliance_status)}`}>
                          {getComplianceIcon(strategy.compliance_status)}
                          <span className="capitalize text-xs font-medium">
                            {strategy.compliance_status.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                        {new Date(strategy.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
