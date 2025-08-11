"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Zap,
  TrendingUp,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  Clock,
  BarChart,
  FileText,
  Users,
  Briefcase,
  Heart,
  Building,
  BookOpen,
  DollarSign,
  Target,
  Settings,
  Cpu,
  HelpCircle,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const keyBenefits = [
  {
    title: "Fast Results",
    description: "Get actionable insights and recommendations within one week of your consultation.",
    icon: Zap,
  },
  {
    title: "ROI Focused",
    description: "Average client sees 300% ROI within 6 months of implementing our recommendations.",
    icon: TrendingUp,
  },
  {
    title: "Risk-Free",
    description: "100% satisfaction guarantee. If you're not completely satisfied, we'll refund your investment.",
    icon: ShieldCheck,
  },
]

const processSteps = [
  {
    step: 1,
    title: "Discovery Call",
    duration: "30 mins",
    description: "Preliminary discussion to understand your business needs and objectives.",
    icon: Clock,
  },
  {
    step: 2,
    title: "Business Analysis",
    duration: "2 hours",
    description: "In-depth analysis of your current business model, challenges, and opportunities.",
    icon: BarChart,
  },
  {
    step: 3,
    title: "Strategy Session",
    duration: "3 hours",
    description: "Interactive workshop with key stakeholders to develop strategic recommendations.",
    icon: Users,
  },
  {
    step: 4,
    title: "Action Plan Delivery",
    duration: "1 week",
    description: "Comprehensive report with prioritized recommendations and implementation roadmap.",
    icon: FileText,
  },
]

const deliverables = [
  "Executive Summary Report",
  "SWOT Analysis",
  "Market Opportunity Assessment",
  "Technology Stack Recommendations",
  "Growth Strategy Blueprint",
  "90-Day Action Plan",
  "KPI Framework",
  "Budget Projections",
  "Risk Assessment Matrix",
  "Follow-up Support (30 days)",
]

const industries = [
  { name: "Healthcare & Medical", icon: Heart },
  { name: "Financial Services", icon: DollarSign },
  { name: "E-commerce & Retail", icon: Briefcase },
  { name: "Education & Training", icon: BookOpen },
  { name: "Manufacturing & Logistics", icon: Settings },
  { name: "Technology & SaaS", icon: Cpu },
  { name: "Professional Services", icon: Users },
  { name: "Real Estate", icon: Building },
]

const whyChooseConsultation = [
  {
    icon: Users,
    title: "Experienced Consultants",
    description:
      "Our team brings years of cross-industry experience to provide you with insightful and practical advice.",
  },
  {
    icon: Target,
    title: "Tailored Advice",
    description:
      "We don't offer generic solutions. Your consultation and roadmap will be customized to your specific business.",
  },
  {
    icon: CheckCircle,
    title: "Proven Results",
    description:
      "We have a track record of helping businesses like yours achieve significant growth and overcome challenges.",
  },
  {
    icon: Lightbulb,
    title: "Actionable Strategies",
    description: "You'll walk away with a clear, actionable plan that you can start implementing immediately.",
  },
]

const consultationFaqs = [
  {
    id: "consult-faq1",
    question: "What happens after the initial A$550 consultation?",
    answer:
      "After the consultation and delivery of your action plan, you'll have a clear roadmap. Many clients choose to engage us further for implementation of the recommended strategies, such as custom software development, SEO services, or ongoing strategic advisory, based on the plan.",
  },
  {
    id: "consult-faq2",
    question: "Is the A$550 consultation fee refundable if I'm not satisfied?",
    answer:
      "Yes, we offer a 100% satisfaction guarantee. If you're not completely satisfied with the value received from the consultation, we will refund your A$550 investment.",
  },
  {
    id: "consult-faq3",
    question: "Who will I be speaking with during the consultation?",
    answer:
      "You will be speaking with one of our senior business strategists or consultants who has expertise relevant to your industry and business challenges. We match you with the best-suited expert from our team.",
  },
  {
    id: "consult-faq4",
    question: "How should I prepare for the consultation sessions?",
    answer:
      "Before the Discovery Call, think about your key business objectives, major challenges, and what you hope to achieve. For the Business Analysis and Strategy Session, be prepared to discuss your business operations, financials (high-level), and market position in more detail. We'll guide you through the process.",
  },
]

export default function InitialConsultationPage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-amber-900/30 to-slate-950 relative overflow-hidden"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/45 via-transparent to-yellow-900/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/55 via-transparent to-amber-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-900/40 via-transparent to-slate-700/50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/45 via-transparent to-amber-800/40"></div>
          
          {/* Large Bold Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-amber-500/40 to-yellow-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-yellow-500/38 to-amber-500/40 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-amber-400/65 rounded-full bg-gradient-to-br from-amber-500/38 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-yellow-400/60 bg-gradient-to-br from-yellow-500/35 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-amber-400/70 to-yellow-400/70 rounded-full shadow-lg shadow-amber-400/50"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-yellow-400/70 to-amber-400/70 rounded-full shadow-lg shadow-yellow-400/50"
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
          <Lightbulb className="w-20 h-20 text-amber-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Initial Business Consultation
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Transform your business vision into reality with our comprehensive initial consultation. Get expert insights,
            strategic recommendations, and a clear roadmap to achieve your goals.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-amber-500 hover:bg-amber-600 text-white group">
              <Link href="/contact?service=Initial%20Business%20Consultation&package=Initial%20Consultation%20A$550">
                Book Consultation{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="/contact?service=Initial%20Business%20Consultation&action=ask_question">
                Ask Questions
              </Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Key Benefits Section */}
      <section className="py-16 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/35 via-transparent to-yellow-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-amber-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-amber-500/25 to-yellow-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-yellow-500/22 to-amber-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-amber-400/50 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent"
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
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-yellow-400/45 bg-gradient-to-br from-yellow-500/18 to-transparent"
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
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid md:grid-cols-3 gap-8">
            {keyBenefits.map((benefit, idx) => (
              <motion.div
                key={benefit.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-amber-500/40 transition-colors"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <benefit.icon className="w-12 h-12 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{benefit.title}</h3>
                <p className="text-slate-300">{benefit.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Proven Process Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/25 via-transparent to-yellow-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-amber-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-amber-500/18 to-yellow-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-yellow-500/15 to-amber-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-amber-400/50 to-yellow-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-yellow-400/50 to-amber-400/50 rounded-full"
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
            <Target className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our Proven Process</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              A structured approach to understanding your business and delivering transformative insights.
            </p>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-16 right-16 h-0.5 bg-gradient-to-r from-transparent via-amber-500/30 to-transparent transform -translate-y-1/2"></div>
            <div className="grid md:grid-cols-4 gap-8">
              {processSteps.map((step, idx) => (
                <motion.div
                  key={step.title}
                  className="text-center relative"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <div className="relative inline-block mb-4">
                    <div className="w-20 h-20 flex items-center justify-center bg-slate-800/50 backdrop-blur-sm border-2 border-amber-500/60 text-amber-400 rounded-full text-3xl font-bold shadow-lg shadow-amber-500/20">
                      {step.step}
                    </div>
                    <div className="absolute -bottom-2 -right-2 p-2 bg-slate-700/80 backdrop-blur-sm rounded-full border-2 border-slate-950">
                      <step.icon className="w-5 h-5 text-amber-300" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-sm text-amber-300 mb-2">{step.duration}</p>
                  <p className="text-sm text-slate-300">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Our Consultation Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/35 via-transparent to-yellow-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-amber-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-amber-500/25 to-yellow-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-yellow-500/22 to-amber-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-amber-400/50 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-yellow-400/45 bg-gradient-to-br from-yellow-500/18 to-transparent"
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
            <Lightbulb className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Choose Our Initial Business Consultation?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Invest in a consultation that provides clarity, direction, and a solid foundation for growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseConsultation.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-amber-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-amber-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Consultation FAQs Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/20 via-transparent to-yellow-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-amber-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-900/15 via-transparent to-slate-700/25"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-amber-500/15 to-yellow-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tl from-yellow-500/12 to-amber-500/15 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-amber-400/40 to-yellow-400/40 rounded-full"
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
            className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-yellow-400/40 to-amber-400/40 rounded-full"
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
            <HelpCircle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Consultation FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Answers to common questions about our Initial Business Consultation.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {consultationFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-amber-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-amber-400 mr-3 flex-shrink-0" />
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

      {/* What You'll Receive Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-amber-900/35 via-transparent to-yellow-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-amber-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-yellow-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-amber-500/25 to-yellow-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-yellow-500/22 to-amber-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-amber-400/50 rounded-full bg-gradient-to-br from-amber-500/20 to-transparent"
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
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-yellow-400/45 bg-gradient-to-br from-yellow-500/18 to-transparent"
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
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <FileText className="w-12 h-12 text-amber-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">What You'll Receive</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Comprehensive deliverables designed to drive immediate action and long-term success.
            </p>
          </div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-slate-700/50 hover:border-amber-500/40 transition-colors"
          >
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-4">
              {deliverables.map((item, idx) => (
                <motion.div
                  key={item}
                  className="flex items-center space-x-3"
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: idx * 0.05 }}
                  viewport={{ once: true, amount: 0.1 }}
                >
                  <CheckCircle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <span className="text-slate-300 text-sm">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Industry Expertise Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Briefcase className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Industry Expertise</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">Specialized knowledge across diverse industries.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {industries.map((industry, idx) => (
              <motion.div
                key={industry.name}
                className="bg-slate-800 p-4 rounded-lg shadow-md flex items-center gap-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                viewport={{ once: true, amount: 0.1 }}
              >
                <industry.icon className="w-6 h-6 text-orange-400 flex-shrink-0" />
                <h4 className="font-semibold text-white text-sm">{industry.name}</h4>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-slate-900">
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">Ready to Transform Your Business?</h2>
          <p className="text-lg text-slate-300 mb-10">
            Join 500+ businesses that have accelerated their growth with our strategic consultation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-amber-500 hover:bg-amber-600 text-white group text-lg px-8 py-6">
              <Link href="/contact?service=Initial%20Business%20Consultation&package=Initial%20Consultation%20A$550">
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
            ⚡ Limited slots available this month • 💰 100% Money-back guarantee
          </p>
        </div>
      </section>
    </div>
  )
}
