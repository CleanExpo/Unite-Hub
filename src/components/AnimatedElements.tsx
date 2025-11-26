'use client';

/**
 * Animated Elements for Landing Page
 *
 * Modern motion graphics and smooth animations using Framer Motion
 */

import { useEffect, useRef, useState } from 'react';

// ============================================================================
// FLOATING GRADIENT BALLS
// ============================================================================

export function FloatingGradientBalls() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Animated floating ball 1 */}
      <div
        className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 40% 40%, #347bf7, transparent)',
          top: '10%',
          left: '5%',
          animation: 'float-slow 8s ease-in-out infinite',
        }}
      />

      {/* Animated floating ball 2 */}
      <div
        className="absolute w-72 h-72 rounded-full opacity-20 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 40% 40%, #00d4aa, transparent)',
          bottom: '20%',
          right: '10%',
          animation: 'float-slow 10s ease-in-out infinite 2s',
        }}
      />

      {/* Animated floating ball 3 */}
      <div
        className="absolute w-96 h-96 rounded-full opacity-15 blur-3xl"
        style={{
          background: 'radial-gradient(circle at 40% 40%, #ff5722, transparent)',
          top: '50%',
          left: '-10%',
          animation: 'float-slow 12s ease-in-out infinite 4s',
        }}
      />

      <style>{`
        @keyframes float-slow {
          0%, 100% { transform: translate(0, 0); }
          25% { transform: translate(20px, -30px); }
          50% { transform: translate(-20px, 30px); }
          75% { transform: translate(30px, 20px); }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// ANIMATED STATS COUNTER
// ============================================================================

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ end, duration = 2000, suffix = '', prefix = '' }: CounterProps) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number;
    let animationFrameId: number;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      setCount(Math.floor(end * progress));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(animate);
      }
    };

    animationFrameId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isVisible, end, duration]);

  return (
    <div ref={ref}>
      {prefix}
      {count}
      {suffix}
    </div>
  );
}

// ============================================================================
// SCROLL-TRIGGERED ANIMATION
// ============================================================================

interface ScrollRevealProps {
  children: React.ReactNode;
  delay?: number;
}

export function ScrollReveal({ children, delay = 0 }: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `opacity 0.6s ease-out, transform 0.6s ease-out`,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ANIMATED GRADIENT TEXT
// ============================================================================

interface AnimatedGradientTextProps {
  text: string;
  className?: string;
}

export function AnimatedGradientText({ text, className = '' }: AnimatedGradientTextProps) {
  return (
    <span
      className={`text-transparent bg-clip-text ${className}`}
      style={{
        backgroundImage: 'linear-gradient(90deg, #347bf7, #00d4aa, #347bf7)',
        backgroundSize: '200% 100%',
        animation: 'gradient-shift 3s ease-in-out infinite',
      }}
    >
      {text}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% { background-position: 0% center; }
          50% { background-position: 100% center; }
        }
      `}</style>
    </span>
  );
}

// ============================================================================
// PULSING DOT
// ============================================================================

export function PulsingDot({ className = '' }: { className?: string }) {
  return (
    <div className={`relative w-3 h-3 ${className}`}>
      <div
        className="absolute inset-0 rounded-full bg-green-500"
        style={{
          animation: 'pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        }}
      />
      <div className="absolute inset-1 rounded-full bg-green-400" />
      <style>{`
        @keyframes pulse-ring {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.5;
            transform: scale(1.2);
          }
        }
      `}</style>
    </div>
  );
}

// ============================================================================
// PARALLAX SCROLL EFFECT
// ============================================================================

interface ParallaxProps {
  children: React.ReactNode;
  offset?: number;
}

export function Parallax({ children, offset = 50 }: ParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [yOffset, setYOffset] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        const elementTop = rect.top;
        const windowHeight = window.innerHeight;

        if (elementTop < windowHeight) {
          const scrollProgress = (windowHeight - elementTop) / (windowHeight + rect.height);
          setYOffset(scrollProgress * offset);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [offset]);

  return (
    <div
      ref={ref}
      style={{
        transform: `translateY(${yOffset}px)`,
        transition: 'transform 0.1s ease-out',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// HOVER LIFT EFFECT
// ============================================================================

interface HoverLiftProps {
  children: React.ReactNode;
  className?: string;
}

export function HoverLift({ children, className = '' }: HoverLiftProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className={className}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        boxShadow: isHovered
          ? '0 20px 25px -5px rgba(52, 123, 247, 0.2)'
          : '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
      }}
    >
      {children}
    </div>
  );
}

// ============================================================================
// ANIMATED FEATURE CARD
// ============================================================================

interface AnimatedFeatureCardProps {
  icon: string;
  title: string;
  description: string;
  features: string[];
  delay?: number;
}

export function AnimatedFeatureCard({
  icon,
  title,
  description,
  features,
  delay = 0,
}: AnimatedFeatureCardProps) {
  return (
    <ScrollReveal delay={delay}>
      <HoverLift className="h-full">
        <div className="p-8 rounded-xl border border-[#e0e5ec] hover:border-[#347bf7] h-full bg-white">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#347bf7] to-[#00d4aa] flex items-center justify-center mb-4">
            <span className="text-white text-xl">{icon}</span>
          </div>
          <h3 className="text-xl font-bold text-[#1a1a1a] mb-3">{title}</h3>
          <p className="text-[#666] mb-4">{description}</p>
          <ul className="space-y-2">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-[#666]">
                <span className="text-[#347bf7]">✓</span> {feature}
              </li>
            ))}
          </ul>
        </div>
      </HoverLift>
    </ScrollReveal>
  );
}

// ============================================================================
// TYPING ANIMATION TEXT
// ============================================================================

interface TypingTextProps {
  text: string;
  speed?: number;
  className?: string;
}

export function TypingText({ text, speed = 50, className = '' }: TypingTextProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedText.length < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(text.slice(0, displayedText.length + 1));
      }, speed);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [displayedText, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && <span className="animate-pulse">|</span>}
    </span>
  );
}
