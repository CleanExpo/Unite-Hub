/**
 * IdeaRecorder Component - Phase 2 Client Library
 * Voice/text/video idea submission interface
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface IdeaRecorderProps {
  onSubmit?: (idea: { type: 'voice' | 'text' | 'video'; content: string }) => void;
}

export default function IdeaRecorder({ onSubmit }: IdeaRecorderProps) {
  const [mode, setMode] = useState<'voice' | 'text' | 'video'>('text');
  const [textContent, setTextContent] = useState('');
  const [isRecording, setIsRecording] = useState(false);

  const handleSubmit = () => {
    if (mode === 'text' && textContent.trim()) {
      onSubmit?.({ type: 'text', content: textContent });
      setTextContent('');
    }
  };

  return (
    <div className="bg-bg-card rounded-xl shadow-lg p-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
        Submit Your Idea
      </h2>

      {/* Mode Selector */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={mode === 'voice' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setMode('voice')}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          }
        >
          Voice
        </Button>
        <Button
          variant={mode === 'text' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setMode('text')}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        >
          Text
        </Button>
        <Button
          variant={mode === 'video' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setMode('video')}
          icon={
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          }
        >
          Video
        </Button>
      </div>

      {/* Content Input */}
      {mode === 'text' && (
        <div className="space-y-4">
          <textarea
            value={textContent}
            onChange={(e) => setTextContent(e.target.value)}
            placeholder="Describe your idea in detail..."
            className="w-full min-h-[200px] p-4 border border-border-base rounded-lg bg-bg-card text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
          <Button onClick={handleSubmit} disabled={!textContent.trim()} fullWidth>
            Submit Idea
          </Button>
        </div>
      )}

      {mode === 'voice' && (
        <div className="text-center py-12">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto transition-all ${
              isRecording
                ? 'bg-red-500 animate-pulse'
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
          </button>
          <p className="mt-4 text-text-secondary">
            {isRecording ? 'Recording... Click to stop' : 'Click to start recording'}
          </p>
        </div>
      )}

      {mode === 'video' && (
        <div className="text-center py-12 border-2 border-dashed border-border-base rounded-lg">
          <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <p className="text-text-secondary mb-4">
            Video recording feature coming soon
          </p>
          <Button variant="outline">Upload Video</Button>
        </div>
      )}
    </div>
  );
}

export { IdeaRecorder };
