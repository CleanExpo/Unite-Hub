'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { 
  Users, 
  Shield, 
  Settings, 
  BarChart3,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Server,
  Activity,
  Mail,
  MessageSquare,
  CreditCard,
  TrendingUp,
  Eye,
  UserPlus,
  Ban,
  Edit
} from 'lucide-react'

interface AdminUser {
  id: string
  email: string
  name?: string
  role: 'admin' | 'user' | 'moderator'
  status: 'active' | 'suspended' | 'pending'
  last_login: string
  created_at: string
}

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  totalMessages: number
  totalProjects: number
  serverUptime: string
  databaseSize: string
  averageResponseTime: number
}

const mockUsers: AdminUser[] = [
  {
    id: '1',
    email: 'john.doe@unite-group.in',
    name: 'Unite Group Team',
    role: 'admin',
    status: 'active',
    last_login: '2024-03-20T10:30:00Z',
    created_at: '2024-01-15T08:00:00Z'
  },
  {
    id: '2',
    email: 'jane.smith@unite-group.in',
    name: 'Jane Smith',
    role: 'user',
    status: 'active',
    last_login: '2024-03-19T15:45:00Z',
    created_at: '2024-02-01T09:15:00Z'
  },
  {
    id: '3',
    email: 'mike.wilson@unite-group.in',
    name: 'Mike Wilson',
    role: 'moderator',
    status: 'suspended',
    last_login: '2024-03-18T12:20:00Z',
    created_at: '2024-01-20T14:30:00Z'
  }
]

const systemMetrics: SystemMetrics = {
  totalUsers: 1247,
  activeUsers: 892,
  totalMessages: 45632,
  totalProjects: 234,
  serverUptime: '99.9%',
  databaseSize: '2.3 GB',
  averageResponseTime: 245
}

export default function AdminPage() {
  const [selectedTab, setSelectedTab] = useState('overview')
  const [users, setUsers] = useState<AdminUser[]>(mockUsers)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-600/20 text-green-400 border-green-800">Active</Badge>
      case 'suspended':
        return <Badge className="bg-red-600/20 text-red-400 border-red-800">Suspended</Badge>
      case 'pending':
        return <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-800">Pending</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge className="bg-purple-600/20 text-purple-400 border-purple-800">Admin</Badge>
      case 'moderator':
        return <Badge className="bg-blue-600/20 text-blue-400 border-blue-800">Moderator</Badge>
      case 'user':
        return <Badge className="bg-slate-600/20 text-slate-400 border-slate-800">User</Badge>
      default:
        return <Badge>{role}</Badge>
    }
  }

  const updateUserStatus = (userId: string, newStatus: 'active' | 'suspended' | 'pending') => {
    setUsers(prev => 
      prev.map(user => 
        user.id === userId ? { ...user, status: newStatus } : user
      )
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="h-12 w-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <Shield className="h-6 w-6 text-purple-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
              <p className="text-slate-400">Manage users, system settings, and monitor performance</p>
            </div>
          </div>
        </motion.div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-8">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="system">System</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* System Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Total Users</p>
                        <p className="text-2xl font-bold text-white">{systemMetrics.totalUsers.toLocaleString()}</p>
                        <p className="text-xs text-green-400 mt-1">â†— 12% this month</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-blue-600/20 flex items-center justify-center">
                        <Users className="h-6 w-6 text-blue-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Active Users</p>
                        <p className="text-2xl font-bold text-white">{systemMetrics.activeUsers.toLocaleString()}</p>
                        <p className="text-xs text-green-400 mt-1">â†— 8% this week</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-green-600/20 flex items-center justify-center">
                        <Activity className="h-6 w-6 text-green-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Messages</p>
                        <p className="text-2xl font-bold text-white">{systemMetrics.totalMessages.toLocaleString()}</p>
                        <p className="text-xs text-green-400 mt-1">â†— 15% today</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-purple-600/20 flex items-center justify-center">
                        <MessageSquare className="h-6 w-6 text-purple-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
              >
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-slate-400">Projects</p>
                        <p className="text-2xl font-bold text-white">{systemMetrics.totalProjects}</p>
                        <p className="text-xs text-green-400 mt-1">â†— 5% this month</p>
                      </div>
                      <div className="h-12 w-12 rounded-lg bg-orange-600/20 flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-orange-400" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </div>

            {/* System Health */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Server Uptime</span>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400">{systemMetrics.serverUptime}</span>
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Database Size</span>
                    <span className="text-white">{systemMetrics.databaseSize}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Avg Response Time</span>
                    <span className="text-white">{systemMetrics.averageResponseTime}ms</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">CPU Usage</span>
                      <span className="text-white">34%</span>
                    </div>
                    <Progress value={34} className="h-2" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-slate-400">Memory Usage</span>
                      <span className="text-white">67%</span>
                    </div>
                    <Progress value={67} className="h-2" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-yellow-600/10 border border-yellow-600/20">
                    <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">High memory usage detected</p>
                      <p className="text-xs text-slate-400">Server load above 80% for 10 minutes</p>
                      <p className="text-xs text-slate-500">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-green-600/10 border border-green-600/20">
                    <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">Backup completed successfully</p>
                      <p className="text-xs text-slate-400">Daily backup finished without errors</p>
                      <p className="text-xs text-slate-500">6 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-blue-600/10 border border-blue-600/20">
                    <UserPlus className="h-4 w-4 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">New user registrations spike</p>
                      <p className="text-xs text-slate-400">25% increase in sign-ups today</p>
                      <p className="text-xs text-slate-500">1 day ago</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">User Management</CardTitle>
                    <CardDescription className="text-slate-400">
                      Manage user accounts, roles, and permissions
                    </CardDescription>
                  </div>
                  <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add User
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700">
                      <TableHead className="text-slate-300">User</TableHead>
                      <TableHead className="text-slate-300">Role</TableHead>
                      <TableHead className="text-slate-300">Status</TableHead>
                      <TableHead className="text-slate-300">Last Login</TableHead>
                      <TableHead className="text-right text-slate-300">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id} className="border-slate-700">
                        <TableCell>
                          <div>
                            <p className="font-medium text-white">{user.name || user.email}</p>
                            <p className="text-sm text-slate-400">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getRoleBadge(user.role)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(user.status)}
                        </TableCell>
                        <TableCell className="text-slate-300">
                          {new Date(user.last_login).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {user.status === 'active' ? (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateUserStatus(user.id, 'suspended')}
                              >
                                <Ban className="h-4 w-4" />
                              </Button>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => updateUserStatus(user.id, 'active')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Operations
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Database className="h-4 w-4 mr-2" />
                    Run Database Backup
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Settings className="h-4 w-4 mr-2" />
                    Optimize Database
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Query Performance
                  </Button>
                  <Button variant="outline" className="w-full justify-start border-slate-600">
                    <Shield className="h-4 w-4 mr-2" />
                    Security Audit
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Mail className="h-5 w-5" />
                    Email System
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Email Queue</span>
                    <span className="text-white">24 pending</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Daily Sent</span>
                    <span className="text-white">1,247</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Delivery Rate</span>
                    <span className="text-green-400">98.5%</span>
                  </div>
                  <Button variant="outline" className="w-full border-slate-600">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">System Configuration</CardTitle>
                <CardDescription className="text-slate-400">
                  Configure system-wide settings and preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">Security Settings</h3>
                    <Button variant="outline" className="w-full justify-start border-slate-600">
                      <Shield className="h-4 w-4 mr-2" />
                      Configure 2FA Settings
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-slate-600">
                      <Settings className="h-4 w-4 mr-2" />
                      Update Password Policy
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-slate-600">
                      <Clock className="h-4 w-4 mr-2" />
                      Session Timeout Settings
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium text-white">System Preferences</h3>
                    <Button variant="outline" className="w-full justify-start border-slate-600">
                      <Mail className="h-4 w-4 mr-2" />
                      Email Templates
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-slate-600">
                      <Settings className="h-4 w-4 mr-2" />
                      API Rate Limits
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-slate-600">
                      <Database className="h-4 w-4 mr-2" />
                      Backup Schedule
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
