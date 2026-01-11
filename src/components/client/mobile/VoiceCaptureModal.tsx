'use client';

import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface VoiceCaptureModalProps {
  onCapture: (file: File) => Promise<void>;
  onCancel: () => void;
  uploading?: boolean;
  progress?: number;
}

/**
 * VoiceCaptureModal - Records audio (voice notes)
 * Supports: unlimited length, playback preview, upload progress
 */
export function VoiceCaptureModal({
  onCapture,
  onCancel,
  uploading,
  progress,
}: VoiceCaptureModalProps) {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      chunksRef.current = [];
      setRecordingTime(0);

      // Setup audio visualization
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      // Start media recorder
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorder.ondataavailable = (event) => {
        chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      mediaRecorderRef.current = mediaRecorder;
      setIsRecording(true);

      // Timer
      let seconds = 0;
      timerRef.current = setInterval(() => {
        seconds += 1;
        setRecordingTime(seconds);

        // Update amplitude
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
        setAmplitude(average / 255);
      }, 100);
    } catch (error) {
      console.error('Microphone access denied:', error);
      alert('Microphone access denied. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    }
  };

  const handleCapture = async () => {
    if (recordedBlob) {
      const file = new File([recordedBlob], `voice-${Date.now()}.webm`, {
        type: 'audio/webm',
      });
      await onCapture(file);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  return (
    <Card className="p-4 space-y-4 bg-bg-card">
      {!recordedBlob ? (
        <>
          {/* Recording Area */}
          <div className="flex flex-col items-center justify-center py-12 bg-gradient-to-b from-blue-50 to-blue-100 rounded-lg space-y-6">
            {/* Waveform Visualization */}
            <div className="flex items-center justify-center gap-1 h-16">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="w-1 bg-accent-500 rounded-full transition-all duration-100"
                  style={{
                    height: isRecording
                      ? `${Math.sin(i * 0.5 + Date.now() / 100) * amplitude * 60 + 20}px`
                      : '20px',
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center space-y-2">
              <div className="text-4xl font-mono font-bold text-text-primary">
                {formatTime(recordingTime)}
              </div>
              <p className="text-sm text-text-secondary">
                {isRecording ? 'Recording...' : 'Ready to record'}
              </p>
            </div>

            {/* Record Button */}
            {!isRecording ? (
              <button
                onClick={startRecording}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-3xl transition-transform active:scale-95 shadow-lg"
              >
                🎙️
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-3xl transition-transform active:scale-95 shadow-lg animate-pulse"
              >
                ⏹
              </button>
            )}
          </div>

          {/* Controls */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={onCancel}
              className="flex-1"
              disabled={uploading || isRecording}
            >
              Cancel
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-text-secondary text-center">
            Share your story • Unlimited time
          </p>
        </>
      ) : (
        <>
          {/* Recording Stats */}
          <div className="grid grid-cols-2 gap-2">
            <Card className="p-3 bg-gray-50">
              <p className="text-xs text-text-secondary">Duration</p>
              <p className="text-lg font-semibold text-text-primary">
                {formatTime(recordingTime)}
              </p>
            </Card>
            <Card className="p-3 bg-gray-50">
              <p className="text-xs text-text-secondary">Size</p>
              <p className="text-lg font-semibold text-text-primary">
                {(recordedBlob.size / 1024 / 1024).toFixed(1)}MB
              </p>
            </Card>
          </div>

          {/* Audio Preview */}
          <audio
            src={URL.createObjectURL(recordedBlob)}
            controls
            className="w-full rounded-lg"
          />

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
