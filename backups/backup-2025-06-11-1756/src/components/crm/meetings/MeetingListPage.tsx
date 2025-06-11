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
  Calendar, 
  Clock, 
  Users,
  Video,
  MapPin,
  Phone,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MoreHorizontal
} from 'lucide-react'
import { ScheduleMeetingModal } from './ScheduleMeetingModal'

interface Meeting {
  id: string
  title: string
  description?: string
  scheduled_at: string
  end_time: string
  duration_minutes: number
  location?: string
  meeting_type: 'in_person' | 'video_call' | 'phone_call'
  meeting_url?: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  agenda?: string
  client?: {
    id: string
    name: string
    company?: string
  }
  organizer: {
    id: string
    full_name: string
    email: string
  }
  attendees: Array<{
    id: string
    attendee: {
      id: string
      full_name: string
      email: string
    }
    response_status: 'pending' | 'accepted' | 'declined'
  }>
  created_at: string
}

interface MeetingListPageProps {
  onMeetingSelect?: (meeting: Meeting) => void
}

export function MeetingListPage({ onMeetingSelect }: MeetingListPageProps) {
  const [meetings, setMeetings] = useState<Meeting[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const { toast } = useToast()

  const fetchMeetings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(statusFilter && { status: statusFilter }),
        ...(typeFilter && { meeting_type: typeFilter }),
        ...(searchTerm && { search: searchTerm })
      })

      const response = await fetch(`/api/crm/meetings?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth-token') || 'dev-token'}`
        }
      })

      if (response.ok) {
        const result = await response.json()
        setMeetings(result.data || [])
        setTotalPages(result.pagination?.totalPages || 1)
      } else {
        throw new Error('Failed to fetch meetings')
      }
    } catch (error) {
      console.error('Error fetching meetings:', error)
      toast({
        title: 'Error',
        description: 'Failed to load meetings',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMeetings()
  }, [currentPage, statusFilter, typeFilter])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm || searchTerm === '') {
        setCurrentPage(1)
        fetchMeetings()
      }
    }, 500)

    return () => clearTimeout(debounceTimer)
  }, [searchTerm])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'scheduled': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'in_progress': return <Clock className="h-4 w-4" />
      case 'scheduled': return <Calendar className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video_call': return <Video className="h-4 w-4" />
      case 'phone_call': return <Phone className="h-4 w-4" />
      case 'in_person': return <MapPin className="h-4 w-4" />
      default: return <Calendar className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'video_call': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
      case 'phone_call': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      case 'in_person': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleMeetingScheduled = () => {
    fetchMeetings()
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  }

  const isUpcoming = (dateString: string) => {
    return new Date(dateString) > new Date()
  }

  const getUpcomingMeetings = () => {
    return meetings.filter(m => isUpcoming(m.scheduled_at) && m.status === 'scheduled')
  }

  const getCompletedMeetings = () => {
    return meetings.filter(m => m.status === 'completed')
  }

  const getTodayMeetings = () => {
    const today = new Date().toDateString()
    return meetings.filter(m => new Date(m.scheduled_at).toDateString() === today)
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Meeting Management</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Schedule and manage meetings with clients and team members
          </p>
        </div>
        <ScheduleMeetingModal onMeetingScheduled={handleMeetingScheduled} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Meetings</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{meetings.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today&apos;s Meetings</p>
                <p className="text-2xl font-bold text-orange-600">{getTodayMeetings().length}</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Upcoming</p>
                <p className="text-2xl font-bold text-blue-600">{getUpcomingMeetings().length}</p>
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
                <p className="text-2xl font-bold text-green-600">{getCompletedMeetings().length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
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
                Unite Group="Search meetings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Statuses</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue Unite Group="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="video_call">Video Call</SelectItem>
                <SelectItem value="phone_call">Phone Call</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              onClick={() => {
                setStatusFilter('')
                setTypeFilter('')
                setSearchTerm('')
              }}
            >
              <Filter className="h-4 w-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meeting List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Meeting List</CardTitle>
        </CardHeader>
        <CardContent>
          {meetings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No meetings found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {searchTerm || statusFilter || typeFilter
                  ? 'Try adjusting your filters or search terms'
                  : 'Get started by scheduling your first meeting'
                }
              </p>
              {!searchTerm && !statusFilter && !typeFilter && (
                <ScheduleMeetingModal onMeetingScheduled={handleMeetingScheduled} />
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Meeting</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Participants</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {meetings.map((meeting) => {
                    const { date, time } = formatDateTime(meeting.scheduled_at)
                    return (
                      <TableRow 
                        key={meeting.id} 
                        className="cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                        onClick={() => onMeetingSelect?.(meeting)}
                      >
                        <TableCell>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{meeting.title}</p>
                            {meeting.description && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                                {meeting.description}
                              </p>
                            )}
                            {meeting.client && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400 mt-1">
                                <Users className="h-3 w-3" />
                                <span>{meeting.client.name}</span>
                                {meeting.client.company && <span>({meeting.client.company})</span>}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getTypeColor(meeting.meeting_type)}>
                            <div className="flex items-center gap-1">
                              {getTypeIcon(meeting.meeting_type)}
                              {meeting.meeting_type.replace('_', ' ')}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{date}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{time}</p>
                            <p className="text-xs text-gray-500">{meeting.duration_minutes} mins</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{meeting.organizer.full_name}</p>
                            {meeting.attendees.length > 0 && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                +{meeting.attendees.length} attendee{meeting.attendees.length !== 1 ? 's' : ''}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(meeting.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(meeting.status)}
                              {meeting.status}
                            </div>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Edit className="h-4 w-4" />
                            </Button>
                            {meeting.meeting_type === 'video_call' && meeting.meeting_url && (
                              <Button size="sm" variant="ghost">
                                <Video className="h-4 w-4" />
                              </Button>
                            )}
                            <Button size="sm" variant="ghost">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
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

export default MeetingListPage
