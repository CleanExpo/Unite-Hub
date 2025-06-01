'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function EmailTimeline() {
  // TODO: Fetch emails from API
  const emails = [
    { id: 1, subject: 'Project Update', date: '2025-05-30' },
    { id: 2, subject: 'Meeting Notes', date: '2025-05-28' },
  ];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle>Email History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 overflow-y-auto">
          <div className="space-y-4">
            {emails.map(email => (
              <div key={email.id} className="border-b pb-2">
                <div className="font-medium">{email.subject}</div>
                <div className="text-sm text-gray-500">{email.date}</div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
