import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import { CommunicationItem } from '@/types/crm';

export function CallTimeline({ items }: { items: CommunicationItem[] }) {
  return (
    <div className="space-y-4">
      {items.map((item) => (
        <Card key={item.id} className="bg-slate-750 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-white">{item.subject}</CardTitle>
            <div className="text-xs text-slate-400">
              {format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-slate-300 text-sm">{item.content}</div>
            <div className="mt-2 text-xs text-slate-500">
              Duration: 15 minutes {/* Placeholder for call duration */}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
