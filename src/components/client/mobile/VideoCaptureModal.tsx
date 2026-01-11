'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface VideoCaptureModalProps {
  onCapture: (file: File) => Promise<void>;
  onCancel: () => void;
  uploading?: boolean;
  progress?: number;
}

/**
 * VideoCaptureModal - Records video up to 90 seconds
 * Supports: front/back camera toggle, playback preview, upload progress
 */
export function VideoCaptureModal({
  onCapture,
  onCancel,
  uploading,
  progress,
}: VideoCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [cameraFacingMode, setCameraFacingMode] = useState<'user' | 'environment'>('user');
  const [recordingTime, setRecordingTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: cameraFacingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
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

  const startRecording = async () => {
    chunksRef.current = [];
    setRecordingTime(0);

    if (videoRef.current?.srcObject) {
      const mediaRecorder = new MediaRecorder(videoRef.current.srcObject as MediaStream, {
        mimeType: 'video/webm;codecs=vp9,opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordedBlob(blob);
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Timer (max 90 seconds)
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);

        if (seconds >= 90) {
          stopRecording();
        }
      }, 1000);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const handleCapture = async () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `video-${Date.now()}.webm`, {
        type: 'video/webm',
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
      {!recordedBlob ? (
        <>
          {/* Video Preview */}
          <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />

            {/* Recording Indicator */}
            {isRecording && (
              <div className="absolute top-4 left-4 flex items-center gap-2 bg-red-600 text-white px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                <span className="text-sm font-semibold">
                  {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:
                  {String(recordingTime % 60).padStart(2, '0')}
                </span>
              </div>
            )}

            {/* Camera Toggle */}
            <button
              onClick={toggleCamera}
              disabled={isRecording}
              className="absolute top-4 right-4 bg-white/80 hover:bg-white disabled:opacity-50 text-black p-2 rounded-lg transition-all"
            >
              🔄
            </button>
          </div>

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

            {!isRecording ? (
              <Button
                onClick={startRecording}
                className="flex-1 bg-accent-500"
                disabled={uploading}
              >
                🔴 Record
              </Button>
            ) : (
              <Button
                onClick={stopRecording}
                className="flex-1 bg-red-600"
              >
                ⏹ Stop
              </Button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-xs text-text-secondary text-center">
            30-90 seconds • Vertical format recommended
          </p>
        </>
      ) : (
        <>
          {/* Preview */}
          <div className="bg-black rounded-lg overflow-hidden aspect-video">
            <video
              src={URL.createObjectURL(recordedBlob)}
              controls
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
                setRecordedBlob(null);
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
