'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, useInView, useSpring, useTransform } from 'framer-motion';
import { TrendingUp, Users, Clock, DollarSign, Rocket, Award, Target, Zap } from 'lucide-react';

interface Stat {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ElementType;
  color: string;
  decimals?: number;
}

interface AnimatedStatsProps {
  stats: Stat[];
  variant?: 'default' | 'dark' | 'gradient' | 'card';
  className?: string;
}

export function AnimatedNumber({ 
  value, 
  decimals = 0,
  duration = 2 
}: { 
  value: number; 
  decimals?: number;
  duration?: number;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useSpring(0, { duration: duration * 1000 });
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (isInView) {
      motionValue.set(value);
    }
  }, [motionValue, value, isInView]);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toFixed(decimals);
      }
    });

    return unsubscribe;
  }, [motionValue, decimals]);

  return <span ref={ref}>0</span>;
}

export default function AnimatedStats({ 
  stats, 
  variant = 'default',
  className = '' 
}: AnimatedStatsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "-100px" });

  const getColorClasses = (color: string) => {
    const colors = {
      blue: {
        bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
        icon: 'text-blue-600',
        iconBg: 'bg-blue-100',
        border: 'border-blue-200',
        glow: 'shadow-blue-500/20'
      },
      green: {
        bg: 'bg-gradient-to-br from-green-500 to-green-600',
        icon: 'text-green-600',
        iconBg: 'bg-green-100',
        border: 'border-green-200',
        glow: 'shadow-green-500/20'
      },
      purple: {
        bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
        icon: 'text-purple-600',
        iconBg: 'bg-purple-100',
        border: 'border-purple-200',
        glow: 'shadow-purple-500/20'
      },
      orange: {
        bg: 'bg-gradient-to-br from-orange-500 to-orange-600',
        icon: 'text-orange-600',
        iconBg: 'bg-orange-100',
        border: 'border-orange-200',
        glow: 'shadow-orange-500/20'
      },
      pink: {
        bg: 'bg-gradient-to-br from-pink-500 to-pink-600',
        icon: 'text-pink-600',
        iconBg: 'bg-pink-100',
        border: 'border-pink-200',
        glow: 'shadow-pink-500/20'
      }
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const variants = {
    default: "bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow",
    dark: "bg-gray-900 text-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow",
    gradient: "bg-gradient-to-br from-white to-gray-50 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow",
    card: "bg-white rounded-2xl p-8 shadow-xl border border-gray-100"
  };

  return (
    <div 
      ref={containerRef}
      className={`grid grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}
    >
      {stats.map((stat, index) => {
        const colors = getColorClasses(stat.color);
        const Icon = stat.icon;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className={`${variants[variant]} relative overflow-hidden group cursor-pointer`}
          >
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute -right-10 -top-10 w-40 h-40 rounded-full bg-gradient-to-br from-blue-400 to-purple-400"></div>
              <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-blue-400"></div>
            </div>

            {/* Icon */}
            <motion.div 
              className={`${colors.iconBg} ${colors.icon} w-14 h-14 rounded-xl flex items-center justify-center mb-4 relative z-10`}
              whileHover={{ rotate: [0, -10, 10, -10, 0] }}
              transition={{ duration: 0.5 }}
            >
              <Icon className="w-7 h-7" />
            </motion.div>

            {/* Value */}
            <div className={`text-3xl lg:text-4xl font-bold mb-2 relative z-10 ${
              variant === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              {stat.prefix}
              <AnimatedNumber 
                value={stat.value} 
                decimals={stat.decimals || 0}
              />
              {stat.suffix}
            </div>

            {/* Label */}
            <div className={`text-sm font-medium relative z-10 ${
              variant === 'dark' ? 'text-gray-300' : 'text-gray-600'
            }`}>
              {stat.label}
            </div>

            {/* Hover Effect Overlay */}
            <motion.div
              className={`absolute inset-0 ${colors.bg} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            />

            {/* Animated Border */}
            <motion.div
              className={`absolute inset-0 rounded-xl border-2 ${colors.border} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}
              initial={{ scale: 0.8 }}
              whileHover={{ scale: 1 }}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

// Circular Progress Stats
export function CircularStats({ stats }: { stats: Stat[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true });

  return (
    <div ref={containerRef} className="grid grid-cols-2 lg:grid-cols-4 gap-8">
      {stats.map((stat, index) => {
        const percentage = (stat.value / 100) * 100;
        const circumference = 2 * Math.PI * 45;
        const strokeDashoffset = circumference - (percentage / 100) * circumference;

        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            className="relative flex flex-col items-center"
          >
            <div className="relative w-32 h-32">
              <svg className="transform -rotate-90 w-32 h-32">
                <circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  className="text-gray-200"
                />
                <motion.circle
                  cx="64"
                  cy="64"
                  r="45"
                  stroke="currentColor"
                  strokeWidth="10"
                  fill="none"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={isInView ? { strokeDashoffset } : {}}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="text-blue-600"
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">
                    <AnimatedNumber value={stat.value} />
                    {stat.suffix}
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 text-center">
              <div className="text-sm font-medium text-gray-600">{stat.label}</div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// Alias exports for backward compatibility
export const CircularProgress = CircularStats;
export const ComparisonBar = ComparisonStats;
export const AnimatedPercentage = AnimatedNumber;

// Comparison Stats
export function ComparisonStats({ 
  before, 
  after 
}: { 
  before: { label: string; value: string };
  after: { label: string; value: string };
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0 }}
      animate={isInView ? { opacity: 1 } : {}}
      className="relative"
    >
      <div className="grid md:grid-cols-2 gap-4">
        {/* Before */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.2 }}
          className="bg-red-50 border-2 border-red-200 rounded-xl p-6"
        >
          <div className="text-red-600 font-semibold mb-2">Before</div>
          <div className="text-3xl font-bold text-gray-900">{before.value}</div>
          <div className="text-sm text-gray-600 mt-1">{before.label}</div>
        </motion.div>

        {/* After */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={isInView ? { x: 0, opacity: 1 } : {}}
          transition={{ delay: 0.4 }}
          className="bg-green-50 border-2 border-green-200 rounded-xl p-6"
        >
          <div className="text-green-600 font-semibold mb-2">After</div>
          <div className="text-3xl font-bold text-gray-900">{after.value}</div>
          <div className="text-sm text-gray-600 mt-1">{after.label}</div>
        </motion.div>
      </div>

      {/* Arrow */}
      <motion.div
        initial={{ scale: 0 }}
        animate={isInView ? { scale: 1 } : {}}
        transition={{ delay: 0.6 }}
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10"
      >
        <div className="bg-white rounded-full p-3 shadow-lg">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
      </motion.div>
    </motion.div>
  );
}