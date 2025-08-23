"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  ShieldCheck,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  DollarSignIcon,
  Zap,
  BarChart,
  ThumbsUp,
  Search,
  FileText,
  Settings,
  Cpu,
  ListChecks,
  FlaskConical,
  Eye,
  HelpCircle,
  Briefcase,
  Lightbulb,
  Users,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const heroStatsQA = [
  { value: "98%", label: "Defect Detection Rate", icon: TrendingUp },
  { value: "95%", label: "Test Coverage", icon: BarChart },
  { value: "80%", label: "Automation Coverage", icon: Zap },
  { value: "99.9%", label: "Critical Bug Prevention", icon: ThumbsUp },
]

const testingServices = [
  {
    title: "Manual Testing",
    icon: Eye,
    description: "Thorough human-driven testing to catch what automation misses.",
    items: [
      "Functional testing",
      "Usability testing",
      "Exploratory testing",
      "User acceptance testing",
      "Cross-browser testing",
      "Mobile device testing",
    ],
  },
  {
    title: "Test Automation",
    icon: Zap,
    description: "Efficient automated testing for faster releases and better coverage.",
    items: [
      "UI automation",
      "API testing",
      "Integration testing",
      "Regression testing",
      "CI/CD integration",
      "Test framework development",
    ],
  },
  {
    title: "Performance Testing",
    icon: TrendingUp,
    description: "Ensure your application performs under real-world conditions.",
    items: [
      "Load testing",
      "Stress testing",
      "Scalability testing",
      "Volume testing",
      "Spike testing",
      "Performance optimization",
    ],
  },
  {
    title: "Security Testing",
    icon: ShieldCheck,
    description: "Identify vulnerabilities before hackers do.",
    items: [
      "Vulnerability assessment",
      "Penetration testing",
      "Security code review",
      "OWASP compliance",
      "Authentication testing",
      "Data protection validation",
    ],
  },
]

const qaProcessSteps = [
  {
    number: "01",
    title: "Requirements Analysis",
    description:
      "Understanding your quality goals and defining test criteria. Includes test planning, risk assessment, and coverage definition.",
    icon: Search,
  },
  {
    number: "02",
    title: "Test Design",
    description:
      "Creating comprehensive test cases and scenarios. Involves test case creation, test data preparation, and environment setup.",
    icon: FileText,
  },
  {
    number: "03",
    title: "Test Execution",
    description:
      "Running tests and documenting results through manual execution, automated testing, and bug reporting.",
    icon: Settings,
  },
  {
    number: "04",
    title: "Results & Optimization",
    description:
      "Analyzing results and improving quality via defect analysis, performance tuning, and process improvement.",
    icon: CheckCircle,
  },
]

const testingTools = [
  { name: "Selenium", category: "Automation" },
  { name: "Cypress", category: "Automation" },
  { name: "Jest", category: "Automation" },
  { name: "Postman", category: "API Testing" },
  { name: "JMeter", category: "Performance" },
  { name: "LoadRunner", category: "Performance" },
  { name: "Appium", category: "Mobile Testing" },
  { name: "TestRail", category: "Test Management" },
  { name: "BrowserStack", category: "Cross-browser" },
  { name: "Jenkins", category: "CI/CD" },
  { name: "OWASP ZAP", category: "Security" },
  { name: "Burp Suite", category: "Security" },
]

// const qaPackages = [
//   {
//     name: "Essential QA",
//     price: "A$3,000/project",
//     description: "Core testing for small to medium projects.",
//     features: [
//       "Functional testing",
//       "Basic UI/UX testing",
//       "Browser compatibility",
//       "Test documentation",
//       "Bug tracking setup",
//       "30-day support",
//     ],
//     bestFor: "MVPs, small applications",
//     isPopular: false,
//   },
//   {
//     name: "Comprehensive Testing",
//     price: "A$8,000/project",
//     description: "Full testing suite for complex applications.",
//     features: [
//       "Everything in Essential",
//       "Test automation setup",
//       "Performance testing",
//       "Security assessment",
//       "API testing",
//       "Regression test suite",
//       "90-day support",
//     ],
//     bestFor: "Enterprise applications",
//     isPopular: true,
//   },
//   {
//     name: "Continuous QA",
//     price: "A$5,000/month",
//     description: "Ongoing testing partnership for continuous delivery.",
//     features: [
//       "Dedicated QA team",
//       "Full test automation",
//       "CI/CD integration",
//       "Performance monitoring",
//       "Security scanning",
//       "Weekly reporting",
//       "Unlimited testing",
//     ],
//     bestFor: "Agile teams, SaaS products",
//     isPopular: false,
//   },
// ]

const whyChooseUsQA = [
  {
    icon: ListChecks,
    title: "Comprehensive Coverage",
    description: "Our multi-layered testing approach ensures all aspects of your software are thoroughly vetted.",
  },
  {
    icon: Users,
    title: "Dedicated QA Experts",
    description: "Experienced QA engineers who are passionate about quality and meticulous in their work.",
  },
  {
    icon: Zap,
    title: "Efficiency through Automation",
    description: "We leverage smart automation to accelerate testing cycles and improve accuracy.",
  },
  {
    icon: Lightbulb,
    title: "Proactive Defect Prevention",
    description: "Our process focuses on identifying and mitigating risks early in the development lifecycle.",
  },
]

const qaFaqs = [
  {
    id: "qa-faq1",
    question: "What types of applications can you test?",
    answer:
      "We test a wide range of applications, including web applications (SaaS, e-commerce, portals), mobile apps (iOS, Android, cross-platform), APIs, and desktop software. Our expertise covers various industries and complexities.",
  },
  {
    id: "qa-faq2",
    question: "How do you integrate QA into an agile development process?",
    answer:
      "We embed QA throughout the agile sprint cycle. This includes participating in sprint planning, daily stand-ups, and retrospectives. Testing is performed continuously on new features and regression suites are run frequently to catch issues early.",
  },
  {
    id: "qa-faq3",
    question: "What is the difference between Quality Assurance (QA) and Quality Control (QC)?",
    answer:
      "Quality Assurance (QA) is process-oriented and focuses on preventing defects by improving development and testing processes. Quality Control (QC) is product-oriented and focuses on identifying defects in the actual product through testing.",
  },
  {
    id: "qa-faq4",
    question: "Can you help set up a test automation framework from scratch?",
    answer:
      "Yes, we have extensive experience in designing and implementing test automation frameworks tailored to project needs, using tools like Selenium, Cypress, Appium, etc. This includes selecting the right tools, setting up infrastructure, and training your team.",
  },
]

export default function QualityAssurancePage() {
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
              backgroundImage: 'url(/images/training.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/40"></div>
          
          {/* Large Bold Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-orange-500/40 to-amber-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-amber-500/38 to-orange-500/40 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-orange-400/65 rounded-full bg-gradient-to-br from-orange-500/38 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-amber-400/60 bg-gradient-to-br from-amber-500/35 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-orange-400/70 to-amber-400/70 rounded-full shadow-lg shadow-orange-400/50"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-amber-400/70 to-orange-400/70 rounded-full shadow-lg shadow-amber-400/50"
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
          <ShieldCheck className="w-20 h-20 text-orange-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Quality Assurance & Testing
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Ensure flawless software delivery with comprehensive testing strategies that catch bugs early,
            improve user experience, and protect your reputation.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white group">
              <Link href="/contact?service=Quality%20Assurance%20Testing&action=qa_assessment">
                Get QA Assessment{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="#our-process">View Our Process</Link>
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
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/35 via-transparent to-amber-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-orange-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-orange-500/25 to-amber-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-amber-500/22 to-orange-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-orange-400/50 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent"
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
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/18 to-transparent"
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
            {heroStatsQA.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="inline-flex items-center justify-center w-16 h-16 bg-orange-500/10 rounded-full mb-4">
                  <stat.icon className="w-8 h-8 text-orange-400" />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-sm text-slate-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive Testing Services Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{
              backgroundImage: 'url(/images/training.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/40"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-500/18 to-amber-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-amber-500/15 to-orange-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-orange-400/50 to-amber-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-amber-400/50 to-orange-400/50 rounded-full"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Comprehensive Testing Services</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              End-to-end quality assurance solutions to ensure your software meets the highest standards.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {testingServices.map((service, idx) => (
              <motion.div
                key={service.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-orange-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <service.icon className="w-10 h-10 text-orange-400" />
                  <h3 className="text-xl font-semibold text-white">{service.title}</h3>
                </div>
                <p className="text-slate-300 mb-4">{service.description}</p>
                <ul className="space-y-2">
                  {service.items.map((item) => (
                    <li key={item} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-orange-400 mr-2 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Unite Group for QA Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/35 via-transparent to-amber-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-orange-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-orange-500/25 to-amber-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-amber-500/22 to-orange-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-orange-400/50 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/18 to-transparent"
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
              Why Choose Unite Group for QA?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Partner with us to achieve exceptional software quality and reliability.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsQA.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-teal-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QA & Testing FAQs Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/20 via-transparent to-amber-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-orange-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/15 via-transparent to-slate-700/25"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-orange-500/15 to-amber-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tl from-amber-500/12 to-orange-500/15 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-orange-400/40 to-amber-400/40 rounded-full"
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
            className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-amber-400/40 to-orange-400/40 rounded-full"
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
            <HelpCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">QA & Testing FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Answers to common questions about our quality assurance and testing services.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {qaFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-orange-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-orange-400 mr-3 flex-shrink-0" />
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

      {/* Our QA Process Section */}
      <section id="our-process" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/35 via-transparent to-amber-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-orange-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-orange-500/25 to-amber-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-amber-500/22 to-orange-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-orange-400/50 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/18 to-transparent"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our QA Process</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              A systematic approach to ensuring software quality and reliability.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {qaProcessSteps.map((step, idx) => (
              <motion.div
                key={step.number}
                className="text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-500/10 rounded-full mb-4 border-2 border-orange-500/30">
                  <span className="text-2xl font-bold text-orange-400">{step.number}</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{step.title}</h3>
                <p className="text-sm text-slate-300">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testing Tools & Technologies Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/25 via-transparent to-amber-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-orange-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-orange-500/18 to-amber-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-amber-500/15 to-orange-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-orange-400/50 to-amber-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-amber-400/50 to-orange-400/50 rounded-full"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Testing Tools & Technologies</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Industry-leading tools and frameworks for comprehensive testing solutions.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {testingTools.map((tool, idx) => (
              <motion.div
                key={tool.name}
                className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg text-center border border-slate-700/30 hover:border-orange-500/40 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="text-sm font-medium text-white mb-1">{tool.name}</div>
                <div className="text-xs text-orange-400">{tool.category}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* QA Service Packages Section */}
      {/*
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/35 via-transparent to-amber-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-orange-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/30 via-transparent to-slate-700/40"></div>
          
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-orange-500/25 to-amber-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-amber-500/22 to-orange-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.95, 1] }}
            transition={{
              duration: 32,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
              delay: 6,
            }}
          />
          
          <motion.div
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-orange-400/50 rounded-full bg-gradient-to-br from-orange-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-amber-400/45 bg-gradient-to-br from-amber-500/18 to-transparent"
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
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">QA Service Packages</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Choose the package that best fits your quality assurance needs and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {qaPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-slate-700/30 hover:border-orange-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-semibold text-white mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold text-orange-400 mb-2">{pkg.price}</div>
                  <p className="text-slate-300 text-sm">{pkg.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {pkg.features.map((feature) => (
                    <li key={feature} className="flex items-center text-slate-300 text-sm">
                      <CheckCircle size={16} className="text-orange-400 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white">
                  Get Started
                </Button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}

      {/* Free Assessment CTA Section */}
      <section className="py-20 md:py-32 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-orange-900/40 via-transparent to-amber-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-transparent to-orange-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-amber-900/35 via-transparent to-slate-700/45"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-orange-500/30 to-amber-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-amber-500/25 to-orange-500/30 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-orange-400/55 rounded-full bg-gradient-to-br from-orange-500/25 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-amber-400/50 bg-gradient-to-br from-amber-500/20 to-transparent"
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
            }}
          />
          
          {/* Floating Elements */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-orange-400/60 to-amber-400/60 rounded-full shadow-lg shadow-orange-400/40"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-amber-400/60 to-orange-400/60 rounded-full shadow-lg shadow-amber-400/40"
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
          <div className="inline-block bg-orange-500/10 text-orange-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Free Assessment
          </div>
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">
            Get Your Free QA Assessment Today
          </h2>
          <p className="text-lg text-slate-300 mb-10">
            Discover how our quality assurance services can improve your software and save you time and costs.
          </p>
          <Button size="lg" asChild className="bg-orange-500 hover:bg-orange-600 text-white group text-lg px-10 py-7">
            <Link href="/contact?service=Quality%20Assurance%20%26%20Testing">
              Get Started{" "}
              <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  )
}
