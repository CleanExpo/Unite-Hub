'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

// Skeleton Loading Component
export function Skeleton({ 
  className = '', 
  variant = 'default' 
}: { 
  className?: string; 
  variant?: 'default' | 'text' | 'circular' | 'card';
}) {
  const baseClasses = "animate-pulse bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%]";
  
  const variantClasses = {
    default: 'rounded-lg',
    text: 'rounded h-4',
    circular: 'rounded-full',
    card: 'rounded-xl'
  };

  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`} />
  );
}

// Card Skeleton
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-xl p-6 shadow-lg">
      <Skeleton className="h-48 mb-4" variant="card" />
      <Skeleton className="h-6 w-3/4 mb-3" variant="text" />
      <Skeleton className="h-4 w-full mb-2" variant="text" />
      <Skeleton className="h-4 w-5/6 mb-4" variant="text" />
      <div className="flex gap-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-20" />
      </div>
    </div>
  );
}

// Table Skeleton
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="p-4 border-b border-gray-200">
        <Skeleton className="h-6 w-48" variant="text" />
      </div>
      <div className="divide-y divide-gray-200">
        {[...Array(rows)].map((_, i) => (
          <div key={i} className="p-4 flex gap-4">
            <Skeleton className="h-10 w-10" variant="circular" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3" variant="text" />
              <Skeleton className="h-3 w-1/2" variant="text" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Form Skeleton
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-xl p-8 shadow-lg space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <Skeleton className="h-4 w-24 mb-2" variant="text" />
          <Skeleton className="h-12 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-24 mb-2" variant="text" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
      <div>
        <Skeleton className="h-4 w-32 mb-2" variant="text" />
        <Skeleton className="h-32 w-full" />
      </div>
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

// Page Loading Spinner
export function PageLoader({ 
  text = "Loading...",
  fullScreen = false 
}: { 
  text?: string;
  fullScreen?: boolean;
}) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 bg-white/90 backdrop-blur-sm z-50" 
    : "py-20";

  return (
    <div className={`${containerClasses} flex flex-col items-center justify-center`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center"
      >
        <div className="relative">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="w-12 h-12 text-blue-600" />
          </motion.div>
          <motion.div
            className="absolute inset-0"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-12 h-12 border-4 border-blue-200 rounded-full" />
          </motion.div>
        </div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-4 text-gray-600 font-medium"
        >
          {text}
        </motion.p>
      </motion.div>
    </div>
  );
}

// Content Placeholder
export function ContentPlaceholder({ 
  lines = 3,
  showImage = false 
}: { 
  lines?: number;
  showImage?: boolean;
}) {
  return (
    <div className="space-y-4">
      {showImage && <Skeleton className="h-64 w-full" variant="card" />}
      <div className="space-y-3">
        <Skeleton className="h-8 w-3/4" variant="text" />
        {[...Array(lines)].map((_, i) => (
          <Skeleton 
            key={i} 
            className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'}`} 
            variant="text" 
          />
        ))}
      </div>
    </div>
  );
}

// Shimmer Effect
export function ShimmerCard() {
  return (
    <div className="relative bg-white rounded-xl p-6 shadow-lg overflow-hidden">
      <div className="space-y-4">
        <Skeleton className="h-12 w-12" variant="circular" />
        <Skeleton className="h-6 w-3/4" variant="text" />
        <Skeleton className="h-4 w-full" variant="text" />
        <Skeleton className="h-4 w-5/6" variant="text" />
      </div>
      
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12"
        animate={{ x: [-1000, 1000] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// Progress Bar Loader
export function ProgressLoader({ 
  progress = 0,
  text = "Loading..." 
}: { 
  progress?: number;
  text?: string;
}) {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-2 flex justify-between text-sm text-gray-600">
        <span>{text}</span>
        <span>{Math.round(progress)}%</span>
      </div>
      <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </div>
  );
}

// Dots Loader
export function DotsLoader() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-3 h-3 bg-blue-600 rounded-full"
          animate={{
            y: [0, -10, 0],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{
            duration: 0.6,
            repeat: Infinity,
            delay: i * 0.1
          }}
        />
      ))}
    </div>
  );
}

// Pulse Loader
export function PulseLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  return (
    <div className="relative">
      <motion.div
        className={`${sizes[size]} bg-blue-600 rounded-full`}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [1, 0.5, 1]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity
        }}
      />
      <motion.div
        className={`absolute inset-0 ${sizes[size]} bg-blue-600 rounded-full`}
        animate={{
          scale: [1, 1.5, 1.5],
          opacity: [0.5, 0, 0]
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity
        }}
      />
    </div>
  );
}

// Grid Skeleton
export function GridSkeleton({ 
  columns = 3,
  rows = 2 
}: { 
  columns?: number;
  rows?: number;
}) {
  const items = columns * rows;
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4'
  };

  return (
    <div className={`grid ${gridCols[columns as keyof typeof gridCols] || 'grid-cols-3'} gap-6`}>
      {[...Array(items)].map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}