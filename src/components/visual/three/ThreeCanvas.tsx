'use client';

/**
 * Three.js Canvas Wrapper
 *
 * Provides a consistent Three.js context for all 3D components.
 * Includes accessibility and performance considerations.
 */

import React, { Suspense, useEffect, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { Preload } from '@react-three/drei';

interface ThreeCanvasProps {
  children: React.ReactNode;
  className?: string;
  camera?: {
    position?: [number, number, number];
    fov?: number;
  };
  background?: string;
  enableOrbitControls?: boolean;
  dpr?: number | [number, number];
}

// Fallback for loading state
function CanvasLoader() {
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
    </div>
  );
}

export function ThreeCanvas({
  children,
  className = '',
  camera = { position: [0, 0, 5], fov: 50 },
  background = 'transparent',
  dpr = [1, 2],
}: ThreeCanvasProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Don't render 3D content if user prefers reduced motion
  if (prefersReducedMotion) {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10" />
        {/* Static fallback */}
      </div>
    );
  }

  // SSR guard
  if (!isClient) {
    return <div className={`relative ${className}`}><CanvasLoader /></div>;
  }

  return (
    <div className={`relative ${className}`}>
      <Suspense fallback={<CanvasLoader />}>
        <Canvas
          camera={camera}
          dpr={dpr}
          style={{ background }}
          gl={{ antialias: true, alpha: true }}
        >
          <Suspense fallback={null}>
            {children}
          </Suspense>
          <Preload all />
        </Canvas>
      </Suspense>
    </div>
  );
}

export default ThreeCanvas;
