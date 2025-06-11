import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import AnalyticsCharts from '@/components/analytics/AnalyticsCharts';
import { 
  TrendingUp, DollarSign, Users, BookOpen, Package, 
  Target, Award, Calendar, Activity, Zap
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Analytics Dashboard | Unite Group + CARSI',
  description: 'Advanced analytics for revenue attribution and cross-platform ROI',
};

// Mock data for charts
const revenueData = [
  { month: 'Jan', unite: 125000, carsi: 45000, bundles: 30000 },
  { month: 'Feb', unite: 135000, carsi: 52000, bundles: 38000 },
  { month: 'Mar', unite: 142000, carsi: 58000, bundles: 45000 },
  { month: 'Apr', unite: 155000, carsi: 65000, bundles: 52000 },
  { month: 'May', unite: 168000, carsi: 72000, bundles: 60000 },
  { month: 'Jun', unite: 175000, carsi: 78000, bundles: 68000 },
];

const crossSellData = [
  { name: 'Unite â†’ CARSI', value: 35, fill: '#14b8a6' },
  { name: 'CARSI â†’ Unite', value: 25, fill: '#0ea5e9' },
  { name: 'Direct Unite', value: 25, fill: '#8b5cf6' },
  { name: 'Direct CARSI', value: 15, fill: '#f59e0b' },
];

const customerJourneyData = [
  { stage: 'Awareness', unite: 1000, carsi: 800 },
  { stage: 'Interest', unite: 750, carsi: 600 },
  { stage: 'Consideration', unite: 500, carsi: 450 },
  { stage: 'Purchase', unite: 300, carsi: 280 },
  { stage: 'Retention', unite: 250, carsi: 240 },
  { stage: 'Advocacy', unite: 180, carsi: 175 },
];

const performanceMetrics = [
  { metric: 'Customer Acquisition', unite: 85, carsi: 78, bundle: 92 },
  { metric: 'Retention Rate', unite: 88, carsi: 90, bundle: 95 },
  { metric: 'Satisfaction Score', unite: 82, carsi: 85, bundle: 91 },
  { metric: 'Revenue per Customer', unite: 75, carsi: 70, bundle: 88 },
  { metric: 'Cross-sell Success', unite: 65, carsi: 68, bundle: 85 },
];

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-AU', {
      style: 'currency',
      currency: 'AUD',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalRevenue = revenueData[revenueData.length - 1].unite + 
                      revenueData[revenueData.length - 1].carsi + 
                      revenueData[revenueData.length - 1].bundles;

  const growthRate = ((totalRevenue - (revenueData[0].unite + revenueData[0].carsi + revenueData[0].bundles)) / 
                     (revenueData[0].unite + revenueData[0].carsi + revenueData[0].bundles)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">Analytics Dashboard</h1>
              <p className="text-teal-100">
                Revenue attribution and cross-platform performance metrics
              </p>
            </div>
            <Select defaultValue="last-6-months">
              <SelectTrigger className="w-48 bg-white/20 border-white/40 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last-30-days">Last 30 Days</SelectItem>
                <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                <SelectItem value="last-year">Last Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Total Revenue</span>
                <DollarSign className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+{growthRate.toFixed(1)}%</span> from Jan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Cross-sell Rate</span>
                <Target className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">60%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+15%</span> vs target
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Bundle Adoption</span>
                <Package className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">28%</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8%</span> this quarter
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-sm font-medium">
                <span>Combined LTV</span>
                <TrendingUp className="h-4 w-4 text-gray-400" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(85000)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+22%</span> with bundles
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Render the client-side chart component */}
        <AnalyticsCharts 
          revenueData={revenueData}
          crossSellData={crossSellData}
          customerJourneyData={customerJourneyData}
          performanceMetrics={performanceMetrics}
          formatCurrency={formatCurrency}
        />
      </div>
    </div>
  );
}
