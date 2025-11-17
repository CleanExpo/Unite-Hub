// useMediaUpload Hook
// Handles file upload with progress tracking and status monitoring

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { MediaFile, FileType, UploadResponse, UploadProgress } from '@/types/media';

interface UseMediaUploadOptions {
  onUploadComplete?: (media: MediaFile) => void;
  onUploadError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
}

interface UploadState {
  uploading: boolean;
  progress: number;
  error: string | null;
  currentFile: string | null;
}

export function useMediaUpload(options: UseMediaUploadOptions = {}) {
  const { currentOrganization } = useAuth();
  const [state, setState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    error: null,
    currentFile: null,
  });

  const uploadFile = useCallback(
    async (
      file: File,
      fileType: FileType,
      projectId?: string
    ): Promise<MediaFile | null> => {
      if (!currentOrganization) {
        const error = new Error('No organization selected');
        options.onUploadError?.(error);
        setState(prev => ({ ...prev, error: error.message }));
        return null;
      }

      try {
        setState({
          uploading: true,
          progress: 0,
          error: null,
          currentFile: file.name,
        });

        // Create form data
        const formData = new FormData();
        formData.append('file', file);
        formData.append('workspace_id', currentOrganization.org_id);
        formData.append('org_id', currentOrganization.org_id);
        formData.append('file_type', fileType);
        if (projectId) {
          formData.append('project_id', projectId);
        }

        // Get auth token
        const { supabase } = await import('@/lib/supabase');
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          throw new Error('Not authenticated');
        }

        // Upload file
        const response = await fetch('/api/media/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Upload failed');
        }

        const result: UploadResponse = await response.json();

        setState({
          uploading: false,
          progress: 100,
          error: null,
          currentFile: null,
        });

        options.onUploadComplete?.(result.media);
        return result.media;

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setState({
          uploading: false,
          progress: 0,
          error: errorMessage,
          currentFile: null,
        });
        options.onUploadError?.(error as Error);
        return null;
      }
    },
    [currentOrganization, options]
  );

  const reset = useCallback(() => {
    setState({
      uploading: false,
      progress: 0,
      error: null,
      currentFile: null,
    });
  }, []);

  return {
    uploadFile,
    reset,
    ...state,
  };
}
