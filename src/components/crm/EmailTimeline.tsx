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
                <AvatarFallback>UG</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-slate-200">{item.subject}</h4>
                  <span className="text-xs text-slate-400">
                    {format(new Date(item.timestamp), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  {item.type === 'email' ? `To: ${item.recipient}` : `From: ${item.sender}`}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-300">{item.content}</p>
            {item.attachments && item.attachments.length > 0 && (
              <div className="mt-2">
                <p className="text-xs text-slate-400 mb-1">Attachments:</p>
                <div className="flex flex-wrap gap-1">
                  {item.attachments.map((attachment, index) => (
                    <span key={index} className="text-xs bg-slate-600 px-2 py-1 rounded">
                      {attachment}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
