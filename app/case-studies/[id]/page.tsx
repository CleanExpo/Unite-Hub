"use client";

import { caseStudies, type CaseStudy, type Technology } from "@/lib/case-studies-data"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Zap, Lightbulb, Target, Workflow, Cpu, TrendingUp, CheckCircle2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { LucideIcon } from "lucide-react"
import { motion } from "framer-motion"

// Helper to get a specific case study
function getCaseStudy(id: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.id === id)
}

const ResultPill = ({ value, label, icon: Icon }: { value: string; label: string; icon?: LucideIcon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true, amount: 0.3 }}
    className="bg-green-600/10 border border-green-500/30 text-green-300 p-4 rounded-lg text-center shadow-md flex flex-col items-center justify-center min-h-[120px] hover:border-green-400/50 transition-all duration-300"
  >
    {Icon && <Icon className="w-8 h-8 mx-auto mb-2 text-green-400" />}
    <p className="text-3xl font-bold text-white">{value}</p>
    <p className="text-sm mt-1">{label}</p>
  </motion.div>
)

const TechnologyCard = ({ tech }: { tech: Technology }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5 }}
    viewport={{ once: true, amount: 0.3 }}
  >
    <Card className="bg-slate-800/70 backdrop-blur-sm border-slate-700/30 hover:border-cyan-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/10">
      <CardContent className="p-4 flex items-center space-x-3">
        {tech.icon && <tech.icon size={24} className="text-cyan-400 flex-shrink-0" />}
        <div>
          <p className="font-semibold text-white text-sm">{tech.name}</p>
          <p className="text-xs text-slate-400">{tech.category}</p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
)

export default function SingleCaseStudyPage({ params }: { params: { id: string } }) {
  const study = getCaseStudy(params.id)

  if (!study) {
    notFound()
  }

  return (
    <div className="bg-slate-950 text-white min-h-screen">
      {/* Enhanced Header Section with Background Patterns */}
      <header className="relative h-[350px] md:h-[450px] overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/30 via-transparent to-teal-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/40 via-transparent to-emerald-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/25 via-transparent to-slate-700/35"></div>
          
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
        </div>
        
        {study.heroImageUrl && (
          <Image
            src={study.heroImageUrl || "/placeholder.svg"}
            alt={`${study.client} project visual`}
            layout="fill"
            objectFit="cover"
            className="opacity-20"
            priority
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col justify-end h-full pb-12 md:pb-20">
          <motion.div 
            className="flex items-center gap-4 mb-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {study.logoUrl && (
              <Image
                src={study.logoUrl || "/placeholder.svg"}
                alt={`${study.client} Logo`}
                width={72}
                height={72}
                className="rounded-lg bg-white p-1.5 shadow-xl"
              />
            )}
            <div>
              <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight">{study.client}</h1>
              <Badge variant="secondary" className="mt-2 bg-cyan-500 text-slate-950 text-md px-3 py-1">
                {study.industry}
              </Badge>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Enhanced Main Content with Background Patterns */}
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Button
              asChild
              variant="outline"
              className="mb-10 bg-slate-800/70 backdrop-blur-sm hover:bg-slate-700/80 border-slate-700/50 hover:border-cyan-500/60 text-slate-300 hover:text-cyan-400 transition-all duration-300"
            >
              <Link href="/case-studies">
                <ArrowLeft size={18} className="mr-2" /> Back to All Case Studies
              </Link>
            </Button>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-10 md:gap-12">
            {/* Main Content Column */}
            <div className="lg:col-span-2 space-y-12">
              {/* Challenge Section */}
              <motion.section 
                id="challenge"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm p-8 rounded-xl border border-slate-700/30"
              >
                <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                  <Zap size={30} className="mr-3 text-amber-400" /> The Challenge
                </h2>
                <p className="text-slate-300 leading-relaxed mb-4 text-lg">{study.challenge}</p>
                {study.challengeDetails && study.challengeDetails.length > 0 && (
                  <ul className="space-y-2 list-disc list-inside text-slate-400 pl-1">
                    {study.challengeDetails.map((detail, index) => (
                      <li key={index} className="leading-relaxed">
                        {detail}
                      </li>
                    ))}
                  </ul>
                )}
              </motion.section>

              {/* Project Goals Section */}
              <motion.section 
                id="project-goals"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm p-8 rounded-xl border border-slate-700/30"
              >
                <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                  <Target size={30} className="mr-3 text-green-400" /> Project Goals & Objectives
                </h2>
                <div className="space-y-3">
                  {study.projectGoals.map((goal, index) => (
                    <div
                      key={index}
                      className="flex items-start p-3 bg-slate-800/50 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-all duration-300"
                    >
                      {goal.icon ? (
                        <goal.icon size={22} className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 size={22} className="mr-3 mt-1 text-green-400 flex-shrink-0" />
                      )}
                      <p className="text-slate-300 leading-relaxed">{goal.goal}</p>
                    </div>
                  ))}
                </div>
              </motion.section>

              {/* Our Strategic Solution Section */}
              <motion.section 
                id="solution"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm p-8 rounded-xl border border-slate-700/30"
              >
                <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                  <Lightbulb size={30} className="mr-3 text-yellow-400" /> Our Strategic Solution
                </h2>
                <p className="text-slate-300 leading-relaxed mb-6 text-lg">{study.solutionIntro}</p>
                <div className="space-y-6">
                  {study.solutionPoints.map((point, index) => (
                    <Card key={index} className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-md hover:border-cyan-500/30 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center">
                          {point.icon && <point.icon size={24} className="mr-3 text-cyan-400" />}
                          {point.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-400 leading-relaxed">{point.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.section>

              {/* Our Approach & Methodology Section */}
              <motion.section 
                id="approach"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm p-8 rounded-xl border border-slate-700/30"
              >
                <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                  <Workflow size={30} className="mr-3 text-purple-400" /> Our Approach & Methodology
                </h2>
                <div className="space-y-6">
                  {study.approach.map((phase, index) => (
                    <Card key={index} className="bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-md hover:border-purple-500/30 transition-all duration-300">
                      <CardHeader>
                        <CardTitle className="text-xl text-white flex items-center">
                          {phase.icon && <phase.icon size={24} className="mr-3 text-purple-400" />}
                          {phase.phase}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-slate-400 leading-relaxed">{phase.description}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.section>

              {/* Key Technologies Utilized Section */}
              <motion.section 
                id="technologies"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm p-8 rounded-xl border border-slate-700/30"
              >
                <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                  <Cpu size={30} className="mr-3 text-sky-400" /> Key Technologies Utilized
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {study.technologies.map((tech, index) => (
                    <TechnologyCard key={index} tech={tech} />
                  ))}
                </div>
              </motion.section>

              {/* Future Outlook Section */}
              <motion.section 
                id="future-outlook"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                viewport={{ once: true, amount: 0.3 }}
                className="bg-slate-900/30 backdrop-blur-sm p-8 rounded-xl border border-slate-700/30"
              >
                <h2 className="text-3xl font-semibold text-cyan-400 mb-5 flex items-center">
                  <TrendingUp size={30} className="mr-3 text-lime-400" /> Future Outlook & Long-Term Impact
                </h2>
                <div className="space-y-3">
                  {study.futureOutlook.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start p-3 bg-slate-800/50 border border-slate-700/40 rounded-lg hover:border-slate-600/60 transition-all duration-300"
                    >
                      {item.icon ? (
                        <item.icon size={22} className="mr-3 mt-1 text-lime-400 flex-shrink-0" />
                      ) : (
                        <CheckCircle2 size={22} className="mr-3 mt-1 text-lime-400 flex-shrink-0" />
                      )}
                      <p className="text-slate-300 leading-relaxed">{item.point}</p>
                    </div>
                  ))}
                </div>
              </motion.section>
            </div>

            {/* Enhanced Sidebar Column */}
            <motion.aside 
              className="lg:col-span-1 space-y-8 sticky top-24 self-start"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <Card className="bg-slate-900/70 backdrop-blur-sm border-slate-700/50 shadow-lg hover:border-cyan-500/30 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-xl text-cyan-400">Services Provided</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {study.services.map((service) => (
                    <div key={service.name} className="flex items-center gap-3 text-slate-300">
                      <service.icon size={20} className="text-cyan-400" />
                      <span>{service.name}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {study.testimonial && (
                <Card className="bg-slate-900/70 backdrop-blur-sm border-cyan-500/30 shadow-xl hover:border-cyan-400/50 transition-all duration-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      {study.avatarUrl && (
                        <Image
                          src={study.avatarUrl || "/placeholder.svg"}
                          alt={study.testimonial.author}
                          width={48}
                          height={48}
                          className="rounded-full border-2 border-cyan-500"
                        />
                      )}
                      <div>
                        <p className="font-semibold text-white text-md">{study.testimonial.author}</p>
                        <p className="text-sm text-slate-400">{study.testimonial.role}</p>
                      </div>
                    </div>
                    <blockquote className="text-slate-300 italic text-md leading-relaxed border-l-4 border-cyan-500 pl-4">
                      "{study.testimonial.quote}"
                    </blockquote>
                  </CardHeader>
                </Card>
              )}
            </motion.aside>
          </div>

          {/* Enhanced Measurable Results Section */}
          <motion.section 
            id="results" 
            className="mt-16 md:mt-20 pt-12 border-t border-slate-700/50 relative overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true, amount: 0.3 }}
          >
            {/* Background Patterns for Results Section */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-900/10 via-transparent to-teal-900/15"></div>
              <div className="absolute inset-0 bg-gradient-to-l from-slate-800/20 via-transparent to-emerald-800/10"></div>
            </div>
            
            <div className="relative z-10">
              <h2 className="text-4xl font-semibold text-white mb-10 text-center">Measurable Results & Impact</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 md:gap-6">
                {study.results.map((result) => (
                  <ResultPill key={result.label} value={result.value} label={result.label} icon={result.icon} />
                ))}
              </div>
            </div>
          </motion.section>
        </div>
      </main>
    </div>
  )
}
