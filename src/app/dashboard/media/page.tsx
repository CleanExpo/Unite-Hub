'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { MediaUploader } from '@/components/media/MediaUploader';
import { MediaGallery } from '@/components/media/MediaGallery';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Upload, Grid3x3, Search } from 'lucide-react';
import type { MediaFile } from '@/types/media';

export default function MediaDashboardPage() {
  const { currentOrganization } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedTab, setSelectedTab] = useState('gallery');

  const handleUploadComplete = (media: MediaFile) => {
    console.log('Upload complete:', media);
    // Refresh gallery
    setRefreshKey(prev => prev + 1);
    // Switch to gallery tab
    setSelectedTab('gallery');
  };

  if (!currentOrganization) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="p-6">
          <p className="text-muted-foreground">
            Please select an organization to view media files.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Media Library</h1>
        <p className="text-muted-foreground mt-2">
          Upload and manage your multimedia files with AI-powered transcription and analysis.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="gallery" className="flex items-center gap-2">
            <Grid3x3 className="h-4 w-4" />
            Gallery
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* Gallery Tab */}
        <TabsContent value="gallery" className="space-y-6">
          <MediaGallery
            key={refreshKey}
            workspaceId={currentOrganization.org_id}
          />
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <MediaUploader
            workspaceId={currentOrganization.org_id}
            orgId={currentOrganization.org_id}
            onUploadComplete={handleUploadComplete}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
