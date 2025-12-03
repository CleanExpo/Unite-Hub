"use client";

import React, { useRef, useState, useEffect } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, SkipBack, SkipForward } from "lucide-react";

interface MediaPlayerProps {
  src: string;
  type: "video" | "audio";
  filename: string;
  transcript?: {
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
    full_text: string;
  };
  onTimestampClick?: (timestamp: number) => void;
}

export function MediaPlayer({
  src,
  type,
  filename,
  transcript,
  onTimestampClick,
}: MediaPlayerProps) {
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showTranscript, setShowTranscript] = useState(true);
  const [activeSegment, setActiveSegment] = useState<number | null>(null);

  // Update current time
  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;

    const updateTime = () => {
      setCurrentTime(media.currentTime);

      // Find active transcript segment
      if (transcript?.segments) {
        const segment = transcript.segments.findIndex(
          (s) => media.currentTime >= s.start && media.currentTime <= s.end
        );
        setActiveSegment(segment !== -1 ? segment : null);
      }
    };

    const updateDuration = () => setDuration(media.duration);

    media.addEventListener("timeupdate", updateTime);
    media.addEventListener("loadedmetadata", updateDuration);

    return () => {
      media.removeEventListener("timeupdate", updateTime);
      media.removeEventListener("loadedmetadata", updateDuration);
    };
  }, [transcript]);

  // Play/Pause toggle
  const togglePlay = () => {
    const media = mediaRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    setIsPlaying(!isPlaying);
  };

  // Seek to time
  const seekTo = (time: number) => {
    const media = mediaRef.current;
    if (!media) return;
    media.currentTime = time;
  };

  // Handle progress click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - bounds.left) / bounds.width;
    seekTo(percent * duration);
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    seekTo(Math.max(0, Math.min(duration, currentTime + seconds)));
  };

  // Toggle mute
  const toggleMute = () => {
    const media = mediaRef.current;
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    const media = mediaRef.current;
    if (!media) return;
    media.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  // Format time (seconds to MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Toggle fullscreen (video only)
  const toggleFullscreen = () => {
    const media = mediaRef.current;
    if (!media || type !== "video") return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      media.requestFullscreen();
    }
  };

  return (
    <div className="space-y-4">
      {/* Media Element */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {type === "video" ? (
          <video
            ref={mediaRef as React.RefObject<HTMLVideoElement>}
            src={src}
            className="w-full"
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            Your browser does not support the video tag.
          </video>
        ) : (
          <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-purple-900 to-blue-900">
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={src}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            >
              Your browser does not support the audio tag.
            </audio>
            <div className="text-center text-white">
              <Volume2 className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">{filename}</p>
            </div>
          </div>
        )}

        {/* Custom Controls Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 space-y-2">
          {/* Progress Bar */}
          <div
            onClick={handleProgressClick}
            className="w-full h-1.5 bg-white/30 rounded-full cursor-pointer group"
          >
            <div
              className="h-full bg-blue-500 rounded-full relative group-hover:bg-blue-400 transition-colors"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-3">
            {/* Play/Pause */}
            <button
              onClick={togglePlay}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5 text-white" />
              ) : (
                <Play className="h-5 w-5 text-white" />
              )}
            </button>

            {/* Skip Back */}
            <button
              onClick={() => skip(-10)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <SkipBack className="h-4 w-4 text-white" />
            </button>

            {/* Skip Forward */}
            <button
              onClick={() => skip(10)}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <SkipForward className="h-4 w-4 text-white" />
            </button>

            {/* Time */}
            <span className="text-white text-sm">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <div className="flex-1" />

            {/* Volume */}
            <div className="flex items-center gap-2">
              <button onClick={toggleMute} className="p-2 hover:bg-white/20 rounded-full">
                {isMuted ? (
                  <VolumeX className="h-4 w-4 text-white" />
                ) : (
                  <Volume2 className="h-4 w-4 text-white" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={volume}
                onChange={handleVolumeChange}
                className="w-20"
              />
            </div>

            {/* Fullscreen (video only) */}
            {type === "video" && (
              <button
                onClick={toggleFullscreen}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <Maximize className="h-4 w-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Transcript */}
      {transcript && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Transcript
            </h3>
            <button
              onClick={() => setShowTranscript(!showTranscript)}
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showTranscript ? "Hide" : "Show"}
            </button>
          </div>

          {showTranscript && (
            <div className="max-h-96 overflow-y-auto bg-bg-raised rounded-lg p-4 space-y-2">
              {transcript.segments.map((segment, index) => (
                <button
                  key={index}
                  onClick={() => {
                    seekTo(segment.start);
                    onTimestampClick?.(segment.start);
                  }}
                  className={`w-full text-left p-2 rounded hover:bg-bg-hover transition-colors ${
                    activeSegment === index
                      ? "bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-500"
                      : ""
                  }`}
                >
                  <span className="text-xs text-text-secondary font-mono">
                    {formatTime(segment.start)}
                  </span>
                  <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                    {segment.text}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
