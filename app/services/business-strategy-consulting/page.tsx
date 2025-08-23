"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Briefcase,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Lightbulb,
  Users,
  ShieldCheck,
  BarChart,
  Layers,
  Handshake,
  TargetIcon,
  Clock,
  PieChart,
  Activity,
  Settings,
  Globe,
  Zap,
  Search,
  FileText,
  HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const heroStats = [
  { value: "234%", label: "Revenue Growth", subLabel: "Average 3-year growth", icon: TrendingUp },
  { value: "+18%", label: "Market Share", subLabel: "Competitive gain", icon: PieChart },
  { value: "47%", label: "Operational Efficiency", subLabel: "Cost reduction", icon: Settings },
  { value: "-65%", label: "Time to Market", subLabel: "Speed improvement", icon: Clock },
]

const strategicSolutions = [
  {
    title: "Innovation Strategy",
    icon: Lightbulb,
    description: "Transform ideas into market-leading products and services.",
    items: [
      "Innovation framework development",
      "R&D process optimization",
      "Product-market fit analysis",
      "Technology roadmapping",
      "Innovation culture building",
    ],
  },
  {
    title: "Market Expansion",
    icon: Globe,
    description: "Identify and capture new market opportunities for growth.",
    items: [
      "Market entry strategies",
      "Geographic expansion planning",
      "Channel development",
      "Partnership strategies",
      "International growth plans",
    ],
  },
  {
    title: "Digital Transformation",
    icon: Zap,
    description: "Leverage technology to revolutionize your business model.",
    items: [
      "Digital maturity assessment",
      "Technology stack planning",
      "Process digitization",
      "Data strategy development",
      "Change management",
    ],
  },
  {
    title: "Organizational Excellence",
    icon: Users,
    description: "Build high-performing teams and scalable operations.",
    items: [
      "Organizational design",
      "Leadership development",
      "Performance frameworks",
      "Culture transformation",
      "Talent strategy",
    ],
  },
]

const methodologies = [
  { phase: "Analysis", tools: ["SWOT Analysis", "Porter's Five Forces", "Value Chain Analysis"], icon: Search },
  { phase: "Planning", tools: ["PESTLE Analysis", "BCG Matrix", "Scenario Planning"], icon: FileText },
  { phase: "Execution", tools: ["Agile Implementation", "KPI Tracking", "Change Management"], icon: CheckCircle },
]

// const engagementModels = [
//   {
//     type: "Strategy Workshop",
//     duration: "1-2 days",
//     price: "A$5,000",
//     description: "Intensive strategy session to define your business direction.",
//     features: [
//       "Business model canvas",
//       "Competitive analysis",
//       "Strategic roadmap",
//       "Action plan",
//       "Follow-up consultation",
//     ],
//     icon: Lightbulb,
//   },
//   {
//     type: "Strategy Project",
//     duration: "4-8 weeks",
//     price: "A$15,000",
//     description: "Comprehensive strategy development with implementation support.",
//     features: [
//       "Full strategic analysis",
//       "Market research",
//       "Implementation plan",
//       "Team training",
//       "3 months support",
//     ],
//     icon: TargetIcon,
//   },
//   {
//     type: "Strategic Partnership",
//     duration: "6-12 months",
//     price: "A$50,000",
//     description: "Ongoing strategic partnership for business transformation.",
//     features: [
//       "Continuous strategy support",
//       "Performance monitoring",
//       "Quarterly reviews",
//       "Team development",
//       "Unlimited consultations",
//     ],
//     icon: Handshake,
//   },
// ];

const uniteAdvantage = [
  {
    title: "Data-Driven Insights",
    description: "Every recommendation backed by rigorous analysis and market data.",
    icon: BarChart,
  },
  {
    title: "Implementation Focus",
    description: "Practical strategies designed for real-world execution and results.",
    icon: TargetIcon,
  },
  {
    title: "Risk Mitigation",
    description: "Comprehensive scenario planning to navigate uncertainty.",
    icon: ShieldCheck,
  },
  {
    title: "Sustainable Growth",
    description: "Strategies aimed at long-term value creation and market leadership.",
    icon: Activity,
  },
]

const uniteGroupAdvantages = [
  {
    title: "Data-Driven Insights",
    description: "Every recommendation backed by rigorous analysis and market data.",
    icon: BarChart,
  },
  {
    title: "Implementation Focus",
    description: "Practical strategies designed for real-world execution and results.",
    icon: TargetIcon,
  },
  {
    title: "Risk Mitigation",
    description: "Comprehensive scenario planning to navigate uncertainty.",
    icon: ShieldCheck,
  },
  {
    title: "Sustainable Growth",
    description: "Strategies aimed at long-term value creation and market leadership.",
    icon: Activity,
  },
]

const strategyFaqs = [
  {
    id: "strategy-faq1",
    question: "What industries do you specialize in for strategy consulting?",
    answer:
      "We have a broad range of experience across various sectors including technology, SaaS, e-commerce, healthcare, finance, and manufacturing. Our core methodologies are adaptable, but we bring deep industry insights where applicable.",
  },
  {
    id: "strategy-faq2",
    question: "How do you ensure the strategies developed are actionable?",
    answer:
      "Our process emphasizes practicality. We work closely with your team to ensure strategies are realistic, resourced appropriately, and come with clear implementation roadmaps, KPIs, and milestones.",
  },
  {
    id: "strategy-faq3",
    question: "What is the typical ROI for your consulting services?",
    answer:
      "While ROI varies by project and industry, our clients typically see significant returns through increased revenue, cost savings, improved efficiency, or enhanced market position. We focus on delivering measurable value and can discuss potential ROI during our initial consultations.",
  },
  {
    id: "strategy-faq4",
    question: "How involved will our team be in the strategy development process?",
    answer:
      "Highly involved. We believe in a collaborative approach. Your team's insights and expertise are crucial. We facilitate workshops, interviews, and regular feedback sessions to ensure the strategy is co-created and owned by your organization.",
  },
]

export default function BusinessStrategyPage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 relative overflow-hidden"
      >
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{
              backgroundImage: 'url(/images/about.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/40"></div>
          
          {/* Large Bold Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-blue-500/40 to-indigo-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-indigo-500/38 to-blue-500/40 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-blue-400/65 rounded-full bg-gradient-to-br from-blue-500/38 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-indigo-400/60 bg-gradient-to-br from-indigo-500/35 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-blue-400/70 to-indigo-400/70 rounded-full shadow-lg shadow-blue-400/50"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-indigo-400/70 to-blue-400/70 rounded-full shadow-lg shadow-indigo-400/50"
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
          <Briefcase className="w-20 h-20 text-blue-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Business Strategy Consulting
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Transform your business with data-driven strategies that drive growth, optimize operations, and create
            sustainable competitive advantages in today's dynamic market landscape.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white group">
              <Link href="/contact?service=Business%20Strategy%20Consulting">
                Start Your Strategy{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="#our-approach">Explore Our Approach</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Hero Stats Section */}
      <section className="py-16 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/35 via-transparent to-indigo-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-blue-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-blue-500/25 to-indigo-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-indigo-500/22 to-blue-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 5,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-blue-400/50 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent"
            animate={{ 
              x: [0, 12, 0], 
              y: [0, -10, 0], 
              rotate: [0, 180, 0]
            }}
            transition={{
              duration: 24,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-indigo-400/45 bg-gradient-to-br from-indigo-500/18 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, -10, 0], 
              y: [0, 15, 0], 
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
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {heroStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-blue-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
                <div className="text-xs text-blue-300">{stat.subLabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Solutions Section */}
      <section id="our-approach" className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/25 via-transparent to-indigo-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-blue-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/18 to-indigo-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-indigo-500/15 to-blue-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 18, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-blue-400/50 to-indigo-400/50 rounded-full"
            animate={{ 
              y: [0, -18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-indigo-400/50 to-blue-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Strategic Solutions</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Comprehensive strategies tailored to your unique business challenges and growth objectives.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {strategicSolutions.map((solution, idx) => (
              <motion.div
                key={solution.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-blue-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <solution.icon className="w-10 h-10 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">{solution.title}</h3>
                </div>
                <p className="text-slate-300 mb-4">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.items.map((item) => (
                    <li key={item} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-blue-400 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* The Unite Group Advantage Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/35 via-transparent to-indigo-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-blue-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-blue-500/25 to-indigo-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-indigo-500/22 to-blue-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-blue-400/50 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-indigo-400/45 bg-gradient-to-br from-indigo-500/18 to-transparent"
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
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              The Unite Group Advantage
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Why leading companies choose us as their strategic partner.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {uniteGroupAdvantages.map((advantage, idx) => (
              <motion.div
                key={advantage.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-blue-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <advantage.icon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{advantage.title}</h3>
                <p className="text-slate-300 text-sm">{advantage.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Consulting FAQs Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/20 via-transparent to-indigo-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-blue-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/15 via-transparent to-slate-700/25"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-blue-500/15 to-indigo-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tl from-indigo-500/12 to-blue-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 25, 0], y: [0, -20, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-blue-400/40 to-indigo-400/40 rounded-full"
            animate={{ 
              y: [0, -15, 0],
              opacity: [0.5, 1, 0.5]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-indigo-400/40 to-blue-400/40 rounded-full"
            animate={{ 
              y: [0, 10, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Strategy Consulting FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Answers to common questions about our business strategy consulting services.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {strategyFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-blue-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-blue-400 mr-3 flex-shrink-0" />
                    {faq.question}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-slate-300 text-sm leading-relaxed pb-4 px-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Proven Methodologies Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/35 via-transparent to-indigo-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-blue-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-blue-500/25 to-indigo-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-indigo-500/22 to-blue-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-blue-400/50 rounded-full bg-gradient-to-br from-blue-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-indigo-400/45 bg-gradient-to-br from-indigo-500/18 to-transparent"
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
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Proven Methodologies</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Time-tested frameworks and tools that drive strategic success.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {methodologies.map((methodology, idx) => (
              <motion.div
                key={methodology.phase}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-blue-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <methodology.icon className="w-10 h-10 text-blue-400" />
                  <h3 className="text-xl font-semibold text-white">{methodology.phase}</h3>
                </div>
                <ul className="space-y-2">
                  {methodology.tools.map((tool) => (
                    <li key={tool} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-blue-400 mr-2 flex-shrink-0" />
                      {tool}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Engagement Models Section */}
      {/*
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-blue-900/25 via-transparent to-indigo-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-blue-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-indigo-900/20 via-transparent to-slate-700/30"></div>
          
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-blue-500/18 to-indigo-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-indigo-500/15 to-blue-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 18, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          <motion.div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-blue-400/50 to-indigo-400/50 rounded-full"
            animate={{ 
              y: [0, -18, 0],
              opacity: [0.6, 1, 0.6]
            }}
            transition={{
              duration: 12,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-indigo-400/50 to-blue-400/50 rounded-full"
            animate={{ 
              y: [0, 12, 0],
              opacity: [0.7, 1, 0.7]
            }}
            transition={{
              duration: 14,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 2,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Engagement Models</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Flexible engagement options to meet your strategic consulting needs.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {engagementModels.map((model, idx) => (
              <motion.div
                key={model.type}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-blue-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="text-center mb-4">
                  <model.icon className="w-12 h-12 text-blue-400 mx-auto mb-3" />
                  <h3 className="text-xl font-semibold text-white mb-2">{model.type}</h3>
                  <div className="text-2xl font-bold text-blue-400 mb-2">{model.duration}</div>
                  <div className="text-lg font-semibold text-blue-300 mb-2">{model.price}</div>
                </div>
                <p className="text-slate-300 mb-4 text-center">{model.description}</p>
                <ul className="space-y-2 mb-6">
                  {model.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-blue-400 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-slate-900">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-lg text-slate-300 mb-10">
            Let's create a strategy that turns your vision into measurable success.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white group text-lg px-8 py-6">
              <Link href="/contact?service=Business%20Strategy%20Consulting">
                Get Started{" "}
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white group text-lg px-8 py-6"
            >
              <Link href="/case-studies">View Success Stories</Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            🎯 Custom strategies • 📊 Data-driven approach • 🚀 Proven results
          </p>
        </div>
      </section>
    </div>
  )
}
