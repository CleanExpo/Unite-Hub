'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <string> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <string> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <Crown className="h-4 w-4" /> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <Shield className="h-4 w-4" /> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <Users className="h-4 w-4" /> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" /> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4"> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium"> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" </p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" /> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div> 'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useToast } from '@/components/ui/use-toast'
import { 
  Users, 
  UserCheck,
  UserX,
  Crown,
  Shield,
  Search,
  Filter,
  Plus,
  Mail,
  Phone,
  Calendar,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2
} from 'lucide-react'

interface StaffMember {
  id: string
  user_id: string
  full_name: string
  email: string
  job_title?: string
  department?: string
  role: 'admin' | 'manager' | 'staff' | 'viewer'
  is_active: boolean
  hire_date?: string
  phone?: string
  avatar_url?: string
  permissions: string[]
  created_at: string
  last_login?: string
}

interface StaffManagementPageProps {
  onStaffSelect?: (staff: StaffMember) => void
}

export function StaffManagementPage({ onStaffSelect }: StaffManagementPageProps) {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchStaff = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(roleFilter && { role: roleFilter }),
        ...(statusFilter && { is_active: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/staff?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setStaff(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch staff')
      }
    } catch (error) {
      console.error('Error fetching staff:', error)
      toast({
        title: 'Error',
        description: 'Failed to load staff members',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaff()
  }, [currentPage, roleFilter, statusFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchStaff()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'manager': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      case 'staff': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'viewer': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Crown className="h-4 w-4" />
      case 'manager': return <Shield className="h-4 w-4" />
      case 'staff': return <Users className="h-4 w-4" />
      case 'viewer': return <Eye className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getStatusColor = (isActive: boolean) => {
    return isActive 
      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
  }

  const formatDate = (dateString: string | undefined) => {
    return dateString ? new Date(dateString).toLocaleDateString() : 'N/A'
  }

  const getActiveStaffCount = () => {
    return staff.filter(s => s.is_active).length
  }

  const getInactiveStaffCount = () => {
    return staff.filter(s => !s.is_active).length
  }

  const getAdminCount = () => {
    return staff.filter(s => s.role === 'admin').length
  }

  const getManagerCount = () => {
    return staff.filter(s => s.role === 'manager').length
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Staff Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Manage team members, roles, and permissions
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Invite Staff
          </Button>
          <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff Member
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Staff</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{staff.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Members</p>
                <p className="text-2xl font-bold text-green-600">{getActiveStaffCount()}</p>
              </div>
              <UserCheck className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Administrators</p>
                <p className="text-2xl font-bold text-purple-600">{getAdminCount()}</p>
              </div>
              <Crown className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Managers</p>
                <p className="text-2xl font-bold text-orange-600">{getManagerCount()}</p>
              </div>
              <Shield className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                Unite Group="Search staff..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Roles</SelectItem>
                <SelectItem value="admin">Administrator</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Status</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setRoleFilter('')
                setStatusFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Staff List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Team Members</CardTitle>
        </CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No staff members found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || roleFilter || statusFilter 
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by adding your first team member'
                }
              </p>
              {!searchTerm && !roleFilter && !statusFilter && (
                <Button className="bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Staff Member
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {staff.map((member) => (
                    <TableRow 
                      key={member.id} 
                      className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                      onClick={() => onStaffSelect?.(member)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-teal-400 to-blue-500 rounded-full flex items-center justify-center text-white font-medium">
                            {member.full_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{member.full_name}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                              <div className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                <span>{member.email}</span>
                              </div>
                              {member.phone && (
                                <div className="flex items-center gap-1">
                                  <Phone className="h-3 w-3" />
                                  <span>{member.phone}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(member.role)}>
                          <div className="flex items-center gap-1">
                            {getRoleIcon(member.role)}
                            {member.role}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{member.department || 'N/A'}</p>
                          {member.job_title && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">{member.job_title}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(member.is_active)}>
                          <div className="flex items-center gap-1">
                            {member.is_active ? <UserCheck className="h-3 w-3" /> : <UserX className="h-3 w-3" />}
                            {member.is_active ? 'Active' : 'Inactive'}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        {member.last_login ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(member.last_login)}</span>
                          </div>
                        ) : (
                          'Never'
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
.Value -replace "'", "'" </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="sm" variant="ghost">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <Mail className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} of {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default StaffManagementPage
