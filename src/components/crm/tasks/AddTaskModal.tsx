'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Loader2, CheckCircle, Users, Calendar, AlertTriangle } from 'lucide-react'

// ✅ Task form validation schema
const taskSchema = z.object({
  title: z.string().min(2, 'Task title must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  due_date: z.string().optional().or(z.literal('')),
  estimated_hours: z.number().positive().optional(),
  client_id: z.string().optional().or(z.literal('')),
  deal_id: z.string().optional().or(z.literal('')),
  assigned_to: z.string().optional().or(z.literal('')),
  tags: z.array(z.string()),
})

type TaskFormData = z.infer<typeof taskSchema>

interface Client {
  id: string
  name: string
  company?: string
}

interface Deal {
  id: string
  title: string
  value: number
  client: { name: string }
}

interface Staff {
  id: string
  full_name: string
  email: string
  job_title?: string
}

interface AddTaskModalProps {
  onTaskAdded?: (task: any) => void
  trigger?: React.ReactNode
  preselectedClientId?: string
  preselectedDealId?: string
}

export function AddTaskModal({ 
  onTaskAdded, 
  trigger, 
  preselectedClientId, 
  preselectedDealId 
}: AddTaskModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: '',
      estimated_hours: undefined,
      client_id: preselectedClientId || '',
      deal_id: preselectedDealId || '',
      assigned_to: '',
      tags: [],
    },
  })

  // Load data when modal opens
  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    setLoading(true)
    try {
      const authHeader = {
        'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
      }

      // Load clients, deals, and staff in parallel
      const [clientsRes, dealsRes, staffRes] = await Promise.all([
        fetch('/api/crm/clients?limit=50&status=active', { headers: authHeader }),
        fetch('/api/crm/deals?limit=50&status=open', { headers: authHeader }),
        fetch('/api/crm/staff?limit=50&is_active=true', { headers: authHeader })
      ])

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.data || [])
      }

      if (dealsRes.ok) {
        const dealsData = await dealsRes.json()
        setDeals(dealsData.data || [])
      }

      if (staffRes.ok) {
        const staffData = await staffRes.json()
        setStaff(staffData.data || [])
      }

    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (data: TaskFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Creating task with data:', data)
      
      const response = await fetch('/api/crm/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create task')
      }

      const result = await response.json()
      console.log('✅ Task created successfully:', result.data)

      // Success notification
      toast({
        title: '✅ Task Created Successfully',
        description: `"${data.title}" has been added to your task list.`,
        variant: 'default',
      })

      // Reset form and close modal
      form.reset()
      setOpen(false)

      // Notify parent component
      if (onTaskAdded) {
        onTaskAdded(result.data)
      }

    } catch (error) {
      console.error('❌ Error creating task:', error)
      toast({
        title: '❌ Error Creating Task',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-50'
      case 'high': return 'text-orange-600 bg-orange-50'
      case 'medium': return 'text-blue-600 bg-blue-50'
      case 'low': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-3 w-3" />
      case 'high': return <AlertTriangle className="h-3 w-3" />
      default: return <CheckCircle className="h-3 w-3" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Create Task
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-teal-600" />
            Create New Task
          </DialogTitle>
          <DialogDescription>
            Add a new task and assign it to team members with deadlines and priorities.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Basic Task Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Task Details
              </h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Task Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Follow up on client proposal" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Detailed description of what needs to be done..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Priority and Assignment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Priority & Timeline
                </h3>

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority Level</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getPriorityColor('low')}>
                                {getPriorityIcon('low')}
                                Low
                              </Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getPriorityColor('medium')}>
                                {getPriorityIcon('medium')}
                                Medium
                              </Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="high">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getPriorityColor('high')}>
                                {getPriorityIcon('high')}
                                High
                              </Badge>
                            </div>
                          </SelectItem>
                          <SelectItem value="urgent">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={getPriorityColor('urgent')}>
                                {getPriorityIcon('urgent')}
                                Urgent
                              </Badge>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="due_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Due Date</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="estimated_hours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="2.5"
                          min="0"
                          step="0.5"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || undefined)}
                        />
                      </FormControl>
                      <FormDescription>
                        How many hours do you expect this task to take?
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Assignment & Context
                </h3>

                <FormField
                  control={form.control}
                  name="assigned_to"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign To</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team member">
                              {loading ? "Loading..." : "Select team member"}
                            </SelectValue>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {staff.map((member) => (
                            <SelectItem key={member.id} value={member.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{member.full_name}</span>
                                {member.job_title && (
                                  <span className="text-sm text-gray-500">{member.job_title}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Leave empty to assign to yourself
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Client</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select client (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{client.name}</span>
                                {client.company && (
                                  <span className="text-sm text-gray-500">{client.company}</span>
                                )}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deal_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Related Deal</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select deal (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {deals.map((deal) => (
                            <SelectItem key={deal.id} value={deal.id}>
                              <div className="flex flex-col">
                                <span className="font-medium">{deal.title}</span>
                                <span className="text-sm text-gray-500">
                                  ${deal.value.toLocaleString()} • {deal.client?.name}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Task...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Task
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

export default AddTaskModal
