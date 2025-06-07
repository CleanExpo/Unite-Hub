'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  MessageSquare, 
  FileText, 
  Users, 
  DollarSign, 
  CheckCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface Activity {
  id: string
  type: 'message' | 'project' | 'payment' | 'user' | 'system'
  title: string
  description?: string
  user: {
    name: string
    email: string
    avatar?: string
  }
  timestamp: Date
  metadata?: {
    amount?: number
    projectName?: string
    status?: string
  }
}

const activities: Activity[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message in #general',
    description: 'Sarah mentioned you in the project discussion',
    user: {
      name: 'Sarah Chen',
      email: 'sarah@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
  },
  {
    id: '2',
    type: 'project',
    title: 'Project milestone completed',
    description: 'Phase 2 of AI Implementation is now complete',
    user: {
      name: 'Michael Torres',
      email: 'michael@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    metadata: {
      projectName: 'AI Implementation',
      status: 'completed'
    }
  },
  {
    id: '3',
    type: 'payment',
    title: 'Payment received',
    description: 'Invoice #INV-2024-003 has been paid',
    user: {
      name: 'System',
      email: 'system@unitegroup.com'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    metadata: {
      amount: 15000
    }
  },
  {
    id: '4',
    type: 'user',
    title: 'New team member joined',
    description: 'Alex Kim has joined the development team',
    user: {
      name: 'Alex Kim',
      email: 'alex@example.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex'
    },
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
  }
]

export function ActivityFeed() {
  const getActivityIcon = (type: Activity['type']) => {
    switch (type) {
      case 'message':
        return <MessageSquare className="h-4 w-4" />
      case 'project':
        return <FileText className="h-4 w-4" />
      case 'payment':
        return <DollarSign className="h-4 w-4" />
      case 'user':
        return <Users className="h-4 w-4" />
      case 'system':
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: Activity['type']) => {
    switch (type) {
      case 'message':
        return 'text-blue-500 bg-blue-50'
      case 'project':
        return 'text-purple-500 bg-purple-50'
      case 'payment':
        return 'text-green-500 bg-green-50'
      case 'user':
        return 'text-orange-500 bg-orange-50'
      case 'system':
        return 'text-gray-500 bg-gray-50'
    }
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Recent Activity</span>
          <Badge variant="secondary" className="text-xs">
            Live
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.map((activity) => (
              <div key={activity.id} className="flex gap-3">
                <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">{activity.title}</p>
                      {activity.description && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {activity.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatDistanceToNow(activity.timestamp, { addSuffix: true })}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Avatar className="h-5 w-5">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback className="text-xs">
                        {activity.user.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-muted-foreground">
                      {activity.user.name}
                    </span>
                    
                    {activity.metadata?.amount && (
                      <Badge variant="secondary" className="text-xs ml-auto">
                        ${activity.metadata.amount.toLocaleString()}
                      </Badge>
                    )}
                    
                    {activity.metadata?.status && (
                      <Badge 
                        variant={activity.metadata.status === 'completed' ? 'default' : 'secondary'} 
                        className="text-xs ml-auto"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {activity.metadata.status}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
