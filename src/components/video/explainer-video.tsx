'use client';

import { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/Slider';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ExplainerVideoProps {
  videoId: string;
  title: string;
  description?: string;
  thumbnail?: string;
  duration: number;
  videoUrl?: string;
  autoPlay?: boolean;
  showTranscript?: boolean;
  transcript?: string;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
  className?: string;
}

/**
 * ExplainerVideo Component
 *
 * Custom video player for Unite-Hub explainer videos.
 * Features custom controls, progress tracking, and transcript support.
 */
export function ExplainerVideo({
  videoId,
  title,
  description,
  thumbnail,
  duration,
  videoUrl,
  autoPlay = false,
  showTranscript = false,
  transcript,
  onProgress,
  onComplete,
  className,
}: ExplainerVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState(showTranscript);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);

  // Video CDN URL from environment
  const cdnUrl = process.env.NEXT_PUBLIC_VIDEO_CDN || '/videos';
  const videoSrc = videoUrl || `${cdnUrl}/${videoId}.mp4`;
  const posterSrc = thumbnail || `${cdnUrl}/${videoId}-poster.jpg`;

  // Hide controls after inactivity
  useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isPlaying) {
      timeout = setTimeout(() => setShowControls(false), 3000);
    }

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!containerRef.current?.contains(document.activeElement)) return;

      switch (e.key) {
        case ' ':
          e.preventDefault();
          togglePlay();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seek(-10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seek(10);
          break;
        case 'm':
          e.preventDefault();
          toggleMute();
          break;
        case 'f':
          e.preventDefault();
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [isPlaying]);

  const togglePlay = () => {
    if (!videoRef.current) return;

    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
      setHasStarted(true);
    }
    setIsPlaying(!isPlaying);
  };

  const seek = (seconds: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = Math.max(
      0,
      Math.min(duration, videoRef.current.currentTime + seconds)
    );
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const time = videoRef.current.currentTime;
    setCurrentTime(time);
    onProgress?.(time / duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    onComplete?.();
  };

  const handleSeek = (value: number[]) => {
    if (!videoRef.current) return;
    const time = (value[0] / 100) * duration;
    videoRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!videoRef.current) return;
    const newVolume = value[0] / 100;
    videoRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      await containerRef.current.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
    setIsFullscreen(!isFullscreen);
  };

  const handlePlaybackRateChange = (rate: number) => {
    if (!videoRef.current) return;
    videoRef.current.playbackRate = rate;
    setPlaybackRate(rate);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={cn('flex flex-col lg:flex-row gap-4', className)}>
      {/* Video Container */}
      <div
        ref={containerRef}
        className={cn(
          'relative aspect-video bg-black rounded-lg overflow-hidden group',
          isTranscriptOpen ? 'lg:w-2/3' : 'w-full'
        )}
        onMouseMove={() => setShowControls(true)}
        tabIndex={0}
      >
        <video
          ref={videoRef}
          src={videoSrc}
          poster={posterSrc}
          autoPlay={autoPlay}
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="w-full h-full object-cover cursor-pointer"
        />

        {/* Play Button Overlay (before video starts) */}
        {!hasStarted && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-black/40 cursor-pointer"
            onClick={togglePlay}
          >
            <div className="h-20 w-20 rounded-full bg-primary-500 flex items-center justify-center hover:bg-primary-600 transition-colors">
              <Play className="h-10 w-10 text-white ml-1" />
            </div>
          </div>
        )}

        {/* Controls Overlay */}
        <div
          className={cn(
            'absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity',
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          )}
        >
          {/* Progress Bar */}
          <Slider
            value={[(currentTime / duration) * 100]}
            onValueChange={handleSeek}
            max={100}
            step={0.1}
            className="mb-4"
          />

          {/* Controls Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Play/Pause */}
              <Button
                variant="ghost"
                size="icon"
                onClick={togglePlay}
                className="text-white hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              {/* Volume */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-5 w-5" />
                  ) : (
                    <Volume2 className="h-5 w-5" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume * 100]}
                  onValueChange={handleVolumeChange}
                  max={100}
                  className="w-20"
                />
              </div>

              {/* Time Display */}
              <span className="text-white text-sm ml-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {/* Playback Speed */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    {playbackRate}x
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-24 p-2">
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                    <button
                      key={rate}
                      onClick={() => handlePlaybackRateChange(rate)}
                      className={cn(
                        'w-full px-2 py-1 text-sm rounded hover:bg-gray-100 dark:hover:bg-slate-700',
                        playbackRate === rate && 'bg-gray-100 dark:bg-slate-700'
                      )}
                    >
                      {rate}x
                    </button>
                  ))}
                </PopoverContent>
              </Popover>

              {/* Transcript Toggle */}
              {transcript && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                  className="text-white hover:bg-white/20"
                >
                  <FileText className="h-5 w-5" />
                </Button>
              )}

              {/* Fullscreen */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                className="text-white hover:bg-white/20"
              >
                {isFullscreen ? (
                  <Minimize className="h-5 w-5" />
                ) : (
                  <Maximize className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Transcript Panel */}
      {isTranscriptOpen && transcript && (
        <div className="lg:w-1/3 bg-gray-100 dark:bg-slate-800 rounded-lg p-4 max-h-[400px] overflow-y-auto">
          <h3 className="font-semibold text-text-primary mb-2">
            Transcript
          </h3>
          <div className="text-sm text-gray-600 dark:text-slate-300 whitespace-pre-wrap">
            {transcript}
          </div>
        </div>
      )}
    </div>
  );
}

export default ExplainerVideo;
