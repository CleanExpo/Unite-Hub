'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  fill?: boolean;
  sizes?: string;
  onLoad?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className,
  priority = false,
  quality = 75,
  placeholder = 'blur',
  blurDataURL,
  fill = false,
  sizes,
  onLoad
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const imageRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01
      }
    );

    if (imageRef.current) {
      observer.observe(imageRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [priority]);

  const handleLoad = () => {
    setHasLoaded(true);
    onLoad?.();
  };

  // Generate blur data URL if not provided
  const getBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    // Default blur placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAA8A/9k=';
  };

  if (fill) {
    return (
      <div 
        ref={imageRef} 
        className={cn('relative overflow-hidden', className)}
      >
        {isInView && (
          <>
            <Image
              src={src}
              alt={alt}
              fill
              quality={quality}
              sizes={sizes || '100vw'}
              priority={priority}
              placeholder={placeholder}
              blurDataURL={getBlurDataURL()}
              onLoad={handleLoad}
              className={cn(
                'object-cover transition-opacity duration-300',
                hasLoaded ? 'opacity-100' : 'opacity-0'
              )}
            />
            {!hasLoaded && (
              <div className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse" />
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div 
      ref={imageRef} 
      className={cn('relative', className)}
      style={{ width, height }}
    >
      {isInView && (
        <>
          <Image
            src={src}
            alt={alt}
            width={width || 500}
            height={height || 300}
            quality={quality}
            priority={priority}
            placeholder={placeholder}
            blurDataURL={getBlurDataURL()}
            onLoad={handleLoad}
            className={cn(
              'transition-opacity duration-300',
              hasLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          {!hasLoaded && (
            <div 
              className="absolute inset-0 bg-gray-200 dark:bg-gray-800 animate-pulse"
              style={{ width, height }}
            />
          )}
        </>
      )}
    </div>
  );
};

// Batch image preloader for critical images
export const preloadImages = (imageSrcs: string[]) => {
  if (typeof window === 'undefined') return;
  
  imageSrcs.forEach((src) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = src;
    document.head.appendChild(link);
  });
};

// WebP support detection
export const supportsWebP = () => {
  if (typeof window === 'undefined') return false;
  
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('image/webp') === 0;
};

// Progressive image loading component
interface ProgressiveImageProps {
  src: string;
  placeholderSrc?: string;
  alt: string;
  className?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({
  src,
  placeholderSrc,
  alt,
  className
}) => {
  const [currentSrc, setCurrentSrc] = useState(placeholderSrc || src);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!placeholderSrc) {
      setIsLoading(false);
      return;
    }

    const img = new window.Image();
    img.src = src;
    img.onload = () => {
      setCurrentSrc(src);
      setIsLoading(false);
    };
  }, [src, placeholderSrc]);

  return (
    <div className={cn('relative', className)}>
      <img
        src={currentSrc}
        alt={alt}
        className={cn(
          'w-full h-full object-cover transition-all duration-300',
          isLoading ? 'filter blur-sm' : 'filter blur-0'
        )}
      />
    </div>
  );
};

// Responsive image component with art direction
interface ResponsiveImageProps {
  sources: {
    media: string;
    srcSet: string;
    type?: string;
  }[];
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export const ResponsiveImage: React.FC<ResponsiveImageProps> = ({
  sources,
  fallbackSrc,
  alt,
  className
}) => {
  return (
    <picture>
      {sources.map((source, index) => (
        <source
          key={index}
          media={source.media}
          srcSet={source.srcSet}
          type={source.type}
        />
      ))}
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        loading="lazy"
      />
    </picture>
  );
};
