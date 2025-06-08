import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, FileText, Mailbox } from 'lucide-react';
import EmailTimeline from '@/components/crm/EmailTimeline';
import { CallTimeline } from '@/components/crm/CallTimeline';
import { NotesTimeline } from '@/components/crm/NotesTimeline';
import { DocumentsTimeline } from '@/components/crm/DocumentsTimeline';

interface Client {
  id: string;
  name: string;
}

interface Deal {
  id: string;
  name: string;
}

interface User {
  id: string;
  full_name: string;
}

interface CommunicationItem {
  id: string;
  type: string;
  subject: string;
  content: string;
  created_at: string;
  related_client: Client[];
  related_deal: Deal[];
  user: User[];
}

interface CommunicationHubProps {
  communications: CommunicationItem[];
}

export default function CommunicationHub({ communications }: CommunicationHubProps) {
  // Categorize communications by type
  const emails = communications.filter(c => c.type === 'email');
  const calls = communications.filter(c => c.type === 'call');
  const notes = communications.filter(c => c.type === 'note');
  const documents = communications.filter(c => c.type === 'document');

  return (
    <Tabs defaultValue="emails" className="w-full">
      <TabsList className="grid grid-cols-4 bg-slate-800 border border-slate-700">
        <TabsTrigger value="emails" className="flex items-center gap-2 py-4">
          <Mail className="h-4 w-4" /> Emails
        </TabsTrigger>
        <TabsTrigger value="calls" className="flex items-center gap-2 py-4">
          <Phone className="h-4 w-4" /> Calls
        </TabsTrigger>
        <TabsTrigger value="notes" className="flex items-center gap-2 py-4">
          <FileText className="h-4 w-4" /> Notes
        </TabsTrigger>
        <TabsTrigger value="documents" className="flex items-center gap-2 py-4">
          <Mailbox className="h-4 w-4" /> Documents
        </TabsTrigger>
      </TabsList>

      <TabsContent value="emails">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Email Communications</CardTitle>
          </CardHeader>
          <CardContent>
            <EmailTimeline items={emails} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="calls">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Call Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <CallTimeline items={calls} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notes">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <NotesTimeline items={notes} />
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="documents">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Documents</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentsTimeline items={documents} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
