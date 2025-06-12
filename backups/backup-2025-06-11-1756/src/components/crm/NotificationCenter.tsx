'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, X } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
}

export default function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    // Connect to WebSocket server
    const websocket = new WebSocket('wss://your-websocket-server.com');

    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);
      if (message.type === 'notification') {
        setNotifications(prev => [
          {
            id: Date.now().toString(),
            title: message.title,
            message: message.content,
            timestamp: new Date().toISOString(),
            read: false
          },
          ...prev
        ]);
      }
    };

    // Load initial notifications
    const fetchNotifications = async () => {
      try {
        const response = await fetch('/api/crm/notifications');
        if (!response.ok) throw new Error('Failed to fetch notifications');
        const data = await response.json();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };
    
    fetchNotifications();

    return () => {
      if (websocket) websocket.close();
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? {...n, read: true} : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 z-50">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex items-center">
            <Bell className="h-5 w-5 mr-2" />
            <CardTitle>Notifications</CardTitle>
          </div>
        <Button variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="p-0 max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No notifications</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div 
                  key={notification.id} 
                  className={`p-4 ${notification.read ? 'bg-white' : 'bg-blue-50'}`}
                >
                  <div className="flex justify-between">
                    <h3 className="font-medium">{notification.title}</h3>
                    <div className="flex space-x-2">
                      {!notification.read && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => markAsRead(notification.id)}
                        >
                          Mark as read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
