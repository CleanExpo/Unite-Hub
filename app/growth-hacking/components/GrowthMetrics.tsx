'use client';

import { motion, useInView } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Repeat, Share2, Target, BarChart3, Zap, Activity, Rocket } from 'lucide-react';
import { useRef, useEffect, useState } from 'react';

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (inView && !isVisible) {
      setIsVisible(true);
      let startTime: number;
      let animationFrame: number;

      const animate = (currentTime: number) => {
        if (!startTime) startTime = currentTime;
        const progress = Math.min((currentTime - startTime) / duration, 1);
        
        setCount(Math.floor(progress * end));
        
        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
    return undefined;
  }, [end, duration, inView, isVisible]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const primaryMetrics = [
  {
    icon: TrendingUp,
    value: 287,
    suffix: '%',
    label: 'Average Growth Rate',
    description: 'in first 6 months',
    bgColor: 'bg-gradient-to-br from-cyan-500/20 to-purple-500/20',
    iconColor: 'text-cyan-400',
    textColor: 'text-cyan-400'
  },
  {
    icon: DollarSign,
    value: 50,
    suffix: 'M+',
    label: 'Revenue Generated',
    description: 'for Brisbane businesses',
    bgColor: 'bg-gradient-to-br from-emerald-500/20 to-cyan-500/20',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-400'
  },
  {
    icon: Users,
    value: 2.5,
    suffix: 'M+',
    label: 'Users Acquired',
    description: 'through viral loops',
    bgColor: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20',
    iconColor: 'text-purple-400',
    textColor: 'text-purple-400'
  }
];

const secondaryMetrics = [
  { icon: Target, value: 92, suffix: '%', label: 'Success Rate', color: 'text-cyan-400' },
  { icon: Share2, value: 3.2, suffix: 'x', label: 'Viral Coefficient', color: 'text-purple-400' },
  { icon: Repeat, value: 73, suffix: '%', label: 'Retention Boost', color: 'text-emerald-400' },
  { icon: Zap, value: 2847, suffix: '+', label: 'A/B Tests Run', color: 'text-amber-400' },
  { icon: Activity, value: 15, suffix: '', label: 'Days to First Growth', color: 'text-rose-400' },
  { icon: Rocket, value: 8.4, suffix: 'x', label: 'ROI Multiplier', color: 'text-indigo-400' }
];

export default function GrowthMetrics() {
  return (
    <section id="growth-metrics" className="py-24 bg-slate-900/50 relative overflow-hidden">
      {/* Background Data Visualization */}
      <div className="absolute inset-0 opacity-10">
        <svg className="absolute inset-0 w-full h-full">
          <defs>
            <pattern id="metrics-grid" width="100" height="100" patternUnits="userSpaceOnUse">
              <path d="M 100 0 L 0 0 0 100" fill="none" stroke="rgba(6, 182, 212, 0.3)" strokeWidth="1"/>
              <circle cx="50" cy="50" r="1" fill="rgba(6, 182, 212, 0.4)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#metrics-grid)" />
        </svg>
        
        {/* Floating Chart Elements */}
        <motion.div
          className="absolute top-20 right-20 w-20 h-12 opacity-30"
          animate={{ y: [0, -15, 0], rotate: [0, 3, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 80 48" className="w-full h-full">
            <path
              d="M 5 40 L 15 35 L 25 20 L 35 25 L 45 10 L 55 15 L 65 5 L 75 8"
              fill="none"
              stroke="rgba(6, 182, 212, 0.6)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-cyan-500/30 rounded-full mb-6"
            whileHover={{ scale: 1.05 }}
          >
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-medium text-cyan-300">GROWTH ANALYTICS</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            The Numbers Don't Lie
          </h2>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            Real-time metrics from our growth hacking campaigns across 
            <span className="text-cyan-400 font-semibold"> 150+ Brisbane businesses</span>
          </p>
        </motion.div>

        {/* Primary Metrics - Large Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {primaryMetrics.map((metric, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="unite-card p-8 text-center group relative overflow-hidden"
            >
              {/* Animated Background Pattern */}
              <div className={`absolute inset-0 ${metric.bgColor} opacity-50`} />
              <motion.div
                className="absolute inset-0 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                animate={{ 
                  background: [
                    "radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)",
                    "radial-gradient(circle at 80% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%)",
                    "radial-gradient(circle at 20% 50%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)",
                  ]
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              />
              
              <div className="relative z-10">
                <motion.div
                  className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${metric.bgColor} mb-6 group-hover:scale-110 transition-transform duration-300`}
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <metric.icon className={`w-8 h-8 ${metric.iconColor}`} />
                </motion.div>
                
                <div className={`text-5xl md:text-6xl font-bold ${metric.textColor} mb-3`}>
                  <AnimatedCounter end={metric.value} suffix={metric.suffix} />
                </div>
                
                <h3 className="text-xl font-semibold text-white mb-2">{metric.label}</h3>
                <p className="text-slate-400">{metric.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Secondary Metrics Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
        >
          {secondaryMetrics.map((metric, index) => (
            <motion.div
              key={index}
              className="unite-card p-6 text-center group"
              whileHover={{ y: -4, scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <metric.icon className={`w-6 h-6 ${metric.color} mx-auto mb-3 group-hover:animate-pulse`} />
              <div className={`text-2xl font-bold ${metric.color} mb-1`}>
                <AnimatedCounter end={metric.value} suffix={metric.suffix} />
              </div>
              <p className="text-xs text-slate-400 leading-tight">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Growth Chart Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-16 p-8 unite-card"
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">Growth Trajectory</h3>
            <p className="text-slate-400">Average client growth over 12 months</p>
          </div>
          
          <div className="relative h-48 flex items-end justify-center gap-3">
            {[20, 35, 45, 60, 75, 85, 95, 120, 140, 180, 220, 287].map((height, index) => (
              <motion.div
                key={index}
                className="bg-gradient-to-t from-cyan-500 to-purple-500 rounded-t-lg relative group cursor-pointer"
                style={{ width: '40px' }}
                initial={{ height: 0 }}
                whileInView={{ height: `${(height / 287) * 100}%` }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                whileHover={{ scale: 1.1, zIndex: 10 }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity">
                  {height}%
                </div>
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 text-xs text-slate-400">
                  M{index + 1}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}