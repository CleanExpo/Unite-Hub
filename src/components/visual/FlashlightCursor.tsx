'use client';

/**
 * Flashlight Cursor Component
 *
 * Creates a soft spotlight effect that follows the cursor.
 * Fully accessible - respects reduced motion preferences.
 * NO strobing or rapid flashing effects.
 */

import React, { useEffect, useState, useCallback } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

// ============================================================================
// TYPES
// ============================================================================

export type FlashlightVariant = 'soft' | 'warm' | 'cool' | 'gradient';

interface FlashlightCursorProps {
  /** Visual variant of the spotlight */
  variant?: FlashlightVariant;
  /** Size of the spotlight in pixels */
  size?: number;
  /** Enable/disable the effect */
  enabled?: boolean;
  /** Opacity of the spotlight (0-1) */
  intensity?: number;
  /** Whether to show on mobile */
  showOnMobile?: boolean;
  /** Z-index of the spotlight */
  zIndex?: number;
}

// ============================================================================
// VARIANT STYLES
// ============================================================================

const variantStyles: Record<FlashlightVariant, string> = {
  soft: `radial-gradient(
    circle at center,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.04) 30%,
    transparent 70%
  )`,
  warm: `radial-gradient(
    circle at center,
    rgba(251, 191, 36, 0.1) 0%,
    rgba(251, 191, 36, 0.05) 30%,
    transparent 60%
  )`,
  cool: `radial-gradient(
    circle at center,
    rgba(59, 130, 246, 0.08) 0%,
    rgba(99, 102, 241, 0.04) 30%,
    transparent 60%
  )`,
  gradient: `radial-gradient(
    circle at center,
    rgba(99, 102, 241, 0.1) 0%,
    rgba(168, 85, 247, 0.06) 25%,
    rgba(236, 72, 153, 0.03) 50%,
    transparent 70%
  )`,
};

// ============================================================================
// COMPONENT
// ============================================================================

export function FlashlightCursor({
  variant = 'soft',
  size = 400,
  enabled = true,
  intensity = 1,
  showOnMobile = false,
  zIndex = 9999,
}: FlashlightCursorProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  // Motion values for smooth tracking
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animation for cursor following
  const springConfig = { damping: 25, stiffness: 200 };
  const smoothX = useSpring(mouseX, springConfig);
  const smoothY = useSpring(mouseY, springConfig);

  // Check for reduced motion preference
  useEffect(() => {
    if (typeof window === 'undefined') {
return;
}

    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Check for mobile device
  useEffect(() => {
    if (typeof window === 'undefined') {
return;
}

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle mouse movement
  const handleMouseMove = useCallback((e: MouseEvent) => {
    mouseX.set(e.clientX);
    mouseY.set(e.clientY);
  }, [mouseX, mouseY]);

  // Handle mouse enter/leave
  const handleMouseEnter = useCallback(() => setIsVisible(true), []);
  const handleMouseLeave = useCallback(() => setIsVisible(false), []);

  // Set up event listeners
  useEffect(() => {
    if (typeof window === 'undefined') {
return;
}
    if (!enabled || prefersReducedMotion) {
return;
}
    if (isMobile && !showOnMobile) {
return;
}

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, prefersReducedMotion, isMobile, showOnMobile, handleMouseMove, handleMouseEnter, handleMouseLeave]);

  // Don't render if disabled or reduced motion
  if (!enabled || prefersReducedMotion || (isMobile && !showOnMobile)) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        pointerEvents: 'none',
        width: size,
        height: size,
        borderRadius: '50%',
        background: variantStyles[variant],
        x: smoothX,
        y: smoothY,
        translateX: '-50%',
        translateY: '-50%',
        opacity: isVisible ? intensity : 0,
        zIndex,
        mixBlendMode: 'overlay',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: isVisible ? intensity : 0 }}
      transition={{ duration: 0.3 }}
    />
  );
}

// ============================================================================
// HOOK FOR CUSTOM IMPLEMENTATIONS
// ============================================================================

export function useFlashlightPosition() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
return;
}

    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
    };

    const handleMouseEnter = () => setIsActive(true);
    const handleMouseLeave = () => setIsActive(false);

    window.addEventListener('mousemove', handleMouseMove);
    document.body.addEventListener('mouseenter', handleMouseEnter);
    document.body.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.removeEventListener('mouseenter', handleMouseEnter);
      document.body.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return { position, isActive };
}

// ============================================================================
// CSS CUSTOM PROPERTY UPDATER
// ============================================================================

export function FlashlightCSSVariables() {
  useEffect(() => {
    if (typeof window === 'undefined') {
return;
}

    const handleMouseMove = (e: MouseEvent) => {
      document.documentElement.style.setProperty('--mouse-x', `${e.clientX}px`);
      document.documentElement.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return null;
}

export default FlashlightCursor;
