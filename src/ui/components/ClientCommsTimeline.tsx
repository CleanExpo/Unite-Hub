'use client';

/**
 * Client Communications Timeline Component
 * Phase 51: Display client communication history
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Mail, Phone, Calendar, FileText, MessageSquare,
  ArrowRight, User, Clock
} from 'lucide-react';

interface Communication {
  id: string;
  type: 'email' | 'call' | 'meeting' | 'document' | 'note';
  title: string;
  summary: string;
  client_id: string;
  client_name: string;
  timestamp: string;
  sentiment?: 'positive' | 'neutral' | 'negative';
  action_items?: string[];
}

interface ClientCommsTimelineProps {
  communications: Communication[];
  onView?: (id: string) => void;
  onClientClick?: (clientId: string) => void;
}

const COMM_ICONS: Record<string, any> = {
  email: Mail,
  call: Phone,
  meeting: Calendar,
  document: FileText,
  note: MessageSquare,
};

const COMM_COLORS: Record<string, string> = {
  email: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  call: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  meeting: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  document: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  note: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
};

export function ClientCommsTimeline({
  communications,
  onView,
  onClientClick,
}: ClientCommsTimelineProps) {
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-500';
      case 'negative':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) {
      return `${days}d ago`;
    }
    if (hours > 0) {
      return `${hours}h ago`;
    }
    return 'Just now';
  };

  if (communications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Client Communications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            No communications to display
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Client Communications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {communications.map((comm, index) => {
            const Icon = COMM_ICONS[comm.type] || MessageSquare;
            const colorClass = COMM_COLORS[comm.type] || COMM_COLORS.note;
            const isLast = index === communications.length - 1;

            return (
              <div key={comm.id} className="flex gap-3">
                {/* Timeline indicator */}
                <div className="flex flex-col items-center">
                  <div className={`p-2 rounded-full ${colorClass}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  {!isLast && (
                    <div className="w-0.5 h-full bg-muted mt-2" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 pb-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-medium">{comm.title}</h4>
                      <button
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                        onClick={() => onClientClick?.(comm.client_id)}
                      >
                        <User className="h-3 w-3" />
                        {comm.client_name}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      {comm.sentiment && (
                        <span className={`text-xs ${getSentimentColor(comm.sentiment)}`}>
                          {comm.sentiment}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(comm.timestamp)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {comm.summary}
                  </p>

                  {/* Action items */}
                  {comm.action_items && comm.action_items.length > 0 && (
                    <div className="mt-2">
                      <div className="text-xs font-medium text-muted-foreground mb-1">
                        Action Items:
                      </div>
                      <div className="space-y-1">
                        {comm.action_items.slice(0, 2).map((item, i) => (
                          <div
                            key={i}
                            className="text-xs text-muted-foreground flex items-center gap-1"
                          >
                            <ArrowRight className="h-3 w-3 text-primary" />
                            {item}
                          </div>
                        ))}
                        {comm.action_items.length > 2 && (
                          <span className="text-xs text-muted-foreground">
                            +{comm.action_items.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {onView && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-6 text-xs"
                      onClick={() => onView(comm.id)}
                    >
                      View Details
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default ClientCommsTimeline;
