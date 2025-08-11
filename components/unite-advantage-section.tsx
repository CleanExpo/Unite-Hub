"use client"

import type React from "react"

import Image from "next/image"
import { motion } from "framer-motion"
import { Zap, DollarSign, Users, ShieldCheck } from "lucide-react"

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number; id?: string }> = ({
  children,
  className,
  delay = 0,
  id,
}) => {
  return (
    <motion.section
      id={id}
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay }}
      variants={{ hidden: { opacity: 0, y: 50 }, visible: { opacity: 1, y: 0 } }}
    >
      {children}
    </motion.section>
  )
}

export default function UniteAdvantageSection() {
  const advantages = [
    {
      icon: Zap,
      title: "Accelerated Growth",
      description: "Unlock new revenue streams and expand market reach with our strategic digital solutions.",
    },
    {
      icon: DollarSign,
      title: "Enhanced ROI",
      description: "Maximize your technology investments with solutions designed for efficiency and profitability.",
    },
    {
      icon: Users,
      title: "Improved Customer Experiences",
      description: "Create seamless and engaging interactions that foster loyalty and drive customer satisfaction.",
    },
    {
      icon: ShieldCheck,
      title: "Strengthened Operational Resilience",
      description: "Build robust systems that minimize risk and ensure business continuity in a dynamic environment.",
    },
  ]

  return (
    <AnimatedSection id="unite-advantage" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
      {/* Background Gradients and Objects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Enhanced Bold Gradient Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/35 via-transparent to-teal-900/40"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-cyan-900/35"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/38 via-transparent to-slate-700/40"></div>
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/38 via-transparent to-cyan-800/35"></div>
        <div className="absolute inset-0 bg-gradient-to-l from-cyan-800/32 via-transparent to-teal-800/38"></div>
        
        {/* Large Bold Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-br from-cyan-500/35 to-teal-500/32 rounded-full filter blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.15, 1] }}
          transition={{
            duration: 28,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/32 to-cyan-500/35 rounded-full filter blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
          transition={{
            duration: 32,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 6,
          }}
        />
        
        {/* Bold Geometric Elements */}
        <motion.div
          className="absolute top-1/6 left-12 w-20 h-20 border-2 border-cyan-400/60 rounded-full bg-gradient-to-br from-cyan-500/35 to-transparent"
          animate={{ 
            x: [0, 15, 0], 
            y: [0, -12, 0], 
            rotate: [0, 180, 0]
          }}
          transition={{
            duration: 24,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/6 right-12 w-16 h-16 border-2 border-teal-400/55 bg-gradient-to-br from-teal-500/32 rounded-full filter blur-3xl"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
          animate={{ 
            x: [0, -12, 0], 
            y: [0, 18, 0], 
            rotate: [0, 120, 0]
          }}
          transition={{
            duration: 26,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        
        {/* Bold Triangle Shape */}
        <motion.div
          className="absolute top-2/3 left-20 w-0 h-0 border-l-[10px] border-l-transparent border-b-[16px] border-b-cyan-400/55 border-r-[10px] border-r-transparent"
          animate={{ 
            x: [0, 8, 0], 
            y: [0, -12, 0], 
            rotate: [0, 60, 0]
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        
        {/* Bold Diamond Shape */}
        <motion.div
          className="absolute bottom-1/3 right-20 w-12 h-12 border-2 border-teal-300/65 bg-gradient-to-br from-teal-400/38 to-transparent"
          style={{
            transform: 'rotate(45deg)'
          }}
          animate={{ 
            x: [0, -15, 0], 
            y: [0, 20, 0], 
            rotate: [45, 225, 45]
          }}
          transition={{
            duration: 22,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 4,
          }}
        />
        
        {/* Bold Floating Elements */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-cyan-400/70 to-teal-400/70 rounded-full shadow-lg shadow-cyan-400/50"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.9, 1, 0.9],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 16,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/70 to-cyan-400/70 rounded-full shadow-lg shadow-teal-400/50"
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.9, 1, 0.9],
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
          className="absolute top-1/2 left-1/3 w-2 h-2 bg-gradient-to-r from-cyan-300/80 to-teal-300/80 rounded-full"
          animate={{ 
            y: [0, -18, 0],
            opacity: [0.8, 1, 0.8]
          }}
          transition={{
            duration: 14,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 5,
          }}
        />
        
        <motion.div
          className="absolute bottom-1/2 right-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-300/80 to-cyan-300/80 rounded-full"
          animate={{ 
            y: [0, 15, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 12,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 7,
          }}
        />
      </div>
      
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">The Unite Group Advantage</h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300">
            Beyond Technology, We Deliver Tangible Outcomes. Our focus is on creating real business value.
          </p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            <Image
              src="/business-outcomes-chart.png"
              alt="Business Outcomes Chart"
              width={500}
              height={400}
              className="rounded-lg shadow-xl object-cover mx-auto"
            />
          </motion.div>
          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {advantages.map((item, idx) => (
              <div key={idx} className="flex items-start">
                <div className="flex-shrink-0 bg-cyan-500/10 p-3 rounded-full mr-4">
                  <item.icon className="w-7 h-7 text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">{item.title}</h3>
                  <p className="text-slate-400 text-sm">{item.description}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </AnimatedSection>
  )
}
