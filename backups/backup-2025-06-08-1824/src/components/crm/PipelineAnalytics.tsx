'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
}

export default function PipelineAnalytics() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Simulated API call - in a real app this would be:
      // const response = await fetch('/api/crm/pipeline/analytics');
      setLoading(true);
      
      // Mock data for demonstration
      setTimeout(() => {
        setData({
          stageDistribution: [
            { stage: 'Lead', count: 15 },
            { stage: 'Qualified', count: 10 },
            { stage: 'Proposal', count: 8 },
            { stage: 'Negotiation', count: 5 },
            { stage: 'Closed Won', count: 3 },
            { stage: 'Closed Lost', count: 4 }
          ],
          dealValueByStage: [
            { stage: 'Lead', total: 15000 },
            { stage: 'Qualified', total: 75000 },
            { stage: 'Proposal', total: 120000 },
            { stage: 'Negotiation', total: 90000 },
            { stage: 'Closed Won', total: 60000 }
          ],
          conversionRate: 18.5,
          avgDealSize: 25000,
          totalDeals: 45,
          totalValue: 1125000
        });
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <p>Loading analytics...</p>
      </div>
    );
  }

  if (!data) return null;

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
