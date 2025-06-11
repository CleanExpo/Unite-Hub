'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Activity, Zap, Award } from 'lucide-react';
import * as Recharts from 'recharts';

// Extract components from Recharts
const {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} = Recharts;

interface AnalyticsChartsProps {
  revenueData: any[];
  crossSellData: any[];
  customerJourneyData: any[];
  performanceMetrics: any[];
  formatCurrency: (value: number) => string;
}

export default function AnalyticsCharts({
  revenueData,
  crossSellData,
  customerJourneyData,
  performanceMetrics,
  formatCurrency
}: AnalyticsChartsProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Loading Charts...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px] flex items-center justify-center text-muted-foreground">
              Loading analytics data...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
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
                  <span>Blog â†’ Consultation â†’ Software Dev â†’ Training (28%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-teal-100 text-teal-800">2</Badge>
                  <span>CARSI Course â†’ Unite SEO â†’ Bundle Purchase (22%)</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Badge className="bg-cyan-100 text-cyan-800">3</Badge>
                  <span>Direct Bundle â†’ Additional Services (18%)</span>
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
                  <span className="text-sm">Cross-sell Unite â†’ CARSI</span>
                  <span className="font-semibold text-green-600">285%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Cross-sell CARSI â†’ Unite</span>
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
  );
}
