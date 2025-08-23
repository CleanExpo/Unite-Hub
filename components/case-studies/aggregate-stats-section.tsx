"use client";

import { TrendingUp, CheckCircle, Users, Globe } from "lucide-react" // Example icons
import { motion } from "framer-motion"

const stats = [
  {
    value: "50+",
    label: "Successful Projects Delivered",
    icon: CheckCircle,
    description: "Across diverse industries and complex challenges.",
  },
  {
    value: "95%",
    label: "Client Satisfaction Rate",
    icon: Users,
    description: "Based on post-project feedback and long-term partnerships.",
  },
  {
    value: "40%",
    label: "Avg. Operational Efficiency Gain",
    icon: TrendingUp,
    description: "Reported by clients after implementing our solutions.",
  },
  {
    value: "10+",
    label: "Countries Served",
    icon: Globe,
    description: "Helping businesses achieve global reach and impact.",
  },
]

export default function AggregateStatsSection() {
  return (
    <section className="py-12 md:py-16 bg-slate-950 relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Multi-layered Gradient Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/20 via-transparent to-teal-900/25"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-emerald-900/20"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/15 via-transparent to-slate-700/25"></div>
        
        {/* Large Animated Orbs */}
        <motion.div
          className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-bl from-emerald-500/15 to-teal-500/12 rounded-full filter blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 1.1, 1] }}
          transition={{
            duration: 28,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tr from-teal-500/12 to-emerald-500/15 rounded-full filter blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 0.9, 1] }}
          transition={{
            duration: 32,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 6,
          }}
        />
        
        {/* Geometric Elements */}
        <motion.div
          className="absolute top-1/6 left-12 w-24 h-24 border-2 border-emerald-400/40 rounded-full bg-gradient-to-br from-emerald-500/15 to-transparent"
          animate={{ 
            x: [0, 15, 0], 
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
          className="absolute bottom-1/6 right-12 w-20 h-20 border-2 border-teal-400/35 bg-gradient-to-br from-teal-500/12 to-transparent"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
          animate={{ 
            x: [0, -15, 0], 
            y: [0, 20, 0], 
            rotate: [0, -120, 0]
          }}
          transition={{
            duration: 24,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 3,
          }}
        />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-4 h-4 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full shadow-lg shadow-emerald-400/30"
          animate={{ 
            y: [0, -30, 0],
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
          className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-teal-400/50 to-emerald-400/50 rounded-full shadow-lg shadow-teal-400/30"
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
          className="absolute top-2/3 right-1/3 w-2.5 h-2.5 bg-gradient-to-r from-emerald-300/60 to-teal-300/60 rounded-full"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 16,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 4,
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
          Our Collective Impact by the Numbers
        </motion.h2>
        <motion.p 
          className="text-center text-slate-400 max-w-2xl mx-auto mb-10 md:mb-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          We measure our success by the success of our clients. Here's a glimpse of what we've achieved together.
        </motion.p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-800/70 backdrop-blur-sm p-6 rounded-lg border border-slate-700/50 text-center shadow-lg hover:border-cyan-500/50 hover:shadow-cyan-500/20 transition-all duration-300 group"
              >
                <div className="flex justify-center mb-3">
                  <motion.div
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ duration: 0.3 }}
                  >
                    <IconComponent className="w-10 h-10 text-cyan-400 group-hover:text-cyan-300 transition-colors duration-300" />
                  </motion.div>
                </div>
                <motion.p 
                  className="text-4xl font-bold text-white mb-1"
                  initial={{ scale: 0.8 }}
                  whileInView={{ scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 + 0.2 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  {stat.value}
                </motion.p>
                <h3 className="text-lg font-medium text-slate-300 mb-2">{stat.label}</h3>
                <p className="text-xs text-slate-400">{stat.description}</p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
