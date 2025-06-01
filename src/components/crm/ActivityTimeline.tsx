import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';

interface Activity {
  id: string;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  details: Record<string, unknown> | null;
  created_at: string;
  user: {
    full_name: string;
    avatar_url: string | null;
  };
}

interface ActivityTimelineProps {
  resourceType: 'client' | 'project' | 'task';
  resourceId: string;
}

const actionLabels: Record<string, string> = {
  create: 'created',
  update: 'updated',
  delete: 'deleted',
  note: 'added a note',
  call: 'logged a call',
  email: 'sent an email',
  meeting: 'scheduled a meeting'
};

export default function ActivityTimeline({ resourceType, resourceId }: ActivityTimelineProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await fetch(`/api/crm/activities?resource=${resourceType}&id=${resourceId}`);
        if (!response.ok) throw new Error('Failed to fetch activities');
        
        const data = await response.json();
        setActivities(data);
      } catch (error) {
        console.error('Error fetching activities:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [resourceType, resourceId]);

  if (loading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (activities.length === 0) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Activity Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No activity yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Activity Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {activities.map(activity => (
            <div key={activity.id} className="flex items-start space-x-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                {activity.user.full_name[0]?.toUpperCase()}
              </div>
              <div>
                <div className="flex items-baseline">
                  <p className="font-medium">{activity.user.full_name}</p>
                  <span className="mx-2 text-gray-500">•</span>
                  <p className="text-sm text-gray-500">
                    {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <p className="mt-1">
                  <span className="font-medium">{actionLabels[activity.action] || activity.action}</span> this {resourceType}
                </p>
                
                {activity.details && (
                  <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                    <pre className="text-sm whitespace-pre-wrap">
                      {JSON.stringify(activity.details, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
