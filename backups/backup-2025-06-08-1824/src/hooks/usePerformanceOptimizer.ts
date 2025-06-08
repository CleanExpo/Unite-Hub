'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePathname } from 'next/navigation'

interface PerformanceMetrics {
  fps: number
  memory: number
  latency: number
  loadTime: number
  renderTime: number
}

interface OptimizationOptions {
  enableLazyLoading?: boolean
  enablePrefetch?: boolean
  enableImageOptimization?: boolean
  enableCodeSplitting?: boolean
  enableCaching?: boolean
  enableCompression?: boolean
}

export function usePerformanceOptimizer(options: OptimizationOptions = {}) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    latency: 0,
    loadTime: 0,
    renderTime: 0
  })
  
  const [isOptimizing, setIsOptimizing] = useState(false)
  const pathname = usePathname()
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const observer = useRef<IntersectionObserver | null>(null)
  const prefetchCache = useRef(new Set<string>())

  // Performance Optimization
  const optimizePerformance = useCallback(() => {
    setIsOptimizing(true)

    // Reduce animation frame rate
    document.body.style.setProperty('--animation-play-state', 'paused')
    
    // Disable non-essential animations
    const animations = document.querySelectorAll('.animate-pulse, .animate-spin, .animate-bounce')
    animations.forEach(el => el.classList.add('animation-disabled'))

    // Enable GPU acceleration for transforms
    const heavyElements = document.querySelectorAll('.card, .modal, .dropdown')
    heavyElements.forEach(el => {
      const element = el as HTMLElement
      element.style.transform = 'translateZ(0)'
      element.style.willChange = 'transform'
    })

    // Defer non-critical resources
    const scripts = document.querySelectorAll('script[src]:not([defer]):not([async])')
    scripts.forEach(script => {
      (script as HTMLScriptElement).setAttribute('defer', 'true')
    })

    setTimeout(() => {
      setIsOptimizing(false)
      document.body.style.setProperty('--animation-play-state', 'running')
    }, 2000)
  }, [])

  // FPS Monitor
  const measureFPS = useCallback(() => {
    frameCount.current++
    const currentTime = performance.now()
    
    if (currentTime >= lastTime.current + 1000) {
      const fps = Math.round((frameCount.current * 1000) / (currentTime - lastTime.current))
      frameCount.current = 0
      lastTime.current = currentTime
      
      setMetrics(prev => ({ ...prev, fps }))
      
      // Auto-optimize if FPS drops below 30
      if (fps < 30 && !isOptimizing) {
        optimizePerformance()
      }
    }
    
    requestAnimationFrame(measureFPS)
  }, [isOptimizing, optimizePerformance])

  // Memory Monitor
  const measureMemory = useCallback(() => {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usedMemory = Math.round(memory.usedJSHeapSize / 1048576)
      setMetrics(prev => ({ ...prev, memory: usedMemory }))
    }
  }, [])

  // Lazy Loading Implementation
  const setupLazyLoading = useCallback(() => {
    if (!options.enableLazyLoading) return

    observer.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement
            const src = img.dataset.src
            
            if (src) {
              // Create a new image to preload
              const tempImg = new Image()
              tempImg.onload = () => {
                img.src = src
                img.classList.add('loaded')
                observer.current?.unobserve(img)
              }
              tempImg.src = src
            }
          }
        })
      },
      { rootMargin: '50px' }
    )

    // Observe all images with data-src
    document.querySelectorAll('img[data-src]').forEach(img => {
      observer.current?.observe(img)
    })
  }, [options.enableLazyLoading])

  // Prefetch Links
  const prefetchLink = useCallback((url: string) => {
    if (!options.enablePrefetch || prefetchCache.current.has(url)) return

    const link = document.createElement('link')
    link.rel = 'prefetch'
    link.href = url
    document.head.appendChild(link)
    prefetchCache.current.add(url)
  }, [options.enablePrefetch])

  // Auto-prefetch visible links
  const setupPrefetching = useCallback(() => {
    if (!options.enablePrefetch) return

    const links = document.querySelectorAll('a[href^="/"]')
    const linkObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const link = entry.target as HTMLAnchorElement
            prefetchLink(link.href)
          }
        })
      },
      { rootMargin: '100px' }
    )

    links.forEach(link => linkObserver.observe(link))

    return () => {
      links.forEach(link => linkObserver.unobserve(link))
    }
  }, [options.enablePrefetch, prefetchLink])

  // Image Optimization
  const optimizeImages = useCallback(() => {
    if (!options.enableImageOptimization) return

    const images = document.querySelectorAll('img')
    images.forEach(img => {
      // Add loading="lazy" if not present
      if (!img.loading) {
        img.loading = 'lazy'
      }

      // Convert to WebP if supported
      if ('loading' in HTMLImageElement.prototype) {
        const src = img.src
        if (src && !src.includes('.webp') && !src.includes('data:')) {
          // Check WebP support
          const webpTest = new Image()
          webpTest.onload = () => {
            if (webpTest.width > 0 && webpTest.height > 0) {
              // WebP is supported, update src
              img.dataset.originalSrc = src
              // In production, you'd have a WebP version available
            }
          }
          webpTest.src = 'data:image/webp;base64,UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA=='
        }
      }
    })
  }, [options.enableImageOptimization])


  // Measure Load Time
  useEffect(() => {
    const measureLoadTime = () => {
      if (window.performance?.timing) {
        const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart
        setMetrics(prev => ({ ...prev, loadTime }))
      }
    }

    if (document.readyState === 'complete') {
      measureLoadTime()
    } else {
      window.addEventListener('load', measureLoadTime)
    }

    return () => window.removeEventListener('load', measureLoadTime)
  }, [])

  // Setup all optimizations
  useEffect(() => {
    measureFPS()
    const memoryInterval = setInterval(measureMemory, 1000)
    
    setupLazyLoading()
    const cleanupPrefetch = setupPrefetching()
    optimizeImages()

    // Enable smooth scrolling
    document.documentElement.style.scrollBehavior = 'smooth'

    // Cleanup
    return () => {
      clearInterval(memoryInterval)
      cleanupPrefetch?.()
      if (observer.current) {
        observer.current.disconnect()
      }
    }
  }, [measureFPS, measureMemory, setupLazyLoading, setupPrefetching, optimizeImages])

  // Route change optimization
  useEffect(() => {
    // Clear unused memory on route change
    if ('gc' in window) {
      (window as any).gc()
    }

    // Prefetch route resources
    if (pathname) {
      const currentPath = pathname
      const adjacentPaths = [
        `${currentPath}/edit`,
        currentPath.replace(/\/[^/]+$/, ''),
        `${currentPath}/new`
      ]

      adjacentPaths.forEach(path => {
        if (path && path !== currentPath) {
          prefetchLink(path)
        }
      })
    }
  }, [pathname, prefetchLink])

  return {
    metrics,
    isOptimizing,
    optimizePerformance,
    prefetchLink
  }
}
