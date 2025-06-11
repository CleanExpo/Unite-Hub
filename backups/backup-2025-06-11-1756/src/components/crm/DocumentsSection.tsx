'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { File, Plus, Trash } from 'lucide-react';
import { format } from 'date-fns';

interface Document {
  id: string;
  name: string;
  url: string;
  entity_type: 'client' | 'project' | 'task';
  entity_id: string;
  created_at: string;
  user_id: string;
  profiles?: {
    email: string;
    full_name?: string;
  };
}

interface DocumentsSectionProps {
  entityType: 'client' | 'project' | 'task';
  entityId: string;
}

export default function DocumentsSection({ entityType, entityId }: DocumentsSectionProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, [entityType, entityId]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/crm/documents?entity_type=${entityType}&entity_id=${entityId}`
      );
      if (!response.ok) throw new Error('Failed to fetch documents');
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Error fetching documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    formData.append('file', files[0]);
    formData.append('entity_type', entityType);
    formData.append('entity_id', entityId);
    formData.append('name', files[0].name);

    try {
      const response = await fetch('/api/crm/documents', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) throw new Error('Failed to upload document');
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading document:', error);
    }
  };

  const deleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      const response = await fetch(`/api/crm/documents?id=${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete document');
      fetchDocuments();
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (loading) {
    return <div className="p-4 text-center">Loading documents...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <File className="h-5 w-5" />
            <span>Documents</span>
            <span className="text-sm text-muted-foreground">({documents.length})</span>
          </div>
<Button asChild size="sm" variant="outline">
  <label className="cursor-pointer">
    <Plus className="h-4 w-4" />
    <span className="sr-only">Upload document</span>
    <input 
      type="file" 
      className="hidden" 
      onChange={handleUpload}
      accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
      aria-label="Upload document"
    />
  </label>
</Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No documents yet. Click the + button to upload one.
          </p>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between border rounded-lg p-3">
                <div className="flex items-center gap-3">
                  <File className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <a 
                      href={doc.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-sm hover:underline"
                    >
                      {doc.name}
                    </a>
                    <div className="text-xs text-muted-foreground">
                      {doc.profiles?.email || 'Unknown user'} â€¢{' '}
                      {format(new Date(doc.created_at), 'MMM d, yyyy h:mm a')}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteDocument(doc.id)}
                >
                  <Trash className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
