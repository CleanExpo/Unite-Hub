'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  Calendar,
  Users,
  Plus,
  Filter,
  Search
} from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed' | 'overdue'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee: string
  dueDate: string
  createdAt: string
  completedAt?: string
  client?: string
  project?: string
  tags: string[]
}

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Update website homepage',
    description: 'Redesign the homepage layout and update content',
    status: 'in-progress',
    priority: 'high',
    assignee: 'John Doe',
    dueDate: '2024-02-15',
    createdAt: '2024-01-15',
    client: 'Tech Corp',
    project: 'Website Redesign',
    tags: ['design', 'frontend']
  },
  {
    id: '2',
    title: 'Database optimization',
    description: 'Optimize database queries for better performance',
    status: 'todo',
    priority: 'medium',
    assignee: 'Jane Smith',
    dueDate: '2024-02-20',
    createdAt: '2024-01-20',
    client: 'Enterprise Ltd',
    project: 'Database Migration',
    tags: ['backend', 'performance']
  },
  {
    id: '3',
    title: 'Client meeting preparation',
    description: 'Prepare presentation for quarterly review',
    status: 'completed',
    priority: 'high',
    assignee: 'Bob Johnson',
    dueDate: '2024-01-30',
    createdAt: '2024-01-25',
    completedAt: '2024-01-29',
    client: 'StartupXYZ',
    tags: ['meeting', 'presentation']
  },
  {
    id: '4',
    title: 'Security audit',
    description: 'Conduct comprehensive security audit',
    status: 'overdue',
    priority: 'urgent',
    assignee: 'Alice Wilson',
    dueDate: '2024-01-25',
    createdAt: '2024-01-10',
    client: 'Tech Corp',
    tags: ['security', 'audit']
  }
]

const priorities = ['All', 'urgent', 'high', 'medium', 'low']
const statuses = ['All', 'todo', 'in-progress', 'completed', 'overdue']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks)
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(mockTasks)
  const [selectedStatus, setSelectedStatus] = useState('All')
  const [selectedPriority, setSelectedPriority] = useState('All')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    let filtered = tasks

    if (selectedStatus !== 'All') {
      filtered = filtered.filter(task => task.status === selectedStatus)
    }

    if (selectedPriority !== 'All') {
      filtered = filtered.filter(task => task.priority === selectedPriority)
    }

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.assignee.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    setFilteredTasks(filtered)
  }, [tasks, selectedStatus, selectedPriority, searchTerm])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>
      case 'in-progress':
        return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>
      case 'todo':
        return <Badge className="bg-gray-100 text-gray-800">To Do</Badge>
      case 'overdue':
        return <Badge className="bg-red-100 text-red-800">Overdue</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{status}</Badge>
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <Badge className="bg-red-100 text-red-800">Urgent</Badge>
      case 'high':
        return <Badge className="bg-orange-100 text-orange-800">High</Badge>
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>
      case 'low':
        return <Badge className="bg-green-100 text-green-800">Low</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-800">{priority}</Badge>
    }
  }

  const getTaskStats = () => {
    const total = tasks.length
    const completed = tasks.filter(t => t.status === 'completed').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const overdue = tasks.filter(t => t.status === 'overdue').length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    return { total, completed, inProgress, overdue, completionRate }
  }

  const stats = getTaskStats()

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Tasks</h1>
          <p className="text-gray-600 dark:text-gray-300">Manage and track task progress</p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add New Task
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completionRate.toFixed(1)}%</div>
            <Progress value={stats.completionRate} className="mt-2 h-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
            <p className="text-xs text-muted-foreground">Active tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
            <p className="text-xs text-muted-foreground">Need attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Status:</span>
              <select 
                value={selectedStatus} 
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">Priority:</span>
              <select 
                value={selectedPriority} 
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              >
                {priorities.map(priority => (
                  <option key={priority} value={priority}>{priority}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4" />
              <input
                type="text"
                placeholder="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border rounded px-2 py-1 text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tasks List */}
      <div className="space-y-4">
        {filteredTasks.map((task) => (
          <Card key={task.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg">{task.title}</CardTitle>
                  <CardDescription>{task.description}</CardDescription>
                </div>
                <div className="flex space-x-2">
                  {getStatusBadge(task.status)}
                  {getPriorityBadge(task.priority)}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Assignee:</span>
                  <p className="font-medium">{task.assignee}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Due Date:</span>
                  <p className="font-medium">{new Date(task.dueDate).toLocaleDateString()}</p>
                </div>
                {task.client && (
                  <div>
                    <span className="text-sm text-gray-600">Client:</span>
                    <p className="font-medium">{task.client}</p>
                  </div>
                )}
              </div>
              
              {task.project && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Project:</span>
                  <p className="font-medium">{task.project}</p>
                </div>
              )}

              {task.tags.length > 0 && (
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Tags:</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {task.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex space-x-2 mt-4">
                <Button variant="outline" size="sm">
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                {task.status !== 'completed' && (
                  <Button size="sm">
                    Mark Complete
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTasks.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <p className="text-gray-500">No tasks found matching your criteria.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
