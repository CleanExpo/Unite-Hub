"use client"

import type React from "react"

import Image from "next/image"
import { motion } from "framer-motion"
import { Zap, DollarSign, Users, ShieldCheck } from "lucide-react"

const AnimatedSection: React.FC<{ children: React.ReactNode; className?: string; delay?: number }> = ({
  children,
  className,
  delay = 0,
}) => {
  return (
    <motion.section
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
    <AnimatedSection id="unite-advantage" className="py-16 md:py-24 bg-slate-900">
      <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
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
