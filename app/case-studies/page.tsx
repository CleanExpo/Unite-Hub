"use client";

import Link from "next/link"
import Image from "next/image"
import { caseStudies, type CaseStudy } from "@/lib/case-studies-data"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { motion } from "framer-motion"

// Import new section components
import IndustriesServedSection from "@/components/case-studies/industries-served-section"
import AggregateStatsSection from "@/components/case-studies/aggregate-stats-section"
import OurProcessSection from "@/components/case-studies/our-process-section"
import CtaSection from "@/components/case-studies/cta-section"

const CaseStudyCard = ({ study }: { study: CaseStudy }) => (
  <motion.div
    initial={{ opacity: 0, y: 30 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.6 }}
    viewport={{ once: true, amount: 0.3 }}
  >
    <Card className="flex flex-col h-full bg-slate-900/70 backdrop-blur-sm border-slate-700/80 hover:border-cyan-500/60 transition-all duration-300 ease-in-out shadow-lg hover:shadow-cyan-500/20 group">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4 mb-3">
          {study.logoUrl && (
            <Image
              src={study.logoUrl || "/placeholder.svg"}
              alt={`${study.client} Logo`}
              width={40}
              height={40}
              className="rounded-md bg-white p-0.5"
            />
          )}
          <CardTitle className="text-xl text-white">{study.client}</CardTitle>
        </div>
        <Badge variant="outline" className="border-cyan-400 text-cyan-400 text-xs w-fit">
          {study.industry}
        </Badge>
      </CardHeader>
      <CardContent className="flex-grow">
        <p className="text-slate-400 text-sm mb-3 leading-relaxed line-clamp-3">{study.overview}</p>
        <h4 className="text-slate-300 text-sm font-semibold mb-1 mt-4">Key Result:</h4>
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle size={16} />
          <p className="text-sm font-medium">
            {study.results[0].value} {study.results[0].label}
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          asChild
          variant="outline"
          className="w-full bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 transition-all"
        >
          <Link href={`/case-studies/${study.id}`}>
            Read Full Case Study <ArrowRight size={16} className="ml-2" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  </motion.div>
)

export default function CaseStudiesPage() {
  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Enhanced Header with Background Patterns */}
      <header className="relative py-16 md:py-24 bg-gradient-to-b from-slate-900 to-slate-950 overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-emerald-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/25 via-transparent to-emerald-800/20"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/20 to-teal-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/18 to-emerald-500/20 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.85, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 8,
            }}
          />
          
          {/* Geometric Elements - Unique to case studies */}
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
          
          {/* Diamond Shapes - Unique to case studies */}
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
            className="absolute top-1/3 right-1/3 w-4 h-4 bg-gradient-to-r from-emerald-400/60 to-teal-400/60 rounded-full shadow-lg shadow-emerald-400/30"
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
            className="absolute bottom-1/3 left-1/3 w-3 h-3 bg-gradient-to-r from-teal-400/60 to-emerald-400/60 rounded-full shadow-lg shadow-teal-400/30"
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
          
          <motion.div
            className="absolute bottom-2/3 right-1/3 w-2 h-2 bg-gradient-to-r from-teal-300/70 to-emerald-300/70 rounded-full"
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
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <motion.h1 
            className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            Our Proven Impact
          </motion.h1>
          <motion.p 
            className="text-lg md:text-xl text-slate-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Discover how we've partnered with businesses like yours to overcome challenges, innovate, and achieve
            remarkable growth. Each story highlights our commitment to delivering tangible results.
          </motion.p>
        </div>
      </header>

      {/* New Section: Industries Served */}
      <IndustriesServedSection />

      {/* New Section: Aggregate Stats */}
      <AggregateStatsSection />

      {/* Enhanced Main Content Section */}
      <main className="relative py-12 md:py-16 overflow-hidden">
        {/* Background Patterns for Main Content */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/15 via-transparent to-teal-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/25 via-transparent to-emerald-900/18"></div>
          
          {/* Subtle Animated Elements */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-64 h-64 bg-gradient-to-br from-emerald-500/12 to-teal-500/10 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/10 to-emerald-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 25, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Floating Dots */}
          <motion.div
            className="absolute top-1/6 right-1/4 w-2 h-2 bg-emerald-400/50 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 left-1/4 w-1.5 h-1.5 bg-teal-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 10,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.h2 
            className="text-3xl font-semibold text-center text-white mb-10 md:mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            Explore Our Success Stories
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {caseStudies.map((study) => (
              <CaseStudyCard key={study.id} study={study} />
            ))}
          </div>
        </div>
      </main>

      {/* New Section: Our Process */}
      <OurProcessSection />

      {/* New Section: CTA */}
      <CtaSection />
    </div>
  )
}
