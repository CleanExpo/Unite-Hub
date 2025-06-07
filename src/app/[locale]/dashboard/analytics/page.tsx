'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  PieChart, 
  Pie, 
  Cell,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar,
  Activity,
  Briefcase,
  Target,
  Award
} from 'lucide-react'
import { motion } from 'framer-motion'

// Sample data - in production this would come from API
const monthlyRevenue = [
  { month: 'Jan', revenue: 45000, projects: 12 },
  { month: 'Feb', revenue: 52000, projects: 15 },
  { month: 'Mar', revenue: 48000, projects: 13 },
  { month: 'Apr', revenue: 61000, projects: 18 },
  { month: 'May', revenue: 72000, projects: 22 },
  { month: 'Jun', revenue: 85000, projects: 25 },
]

const projectTypes = [
  { name: 'AI Implementation', value: 35, color: '#0ea5e9' },
  { name: 'SaaS Development', value: 28, color: '#8b5cf6' },
  { name: 'Cloud Migration', value: 22, color: '#10b981' },
  { name: 'Digital Transformation', value: 15, color: '#f59e0b' },
]

const clientSatisfaction = [
  { metric: 'Very Satisfied', value: 75 },
  { metric: 'Satisfied', value: 20 },
  { metric: 'Neutral', value: 4 },
  { metric: 'Dissatisfied', value: 1 },
]

const performanceMetrics = [
  { day: 'Mon', tasks: 45, completed: 42 },
  { day: 'Tue', tasks: 52, completed: 50 },
  { day: 'Wed', tasks: 38, completed: 35 },
  { day: 'Thu', tasks: 60, completed: 58 },
  { day: 'Fri', tasks: 55, completed: 53 },
  { day: 'Sat', tasks: 20, completed: 20 },
  { day: 'Sun', tasks: 15, completed: 14 },
]

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState('month')
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Analytics Dashboard</h1>
          <p className="text-slate-400">Real-time insights into your business performance</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
        >
          <StatsCard
            title="Total Revenue"
            value="$385,000"
            icon={<DollarSign className="h-5 w-5" />}
            description="Year to date"
            trend={{ value: 23.5, isPositive: true }}
          />
          <StatsCard
            title="Active Clients"
            value="127"
            icon={<Users className="h-5 w-5" />}
            description="Currently engaged"
            trend={{ value: 12.3, isPositive: true }}
          />
          <StatsCard
            title="Projects Completed"
            value="105"
            icon={<Briefcase className="h-5 w-5" />}
            description="This year"
            trend={{ value: 18.7, isPositive: true }}
          />
          <StatsCard
            title="Success Rate"
            value="98.5%"
            icon={<Target className="h-5 w-5" />}
            description="Client satisfaction"
            trend={{ value: 2.1, isPositive: true }}
          />
        </motion.div>

        {/* Charts */}
        <Tabs defaultValue="revenue" className="space-y-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="revenue" className="data-[state=active]:bg-slate-700">
              Revenue & Growth
            </TabsTrigger>
            <TabsTrigger value="projects" className="data-[state=active]:bg-slate-700">
              Project Analytics
            </TabsTrigger>
            <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
              Performance
            </TabsTrigger>
            <TabsTrigger value="clients" className="data-[state=active]:bg-slate-700">
              Client Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Monthly Revenue Trend</CardTitle>
                  <CardDescription className="text-slate-400">
                    Revenue and project count over the last 6 months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={monthlyRevenue}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="revenue" 
                        stroke="#0ea5e9" 
                        fillOpacity={1} 
                        fill="url(#colorRevenue)" 
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Revenue by Project Type</CardTitle>
                    <CardDescription className="text-slate-400">
                      Distribution of revenue across different services
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={projectTypes}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {projectTypes.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-white">Growth Metrics</CardTitle>
                    <CardDescription className="text-slate-400">
                      Key performance indicators
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span className="text-slate-300">Average Project Value</span>
                      <span className="text-xl font-bold text-white">$15,400</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span className="text-slate-300">Monthly Recurring Revenue</span>
                      <span className="text-xl font-bold text-white">$42,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span className="text-slate-300">Customer Lifetime Value</span>
                      <span className="text-xl font-bold text-white">$85,000</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-slate-700/50 rounded">
                      <span className="text-slate-300">Revenue Per Employee</span>
                      <span className="text-xl font-bold text-white">$125,000</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="projects" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Project Completion Timeline</CardTitle>
                  <CardDescription className="text-slate-400">
                    Average time to complete projects by type
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={[
                      { type: 'AI Implementation', days: 45 },
                      { type: 'SaaS Development', days: 60 },
                      { type: 'Cloud Migration', days: 30 },
                      { type: 'Digital Transformation', days: 90 },
                      { type: 'API Integration', days: 15 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="type" stroke="#94a3b8" angle={-45} textAnchor="end" height={80} />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Bar dataKey="days" fill="#8b5cf6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Weekly Task Performance</CardTitle>
                  <CardDescription className="text-slate-400">
                    Tasks created vs completed this week
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceMetrics}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="day" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="tasks" 
                        stroke="#f59e0b" 
                        strokeWidth={2}
                        name="Total Tasks"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completed" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        name="Completed"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>

          <TabsContent value="clients" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Client Satisfaction Metrics</CardTitle>
                  <CardDescription className="text-slate-400">
                    Based on recent client feedback surveys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={clientSatisfaction} layout="horizontal">
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis type="number" stroke="#94a3b8" />
                      <YAxis dataKey="metric" type="category" stroke="#94a3b8" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                        labelStyle={{ color: '#f1f5f9' }}
                      />
                      <Bar dataKey="value" fill="#10b981" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
