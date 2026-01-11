'use client';

import React, { useState, useRef } from 'react';
import { useMediaUpload } from '@/lib/hooks/useMediaUpload';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Loader } from '@/components/ui/loader';
import { VideoCaptureModal } from './VideoCaptureModal';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { VoiceCaptureModal } from './VoiceCaptureModal';

export type CaptureMode = 'video' | 'photo' | 'voice' | null;

export interface ContentStudioProps {
  workspaceId: string;
  clientUserId: string;
  onSuccess?: (contribution: any) => void;
}

/**
 * ContentStudio - Mobile-first content capture interface
 * Supports: video, photo, voice, with upload progress and offline support
 *
 * Features:
 * - Quick capture modes (30-90s videos, full-res photos, voice notes)
 * - Real-time upload progress
 * - Draft saving with offline support
 * - Camera toggle (front/back)
 */
export function ContentStudio({
  workspaceId,
  clientUserId,
  onSuccess,
}: ContentStudioProps) {
  const [mode, setMode] = useState<CaptureMode>(null);
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);
  const { upload, uploading, progress, error: uploadError } = useMediaUpload(workspaceId);

  const handleVideoCapture = async (file: File) => {
    try {
      const result = await upload(file, 'video', clientUserId, {
        contribution_type: 'video',
      });
      onSuccess?.(result);
      setMode(null);
    } catch (error) {
      console.error('Video upload failed:', error);
    }
  };

  const handlePhotoCapture = async (file: File) => {
    try {
      const result = await upload(file, 'photo', clientUserId, {
        contribution_type: 'photo',
      });
      onSuccess?.(result);
      setMode(null);
    } catch (error) {
      console.error('Photo upload failed:', error);
    }
  };

  const handleVoiceCapture = async (file: File) => {
    try {
      const result = await upload(file, 'audio', clientUserId, {
        contribution_type: 'voice',
      });
      onSuccess?.(result);
      setMode(null);
    } catch (error) {
      console.error('Voice upload failed:', error);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-bg-base min-h-screen">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-text-primary">Content Studio</h1>
        <p className="text-text-secondary">Share your story and earn rewards</p>
      </div>

      {/* Error Display */}
      {uploadError && (
        <div className="p-3 bg-red-100 border border-red-400 rounded-lg">
          <p className="text-sm text-red-800">{uploadError}</p>
        </div>
      )}

      {/* Mode Selection */}
      {!mode && (
        <>
          {/* Capture Buttons */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setMode('video')}
              className="aspect-square rounded-xl bg-gradient-to-br from-accent-500 to-orange-600 text-white flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-2xl">📹</span>
              <span className="text-xs font-semibold">Video</span>
            </button>
            <button
              onClick={() => setMode('photo')}
              className="aspect-square rounded-xl bg-gradient-to-br from-accent-500 to-orange-600 text-white flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-2xl">📷</span>
              <span className="text-xs font-semibold">Photo</span>
            </button>
            <button
              onClick={() => setMode('voice')}
              className="aspect-square rounded-xl bg-gradient-to-br from-accent-500 to-orange-600 text-white flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <span className="text-2xl">🎤</span>
              <span className="text-xs font-semibold">Voice</span>
            </button>
          </div>

          {/* Upload Progress Indicator */}
          {uploading && (
            <Card className="p-4 space-y-2 bg-blue-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-primary">Uploading...</span>
                <span className="text-sm text-text-secondary">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-accent-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </Card>
          )}

          {/* Recent Drafts */}
          {savedDrafts.length > 0 && (
            <Card className="p-4 space-y-2 bg-bg-card">
              <h3 className="text-sm font-semibold text-text-primary">Drafts ({savedDrafts.length})</h3>
              <div className="space-y-1">
                {savedDrafts.map((draft) => (
                  <div
                    key={draft.id}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                  >
                    <span className="text-xs text-text-secondary">{draft.filename}</span>
                    <span className="text-xs text-text-tertiary">{draft.size}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 gap-2 mt-6">
            <Card className="p-3 bg-gradient-to-r from-blue-50 to-transparent border border-blue-200">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold">📊 Earn 100 points</span> for each video
              </p>
            </Card>
            <Card className="p-3 bg-gradient-to-r from-green-50 to-transparent border border-green-200">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold">⚡ Real-time</span> impact tracking
              </p>
            </Card>
            <Card className="p-3 bg-gradient-to-r from-purple-50 to-transparent border border-purple-200">
              <p className="text-xs text-text-secondary">
                <span className="font-semibold">&lt;2s</span> upload speed on 4G
              </p>
            </Card>
          </div>
        </>
      )}

      {/* Video Capture */}
      {mode === 'video' && (
        <VideoCaptureModal
          onCapture={handleVideoCapture}
          onCancel={() => setMode(null)}
          uploading={uploading}
          progress={progress}
        />
      )}

      {/* Photo Capture */}
      {mode === 'photo' && (
        <PhotoCaptureModal
          onCapture={handlePhotoCapture}
          onCancel={() => setMode(null)}
          uploading={uploading}
          progress={progress}
        />
      )}

      {/* Voice Capture */}
      {mode === 'voice' && (
        <VoiceCaptureModal
          onCapture={handleVoiceCapture}
          onCancel={() => setMode(null)}
          uploading={uploading}
          progress={progress}
        />
      )}
    </div>
  );
}

export default ContentStudio;
