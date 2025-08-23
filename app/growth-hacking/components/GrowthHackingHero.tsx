'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, TrendingUp, Zap, Rocket, BarChart3, Target, Users, DollarSign } from 'lucide-react';
import { useEffect, useState } from 'react';

const AnimatedCounter = ({ end, duration = 2000, suffix = "" }: { end: number; duration?: number; suffix?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
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
  }, [end, duration]);

  return <span>{count}{suffix}</span>;
};

export default function GrowthHackingHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -100]);
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Data-Driven Background Effects */}
      <div className="absolute inset-0">
        {/* Base gradient with neon accents */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/20 via-transparent to-purple-900/20" />
        
        {/* Animated Data Grid */}
        <svg className="absolute inset-0 w-full h-full opacity-30">
          <defs>
            <pattern id="data-grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="1"/>
              <circle cx="30" cy="30" r="2" fill="rgba(6, 182, 212, 0.6)" />
            </pattern>
            <linearGradient id="neon-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(6, 182, 212, 0.8)" />
              <stop offset="50%" stopColor="rgba(139, 92, 246, 0.8)" />
              <stop offset="100%" stopColor="rgba(6, 182, 212, 0.8)" />
            </linearGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#data-grid)" />
        </svg>
        
        {/* Floating Growth Charts */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-32 h-20 opacity-40"
          animate={{ y: [0, -10, 0], rotate: [0, 2, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 100 60" className="w-full h-full">
            <path
              d="M 10 50 Q 30 40 50 20 T 90 10"
              fill="none"
              stroke="url(#neon-gradient)"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="90" cy="10" r="3" fill="rgba(6, 182, 212, 1)" className="animate-pulse" />
          </svg>
        </motion.div>

        <motion.div
          className="absolute bottom-1/4 right-1/6 w-40 h-24 opacity-40"
          animate={{ y: [0, 15, 0], rotate: [0, -2, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          <svg viewBox="0 0 120 72" className="w-full h-full">
            <path
              d="M 10 60 L 20 45 L 30 50 L 40 30 L 50 35 L 60 20 L 70 25 L 80 15 L 90 20 L 100 10 L 110 12"
              fill="none"
              stroke="rgba(139, 92, 246, 0.8)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {[20, 40, 60, 80, 100].map((x, i) => (
              <rect
                key={i}
                x={x - 2}
                y={60 - (i + 1) * 8}
                width="4"
                height={(i + 1) * 8}
                fill={`rgba(6, 182, 212, ${0.3 + i * 0.1})`}
              />
            ))}
          </svg>
        </motion.div>

        {/* Glowing Orbs with Neon Effect */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
          style={{
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.3) 0%, rgba(6, 182, 212, 0.1) 50%, transparent 70%)'
          }}
          animate={{
            x: [0, 30, 0],
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        />
        
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-80 h-80 rounded-full blur-3xl"
          style={{
            background: 'radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(139, 92, 246, 0.1) 50%, transparent 70%)'
          }}
          animate={{
            x: [0, -25, 0],
            y: [0, 25, 0],
            scale: [1, 1.15, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 5 }}
        />
      </div>

      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
        style={{ y }}
      >
        {/* Live Metrics Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-3 px-6 py-3 bg-slate-800/50 backdrop-blur-xl border border-cyan-500/30 rounded-full mb-8 unite-glow"
        >
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-cyan-300">LIVE</span>
          </div>
          <div className="h-4 w-px bg-cyan-500/30" />
          <TrendingUp className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-medium text-slate-200">
            <AnimatedCounter end={287} suffix="%" /> Avg Growth in 6 Months
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
        >
          <span className="unite-text-gradient">
            Growth Hacking
          </span>
          <br />
          <span className="text-white">That Actually Works</span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed"
        >
          Data-driven experimentation and viral growth strategies that have generated 
          <span className="text-cyan-400 font-semibold"> $50M+ in revenue </span>
          for Brisbane businesses
        </motion.p>

        {/* Real-Time Metrics Dashboard */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 max-w-5xl mx-auto"
        >
          {[
            { icon: BarChart3, label: 'Conversion Rate', value: 34, suffix: '%', color: 'text-cyan-400' },
            { icon: Target, label: 'Experiments Run', value: 2847, suffix: '', color: 'text-purple-400' },
            { icon: Users, label: 'Users Acquired', value: 150, suffix: 'K+', color: 'text-emerald-400' },
            { icon: DollarSign, label: 'Revenue Generated', value: 50, suffix: 'M+', color: 'text-amber-400' }
          ].map((metric, index) => (
            <motion.div
              key={index}
              className="unite-card p-6 text-center group"
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ duration: 0.2 }}
            >
              <metric.icon className={`w-8 h-8 ${metric.color} mx-auto mb-3 group-hover:animate-pulse`} />
              <div className="text-2xl md:text-3xl font-bold text-white mb-1">
                <AnimatedCounter end={metric.value} suffix={metric.suffix} />
              </div>
              <p className="text-sm text-slate-400">{metric.label}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="/contact?service=growth-hacking"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl hover:from-cyan-500 hover:to-cyan-600 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 unite-glow"
            >
              Start Growth Analysis
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              href="#growth-metrics"
              className="inline-flex items-center justify-center px-10 py-5 text-lg font-semibold text-white bg-slate-800/50 backdrop-blur-xl border border-slate-600 rounded-xl hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
            >
              View Growth Data
              <BarChart3 className="ml-2 w-5 h-5" />
            </Link>
          </motion.div>
        </motion.div>

        {/* Trust Indicators with Australian Focus */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pt-12 border-t border-slate-700"
        >
          <p className="text-sm text-slate-400 mb-6">Trusted by Australia's fastest-growing companies</p>
          <div className="flex flex-wrap justify-center gap-8 items-center opacity-60">
            {['TechStart Brisbane', 'SydneyScale', 'MelbourneGrowth', 'Aussie Unicorn', 'Digital Sydney'].map((company) => (
              <motion.span
                key={company}
                className="text-slate-300 font-semibold text-lg"
                whileHover={{ opacity: 1, scale: 1.1 }}
                transition={{ duration: 0.2 }}
              >
                {company}
              </motion.span>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}