"use client";

import { caseStudies } from "@/lib/case-studies-data"
import { Badge } from "@/components/ui/badge"
import { Building, ShoppingCart, Truck, Stethoscope, Factory, Lightbulb } from "lucide-react" // Example icons
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

interface IndustryIconMap {
  [key: string]: LucideIcon
}

const industryIconMap: IndustryIconMap = {
  "SaaS & Technology": Building,
  "E-commerce & Retail": ShoppingCart,
  "Logistics & Supply Chain": Truck,
  "Healthcare Services": Stethoscope,
  "International Trade & Manufacturing": Factory,
  Default: Lightbulb,
}

export default function IndustriesServedSection() {
  const uniqueIndustries = Array.from(new Set(caseStudies.map((cs) => cs.industry))).sort()

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
          className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-br from-emerald-500/15 to-teal-500/12 rounded-full filter blur-3xl"
          animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
          transition={{
            duration: 25,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/12 to-emerald-500/15 rounded-full filter blur-3xl"
          animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 5,
          }}
        />
        
        {/* Geometric Elements */}
        <motion.div
          className="absolute top-1/6 right-12 w-20 h-20 border-2 border-emerald-400/40 rounded-full bg-gradient-to-br from-emerald-500/15 to-transparent"
          animate={{ 
            x: [0, -15, 0], 
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
          className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-teal-400/35 bg-gradient-to-br from-teal-500/12 to-transparent"
          style={{
            clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
          }}
          animate={{ 
            x: [0, 12, 0], 
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
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full shadow-lg shadow-emerald-400/30"
          animate={{ 
            y: [0, -25, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 16,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/50 to-emerald-400/50 rounded-full shadow-lg shadow-teal-400/30"
          animate={{ 
            y: [0, 20, 0],
            opacity: [0.8, 1, 0.8],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
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
          Industries We Transform
        </motion.h2>
        <motion.p 
          className="text-center text-slate-400 max-w-2xl mx-auto mb-10"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Our expertise spans across diverse sectors, delivering tailored solutions that address unique industry
          challenges and drive growth.
        </motion.p>
        <div className="flex flex-wrap justify-center gap-4">
          {uniqueIndustries.map((industry, index) => {
            const IconComponent = industryIconMap[industry] || industryIconMap["Default"]
            return (
              <motion.div
                key={industry}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <Badge
                  variant="outline"
                  className="text-sm md:text-base px-4 py-2 border-cyan-500/70 text-cyan-400 bg-slate-800/70 backdrop-blur-sm flex items-center gap-2 transition-all hover:bg-cyan-500/10 hover:shadow-md hover:border-cyan-400/90"
                >
                  <IconComponent size={18} />
                  {industry}
                </Badge>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
