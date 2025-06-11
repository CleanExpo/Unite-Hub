import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CommunicationItem } from '@/types/crm';

export default function EmailTimeline({ items }: { items: CommunicationItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="bg-slate-750 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/Unite Group-avatar.jpg" />
                <AvatarFallback> import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CommunicationItem } from '@/types/crm';

export default function EmailTimeline({ items }: { items: CommunicationItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="bg-slate-750 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/Unite Group-avatar.jpg" />
                <AvatarFallback>{item.user[0]?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm text-white">{item.subject}</CardTitle>
                <div className="text-xs text-slate-400">
                  {item.user[0]?.full_name} • {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-slate-300 text-sm">{item.content}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
.Value -replace "'", "'" </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm text-white">{item.subject}</CardTitle>
                <div className="text-xs text-slate-400"> import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { CommunicationItem } from '@/types/crm';

export default function EmailTimeline({ items }: { items: CommunicationItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="bg-slate-750 border-slate-700">
          <CardHeader className="pb-2">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src="/Unite Group-avatar.jpg" />
                <AvatarFallback>{item.user[0]?.full_name?.charAt(0) || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-sm text-white">{item.subject}</CardTitle>
                <div className="text-xs text-slate-400">
                  {item.user[0]?.full_name} • {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-slate-300 text-sm">{item.content}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
.Value -replace "'", "'" </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-slate-300 text-sm">{item.content}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
