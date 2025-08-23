'use client';

import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundPatternProps {
  variant?: 'dots' | 'grid' | 'gradient' | 'mesh' | 'waves' | 'circles' | 'lines' | 'blobs';
  className?: string;
  opacity?: number;
  animated?: boolean;
}

export default function BackgroundPattern({
  variant = 'gradient',
  className = '',
  opacity = 0.1,
  animated = true
}: BackgroundPatternProps) {
  if (variant === 'dots') {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" className="text-gray-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots)" />
        </svg>
      </div>
    );
  }

  if (variant === 'grid') {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" className="text-gray-300" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>
    );
  }

  if (variant === 'mesh') {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 via-purple-500 to-pink-500 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-bl from-green-400 via-blue-500 to-purple-500 blur-3xl mix-blend-multiply" />
        <div className="absolute inset-0 bg-gradient-to-br from-pink-400 via-red-500 to-yellow-500 blur-3xl mix-blend-multiply" />
      </div>
    );
  }

  if (variant === 'waves') {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
        <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
          {animated ? (
            <motion.path
              fill="currentColor"
              className="text-blue-500"
              animate={{
                d: [
                  "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,128L48,138.7C96,149,192,171,288,165.3C384,160,480,128,576,128C672,128,768,160,864,160C960,160,1056,128,1152,112C1248,96,1344,96,1392,96L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z",
                  "M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
                ]
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
          ) : (
            <path
              fill="currentColor"
              className="text-blue-500"
              d="M0,96L48,112C96,128,192,160,288,160C384,160,480,128,576,122.7C672,117,768,139,864,138.7C960,139,1056,117,1152,112C1248,107,1344,117,1392,122.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
            />
          )}
        </svg>
      </div>
    );
  }

  if (variant === 'circles') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ opacity }}>
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-gradient-to-r from-blue-400 to-purple-400"
            style={{
              width: `${Math.random() * 400 + 200}px`,
              height: `${Math.random() * 400 + 200}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={animated ? {
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 100 - 50],
            } : {}}
            transition={{
              duration: Math.random() * 20 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut"
            }}
          />
        ))}
      </div>
    );
  }

  if (variant === 'lines') {
    return (
      <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="lines" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-gray-400" />
              <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-gray-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#lines)" />
        </svg>
      </div>
    );
  }

  if (variant === 'blobs') {
    return (
      <div className={`absolute inset-0 overflow-hidden ${className}`} style={{ opacity }}>
        <motion.div
          className="absolute w-96 h-96 bg-purple-400 rounded-full blur-3xl"
          style={{ left: '10%', top: '20%' }}
          animate={animated ? {
            x: [0, 100, 0],
            y: [0, -100, 0],
          } : {}}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-blue-400 rounded-full blur-3xl"
          style={{ right: '10%', bottom: '20%' }}
          animate={animated ? {
            x: [0, -100, 0],
            y: [0, 100, 0],
          } : {}}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute w-96 h-96 bg-pink-400 rounded-full blur-3xl"
          style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
          animate={animated ? {
            scale: [1, 1.2, 1],
          } : {}}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>
    );
  }

  // Default gradient
  return (
    <div className={`absolute inset-0 ${className}`} style={{ opacity }}>
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50" />
      {animated && (
        <motion.div
          className="absolute inset-0"
          animate={{
            background: [
              'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.2), transparent 50%)',
              'radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.2), transparent 50%)',
              'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.2), transparent 50%)',
            ],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  );
}

// Animated Gradient Background
export function AnimatedGradient({ className = '' }: { className?: string }) {
  return (
    <motion.div
      className={`absolute inset-0 ${className}`}
      animate={{
        background: [
          'linear-gradient(to right, #3b82f6, #8b5cf6)',
          'linear-gradient(to right, #8b5cf6, #ec4899)',
          'linear-gradient(to right, #ec4899, #3b82f6)',
          'linear-gradient(to right, #3b82f6, #8b5cf6)',
        ],
      }}
      transition={{
        duration: 10,
        repeat: Infinity,
        ease: "linear"
      }}
    />
  );
}

// Particle Background
export function ParticleBackground({ 
  particleCount = 50,
  className = '' 
}: { 
  particleCount?: number;
  className?: string;
}) {
  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {[...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-white rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [-20, -window.innerHeight - 20],
          }}
          transition={{
            duration: Math.random() * 10 + 10,
            repeat: Infinity,
            delay: Math.random() * 5,
            ease: "linear"
          }}
        />
      ))}
    </div>
  );
}

// Glassmorphism Overlay
export function GlassOverlay({ 
  className = '',
  blur = 10 
}: { 
  className?: string;
  blur?: number;
}) {
  return (
    <div 
      className={`absolute inset-0 bg-white/10 backdrop-blur-${blur} ${className}`}
      style={{ backdropFilter: `blur(${blur}px)` }}
    />
  );
}