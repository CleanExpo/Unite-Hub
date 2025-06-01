import { format } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ActivityLog } from '@/types/supabase';

interface ActivityItemProps {
  activity: ActivityLog;
}

export function ActivityItem({ activity }: ActivityItemProps) {
  const getActionText = () => {
    switch (activity.action) {
      case 'create': return 'created';
      case 'update': return 'updated';
      case 'delete': return 'deleted';
      default: return 'modified';
    }
  };

  const getIcon = () => {
    switch (activity.entity_type) {
      case 'clients': return '👤';
      case 'projects': return '📁';
      case 'tasks': return '✅';
      default: return '📝';
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center space-y-0">
        <Avatar className="h-9 w-9 mr-3">
          <AvatarImage src={activity.user?.avatar_url || ''} alt="User" />
          <AvatarFallback>{activity.user?.email?.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <CardTitle className="text-sm">
          <div className="font-medium">{activity.user?.email}</div>
          <div className="text-xs text-muted-foreground">
            {getActionText()} a {activity.entity_type} • {format(new Date(activity.created_at), 'MMM d, yyyy h:mm a')}
          </div>
        </CardTitle>
        <div className="ml-auto text-2xl">{getIcon()}</div>
      </CardHeader>
      <CardContent>
        {activity.new_values && (
          <div className="text-sm p-2 bg-green-50 rounded-md">
            <pre className="whitespace-pre-wrap">{JSON.stringify(activity.new_values, null, 2)}</pre>
          </div>
        )}
        {activity.old_values && (
          <div className="mt-2 text-sm p-2 bg-red-50 rounded-md">
            <pre className="whitespace-pre-wrap">{JSON.stringify(activity.old_values, null, 2)}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
