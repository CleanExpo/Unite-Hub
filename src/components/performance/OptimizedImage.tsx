'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallback?: string;
  blur?: boolean;
  aspectRatio?: number;
  onLoad?: () => void;
  onError?: () => void;
}

export function OptimizedImage({
  src,
  alt,
  className,
  fallback = '/images/placeholder.jpg',
  blur = true,
  aspectRatio,
  onLoad,
  onError,
  priority = false,
  loading = 'lazy',
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(src);
  const [isLoading, setIsLoading] = useState(true);
  const [isInView, setIsInView] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for truly lazy loading
  useEffect(() => {
    if (priority || loading === 'eager') {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01,
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => observer.disconnect();
  }, [priority, loading]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setImageSrc(fallback);
    setIsLoading(false);
    onError?.();
  };

  const containerStyle = aspectRatio
    ? { aspectRatio: aspectRatio.toString() }
    : undefined;

  return (
    <div
      ref={imageRef}
      className={cn(
        'relative overflow-hidden',
        blur && isLoading && 'animate-pulse bg-muted',
        className
      )}
      style={containerStyle}
    >
      {isInView ? (
        <>
          <Image
            src={imageSrc}
            alt={alt}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={handleLoad}
            onError={handleError}
            priority={priority}
            loading={loading}
            {...props}
          />
          {blur && isLoading && (
            <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-muted" />
          )}
        </>
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}
    </div>
  );
}

/**
 * Responsive image with art direction
 */
export function ResponsiveImage({
  sources,
  alt,
  className,
  ...props
}: {
  sources: {
    media: string;
    src: string;
    width: number;
    height: number;
  }[];
  alt: string;
  className?: string;
} & Omit<OptimizedImageProps, 'src' | 'width' | 'height'>) {
  const [currentSource, setCurrentSource] = useState(sources[0]);

  useEffect(() => {
    const updateSource = () => {
      for (const source of sources) {
        if (window.matchMedia(source.media).matches) {
          setCurrentSource(source);
          break;
        }
      }
    };

    updateSource();
    window.addEventListener('resize', updateSource);
    return () => window.removeEventListener('resize', updateSource);
  }, [sources]);

  return (
    <OptimizedImage
      src={currentSource.src}
      width={currentSource.width}
      height={currentSource.height}
      alt={alt}
      className={className}
      {...props}
    />
  );
}

/**
 * Background image with lazy loading
 */
export function BackgroundImage({
  src,
  className,
  children,
  overlay = false,
  parallax = false,
}: {
  src: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  parallax?: boolean;
}) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isInView) return;

    const img = new window.Image();
    img.src = src;
    img.onload = () => setIsLoaded(true);
  }, [src, isInView]);

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        !isLoaded && 'bg-muted animate-pulse',
        className
      )}
    >
      {isInView && (
        <div
          className={cn(
            'absolute inset-0 bg-cover bg-center transition-opacity duration-700',
            isLoaded ? 'opacity-100' : 'opacity-0',
            parallax && 'will-change-transform'
          )}
          style={{
            backgroundImage: `url(${src})`,
            transform: parallax ? 'translateZ(0)' : undefined,
          }}
        />
      )}
      {overlay && (
        <div className="absolute inset-0 bg-black/50" />
      )}
      {children && (
        <div className="relative z-10">{children}</div>
      )}
    </div>
  );
}
