'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import EmailComposer from './EmailComposer';
import DocumentsSection from './DocumentsSection';
import NotesSection from './NotesSection';
import EmailTimeline from './EmailTimeline';

type EntityType = 'client' | 'project' | 'task';

interface CommunicationHubProps {
  entityType: EntityType;
  entityId: string;
  clientEmail?: string;
}

export default function CommunicationHub({
  entityType,
  entityId,
  clientEmail
}: CommunicationHubProps) {
  const [activeTab, setActiveTab] = useState('email');

  return (
    <div className="w-full p-4 border rounded-lg">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full">
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>
        
        <TabsContent value="email">
          <div className="space-y-4 mt-4">
            <EmailComposer 
              entityType={entityType}
              entityId={entityId}
              clientEmail={clientEmail} 
            />
            <EmailTimeline />
          </div>
        </TabsContent>
        
        <TabsContent value="notes">
          <NotesSection entityType={entityType} entityId={entityId} />
        </TabsContent>
        
        <TabsContent value="documents">
          <DocumentsSection entityType={entityType} entityId={entityId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
