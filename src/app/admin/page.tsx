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
  name: string
  email: string
  role: 'admin' | 'moderator' | 'user'
  status: 'active' | 'suspended' | 'pending'
  lastLogin: string
  joinDate: string
}

interface SystemMetrics {
  totalUsers: number
  activeUsers: number
  pendingUsers: number
  suspendedUsers: number
  totalRevenue: number
  monthlyGrowth: number
}

const mockUsers: AdminUser[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'admin',
    status: 'active',
    lastLogin: '2024-01-15',
    joinDate: '2023-06-01'
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'moderator',
    status: 'active',
    lastLogin: '2024-01-14',
    joinDate: '2023-08-15'
  },
  {
    id: '3',
    name: 'Bob Johnson',
    email: 'bob@example.com',
    role: 'user',
    status: 'suspended',
    lastLogin: '2024-01-10',
    joinDate: '2023-12-01'
  }
]

const systemMetrics: SystemMetrics = {
  totalUsers: 1247,
  activeUsers: 1156,
  pendingUsers: 23,
  suspendedUsers: 68,
  totalRevenue: 45678,
  monthlyGrowth: 12.5
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
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-slate-400">Manage users, monitor system health, and oversee operations</p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800/50 border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                <BarChart3 className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-slate-700">
                <Users className="h-4 w-4 mr-2" />
                Users
              </TabsTrigger>
              <TabsTrigger value="system" className="data-[state=active]:bg-slate-700">
                <Server className="h-4 w-4 mr-2" />
                System
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-slate-700">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Total Users</CardTitle>
                    <Users className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemMetrics.totalUsers}</div>
                    <p className="text-xs text-slate-400">
                      +{systemMetrics.monthlyGrowth}% from last month
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Active Users</CardTitle>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemMetrics.activeUsers}</div>
                    <p className="text-xs text-slate-400">
                      {((systemMetrics.activeUsers / systemMetrics.totalUsers) * 100).toFixed(1)}% of total
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Pending Users</CardTitle>
                    <Clock className="h-4 w-4 text-yellow-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">{systemMetrics.pendingUsers}</div>
                    <p className="text-xs text-slate-400">Awaiting approval</p>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-slate-200">Revenue</CardTitle>
                    <CreditCard className="h-4 w-4 text-slate-400" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-white">${systemMetrics.totalRevenue.toLocaleString()}</div>
                    <p className="text-xs text-slate-400">This month</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">System Health</CardTitle>
                    <CardDescription className="text-slate-400">
                      Current system performance metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">CPU Usage</span>
                        <span className="text-slate-400">45%</span>
                      </div>
                      <Progress value={45} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Memory Usage</span>
                        <span className="text-slate-400">67%</span>
                      </div>
                      <Progress value={67} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-300">Disk Usage</span>
                        <span className="text-slate-400">23%</span>
                      </div>
                      <Progress value={23} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Recent Activity</CardTitle>
                    <CardDescription className="text-slate-400">
                      Latest system events and user actions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <UserPlus className="h-4 w-4 text-green-400" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-300">New user registered</p>
                          <p className="text-xs text-slate-500">2 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-4 w-4 text-blue-400" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-300">Security scan completed</p>
                          <p className="text-xs text-slate-500">15 minutes ago</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Database className="h-4 w-4 text-purple-400" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-300">Database backup completed</p>
                          <p className="text-xs text-slate-500">1 hour ago</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="users" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">User Management</CardTitle>
                  <CardDescription className="text-slate-400">
                    Manage user accounts, roles, and permissions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700">
                        <TableHead className="text-slate-300">Name</TableHead>
                        <TableHead className="text-slate-300">Email</TableHead>
                        <TableHead className="text-slate-300">Role</TableHead>
                        <TableHead className="text-slate-300">Status</TableHead>
                        <TableHead className="text-slate-300">Last Login</TableHead>
                        <TableHead className="text-slate-300">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-slate-700">
                          <TableCell className="text-slate-200">{user.name}</TableCell>
                          <TableCell className="text-slate-400">{user.email}</TableCell>
                          <TableCell>
                            {getRoleBadge(user.role)}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(user.status)}
                          </TableCell>
                          <TableCell className="text-slate-400">{user.lastLogin}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Eye className="h-3 w-3" />
                              </Button>
                              <Button size="sm" variant="outline" className="border-slate-600">
                                <Edit className="h-3 w-3" />
                              </Button>
                              {user.status === 'active' ? (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-red-600 text-red-400"
                                  onClick={() => updateUserStatus(user.id, 'suspended')}
                                >
                                  <Ban className="h-3 w-3" />
                                </Button>
                              ) : (
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="border-green-600 text-green-400"
                                  onClick={() => updateUserStatus(user.id, 'active')}
                                >
                                  <CheckCircle className="h-3 w-3" />
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
                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">Server Status</CardTitle>
                    <CardDescription className="text-slate-400">
                      Monitor server health and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">API Server</span>
                      <Badge className="bg-green-600/20 text-green-400 border-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Database</span>
                      <Badge className="bg-green-600/20 text-green-400 border-green-800">Online</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Cache Server</span>
                      <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-800">Warning</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">File Storage</span>
                      <Badge className="bg-green-600/20 text-green-400 border-green-800">Online</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-slate-800/50 border-slate-700">
                  <CardHeader>
                    <CardTitle className="text-slate-200">System Logs</CardTitle>
                    <CardDescription className="text-slate-400">
                      Recent system events and errors
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-start space-x-3">
                        <CheckCircle className="h-4 w-4 text-green-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-300">System backup completed successfully</p>
                          <p className="text-xs text-slate-500">2024-01-15 14:30:00</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-4 w-4 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-300">High memory usage detected</p>
                          <p className="text-xs text-slate-500">2024-01-15 14:15:00</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-3">
                        <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                        <div>
                          <p className="text-sm text-slate-300">Failed login attempt from suspicious IP</p>
                          <p className="text-xs text-slate-500">2024-01-15 13:45:00</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6">
              <Card className="bg-slate-800/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-slate-200">System Settings</CardTitle>
                  <CardDescription className="text-slate-400">
                    Configure system-wide settings and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-200">Security</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start border-slate-600">
                          <Shield className="h-4 w-4 mr-2" />
                          Configure 2FA Settings
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-slate-600">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Security Audit Log
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-slate-200">System</h3>
                      <div className="space-y-3">
                        <Button variant="outline" className="w-full justify-start border-slate-600">
                          <Database className="h-4 w-4 mr-2" />
                          Database Management
                        </Button>
                        <Button variant="outline" className="w-full justify-start border-slate-600">
                          <Server className="h-4 w-4 mr-2" />
                          Server Configuration
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  )
}
