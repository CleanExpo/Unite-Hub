'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface PhotoCaptureModalProps {
  onCapture: (file: File) => Promise<void>;
  onCancel: () => void;
  uploading?: boolean;
  progress?: number;
}

/**
 * PhotoCaptureModal - Takes full-resolution photos
 * Supports: front/back camera toggle, preview, upload progress
 */
export function PhotoCaptureModal({
  onCapture,
  onCancel,
  uploading,
  progress,
}: PhotoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('environment');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1920 },
          height: { ideal: 1440 },
        },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Camera access denied:', error);
      alert('Camera access denied. Please check permissions.');
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
    }
  };

  const toggleCamera = async () => {
    stopCamera();
    setCameraFacingMode(cameraFacingMode === 'user' ? 'environment' : 'user');
    setTimeout(startCamera, 500);
  };

  const takePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);

        canvasRef.current.toBlob((blob) => {
          if (blob) {
            setCapturedPhoto(blob);
          }
        }, 'image/jpeg', 0.95);
      }
    }
  };

  const handleCapture = async () => {
    if (capturedPhoto) {
      const file = new File([capturedPhoto], `photo-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });
      await onCapture(file);
    }
  };

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  return (
    <Card className="p-4 space-y-4 bg-bg-card">
      {!capturedPhoto ? (
        <>
          {/* Camera Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white text-black p-2 rounded-lg transition-all"
            >
              🔄
            </button>
          </div>

          {/* Hidden Canvas for Photo Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              onClick={takePhoto}
              className="flex-1 bg-accent-500"
              disabled={uploading}
            >
              📸 Capture
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-text-secondary text-center">
            Full resolution • Before/after recommended
          </p>
        </>
      ) : (
        <>
          {/* Photo Preview */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <img
              src={URL.createObjectURL(capturedPhoto)}
              alt="Captured"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
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
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCapturedPhoto(null);
                startCamera();
              }}
              className="flex-1"
              disabled={uploading}
            >
              Retake
            </Button>
            <Button
              onClick={handleCapture}
              className="flex-1 bg-accent-500"
              disabled={uploading}
            >
              {uploading ? '⏳ Uploading...' : '✓ Share'}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
}
