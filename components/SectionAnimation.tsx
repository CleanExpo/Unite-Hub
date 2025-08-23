'use client';

import React, { useRef } from 'react';
import { motion, useInView, useScroll, useTransform, MotionValue } from 'framer-motion';

interface SectionAnimationProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fadeUp' | 'fadeIn' | 'slideLeft' | 'slideRight' | 'scale' | 'parallax';
  delay?: number;
  duration?: number;
  once?: boolean;
}

export default function SectionAnimation({
  children,
  className = '',
  animation = 'fadeUp',
  delay = 0,
  duration = 0.6,
  once = true
}: SectionAnimationProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  const animations = {
    fadeUp: {
      initial: { opacity: 0, y: 50 },
      animate: { opacity: 1, y: 0 }
    },
    fadeIn: {
      initial: { opacity: 0 },
      animate: { opacity: 1 }
    },
    slideLeft: {
      initial: { opacity: 0, x: 100 },
      animate: { opacity: 1, x: 0 }
    },
    slideRight: {
      initial: { opacity: 0, x: -100 },
      animate: { opacity: 1, x: 0 }
    },
    scale: {
      initial: { opacity: 0, scale: 0.8 },
      animate: { opacity: 1, scale: 1 }
    },
    parallax: {
      initial: { opacity: 0, y: 100 },
      animate: { opacity: 1, y: 0 }
    }
  };

  const selectedAnimation = animations[animation];

  return (
    <motion.div
      ref={ref}
      initial={selectedAnimation.initial}
      animate={isInView ? selectedAnimation.animate : selectedAnimation.initial}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger Children Animation
export function StaggerChildren({
  children,
  className = '',
  staggerDelay = 0.1,
  once = true
}: {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
  once?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={{
        visible: {
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={className}
    >
      {React.Children.map(children, (child, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 20 },
            visible: { opacity: 1, y: 0 }
          }}
          transition={{ duration: 0.5 }}
        >
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}

// Parallax Section
export function ParallaxSection({
  children,
  backgroundImage,
  speed = 0.5,
  overlay = true,
  className = ''
}: {
  children: React.ReactNode;
  backgroundImage?: string;
  speed?: number;
  overlay?: boolean;
  className?: string;
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ['0%', `${speed * 100}%`]);

  return (
    <div ref={ref} className={`relative overflow-hidden ${className}`}>
      {backgroundImage && (
        <motion.div
          style={{ y }}
          className="absolute inset-0 z-0"
        >
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ 
              backgroundImage: `url(${backgroundImage})`,
              transform: `scale(${1 + Math.abs(speed)})`
            }}
          />
          {overlay && (
            <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-black/30" />
          )}
        </motion.div>
      )}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

// Reveal on Scroll with Line
export function RevealWithLine({
  children,
  className = '',
  lineColor = 'bg-blue-600',
  once = true
}: {
  children: React.ReactNode;
  className?: string;
  lineColor?: string;
  once?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once, margin: "-100px" });

  return (
    <div ref={ref} className={`relative ${className}`}>
      <motion.div
        initial={{ scaleX: 0 }}
        animate={isInView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`absolute left-0 top-0 h-1 ${lineColor} origin-left`}
        style={{ width: '100%' }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="pt-4"
      >
        {children}
      </motion.div>
    </div>
  );
}

// Floating Animation
export function FloatingElement({
  children,
  duration = 3,
  delay = 0,
  yOffset = 10
}: {
  children: React.ReactNode;
  duration?: number;
  delay?: number;
  yOffset?: number;
}) {
  return (
    <motion.div
      animate={{
        y: [0, -yOffset, 0]
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut"
      }}
    >
      {children}
    </motion.div>
  );
}

// Rotate on Hover
export function RotateOnHover({
  children,
  rotation = 10
}: {
  children: React.ReactNode;
  rotation?: number;
}) {
  return (
    <motion.div
      whileHover={{ rotate: rotation, scale: 1.05 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      {children}
    </motion.div>
  );
}

// Typewriter Effect
export function TypewriterText({
  text,
  speed = 50,
  className = '',
  cursor = true
}: {
  text: string;
  speed?: number;
  className?: string;
  cursor?: boolean;
}) {
  const [displayedText, setDisplayedText] = React.useState('');
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {cursor && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
        >
          |
        </motion.span>
      )}
    </span>
  );
}

// 3D Card Tilt
export function Card3D({
  children,
  className = ''
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const [mousePosition, setMousePosition] = React.useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = React.useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 20;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -20;
    setMousePosition({ x, y });
  };

  return (
    <motion.div
      className={`relative ${className}`}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setMousePosition({ x: 0, y: 0 });
      }}
      animate={{
        rotateX: isHovered ? mousePosition.y : 0,
        rotateY: isHovered ? mousePosition.x : 0
      }}
      transition={{ type: "spring", stiffness: 300 }}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}