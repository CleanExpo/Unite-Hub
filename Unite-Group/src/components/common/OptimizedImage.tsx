/**
 * Optimized Image Component
 * 
 * This component renders an image with CDN optimization, responsive sizing,
 * and proper loading attributes for performance.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { getCdnImageUrl, getCdnImageSrcSet } from '@/lib/cdn/utils'

export interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /**
   * Image source URL
   */
  src: string
  
  /**
   * Alternative text for accessibility
   */
  alt: string
  
  /**
   * Image width in pixels
   */
  width?: number
  
  /**
   * Image height in pixels
   */
  height?: number
  
  /**
   * Aspect ratio to maintain (width/height)
   * If provided along with one dimension, the other will be calculated
   */
  aspectRatio?: number
  
  /**
   * Image quality (1-100)
   * @default 80
   */
  quality?: number
  
  /**
   * Whether to generate and use srcSet for responsive images
   * @default true
   */
  responsive?: boolean
  
  /**
   * Array of widths to include in srcSet for responsive images
   * @default [640, 750, 828, 1080, 1200, 1920, 2048]
   */
  responsiveWidths?: number[]
  
  /**
   * Loading strategy
   * @default 'lazy'
   */
  loading?: 'lazy' | 'eager'
  
  /**
   * Class name for the image
   */
  className?: string
  
  /**
   * Style object for the image
   */
  style?: React.CSSProperties
  
  /**
   * Whether to use a blur placeholder while loading
   * @default false
   */
  blur?: boolean
  
  /**
   * Priority loading (sets loading='eager' and fetchpriority='high')
   * @default false
   */
  priority?: boolean
  
  /**
   * onClick handler
   */
  onClick?: (e: React.MouseEvent<HTMLImageElement>) => void
}

/**
 * Calculate the missing dimension based on aspect ratio
 */
function calculateMissingDimension(
  width?: number,
  height?: number,
  aspectRatio?: number
): { width?: number; height?: number } {
  if (width && height) {
    return { width, height }
  }
  
  if (width && aspectRatio) {
    return { width, height: Math.round(width / aspectRatio) }
  }
  
  if (height && aspectRatio) {
    return { width: Math.round(height * aspectRatio), height }
  }
  
  return { width, height }
}

/**
 * Optimized Image Component
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  aspectRatio,
  quality = 80,
  responsive = true,
  responsiveWidths,
  loading: loadingProp = 'lazy',
  className,
  style,
  blur = false,
  priority = false,
  onClick,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  
  // Override loading if priority is set
  const loading = priority ? 'eager' : loadingProp
  
  // Calculate dimensions based on aspect ratio if needed
  const dimensions = calculateMissingDimension(width, height, aspectRatio)
  
  // Get CDN optimized URL
  const optimizedSrc = getCdnImageUrl(src, dimensions.width, dimensions.height, quality)
  
  // Generate srcSet for responsive images if needed
  const srcSet = responsive ? getCdnImageSrcSet(
    src,
    responsiveWidths,
    dimensions.height,
    quality
  ) : undefined
  
  // Handle loading state
  useEffect(() => {
    // Reset state when src changes
    setLoaded(false)
    setError(false)
  }, [src])
  
  // Combine styles
  const combinedStyle: React.CSSProperties = {
    ...style,
    objectFit: 'cover',
    transition: 'opacity 0.3s ease-in-out',
    ...(blur && !loaded && !error ? { filter: 'blur(10px)' } : {}),
    ...((!loaded && !error) ? { opacity: 0.5 } : { opacity: 1 }),
  }
  
  return (
    <img
      src={optimizedSrc}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      loading={loading}
      fetchPriority={priority ? 'high' : undefined}
      className={className}
      style={combinedStyle}
      srcSet={srcSet}
      sizes={srcSet ? "100vw" : undefined}
      onLoad={() => setLoaded(true)}
      onError={() => setError(true)}
      onClick={onClick}
      {...props}
    />
  )
}
