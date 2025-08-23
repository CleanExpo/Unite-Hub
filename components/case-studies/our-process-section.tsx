"use client";

import { Search, Lightbulb, Code2, Rocket } from "lucide-react" // Example icons
import { motion } from "framer-motion"

const processSteps = [
  {
    id: 1,
    title: "Discovery & Strategy",
    description: "We start by deeply understanding your business, challenges, and goals to craft a tailored strategy.",
    icon: Search,
  },
  {
    id: 2,
    title: "Design & Prototyping",
    description: "Our team designs intuitive solutions and creates prototypes to visualize the path forward.",
    icon: Lightbulb,
  },
  {
    id: 3,
    title: "Development & Implementation",
    description: "Leveraging cutting-edge technologies, we build robust solutions and integrate them seamlessly.",
    icon: Code2,
  },
  {
    id: 4,
    title: "Launch & Growth",
    description:
      "We ensure a smooth launch and provide ongoing support to help you scale and achieve long-term success.",
    icon: Rocket,
  },
]

export default function OurProcessSection() {
  return (
    <section className="py-12 md:py-16 bg-slate-900 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Multi-layered Gradient Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/20 via-transparent to-teal-900/25"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-emerald-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/15 via-transparent to-slate-700/25"></div>
        
        {/* Large Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/15 to-teal-500/12 rounded-full filter blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/12 to-emerald-500/15 rounded-full filter blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.9, 1] }}
          transition={{
            duration: 35,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 8,
          }}
        />
        
        {/* Geometric Elements */}
        <motion.div
          className="absolute top-1/6 right-16 w-24 h-24 border-2 border-emerald-400/45 rounded-full bg-gradient-to-br from-emerald-500/18 to-transparent"
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
          className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-teal-400/40 bg-gradient-to-br from-teal-500/15 to-transparent"
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
        
        {/* Diamond Shapes */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-400/20 to-transparent"
          style={{
            transform: 'rotate(45deg)'
          }}
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -25, 0], 
            rotate: [45, 225, 45],
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
          className="absolute bottom-1/3 right-1/4 w-12 h-12 border-2 border-teal-300/50 bg-gradient-to-br from-teal-400/18 to-transparent"
          style={{
            transform: 'rotate(45deg)'
          }}
          animate={{ 
            x: [0, -18, 0], 
            y: [0, 25, 0], 
            rotate: [45, -135, 45],
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
          className="absolute top-1/3 right-1/4 w-4 h-4 bg-gradient-to-r from-emerald-400/60 to-teal-400/60 rounded-full shadow-lg shadow-emerald-400/30"
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
          className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-teal-400/60 to-emerald-400/60 rounded-full shadow-lg shadow-teal-400/30"
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
          className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-emerald-300/70 to-teal-300/70 rounded-full"
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
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.h2 
          className="text-3xl font-semibold text-center text-white mb-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Our Path to Your Success
        </motion.h2>
        <motion.p 
          className="text-center text-slate-400 max-w-2xl mx-auto mb-10 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          We follow a proven, collaborative process designed to deliver impactful results and ensure your objectives are
          met.
        </motion.p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {processSteps.map((step, index) => {
            const IconComponent = step.icon
            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg border border-slate-700/50 text-left shadow-md hover:border-cyan-500/30 hover:shadow-cyan-500/20 transition-all duration-300 group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconComponent className="w-8 h-8 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                  </motion.div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">{step.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
