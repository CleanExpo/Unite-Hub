"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  TrendingUp,
  DollarSignIcon,
  CheckCircle,
  ArrowRight,
  FileText,
  Link2,
  MapPin,
  BarChart,
  Award,
  Lightbulb,
  TargetIcon,
  Settings,
  HelpCircle,
  Briefcase,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const stats = [
  { value: "+156%", label: "Average Traffic Increase", icon: TrendingUp },
  { value: "+89%", label: "First Page Rankings", icon: Award },
  { value: "+43%", label: "Conversion Rate Boost", icon: DollarSignIcon },
  { value: "+312%", label: "ROI Improvement", icon: BarChart },
]

const seoSolutions = [
  {
    title: "Technical SEO Audit",
    icon: Settings,
    description: "Complete technical analysis to identify and fix issues impacting your rankings.",
    items: [
      "Site speed optimization",
      "Mobile responsiveness",
      "Crawlability analysis",
      "Schema markup implementation",
      "Core Web Vitals optimization",
    ],
  },
  {
    title: "Content Strategy",
    icon: FileText,
    description: "Data-driven content planning that attracts and converts your target audience.",
    items: [
      "Keyword research & mapping",
      "Content gap analysis",
      "Topic cluster planning",
      "Content optimization",
      "Editorial calendar",
    ],
  },
  {
    title: "Link Building",
    icon: Link2,
    description: "White-hat link building strategies that boost your domain authority.",
    items: [
      "Competitor backlink analysis",
      "Outreach campaigns",
      "Digital PR",
      "Guest posting",
      "Broken link recovery",
    ],
  },
  {
    title: "Local SEO",
    icon: MapPin,
    description: "Dominate local search results and attract nearby customers.",
    items: [
      "Google My Business optimization",
      "Local citations",
      "Review management",
      "Location page optimization",
      "Local link building",
    ],
  },
]

const seoProcessSteps = [
  {
    number: "01",
    week: "Week 1",
    title: "SEO Audit",
    description: "Comprehensive analysis of your current SEO performance and opportunities.",
    icon: Search,
  },
  {
    number: "02",
    week: "Week 2",
    title: "Strategy Development",
    description: "Custom SEO strategy tailored to your business goals and competition.",
    icon: Lightbulb,
  },
  {
    number: "03",
    week: "Weeks 3-8",
    title: "Implementation",
    description: "Execute technical fixes, content optimization, and link building.",
    icon: CheckCircle,
  },
  {
    number: "04",
    week: "Ongoing",
    title: "Monitor & Optimize",
    description: "Track performance, refine strategies, and scale what works.",
    icon: TrendingUp,
  },
]

// const seoPackages = [
//   {
//     name: "SEO Starter Package",
//     price: "A$1,500/month",
//     description: "Perfect for small businesses looking to improve local visibility.",
//     features: [
//       "Local SEO optimization",
//       "Basic keyword research",
//       "On-page optimization",
//       "Monthly reporting",
//       "Google My Business optimization",
//       "Basic content recommendations",
//     ],
//     idealFor: "Small local businesses",
//     isPopular: false,
//   },
//   {
//     name: "SEO Growth Package",
//     price: "A$3,500/month",
//     description: "Comprehensive SEO strategy for businesses ready to scale.",
//     features: [
//       "Full technical SEO audit",
//       "Advanced keyword research",
//       "Content strategy & creation",
//       "Link building outreach",
//       "Competitor analysis",
//       "Weekly reporting",
//       "Priority support",
//     ],
//     idealFor: "Growing businesses",
//     isPopular: true,
//   },
//   {
//     name: "SEO Enterprise Package",
//     price: "Custom pricing",
//     description: "Full-service SEO for large organizations with complex needs.",
//     features: [
//       "Enterprise SEO strategy",
//       "Advanced technical optimization",
//       "Content marketing team",
//       "International SEO",
//       "Custom reporting dashboard",
//       "Dedicated SEO manager",
//       "24/7 support",
//     ],
//     idealFor: "Large enterprises",
//     isPopular: false,
//   },
// ];

const whyChooseUsSeo = [
  {
    icon: BarChart,
    title: "Results-Driven Strategies",
    description:
      "We focus on SEO tactics that deliver measurable results, from increased traffic to higher conversion rates.",
  },
  {
    icon: CheckCircle,
    title: "Ethical & Transparent",
    description:
      "Our white-hat SEO practices ensure long-term success, and we provide clear, regular reporting on our progress.",
  },
  {
    icon: Lightbulb,
    title: "Customized Approach",
    description:
      "We don't believe in one-size-fits-all. Your SEO strategy will be tailored to your unique business and industry.",
  },
  {
    icon: Users,
    title: "Experienced SEO Experts",
    description:
      "Our team stays ahead of algorithm changes and industry trends to keep your business at the forefront.",
  },
]

const seoFaqs = [
  {
    id: "seo-faq1",
    question: "How long does it take to see SEO results?",
    answer:
      "SEO is a long-term strategy. While some improvements can be seen in a few weeks (like technical fixes), significant ranking and traffic changes typically take 3-6 months, and sometimes longer for highly competitive keywords.",
  },
  {
    id: "seo-faq2",
    question: "What's the difference between on-page and off-page SEO?",
    answer:
      "On-page SEO refers to optimizing elements on your website itself (content, meta tags, site speed). Off-page SEO involves activities outside your website to build its authority and reputation (like link building, social media marketing, and brand mentions).",
  },
  {
    id: "seo-faq3",
    question: "Do you guarantee #1 rankings?",
    answer:
      "No reputable SEO agency can guarantee #1 rankings, as search engine algorithms are complex and constantly changing, and many factors are outside our direct control. We do guarantee to apply best practices and proven strategies to significantly improve your organic visibility and work towards the best possible rankings.",
  },
  {
    id: "seo-faq4",
    question: "How do you measure SEO success?",
    answer:
      "We measure success through a variety of Key Performance Indicators (KPIs), including organic traffic growth, keyword ranking improvements, conversion rates from organic search, backlink profile quality, and overall return on investment (ROI).",
  },
]

export default function StrategicSeoServicesPage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-emerald-900/30 to-slate-950 relative overflow-hidden"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/45 via-transparent to-teal-900/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/55 via-transparent to-emerald-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/40 via-transparent to-slate-700/50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/45 via-transparent to-emerald-800/40"></div>
          
          {/* Large Bold Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/40 to-teal-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/38 to-emerald-500/40 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-emerald-400/65 rounded-full bg-gradient-to-br from-emerald-500/38 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-emerald-400/70 to-teal-400/70 rounded-full shadow-lg shadow-emerald-400/50"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/70 to-emerald-400/70 rounded-full shadow-lg shadow-teal-400/50"
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
          <Search className="w-20 h-20 text-emerald-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Strategic SEO Services
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Dominate search results with data-driven SEO strategies that drive organic traffic, boost conversions,
            and deliver measurable ROI for your business.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-emerald-500 hover:bg-emerald-600 text-white group">
              <Link href="/contact?service=Strategic%20SEO%20Services&action=free_audit">
                Get Free Audit{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="/case-studies">View Case Studies</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-emerald-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
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
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
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
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-emerald-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive SEO Solutions Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-emerald-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-500/18 to-teal-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/15 to-emerald-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/50 to-emerald-400/50 rounded-full"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Comprehensive SEO Solutions</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              End-to-end SEO services designed to boost your search rankings and drive organic traffic growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {seoSolutions.map((solution, idx) => (
              <motion.div
                key={solution.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-emerald-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <solution.icon className="w-10 h-10 text-emerald-400" />
                  <h3 className="text-xl font-semibold text-white">{solution.title}</h3>
                </div>
                <p className="text-slate-300 mb-4">{solution.description}</p>
                <ul className="space-y-2">
                  {solution.items.map((item) => (
                    <li key={item} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-emerald-400 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Unite Group for SEO Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-emerald-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
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
              Why Choose Unite Group for SEO?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Partner with us to achieve sustainable SEO success and dominate your market.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsSeo.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-emerald-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-emerald-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO FAQs Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/20 via-transparent to-teal-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-emerald-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/15 via-transparent to-slate-700/25"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-emerald-500/15 to-teal-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tl from-teal-500/12 to-emerald-500/15 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400/40 to-teal-400/40 rounded-full"
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
            className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-teal-400/40 to-emerald-400/40 rounded-full"
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
            <HelpCircle className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">SEO FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Answers to common questions about our SEO services.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {seoFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-emerald-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-emerald-400 mr-3 flex-shrink-0" />
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

      {/* Our SEO Process Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/35 via-transparent to-teal-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-emerald-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-emerald-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-emerald-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-emerald-400/50 rounded-full bg-gradient-to-br from-emerald-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-teal-400/45 bg-gradient-to-br from-teal-500/18 to-transparent"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our SEO Process</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              A proven methodology that delivers consistent, sustainable results.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {seoProcessSteps.map((step, idx) => (
              <motion.div
                key={step.number}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500/10 rounded-full mb-4 border-2 border-emerald-500/30">
                  <span className="text-2xl font-bold text-emerald-400">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Packages Section */}
      {/*
      <section className="py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-emerald-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-emerald-500/18 to-teal-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/15 to-emerald-500/18 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 18, 0], scale: [1, 0.98, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          <motion.div
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-emerald-400/50 to-teal-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/50 to-emerald-400/50 rounded-full"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">SEO Packages</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose the package that best fits your business goals and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {seoPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-slate-700/30 hover:border-emerald-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-emerald-400 mb-2">{pkg.price}</div>
                  <p className="text-slate-300 text-sm">{pkg.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-emerald-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white">
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Limited Time Offer Section */}
      <section className="py-20 md:py-32 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-emerald-900/40 via-transparent to-teal-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-transparent to-emerald-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/35 via-transparent to-slate-700/45"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-emerald-500/30 to-teal-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/25 to-emerald-500/30 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 35, 0], scale: [1, 0.9, 1] }}
            transition={{
              duration: 35,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 7,
            }}
          />
          
          {/* Geometric Elements */}
          <motion.div
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-emerald-400/55 rounded-full bg-gradient-to-br from-emerald-500/25 to-transparent"
            animate={{ 
              x: [0, -20, 0], 
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-teal-400/50 bg-gradient-to-br from-teal-500/20 to-transparent"
            style={{
              clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)'
            }}
            animate={{ 
              x: [0, 18, 0], 
              y: [0, 22, 0], 
              rotate: [0, 120, 0]
            }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 4,
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-emerald-400/60 to-teal-400/60 rounded-full shadow-lg shadow-emerald-400/40"
            animate={{ 
              y: [0, -30, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 18,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/60 to-emerald-400/60 rounded-full shadow-lg shadow-teal-400/40"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 3,
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-block bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Limited Time Offer
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Get Your Free SEO Audit Today
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Discover hidden opportunities worth thousands in potential revenue.
          </p>
          <Button size="lg" asChild className="bg-emerald-500 hover:bg-emerald-600 text-white group text-lg px-10 py-7">
            <Link href="/contact?service=Strategic%20SEO%20Services&package=SEO%20Starter%20Package">
              Get Started{" "}
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
