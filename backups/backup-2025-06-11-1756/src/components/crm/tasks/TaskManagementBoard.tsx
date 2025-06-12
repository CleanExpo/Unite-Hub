'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users,
  Calendar,
  Target,
  Search,
  Filter,
  Plus,
  MoreHorizontal
} from 'lucide-react'
import { AddTaskModal } from './AddTaskModal'

interface Task {
  id: string
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  due_date?: string
  estimated_hours?: number
  client?: {
    id: string
    name: string
    company?: string
  }
  assigned_to_profile?: {
    id: string
    full_name: string
    avatar_url?: string
  }
  created_at: string
}

interface TaskColumn {
  status: string
  title: string
  color: string
  icon: React.ReactNode
  tasks: Task[]
}

interface TaskManagementBoardProps {
  onTaskSelect?: (task: Task) => void
}

export function TaskManagementBoard({ onTaskSelect }: TaskManagementBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')
  const [assigneeFilter, setAssigneeFilter] = useState<string>('')
  const { toast } = useToast()

  const columns: TaskColumn[] = [
    {
      status: 'pending',
      title: 'To Do',
      color: '#6B7280',
      icon: <Clock className="h-4 w-4" />,
      tasks: []
    },
    {
      status: 'in_progress', 
      title: 'In Progress',
      color: '#3B82F6',
      icon: <AlertCircle className="h-4 w-4" />,
      tasks: []
    },
    {
      status: 'completed',
      title: 'Completed',
      color: '#10B981',
      icon: <CheckCircle2 className="h-4 w-4" />,
      tasks: []
    }
  ]

  const fetchTasks = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/crm/tasks?limit=100', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        const allTasks = result.data || []
        setTasks(allTasks)
        setFilteredTasks(allTasks)
      } else {
        throw new Error('Failed to fetch tasks')
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
      toast({
        title: 'Error',
        description: 'Failed to load tasks',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks()
  }, [])

  // Filter tasks based on search and filters
  useEffect(() => {
    let filtered = tasks

    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.client?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (priorityFilter) {
      filtered = filtered.filter(task => task.priority === priorityFilter)
    }

    if (assigneeFilter) {
      filtered = filtered.filter(task => task.assigned_to_profile?.id === assigneeFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, priorityFilter, assigneeFilter])

  const handleTaskAdded = () => {
    fetchTasks()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = date.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Tomorrow'
    if (diffDays === -1) return 'Yesterday'
    if (diffDays < 0) return `${Math.abs(diffDays)} days overdue`
    return `${diffDays} days left`
  }

  const isOverdue = (dateString: string) => {
    return new Date(dateString) < new Date()
  }

  // Organize tasks by status
  const organizedColumns = columns.map(col => ({
    ...col,
    tasks: filteredTasks.filter(task => task.status === col.status)
  }))

  const getUniqueAssignees = () => {
    const assignees = tasks
      .filter(task => task.assigned_to_profile)
      .map(task => task.assigned_to_profile!)
    
    return Array.from(new Map(assignees.map(a => [a.id, a])).values())
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Task Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Track and manage tasks across your team
          </p>
        </div>
        <AddTaskModal onTaskAdded={handleTaskAdded} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tasks</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{tasks.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">In Progress</p>
                <p className="text-2xl font-bold text-blue-600">
                  {tasks.filter(t => t.status === 'in_progress').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {tasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Overdue</p>
                <p className="text-2xl font-bold text-red-600">
                  {tasks.filter(t => t.due_date && isOverdue(t.due_date) && t.status !== 'completed').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-red-500" />
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
                Unite Group="Search tasks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Priorities</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>

            <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by assignee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Assignees</SelectItem>
                {getUniqueAssignees().map((assignee) => (
                  <SelectItem key={assignee.id} value={assignee.id}>
                    {assignee.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('')
                setPriorityFilter('')
                setAssigneeFilter('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Task Board */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {organizedColumns.map((column) => (
          <Card key={column.status} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle 
                  className="text-sm font-medium flex items-center gap-2"
                  style={{ color: column.color }}
                >
                  {column.icon}
                  {column.title}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {column.tasks.length}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="flex-1 space-y-3 pt-0">
              {column.tasks.map((task) => (
                <Card 
                  key={task.id}
                  className="cursor-pointer hover:shadow-md transition-shadow border-l-4"
                  style={{ borderLeftColor: column.color }}
                  onClick={() => onTaskSelect?.(task)}
                >
                  <CardContent className="p-3">
                    <div className="space-y-2">
                      <div className="flex items-start justify-between">
                        <h4 className="font-medium text-sm leading-tight">{task.title}</h4>
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </div>
                      
                      {task.description && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        
                        {task.estimated_hours && (
                          <Badge variant="outline" className="text-xs">
                            {task.estimated_hours}h
                          </Badge>
                        )}
                      </div>
                      
                      {task.client && (
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                          <Users className="h-3 w-3" />
                          <span>{task.client.name}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-xs">
                        {task.due_date && (
                          <div className={`flex items-center gap-1 ${
                            isOverdue(task.due_date) && task.status !== 'completed' 
                              ? 'text-red-600' 
                              : 'text-gray-600 dark:text-gray-400'
                          }`}>
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(task.due_date)}</span>
                          </div>
                        )}
                        
                        {task.assigned_to_profile && (
                          <div className="flex items-center gap-1">
                            <div className="w-4 h-4 bg-gray-300 rounded-full flex items-center justify-center">
                              <span className="text-xs">
                                {task.assigned_to_profile.full_name.charAt(0)}
                              </span>
                            </div>
                            <span className="truncate text-xs">{task.assigned_to_profile.full_name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {column.tasks.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  {column.icon}
                  <p className="text-sm mt-2">No tasks in {column.title.toLowerCase()}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default TaskManagementBoard
