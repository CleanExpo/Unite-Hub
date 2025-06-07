import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar
} from 'recharts';
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
  { name: 'Unite → CARSI', value: 35, fill: '#14b8a6' },
  { name: 'CARSI → Unite', value: 25, fill: '#0ea5e9' },
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

        <Tabs defaultValue="revenue" className="space-y-4">
          <TabsList>
            <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
            <TabsTrigger value="attribution">Attribution</TabsTrigger>
            <TabsTrigger value="journey">Customer Journey</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Revenue Streams</CardTitle>
                <CardDescription>
                  Monthly revenue breakdown across platforms and bundles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <AreaChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `$${value/1000}k`} />
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                    <Legend />
                    <Area type="monotone" dataKey="unite" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" />
                    <Area type="monotone" dataKey="carsi" stackId="1" stroke="#14b8a6" fill="#14b8a6" />
                    <Area type="monotone" dataKey="bundles" stackId="1" stroke="#0ea5e9" fill="#0ea5e9" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={crossSellData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry) => `${entry.name}: ${entry.value}%`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {crossSellData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Bundle Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Digital Transformation</span>
                        <span className="text-sm text-muted-foreground">45 sold</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div className="bg-teal-600 h-2 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">SEO Mastery</span>
                        <span className="text-sm text-muted-foreground">32 sold</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div className="bg-cyan-600 h-2 rounded-full" style={{ width: '32%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Business Growth</span>
                        <span className="text-sm text-muted-foreground">23 sold</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: '23%' }} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="attribution" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Multi-Touch Attribution</CardTitle>
                <CardDescription>
                  Customer touchpoints leading to conversion
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-teal-600">42%</div>
                    <p className="text-sm text-muted-foreground">Unite First Touch</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-cyan-600">35%</div>
                    <p className="text-sm text-muted-foreground">CARSI First Touch</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">23%</div>
                    <p className="text-sm text-muted-foreground">Bundle Direct</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold">Common Conversion Paths</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-purple-100 text-purple-800">1</Badge>
                      <span>Blog → Consultation → Software Dev → Training (28%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-teal-100 text-teal-800">2</Badge>
                      <span>CARSI Course → Unite SEO → Bundle Purchase (22%)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Badge className="bg-cyan-100 text-cyan-800">3</Badge>
                      <span>Direct Bundle → Additional Services (18%)</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="journey" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Customer Journey Funnel</CardTitle>
                <CardDescription>
                  Conversion rates through each stage
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={customerJourneyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="unite" fill="#8b5cf6" />
                    <Bar dataKey="carsi" fill="#14b8a6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>
                  Key metrics across service types
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={400}>
                  <RadarChart data={performanceMetrics}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={90} domain={[0, 100]} />
                    <Radar name="Unite Only" dataKey="unite" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Radar name="CARSI Only" dataKey="carsi" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                    <Radar name="Bundle" dataKey="bundle" stroke="#0ea5e9" fill="#0ea5e9" fillOpacity={0.6} />
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>ROI by Channel</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Bundle Packages</span>
                      <span className="font-semibold text-green-600">312%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cross-sell Unite → CARSI</span>
                      <span className="font-semibold text-green-600">285%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Cross-sell CARSI → Unite</span>
                      <span className="font-semibold text-green-600">267%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Direct Unite Services</span>
                      <span className="font-semibold">198%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Direct CARSI Courses</span>
                      <span className="font-semibold">175%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Success Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Activity className="h-5 w-5 text-teal-600" />
                      <div className="flex-grow">
                        <div className="text-sm font-medium">Engagement Score</div>
                        <div className="text-2xl font-bold">85%</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Zap className="h-5 w-5 text-cyan-600" />
                      <div className="flex-grow">
                        <div className="text-sm font-medium">Time to Value</div>
                        <div className="text-2xl font-bold">14 days</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-purple-600" />
                      <div className="flex-grow">
                        <div className="text-sm font-medium">Certification Rate</div>
                        <div className="text-2xl font-bold">78%</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
