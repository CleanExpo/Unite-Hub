'use client'

import { useState } from 'react'
import { Bell, Check, X, MessageSquare, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'

interface Notification {
  id: string
  type: 'info' | 'success' | 'warning' | 'error' | 'message'
  title: string
  description?: string
  read: boolean
  timestamp: Date
  avatar?: string
  actions?: {
    label: string
    action: () => void
  }[]
}

const notifications: Notification[] = [
  {
    id: '1',
    type: 'message',
    title: 'New message from Sarah Chen',
    description: 'Hey, can we discuss the AI implementation timeline?',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah'
  },
  {
    id: '2',
    type: 'success',
    title: 'Project deployed successfully',
    description: 'Your SaaS platform has been deployed to production',
    read: false,
    timestamp: new Date(Date.now() - 1000 * 60 * 30)
  },
  {
    id: '3',
    type: 'warning',
    title: 'API rate limit warning',
    description: 'You\'ve used 80% of your monthly API quota',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2)
  },
  {
    id: '4',
    type: 'info',
    title: 'System maintenance scheduled',
    description: 'Maintenance window: Sunday 2AM-4AM UTC',
    read: true,
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24)
  }
]

export function NotificationCenter() {
  const [open, setOpen] = useState(false)
  const [notificationList, setNotificationList] = useState(notifications)
  
  const unreadCount = notificationList.filter(n => !n.read).length
  
  const markAsRead = (id: string) => {
    setNotificationList(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    )
  }
  
  const markAllAsRead = () => {
    setNotificationList(prev => 
      prev.map(n => ({ ...n, read: true }))
    )
  }
  
  const deleteNotification = (id: string) => {
    setNotificationList(prev => prev.filter(n => n.id !== id))
  }
  
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return <Info className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'warning':
        return <AlertCircle className="h-4 w-4" />
      case 'error':
        return <X className="h-4 w-4" />
      case 'message':
        return <MessageSquare className="h-4 w-4" />
    }
  }
  
  const getIconColor = (type: Notification['type']) => {
    switch (type) {
      case 'info':
        return 'text-blue-500 bg-blue-50'
      case 'success':
        return 'text-green-500 bg-green-50'
      case 'warning':
        return 'text-yellow-500 bg-yellow-50'
      case 'error':
        return 'text-red-500 bg-red-50'
      case 'message':
        return 'text-purple-500 bg-purple-50'
    }
  }
  
  const unreadNotifications = notificationList.filter(n => !n.read)
  const readNotifications = notificationList.filter(n => n.read)
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Notifications</h3>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                Mark all as read
              </Button>
            )}
          </div>
        </div>
        
        <Tabs defaultValue="unread" className="w-full">
          <TabsList className="w-full rounded-none border-b">
            <TabsTrigger value="unread" className="flex-1">
              Unread ({unreadCount})
            </TabsTrigger>
            <TabsTrigger value="all" className="flex-1">
              All ({notificationList.length})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="unread" className="m-0">
            <ScrollArea className="h-[400px]">
              {unreadNotifications.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-20" />
                  <p>No unread notifications</p>
                </div>
              ) : (
                <div className="divide-y">
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                      getIcon={getIcon}
                      getIconColor={getIconColor}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="all" className="m-0">
            <ScrollArea className="h-[400px]">
              <div className="divide-y">
                {notificationList.map((notification) => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onMarkAsRead={markAsRead}
                    onDelete={deleteNotification}
                    getIcon={getIcon}
                    getIconColor={getIconColor}
                  />
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  )
}

interface NotificationItemProps {
  notification: Notification
  onMarkAsRead: (id: string) => void
  onDelete: (id: string) => void
  getIcon: (type: Notification['type']) => React.ReactNode
  getIconColor: (type: Notification['type']) => string
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  getIcon,
  getIconColor
}: NotificationItemProps) {
  return (
    <div 
      className={cn(
        "p-4 hover:bg-muted/50 transition-colors",
        !notification.read && "bg-muted/20"
      )}
    >
      <div className="flex gap-3">
        {notification.avatar ? (
          <Avatar className="h-8 w-8">
            <AvatarImage src={notification.avatar} />
            <AvatarFallback>
              {notification.title.charAt(0)}
            </AvatarFallback>
          </Avatar>
        ) : (
          <div className={cn("p-2 rounded-lg", getIconColor(notification.type))}>
            {getIcon(notification.type)}
          </div>
        )}
        
        <div className="flex-1 space-y-1">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium leading-none">
                {notification.title}
              </p>
              {notification.description && (
                <p className="text-sm text-muted-foreground">
                  {notification.description}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              {!notification.read && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={() => onMarkAsRead(notification.id)}
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(notification.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
          
          {notification.actions && (
            <div className="flex gap-2 mt-2">
              {notification.actions.map((action, index) => (
                <Button
                  key={index}
                  size="sm"
                  variant="outline"
                  onClick={action.action}
                  className="h-7 text-xs"
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
