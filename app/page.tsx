"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  ChevronDown,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Settings,
  ShieldCheck,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  FolderOpen,
  MessageSquare,
} from "lucide-react";

// Custom Components
import UniteAdvantageSection from "@/components/unite-advantage-section";
import PartnersSection from "@/components/partners-section";
import CaseStudiesSection from "@/components/case-studies-section";
import { services } from "@/lib/services-data";
import { iconMap } from "@/lib/icon-map";
import { FloatingChatbotTrigger } from "@/components/chatbot";

const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
  id?: string;
}> = ({ children, className, delay = 0, id }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const controls = useAnimation();
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
      }}
    >
      {children}
    </motion.section>
  );
};

export default function UniteGroupLandingPage() {
  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen antialiased">
      {/* Hero Section */}
      <AnimatedSection className="relative pt-32 pb-28 md:pt-48 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          {/* Enhanced Bold Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-900/70 opacity-80"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-teal-900/50 via-transparent to-cyan-800/60"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 via-transparent to-teal-900/50"></div>
          
          {/* Large Bold Gradient Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/40 to-teal-500/35 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-80 h-80 bg-gradient-to-tl from-teal-500/35 to-cyan-400/40 rounded-full filter blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, 30, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Left Side Bold Geometric Objects */}
          <motion.div
            className="absolute top-1/6 left-8 w-20 h-20 border-2 border-cyan-400/70 rounded-full bg-gradient-to-br from-cyan-500/40 to-transparent"
            animate={{ 
              x: [0, 15, 0], 
              y: [0, -25, 0], 
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute top-1/3 left-4 w-12 h-12 border-2 border-teal-400/80 rounded-full bg-gradient-to-br from-teal-500/45 to-transparent"
            animate={{ 
              x: [0, 20, 0], 
              y: [0, 30, 0], 
              scale: [1, 0.8, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-12 w-16 h-16 border-2 border-cyan-300/75 rounded-full bg-gradient-to-br from-cyan-400/50 to-transparent"
            animate={{ 
              x: [0, 25, 0], 
              y: [0, -20, 0], 
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-6 w-10 h-10 border-2 border-teal-300/70 rounded-full bg-gradient-to-br from-teal-400/40 to-transparent"
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 25, 0], 
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Right Side Bold Geometric Objects */}
          <motion.div
            className="absolute top-1/4 right-8 w-24 h-24 border-2 border-teal-400/75 rounded-full bg-gradient-to-br from-teal-500/45 to-transparent"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, -30, 0], 
              scale: [1, 1.25, 1]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.5,
            }}
          />
          
          <motion.div
            className="absolute top-1/2 right-4 w-14 h-14 border-2 border-cyan-400/60 rounded-full bg-gradient-to-br from-cyan-400/30 to-transparent"
            animate={{ 
              x: [0, -25, 0], 
              y: [0, 20, 0], 
              scale: [1, 0.85, 1]
            }}
            transition={{
              duration: 19,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1.5,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-12 w-18 h-18 border-2 border-teal-300/50 rounded-full bg-gradient-to-br from-teal-400/20 to-transparent"
            animate={{ 
              x: [0, -15, 0], 
              y: [0, -25, 0], 
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 17,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2.5,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/8 right-6 w-12 h-12 border-2 border-cyan-300/55 rounded-full bg-gradient-to-br from-cyan-300/25 to-transparent"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, 30, 0], 
              scale: [1, 0.95, 1]
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3.5,
            }}
          />
          
          {/* Triangle Shapes */}
          <motion.div
            className="absolute top-1/8 left-16 w-0 h-0 border-l-[12px] border-l-transparent border-b-[20px] border-b-cyan-400/60 border-r-[12px] border-r-transparent"
            animate={{ 
              x: [0, 10, 0], 
              y: [0, -15, 0], 
              rotate: [0, 45, 0]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 0.8,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 right-20 w-0 h-0 border-l-[15px] border-l-transparent border-b-[25px] border-b-teal-400/65 border-r-[15px] border-r-transparent"
            animate={{ 
              x: [0, -12, 0], 
              y: [0, 18, 0], 
              rotate: [0, -30, 0]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2.2,
            }}
          />
          
          {/* Hexagon Shapes */}
          <motion.div
            className="absolute top-1/3 left-20 w-16 h-16 border-2 border-cyan-400/70 bg-gradient-to-br from-cyan-500/35 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, -12, 0], 
              rotate: [0, 60, 0],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 21,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1.8,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-16 w-12 h-12 border-2 border-teal-400/75 bg-gradient-to-br from-teal-500/40 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -15, 0], 
              y: [0, 20, 0], 
              rotate: [0, -45, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3.2,
            }}
          />
          
          {/* Diamond Shapes */}
          <motion.div
            className="absolute top-1/2 left-8 w-8 h-8 border-2 border-cyan-300/80 bg-gradient-to-br from-cyan-400/45 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, 12, 0], 
              y: [0, -18, 0], 
              rotate: [45, 225, 45],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2.8,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-8 w-10 h-10 border-2 border-teal-300/70 bg-gradient-to-br from-teal-400/40 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, -18, 0], 
              y: [0, 15, 0], 
              rotate: [45, -135, 45],
              scale: [1, 0.85, 1]
            }}
            transition={{
              duration: 19,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1.2,
            }}
          />
          
          {/* Enhanced Bold Floating Dots */}
          <motion.div
            className="absolute top-1/5 right-1/3 w-3 h-3 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full shadow-lg shadow-cyan-400/50"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/5 w-2.5 h-2.5 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-full shadow-lg shadow-teal-400/50"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.9, 1, 0.9],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 8,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 left-1/5 w-2 h-2 bg-gradient-to-r from-cyan-300 to-teal-300 rounded-full shadow-lg shadow-cyan-300/50"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.9, 1, 0.9],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute top-1/3 left-1/4 w-1.5 h-1.5 bg-gradient-to-r from-teal-300 to-cyan-300 rounded-full shadow-lg shadow-teal-300/50"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.25, 1]
            }}
            transition={{
              duration: 9,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2.8,
            }}
          />
          
          {/* Additional Bold Glow Effects */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/25 rounded-full filter blur-2xl"
            animate={{ x: [0, 20, 0], y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-teal-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 30, 0], rotate: [0, -15, 0] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            className="inline-block bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Simple Business Solutions
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            We Help Your Business{" "}
            <span className="text-cyan-400">Grow.</span>
          </motion.h1>
          <motion.p
            className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10 leading-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            We solve your business problems with simple, effective solutions that work.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <motion.a
              href="/services/initial-consultation"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-10 py-4 rounded-lg shadow-lg text-xl transition-colors duration-300 flex items-center group"
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 20px rgba(45, 212, 191, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Start Here
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </motion.a>
            <motion.a
              href="/services"
              className="bg-transparent border-2 border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-100 font-semibold px-10 py-4 rounded-lg text-xl transition-colors duration-300 flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              See What We Do
              <ChevronDown
                size={20}
                className="ml-2 group-hover:translate-y-0.5 transition-transform"
              />
            </motion.a>
          </motion.div>
          <motion.div
            className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-2 max-w-xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            {[
              { icon: Clock, text: "Fast Results" },
              { icon: FolderOpen, text: "Simple Process" },
              { icon: MessageSquare, text: "Clear Communication" },
              { icon: CheckCircle, text: "Proven Results" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-slate-300"
              >
                <item.icon size={24} className="text-cyan-400 mb-1" />
                <span className="text-xs">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Simple Problem Section */}
      <AnimatedSection className="py-24 md:py-36 bg-slate-900 relative overflow-hidden">
        {/* Background Gradients and Objects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Enhanced Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/20 via-transparent to-teal-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-cyan-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/15 via-transparent to-slate-700/25"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/20 via-transparent to-cyan-800/18"></div>
          
          {/* More Visible Animated Objects */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-40 h-40 bg-gradient-to-br from-cyan-500/20 to-teal-500/15 rounded-full filter blur-2xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-48 h-48 bg-gradient-to-tl from-teal-500/15 to-cyan-500/20 rounded-full filter blur-2xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.85, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* More Visible Geometric Shapes */}
          <motion.div
            className="absolute top-1/3 left-8 w-20 h-20 border-2 border-cyan-400/50 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent"
            animate={{ 
              x: [0, 15, 0], 
              y: [0, -12, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-8 w-16 h-16 border-2 border-teal-400/40 bg-gradient-to-br from-teal-500/15 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -15, 0], 
              y: [0, 20, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Additional Geometric Elements */}
          <motion.div
            className="absolute top-1/6 left-1/4 w-12 h-12 border-2 border-cyan-300/60 bg-gradient-to-br from-cyan-400/25 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, -15, 0], 
              rotate: [45, 225, 45]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 right-1/4 w-10 h-10 border-2 border-teal-300/55 bg-gradient-to-br from-teal-400/20 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -12, 0], 
              y: [0, 18, 0], 
              rotate: [0, -90, 0]
            }}
            transition={{
              duration: 19,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* More Visible Floating Dots */}
          <motion.div
            className="absolute top-1/6 right-1/4 w-3 h-3 bg-cyan-400/60 rounded-full shadow-lg shadow-cyan-400/30"
            animate={{ 
              y: [0, -25, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-1/4 w-2.5 h-2.5 bg-teal-400/60 rounded-full shadow-lg shadow-teal-400/30"
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 left-1/3 w-2 h-2 bg-cyan-300/70 rounded-full"
            animate={{ 
              y: [0, -18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          <motion.div
            className="absolute bottom-2/3 right-1/3 w-1.5 h-1.5 bg-teal-300/70 rounded-full"
            animate={{ 
              y: [0, 15, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 11,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Does This Sound Like You?
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-300 mb-10">
            Most businesses face these common challenges. We help you solve them.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                title: "Your business isn't growing",
                desc: "You're stuck at the same level and don't know how to reach more customers or increase sales.",
                icon: TrendingUp,
              },
              {
                title: "Everything takes too long",
                desc: "Manual processes slow you down. You need better tools to work faster and smarter.",
                icon: Settings,
              },
              {
                title: "You worry about security",
                desc: "Your business data and customer information need better protection to build trust.",
                icon: ShieldCheck,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-slate-800 p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-cyan-400 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Services Overview Section */}
      <AnimatedSection id="services-overview" className="py-24 md:py-36 relative overflow-hidden">
        {/* Background Image and Gradients */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-70"
            style={{
              backgroundImage: 'url(/images/home.png)'
            }}
          ></div>
          
          {/* Enhanced Bold Gradient Backgrounds with minimal opacity */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/50 via-slate-900/40 to-slate-950/50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-900/5 via-transparent to-teal-900/8"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-slate-800/10 via-transparent to-cyan-900/8"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-teal-900/6 via-transparent to-slate-700/10"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-700/8 via-transparent to-cyan-800/5"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-slate-800/6 via-transparent to-teal-800/8"></div>
          
          {/* More Visible Large Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-72 h-72 bg-gradient-to-br from-cyan-500/15 to-teal-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-tl from-teal-500/12 to-cyan-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, 35, 0], scale: [1, 0.85, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
          
          {/* More Visible Geometric Elements */}
          <motion.div
            className="absolute top-1/6 left-12 w-24 h-24 border-2 border-cyan-400/40 rounded-full bg-gradient-to-br from-cyan-500/15 to-transparent"
            animate={{ 
              x: [0, 18, 0], 
              y: [0, -15, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 right-12 w-20 h-20 border-2 border-teal-400/35 bg-gradient-to-br from-teal-500/12 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, -15, 0], 
              y: [0, 22, 0], 
              rotate: [45, 225, 45]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* More Visible Triangle Shape */}
          <motion.div
            className="absolute top-2/3 left-20 w-0 h-0 border-l-[12px] border-l-transparent border-b-[20px] border-b-cyan-400/40 border-r-[12px] border-r-transparent"
            animate={{ 
              x: [0, 10, 0], 
              y: [0, -15, 0], 
              rotate: [0, 60, 0]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* More Visible Hexagon */}
          <motion.div
            className="absolute bottom-1/3 right-20 w-18 h-18 border-2 border-teal-400/35 bg-gradient-to-br from-teal-500/12 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -12, 0], 
              y: [0, 18, 0], 
              rotate: [0, -60, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          {/* Additional Geometric Elements */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-cyan-300/50 bg-gradient-to-br from-cyan-400/20 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, 20, 0], 
              y: [0, -25, 0], 
              rotate: [45, 225, 45]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-14 h-14 border-2 border-teal-300/45 bg-gradient-to-br from-teal-400/15 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, -20, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* More Visible Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/3 w-4 h-4 bg-gradient-to-r from-cyan-400/50 to-teal-400/50 rounded-full shadow-lg shadow-cyan-400/30"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.6, 1, 0.6],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-gradient-to-r from-teal-400/50 to-cyan-400/50 rounded-full shadow-lg shadow-teal-400/30"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 right-1/4 w-2.5 h-2.5 bg-gradient-to-r from-cyan-300/60 to-teal-300/60 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
          
          <motion.div
            className="absolute bottom-2/3 left-1/4 w-2 h-2 bg-gradient-to-r from-teal-300/60 to-cyan-300/60 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 9,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-4">
            How We Help You
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 text-center mb-16">
            We provide simple solutions that solve real business problems.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Business Planning",
                description: "We help you create a clear plan to grow your business. You'll know exactly what to do next and how to measure success.",
                icon: "Lightbulb",
                link: "/services/initial-consultation",
              },
              {
                title: "Custom Software",
                description: "We build software that does exactly what your business needs. It saves time, reduces errors, and helps you work better.",
                icon: "AppWindow",
                link: "/services/custom-software-development",
              },
              {
                title: "Get Found Online",
                description: "We help customers find your business when they search online. More visitors means more sales for your business.",
                icon: "BarChart3",
                link: "/services/strategic-seo-services",
              },
              {
                title: "Business Strategy",
                description: "We help you understand your market better and create a plan to beat your competition and grow faster.",
                icon: "Briefcase",
                link: "/services/business-strategy-consulting",
              },
              {
                title: "Quality Testing",
                description: "We make sure your software works perfectly for your customers. No bugs, no problems, just smooth operation.",
                icon: "ShieldCheck",
                link: "/services/quality-assurance-testing",
              },
              {
                title: "Team Training",
                description: "We teach your team the skills they need to succeed. Better skills mean better results for your business.",
                icon: "GraduationCap",
                link: "/services/education-training",
              },
            ].map((service, idx) => {
              const IconComponent = iconMap[service.icon] || TrendingUp;
              return (
                <motion.div
                  key={idx}
                  className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col hover:border-cyan-500/50 transition-all duration-300 group"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 30px -10px rgba(45, 212, 191, 0.2)",
                  }}
                >
                  <IconComponent className="w-12 h-12 text-cyan-400 mb-6" />
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-slate-400 mb-6 text-sm flex-grow">
                    {service.description}
                  </p>
                  <Link
                    href={service.link}
                    className="mt-auto inline-block text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors duration-300"
                  >
                    Learn More
                    <ArrowRight
                      size={16}
                      className="inline-block ml-1 group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/services"
              className="text-cyan-400 hover:text-cyan-300 font-semibold text-lg group"
            >
              See All Services
              <ArrowRight
                size={20}
                className="inline-block ml-1 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </AnimatedSection>

      <UniteAdvantageSection />
      <CaseStudiesSection />
      <PartnersSection />

      {/* Final Call to Action */}
      <AnimatedSection
        id="contact"
        className="py-28 md:py-44 bg-slate-900 relative overflow-hidden"
      >
        {/* Background Gradients and Objects */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Enhanced Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 via-transparent to-cyan-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/25 via-transparent to-cyan-800/20"></div>
          <div className="absolute inset-0 bg-gradient-to-l from-cyan-800/18 via-transparent to-teal-800/25"></div>
          
          {/* More Visible Large Glowing Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-cyan-500/20 to-teal-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -35, 0], scale: [1, 1.25, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/18 to-cyan-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, -45, 0], y: [0, 40, 0], scale: [1, 0.8, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* More Visible Geometric Elements */}
          <motion.div
            className="absolute top-1/6 left-16 w-28 h-28 border-2 border-cyan-400/45 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent"
            animate={{ 
              x: [0, 22, 0], 
              y: [0, -20, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 right-16 w-24 h-24 border-2 border-teal-400/40 bg-gradient-to-br from-teal-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -18, 0], 
              y: [0, 25, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* More Visible Diamond Shape */}
          <motion.div
            className="absolute top-1/2 left-8 w-16 h-16 border-2 border-cyan-300/50 bg-gradient-to-br from-cyan-400/25 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, -22, 0], 
              rotate: [45, 225, 45]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          {/* More Visible Triangle */}
          <motion.div
            className="absolute bottom-1/2 right-8 w-0 h-0 border-l-[15px] border-l-transparent border-b-[25px] border-b-teal-400/45 border-r-[15px] border-r-transparent"
            animate={{ 
              x: [0, -12, 0], 
              y: [0, 18, 0], 
              rotate: [0, -45, 0]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Additional Geometric Elements */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-14 h-14 border-2 border-cyan-300/55 bg-gradient-to-br from-cyan-400/20 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, -15, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-12 h-12 border-2 border-teal-300/50 bg-gradient-to-br from-teal-400/18 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, -20, 0], 
              y: [0, 30, 0], 
              rotate: [45, -135, 45]
            }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* More Visible Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-5 h-5 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-full shadow-lg shadow-cyan-400/30"
            animate={{ 
              y: [0, -35, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-4 h-4 bg-gradient-to-r from-teal-400/60 to-cyan-400/60 rounded-full shadow-lg shadow-teal-400/30"
            animate={{ 
              y: [0, 30, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 left-1/3 w-3 h-3 bg-gradient-to-r from-cyan-300/70 to-teal-300/70 rounded-full shadow-lg shadow-cyan-300/30"
            animate={{ 
              y: [0, -25, 0],
              opacity: [0.9, 1, 0.9],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          <motion.div
            className="absolute bottom-2/3 right-1/3 w-2.5 h-2.5 bg-gradient-to-r from-teal-300/70 to-cyan-300/70 rounded-full shadow-lg shadow-teal-300/30"
            animate={{ 
              y: [0, 22, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 0.95, 1]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
          
          <motion.div
            className="absolute top-1/2 left-1/3 w-2 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-full"
            animate={{ 
              y: [0, -18, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 17,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/2 right-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/60 to-cyan-400/60 rounded-full"
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 15,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/abstract-dark-background.png"
            alt="Abstract background"
            layout="fill"
            objectFit="cover"
            quality={50}
          />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-12">
            Let's talk about your business and how we can help you grow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <motion.a
              href="mailto:contact@unite-group.in"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-10 py-4 rounded-lg shadow-xl text-lg transition-colors duration-300 flex items-center group"
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 25px rgba(45, 212, 191, 0.6)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Talk to Us
              <ArrowRight
                size={22}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </motion.a>
            <motion.a
              href="/contact"
              className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white font-semibold px-10 py-4 rounded-lg shadow-xl text-lg transition-all duration-300 flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Us <Phone size={20} className="ml-2" />
            </motion.a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Simple Solutions
            </span>
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Fast Results
            </span>
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Clear Communication
            </span>
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Proven Results
            </span>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
