'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, Users, Clock, Zap, Globe, BarChart3 } from 'lucide-react';

interface Metric {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  icon: React.ElementType;
  color: string;
  trend?: number;
}

export default function LiveMetricsDisplay() {
  const [metrics, setMetrics] = useState<Metric[]>([
    {
      label: 'Websites Built This Month',
      value: 1247,
      icon: Globe,
      color: 'blue',
      trend: 12
    },
    {
      label: 'Average Time to Launch',
      value: 32,
      suffix: 'min',
      icon: Clock,
      color: 'green',
      trend: -15
    },
    {
      label: 'Active Self-Service Users',
      value: 8492,
      icon: Users,
      color: 'purple',
      trend: 28
    },
    {
      label: 'Features Deployed Today',
      value: 47,
      icon: Zap,
      color: 'orange',
      trend: 5
    }
  ]);

  const [currentMetricIndex, setCurrentMetricIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: metric.value + Math.floor(Math.random() * 3) - 1
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Rotate through metrics on mobile
  useEffect(() => {
    const rotation = setInterval(() => {
      setCurrentMetricIndex(prev => (prev + 1) % metrics.length);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 500);
    }, 4000);

    return () => clearInterval(rotation);
  }, [metrics.length]);

  const getColorClasses = (color: string) => {
    const colors = {
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      purple: 'bg-purple-100 text-purple-700 border-purple-200',
      orange: 'bg-orange-100 text-orange-700 border-orange-200'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getTrendColor = (trend?: number) => {
    if (!trend) return 'text-gray-500';
    return trend > 0 ? 'text-green-600' : 'text-red-600';
  };

  return (
    <>
      {/* Desktop View - Horizontal Bar */}
      <div className="hidden md:block w-full bg-gradient-to-r from-gray-50 to-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs text-gray-600">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span className="font-medium">Live Platform Metrics</span>
            </div>
            
            <div className="flex items-center space-x-6">
              {metrics.map((metric, index) => (
                <motion.div
                  key={metric.label}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center space-x-2"
                >
                  <div className={`p-1.5 rounded-lg ${getColorClasses(metric.color)}`}>
                    <metric.icon className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500">{metric.label}</span>
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-sm text-gray-900">
                        {metric.prefix}{metric.value.toLocaleString()}{metric.suffix}
                      </span>
                      {metric.trend && (
                        <span className={`text-xs ${getTrendColor(metric.trend)}`}>
                          {metric.trend > 0 ? '+' : ''}{metric.trend}%
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600">Live</span>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile View - Rotating Single Metric */}
      <div className="md:hidden w-full bg-gradient-to-r from-gray-50 to-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-gray-600 font-medium">Live Metrics</span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentMetricIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="flex items-center space-x-2"
              >
                <div className={`p-1.5 rounded-lg ${getColorClasses(metrics[currentMetricIndex].color)}`}>
                  {React.createElement(metrics[currentMetricIndex].icon, { className: "w-3.5 h-3.5" })}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500">
                    {metrics[currentMetricIndex].label}
                  </span>
                  <div className="flex items-center space-x-1">
                    <span className="font-bold text-sm text-gray-900">
                      {metrics[currentMetricIndex].prefix}
                      {metrics[currentMetricIndex].value.toLocaleString()}
                      {metrics[currentMetricIndex].suffix}
                    </span>
                    {metrics[currentMetricIndex].trend && (
                      <span className={`text-xs ${getTrendColor(metrics[currentMetricIndex].trend)}`}>
                        {metrics[currentMetricIndex].trend > 0 ? '+' : ''}
                        {metrics[currentMetricIndex].trend}%
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}

// Compact version for embedding in other components
export function CompactMetrics() {
  const [websitesBuilt, setWebsitesBuilt] = useState(1247);
  const [avgTime, setAvgTime] = useState(32);

  useEffect(() => {
    const interval = setInterval(() => {
      setWebsitesBuilt(prev => prev + Math.floor(Math.random() * 5));
      setAvgTime(prev => Math.max(20, Math.min(45, prev + Math.floor(Math.random() * 3) - 1)));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="inline-flex items-center space-x-4 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 shadow-sm">
      <div className="flex items-center space-x-1">
        <Globe className="w-4 h-4 text-blue-600" />
        <span className="text-sm">
          <span className="font-bold text-gray-900">{websitesBuilt.toLocaleString()}</span>
          <span className="text-gray-600 ml-1">sites built</span>
        </span>
      </div>
      <div className="w-px h-4 bg-gray-300"></div>
      <div className="flex items-center space-x-1">
        <Clock className="w-4 h-4 text-green-600" />
        <span className="text-sm">
          <span className="font-bold text-gray-900">{avgTime}</span>
          <span className="text-gray-600 ml-1">min avg</span>
        </span>
      </div>
    </div>
  );
}