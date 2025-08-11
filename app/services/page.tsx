// app/services/page.tsx (Services Overview Page)
"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowRight, Briefcase, Zap } from "lucide-react"
import { services } from "@/lib/services-data"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { iconMap } from "@/lib/icon-map" // Assuming iconMap is moved to lib

export default function ServicesOverviewPage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-b from-slate-900 to-slate-950 relative overflow-hidden"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/45 via-transparent to-teal-900/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/55 via-transparent to-cyan-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/40 via-transparent to-slate-700/50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/45 via-transparent to-cyan-800/40"></div>
          
          {/* Large Bold Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-cyan-500/40 to-teal-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/38 to-cyan-500/40 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.85, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
          
          {/* Bold Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-cyan-400/65 rounded-full bg-gradient-to-br from-cyan-500/38 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-teal-400/60 bg-gradient-to-br from-teal-500/35 to-transparent"
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
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Briefcase className="w-16 h-16 text-cyan-400 mx-auto mb-6" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">Our Comprehensive Services</h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Unite Group offers a full spectrum of technology and consulting services designed to empower your business,
            drive innovation, and achieve sustainable growth. Explore how we can help you transform.
          </p>
          <Button size="lg" asChild className="bg-cyan-500 hover:bg-cyan-600 text-white group">
            <Link href="/contact">
              Discuss Your Project{" "}
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </motion.section>

      {/* Services Listing Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/30 via-transparent to-teal-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 via-transparent to-cyan-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/25 via-transparent to-slate-700/35"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/20 to-teal-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/18 to-cyan-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-full"
            animate={{ 
              y: [0, -20, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/60 to-cyan-400/60 rounded-full"
            animate={{ 
              y: [0, 15, 0],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Explore Our Solutions</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Tailored expertise to meet your unique challenges and unlock new opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, idx) => {
              const IconComponent = iconMap[service.icon as keyof typeof iconMap] || Zap
              return (
                <motion.div
                  key={service.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  className="h-full"
                >
                  <Card className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl h-full flex flex-col hover:border-cyan-500/50 transition-all duration-300 group">
                    <CardHeader>
                      <div className="mb-4">
                        <IconComponent className="w-10 h-10 text-cyan-400" />
                      </div>
                      <CardTitle className="text-2xl text-white group-hover:text-cyan-300 transition-colors">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-slate-400 text-sm min-h-[60px]">
                        {service.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-end">
                      <Button
                        asChild
                        variant="outline"
                        className="mt-auto border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white w-full group-hover:bg-cyan-500 group-hover:text-white transition-colors"
                      >
                        <Link href={service.link}>
                          Learn More <ArrowRight size={16} className="ml-2" />
                        </Link>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Why Choose Unite Group Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-cyan-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-80 h-80 bg-gradient-to-br from-cyan-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-cyan-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 left-12 w-20 h-20 border-2 border-cyan-400/50 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent"
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
            className="absolute bottom-1/6 right-12 w-16 h-16 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
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
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Partner with Experts for Lasting Success
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-10">
            At Unite Group, we combine deep industry knowledge with cutting-edge technology to deliver solutions that
            not only meet your current needs but also anticipate future challenges. Our client-centric approach ensures
            we're more than just a vendor – we're your dedicated partner in growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-cyan-500 hover:bg-cyan-600 text-white group">
              <Link href="/case-studies">
                View Our Success Stories{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white group"
            >
              <Link href="/case-studies">View Our Success Stories</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
