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
import { Plus, Loader2, Calendar, Users, MapPin, Video, Clock } from 'lucide-react'

// 📅 Meeting form validation schema
const meetingSchema = z.object({
  title: z.string().min(2, 'Meeting title must be at least 2 characters'),
  description: z.string().optional().or(z.literal('')),
  scheduled_at: z.string().min(1, 'Please select date and time'),
  duration_minutes: z.number().min(15, 'Meeting must be at least 15 minutes'),
  meeting_type: z.enum(['in_person', 'video_call', 'phone_call']),
  location: z.string().optional().or(z.literal('')),
  meeting_url: z.string().optional().or(z.literal('')),
  client_id: z.string().optional().or(z.literal('')),
  attendees: z.array(z.string()),
  agenda: z.string().optional().or(z.literal('')),
})

type MeetingFormData = z.infer<typeof meetingSchema>

interface Client {
  id: string
  name: string
  email: string
  company?: string
}

interface Staff {
  id: string
  full_name: string
  email: string
  job_title?: string
}

interface ScheduleMeetingModalProps {
  onMeetingScheduled?: (meeting: any) => void
  trigger?: React.ReactNode
  preselectedClientId?: string
}

export function ScheduleMeetingModal({ 
  onMeetingScheduled, 
  trigger, 
  preselectedClientId 
}: ScheduleMeetingModalProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [staff, setStaff] = useState<Staff[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const form = useForm<MeetingFormData>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: '',
      description: '',
      scheduled_at: '',
      duration_minutes: 60,
      meeting_type: 'video_call',
      location: '',
      meeting_url: '',
      client_id: preselectedClientId || '',
      attendees: [],
      agenda: '',
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

      // Load clients and staff in parallel
      const [clientsRes, staffRes] = await Promise.all([
        fetch('/api/crm/clients?limit=50&status=active', { headers: authHeader }),
        fetch('/api/crm/staff?limit=50&is_active=true', { headers: authHeader })
      ])

      if (clientsRes.ok) {
        const clientsData = await clientsRes.json()
        setClients(clientsData.data || [])
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

  const handleSubmit = async (data: MeetingFormData) => {
    setIsSubmitting(true)
    
    try {
      console.log('🔄 Scheduling meeting with data:', data)
      
      const response = await fetch('/api/crm/meetings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to schedule meeting')
      }

      const result = await response.json()
      console.log('✅ Meeting scheduled successfully:', result.data)

      // Success notification
      toast({
        title: '✅ Meeting Scheduled Successfully',
        description: `"${data.title}" has been added to your calendar.`,
        variant: 'default',
      })

      // Reset form and close modal
      form.reset()
      setOpen(false)

      // Notify parent component
      if (onMeetingScheduled) {
        onMeetingScheduled(result.data)
      }

    } catch (error) {
      console.error('❌ Error scheduling meeting:', error)
      toast({
        title: '❌ Error Scheduling Meeting',
        description: error instanceof Error ? error.message : 'An unexpected error occurred',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDateTime = () => {
    const now = new Date()
    now.setMinutes(now.getMinutes() + 30) // Default to 30 minutes from now
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(Math.round(now.getMinutes() / 15) * 15).padStart(2, '0')
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  const getMeetingTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="h-4 w-4" />
      case 'phone_call': return <Calendar className="h-4 w-4" />
      case 'in_person': return <MapPin className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white">
            <Calendar className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        )}
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-blue-600" />
            Schedule Meeting
          </DialogTitle>
          <DialogDescription>
            Schedule a meeting with clients or team members and send calendar invitations.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Meeting Basic Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Meeting Details
              </h3>
              
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meeting Title *</FormLabel>
                    <FormControl>
                      <Input placeholder="Weekly project check-in" {...field} />
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
                        placeholder="Meeting purpose and key discussion points..."
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Date, Time & Duration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Schedule
                </h3>

                <FormField
                  control={form.control}
                  name="scheduled_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date & Time *</FormLabel>
                      <FormControl>
                        <Input
                          type="datetime-local"
                          {...field}
                          min={new Date().toISOString().slice(0, 16)}
                          defaultValue={formatDateTime()}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="15">15 minutes</SelectItem>
                          <SelectItem value="30">30 minutes</SelectItem>
                          <SelectItem value="60">1 hour</SelectItem>
                          <SelectItem value="90">1.5 hours</SelectItem>
                          <SelectItem value="120">2 hours</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Meeting Type
                </h3>

                <FormField
                  control={form.control}
                  name="meeting_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Meeting Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="video_call">
                            <div className="flex items-center gap-2">
                              <Video className="h-4 w-4" />
                              Video Call
                            </div>
                          </SelectItem>
                          <SelectItem value="phone_call">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4" />
                              Phone Call
                            </div>
                          </SelectItem>
                          <SelectItem value="in_person">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              In Person
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch('meeting_type') === 'video_call' && (
                  <FormField
                    control={form.control}
                    name="meeting_url"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meeting URL</FormLabel>
                        <FormControl>
                          <Input placeholder="https://zoom.us/j/123456789" {...field} />
                        </FormControl>
                        <FormDescription>
                          Zoom, Teams, or other video conference link
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {form.watch('meeting_type') === 'in_person' && (
                  <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                          <Input placeholder="Conference Room A, 123 Main St" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </div>

            {/* Participants */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Client (Optional)</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select client">
                            {loading ? "Loading..." : "Select client"}
                          </SelectValue>
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

              <div className="space-y-2">
                <FormLabel>Team Attendees (Optional)</FormLabel>
                <div className="max-h-32 overflow-y-auto border rounded-lg p-2">
                  {staff.map((member) => (
                    <div key={member.id} className="flex items-center space-x-2 p-1">
                      <input
                        type="checkbox"
                        id={`attendee-${member.id}`}
                        className="rounded"
                        onChange={(e) => {
                          const currentAttendees = form.getValues('attendees')
                          if (e.target.checked) {
                            form.setValue('attendees', [...currentAttendees, member.id])
                          } else {
                            form.setValue('attendees', currentAttendees.filter(id => id !== member.id))
                          }
                        }}
                      />
                      <label htmlFor={`attendee-${member.id}`} className="text-sm">
                        {member.full_name}
                        {member.job_title && (
                          <span className="text-gray-500 ml-1">({member.job_title})</span>
                        )}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Agenda */}
            <FormField
              control={form.control}
              name="agenda"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Meeting Agenda</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="1. Review project status&#10;2. Discuss upcoming milestones&#10;3. Address any blockers&#10;4. Next steps"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Outline the key topics and structure for the meeting
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                className="bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
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

export default ScheduleMeetingModal
