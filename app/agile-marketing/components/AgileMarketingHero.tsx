'use client';

import { motion, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Zap, Users, Target, TrendingUp, Calendar, CheckCircle, Clock, Play } from 'lucide-react';
import { useState, useEffect } from 'react';

const KanbanCard = ({ title, status, priority, delay }: { 
  title: string; 
  status: 'todo' | 'doing' | 'done'; 
  priority: 'high' | 'medium' | 'low';
  delay: number;
}) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const statusColors = {
    todo: 'border-orange-500/30 bg-orange-500/10',
    doing: 'border-cyan-500/30 bg-cyan-500/10',
    done: 'border-emerald-500/30 bg-emerald-500/10'
  };

  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-amber-500',
    low: 'bg-emerald-500'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20, scale: isVisible ? 1 : 0.9 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`p-4 rounded-lg border ${statusColors[status]} backdrop-blur-sm hover:scale-105 transition-all duration-300 cursor-pointer group`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className={`w-3 h-3 rounded-full ${priorityColors[priority]}`} />
        <div className="text-xs text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
          #{Math.floor(Math.random() * 1000)}
        </div>
      </div>
      <p className="text-sm text-white font-medium leading-relaxed">{title}</p>
    </motion.div>
  );
};

export default function AgileMarketingHero() {
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 500], [0, -100]);
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Kanban-Inspired Background */}
      <div className="absolute inset-0">
        {/* Base gradient with organized workflow feel */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="absolute inset-0 bg-gradient-to-r from-orange-900/10 via-transparent to-emerald-900/10" />
        
        {/* Grid Pattern - Like Kanban Board */}
        <svg className="absolute inset-0 w-full h-full opacity-20">
          <defs>
            <pattern id="kanban-grid" width="120" height="80" patternUnits="userSpaceOnUse">
              <rect x="0" y="0" width="120" height="80" fill="none" stroke="rgba(6, 182, 212, 0.2)" strokeWidth="1"/>
              <rect x="10" y="10" width="100" height="60" fill="none" stroke="rgba(6, 182, 212, 0.1)" strokeWidth="1" rx="8"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#kanban-grid)" />
        </svg>

        {/* Floating Kanban Cards */}
        <div className="absolute top-20 left-10 w-64 space-y-3 opacity-40">
          <div className="bg-slate-800/50 p-3 rounded-lg border-t-4 border-orange-500">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-orange-400" />
              <span className="text-xs font-medium text-orange-300">TO DO</span>
            </div>
            <p className="text-sm text-slate-300">Email Campaign Strategy</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border-t-4 border-orange-500">
            <p className="text-sm text-slate-300">Social Media Calendar</p>
          </div>
        </div>

        <div className="absolute top-40 right-10 w-64 space-y-3 opacity-40">
          <div className="bg-slate-800/50 p-3 rounded-lg border-t-4 border-cyan-500">
            <div className="flex items-center gap-2 mb-2">
              <Play className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300">IN PROGRESS</span>
            </div>
            <p className="text-sm text-slate-300">Landing Page A/B Test</p>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-lg border-t-4 border-cyan-500">
            <p className="text-sm text-slate-300">Lead Nurture Sequence</p>
          </div>
        </div>

        <div className="absolute bottom-40 left-1/2 transform -translate-x-1/2 w-64 space-y-3 opacity-40">
          <div className="bg-slate-800/50 p-3 rounded-lg border-t-4 border-emerald-500">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-medium text-emerald-300">DONE</span>
            </div>
            <p className="text-sm text-slate-300">Q4 Campaign Analysis</p>
          </div>
        </div>

        {/* Animated Sprint Indicator */}
        <motion.div
          className="absolute top-10 right-20 bg-slate-800/80 backdrop-blur-sm px-6 py-3 rounded-full border border-cyan-500/30"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-cyan-300">Sprint 23 • Day 8/14</span>
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        style={{ y }}
      >
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left Column - Content */}
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-cyan-500/30 rounded-full mb-8"
            >
              <Zap className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium text-cyan-300">AGILE TRANSFORMATION</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6"
            >
              <span className="text-white">Sprint-Based</span>
              <br />
              <span className="unite-text-gradient">Marketing</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-300 mb-8 leading-relaxed"
            >
              Transform your marketing team with agile methodologies. Deliver campaigns 
              <span className="text-cyan-400 font-semibold"> 3x faster </span>
              with iterative sprints and continuous optimization.
            </motion.p>

            {/* Agile Benefits Cards */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8"
            >
              {[
                { icon: Users, label: 'Cross-functional Teams', metric: '90% Satisfaction' },
                { icon: Target, label: 'Sprint Delivery', metric: '2-Week Cycles' },
                { icon: TrendingUp, label: 'Continuous Improvement', metric: '40% Better ROI' }
              ].map((benefit, index) => (
                <motion.div
                  key={index}
                  className="unite-card p-4 text-center group"
                  whileHover={{ y: -4, scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <benefit.icon className="w-6 h-6 text-cyan-400 mx-auto mb-2 group-hover:animate-pulse" />
                  <p className="text-sm font-medium text-white mb-1">{benefit.label}</p>
                  <p className="text-xs text-slate-400">{benefit.metric}</p>
                </motion.div>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="/contact?service=agile-marketing"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-500 rounded-xl hover:from-cyan-500 hover:to-cyan-600 transition-all duration-300 shadow-2xl hover:shadow-cyan-500/50 unite-glow"
                >
                  Start Your Transformation
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </motion.div>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Link
                  href="#agile-process"
                  className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-slate-800/50 backdrop-blur-xl border border-slate-600 rounded-xl hover:bg-slate-700/50 hover:border-cyan-500/50 transition-all duration-300"
                >
                  See Our Process
                  <Calendar className="ml-2 w-5 h-5" />
                </Link>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column - Interactive Kanban Board */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="relative"
          >
            <div className="bg-slate-800/30 backdrop-blur-xl border border-slate-700 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-white">Marketing Sprint Board</h3>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  Live Project
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {/* To Do Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                    <Clock className="w-4 h-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-300">TO DO (4)</span>
                  </div>
                  <KanbanCard 
                    title="Email Campaign Strategy" 
                    status="todo" 
                    priority="high" 
                    delay={500}
                  />
                  <KanbanCard 
                    title="Social Media Calendar Q1" 
                    status="todo" 
                    priority="medium" 
                    delay={700}
                  />
                  <KanbanCard 
                    title="Competitor Analysis Report" 
                    status="todo" 
                    priority="low" 
                    delay={900}
                  />
                </div>

                {/* In Progress Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                    <Play className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm font-medium text-cyan-300">DOING (2)</span>
                  </div>
                  <KanbanCard 
                    title="Landing Page A/B Test" 
                    status="doing" 
                    priority="high" 
                    delay={1100}
                  />
                  <KanbanCard 
                    title="Lead Nurture Sequence" 
                    status="doing" 
                    priority="medium" 
                    delay={1300}
                  />
                </div>

                {/* Done Column */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-700">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-medium text-emerald-300">DONE (3)</span>
                  </div>
                  <KanbanCard 
                    title="Q4 Campaign Analysis" 
                    status="done" 
                    priority="medium" 
                    delay={1500}
                  />
                  <KanbanCard 
                    title="Brand Guidelines Update" 
                    status="done" 
                    priority="low" 
                    delay={1700}
                  />
                </div>
              </div>

              {/* Sprint Progress */}
              <div className="mt-6 p-4 bg-slate-700/30 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-white">Sprint Progress</span>
                  <span className="text-sm text-slate-400">8 of 14 days</span>
                </div>
                <div className="w-full bg-slate-600 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-cyan-500 to-emerald-500 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: "57%" }}
                    transition={{ duration: 2, delay: 2 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sprint Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 1 }}
          className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 text-center"
        >
          {[
            { value: '3x', label: 'Faster Delivery', color: 'text-cyan-400' },
            { value: '65%', label: 'Team Velocity Boost', color: 'text-emerald-400' },
            { value: '40%', label: 'Better Campaign ROI', color: 'text-purple-400' },
            { value: '14', label: 'Day Sprint Cycles', color: 'text-amber-400' }
          ].map((stat, index) => (
            <motion.div
              key={index}
              className="unite-card p-6"
              whileHover={{ y: -4, scale: 1.05 }}
            >
              <div className={`text-3xl font-bold ${stat.color} mb-2`}>{stat.value}</div>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  );
}