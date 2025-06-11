'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { apiClient } from '@/lib/apiClient';
import { toast } from '@/components/ui/use-toast';
import { RefreshCw, BarChart3 } from 'lucide-react';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface AnalyticsData {
  stageDistribution: { stage: string; count: number }[];
  dealValueByStage: { stage: string; total: number }[];
  conversionRate: number;
  avgDealSize: number;
  totalDeals: number;
  totalValue: number;
  isEmpty?: boolean;
  additionalMetrics?: {
    activeDeals: number;
    closedWonDeals: number;
    closedLostDeals: number;
    avgTimeInPipeline: number;
  };
}

export default function PipelineAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('30d');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await apiClient.get(`crm/pipeline/analytics?timeRange=${timeRange}`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching pipeline analytics:', err);
      setError('Failed to load pipeline analytics. Please try again.');
      toast({
        title: 'Error',
        description: 'Failed to load pipeline analytics',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchAnalytics();
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleRefresh}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!data) return null;

  // Show empty state if no data
  if (data.isEmpty) {
    return (
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pipeline Analytics</h2>
            <p className="text-gray-600 dark:text-gray-400">Sales pipeline performance metrics</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="ui-dropdown">
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="ui-select"
                aria-label="Select time range for analytics"
              >
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
                <option value="90d">Last 90 Days</option>
              </select>
            </div>
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <BarChart3 className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                No Pipeline Data Available
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Create some deals to see your pipeline analytics here.
              </p>
              <Button>
                Create Your First Deal
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare data for charts
  const stageDistributionData = {
    labels: data.stageDistribution.map(item => item.stage),
    datasets: [
      {
        label: 'Deals per Stage',
        data: data.stageDistribution.map(item => item.count),
        backgroundColor: [
          '#4f46e5', '#60a5fa', '#fbbf24', '#f97316', '#22c55e', '#ef4444'
        ]
      }
    ]
  };

  const dealValueData = {
    labels: data.dealValueByStage.map(item => item.stage),
    datasets: [
      {
        label: 'Deal Value ($)',
        data: data.dealValueByStage.map(item => item.total),
        backgroundColor: '#3b82f6'
      }
    ]
  };

  return (
    <div className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Deals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.totalDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Avg Deal Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${data.avgDealSize.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Conversion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{data.conversionRate}%</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Deals by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie 
                data={stageDistributionData} 
                options={{ 
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Value by Stage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar 
                data={dealValueData} 
                options={{ 
                  maintainAspectRatio: false,
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: (value) => '$' + value
                      }
                    }
                  }
                }} 
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
