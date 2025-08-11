"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, Eye, Zap, Users, Lightbulb, Heart } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";

export default function AboutUsPage() {
  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
        {/* Enhanced Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/25 via-transparent to-indigo-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-blue-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-transparent to-slate-700/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/25 via-transparent to-blue-800/20"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-blue-500/20 to-indigo-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-indigo-500/18 to-blue-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.85, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
          
          {/* Geometric Elements - Different from home page */}
          <motion.div
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-blue-400/45 rounded-full bg-gradient-to-br from-blue-500/18 to-transparent"
            animate={{ 
              x: [0, -18, 0], 
              y: [0, -15, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-indigo-400/40 bg-gradient-to-br from-indigo-500/15 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 20, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Star Shapes - Unique to about page */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-blue-300/50 bg-gradient-to-br from-blue-400/20 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
            animate={{ 
              x: [0, 20, 0], 
              y: [0, -25, 0], 
              rotate: [0, 180, 0],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-12 h-12 border-2 border-indigo-300/50 bg-gradient-to-br from-indigo-400/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
            }}
            animate={{ 
              x: [0, -18, 0], 
              y: [0, 25, 0], 
              rotate: [0, -180, 0],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/3 w-4 h-4 bg-gradient-to-r from-blue-400/60 to-indigo-400/60 rounded-full shadow-lg shadow-blue-400/30"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-gradient-to-r from-indigo-400/60 to-blue-400/60 rounded-full shadow-lg shadow-indigo-400/30"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-blue-300/70 to-indigo-300/70 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          <motion.div
            className="absolute bottom-2/3 right-1/3 w-2 h-2 bg-gradient-to-r from-indigo-300/70 to-blue-300/70 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
        </div>
        
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/abstract-corporate-background.png"
            alt="Abstract Background"
            layout="fill"
            objectFit="cover"
          />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-400 mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            About Unite Group
          </motion.h1>
          <motion.p 
            className="text-lg sm:text-xl text-slate-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover our journey, mission, and the values that drive us to
            deliver exceptional technology solutions and foster innovation.
          </motion.p>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Enhanced Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/20 via-transparent to-indigo-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-blue-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/18 via-transparent to-slate-700/25"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/20 via-transparent to-blue-800/18"></div>
          
          {/* Enhanced Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-blue-500/15 to-indigo-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-indigo-500/12 to-blue-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Additional Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-16 w-28 h-28 border-2 border-blue-400/40 rounded-full bg-gradient-to-br from-blue-500/18 to-transparent"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, -18, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-16 w-24 h-24 border-2 border-indigo-400/35 bg-gradient-to-br from-indigo-500/15 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, 22, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Diamond Shapes */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-20 h-20 border-2 border-blue-300/45 bg-gradient-to-br from-blue-400/20 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, 25, 0], 
              y: [0, -30, 0], 
              rotate: [45, 225, 45],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 1,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-16 h-16 border-2 border-indigo-300/45 bg-gradient-to-br from-indigo-400/18 to-transparent"
            style={{
              transform: 'rotate(45deg)'
            }}
            animate={{ 
              x: [0, -22, 0], 
              y: [0, 28, 0], 
              rotate: [45, -135, 45],
              scale: [1, 0.85, 1]
            }}
            transition={{
              duration: 22,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Enhanced Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-4 h-4 bg-gradient-to-r from-blue-400/60 to-indigo-400/60 rounded-full shadow-lg shadow-blue-400/30"
            animate={{ 
              y: [0, -35, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.2, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-indigo-400/60 to-blue-400/60 rounded-full shadow-lg shadow-indigo-400/30"
            animate={{ 
              y: [0, 30, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
          
          <motion.div
            className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-blue-300/70 to-indigo-300/70 rounded-full"
            animate={{ 
              y: [0, -25, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          <motion.div
            className="absolute bottom-2/3 right-1/3 w-2 h-2 bg-gradient-to-r from-indigo-300/70 to-blue-300/70 rounded-full"
            animate={{ 
              y: [0, 20, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
          
          {/* Additional Floating Particles */}
          <motion.div
            className="absolute top-1/4 right-1/3 w-1.5 h-1.5 bg-blue-200/60 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-1 h-1 bg-indigo-200/60 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <h2 className="text-3xl font-semibold text-white mb-4">
                Our Journey So Far
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                Founded in 2020 with a vision to bridge the gap between complex
                technology and business growth, Unite Group has steadily grown
                into a trusted partner for organizations seeking transformative
                digital solutions. Our journey began with a small, passionate
                team and a commitment to client success.
              </p>
              <p className="text-slate-400 mb-4 leading-relaxed">
                Key milestones, like launching our first enterprise-level SaaS
                platform and expanding our AI consulting services in 2022, have
                defined our trajectory. We believe in the power of
                collaboration, continuous learning, and adapting to the
                ever-evolving tech landscape.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <Image
                src="/corporate-timeline-montage.png"
                alt="Our Journey Montage"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover aspect-[4/3]"
              />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission, Vision, Values Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/20 via-transparent to-indigo-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-blue-900/20"></div>
          
          {/* Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-72 h-72 bg-gradient-to-br from-blue-500/15 to-indigo-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-indigo-500/12 to-blue-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Shapes */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-blue-400/35 rounded-full bg-gradient-to-br from-blue-500/15 to-transparent"
            animate={{ 
              x: [0, -12, 0], 
              y: [0, -10, 0], 
              rotate: [0, 90, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-indigo-400/30 bg-gradient-to-br from-indigo-500/12 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 15, 0], 
              y: [0, 18, 0], 
              rotate: [0, -60, 0]
            }}
            transition={{
              duration: 26,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            className="text-3xl font-semibold text-white text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Our Guiding Principles
          </motion.h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Target,
                title: "Our Mission",
                content: "To empower businesses with innovative and tailored technology solutions, driving growth, efficiency, and a competitive edge in their respective industries.",
                color: "text-cyan-400"
              },
              {
                icon: Eye,
                title: "Our Vision",
                content: "To be a globally recognized leader in technology consulting and solution delivery, known for our commitment to excellence, integrity, and transformative impact.",
                color: "text-sky-400"
              },
              {
                icon: Zap,
                title: "Our Core Values",
                content: "Client-Centricity, Innovation & Excellence, Integrity & Transparency, Collaboration & Teamwork, Continuous Learning",
                color: "text-indigo-400"
              }
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <Card className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 text-slate-50 hover:border-blue-500/30 transition-all duration-300 group">
              <CardHeader>
                    <CardTitle className={`flex items-center text-xl ${item.color}`}>
                      <item.icon size={28} className="mr-3" /> {item.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300">
                      {item.content}
                </p>
              </CardContent>
            </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Culture Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-indigo-900/15 via-transparent to-blue-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/25 via-transparent to-indigo-900/18"></div>
          
          {/* Animated Elements */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-80 h-80 bg-gradient-to-bl from-indigo-500/15 to-blue-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-72 h-72 bg-gradient-to-tr from-blue-500/12 to-indigo-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-blue-400/50 to-indigo-400/50 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 16,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-2.5 h-2.5 bg-gradient-to-r from-indigo-400/50 to-blue-400/50 rounded-full"
            animate={{ 
              y: [0, 18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <motion.div 
              className="order-2 md:order-1"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <Image
                src="/company-culture-collaboration.png"
                alt="Company Culture"
                width={600}
                height={400}
                className="rounded-lg shadow-xl object-cover aspect-[4/3]"
              />
            </motion.div>
            <motion.div 
              className="order-1 md:order-2"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              viewport={{ once: true, amount: 0.3 }}
            >
              <h2 className="text-3xl font-semibold text-white mb-4">
                Our Culture: People First
              </h2>
              <p className="text-slate-400 mb-4 leading-relaxed">
                At Unite Group, we cultivate an environment where creativity,
                curiosity, and collaboration thrive. We invest in our team's
                growth through continuous training, mentorship programs, and
                opportunities to work on cutting-edge projects.
              </p>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Users className="h-6 w-6 mr-3 mt-1 text-cyan-400" />
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">
                      Collaborative Spirit:
                    </span>{" "}
                    We believe the best ideas come from teamwork and open
                    communication.
                  </p>
                </div>
                <div className="flex items-start">
                  <Lightbulb className="h-6 w-6 mr-3 mt-1 text-cyan-400" />
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">
                      Innovation Driven:
                    </span>{" "}
                    We encourage experimentation and provide the freedom to
                    explore new technologies.
                  </p>
                </div>
                <div className="flex items-start">
                  <Heart className="h-6 w-6 mr-3 mt-1 text-cyan-400" />
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">
                      Work-Life Balance:
                    </span>{" "}
                    We support our team's well-being with flexible work
                    arrangements and a focus on sustainable performance.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/25 via-transparent to-indigo-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-blue-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Large Glowing Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-blue-500/20 to-indigo-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.25, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-indigo-500/18 to-blue-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, -40, 0], y: [0, 35, 0], scale: [1, 0.8, 1] }}
            transition={{
              duration: 36,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-16 w-28 h-28 border-2 border-blue-400/45 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent"
            animate={{ 
              x: [0, -20, 0], 
              y: [0, -18, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-16 w-24 h-24 border-2 border-indigo-400/40 bg-gradient-to-br from-indigo-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, 22, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-4 h-4 bg-gradient-to-r from-blue-400/60 to-indigo-400/60 rounded-full shadow-lg shadow-blue-400/30"
            animate={{ 
              y: [0, -35, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.15, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-indigo-400/60 to-blue-400/60 rounded-full shadow-lg shadow-indigo-400/30"
            animate={{ 
              y: [0, 28, 0],
              opacity: [0.7, 1, 0.7],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.h2 
            className="text-3xl font-semibold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Ready to Partner with Us?
          </motion.h2>
          <motion.p 
            className="text-slate-300 max-w-xl mx-auto mb-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Let's discuss how Unite Group can help your business achieve its
            technology goals.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
          <Button
            size="lg"
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold px-8 py-3 rounded-lg shadow-lg transition duration-300"
            asChild
          >
            <Link href="/contact">Get in Touch</Link>
          </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
