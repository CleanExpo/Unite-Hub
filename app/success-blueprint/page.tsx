"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  CheckCircle,
  TrendingUp,
  Users,
  Rocket,
  ShieldCheck,
  Target,
  GitFork,
  Settings2,
  ClipboardCheck,
  Layers,
  HeartHandshake,
  Megaphone,
  RefreshCw,
  DatabaseZap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { motion } from "framer-motion"

export default function SuccessBlueprintPage() {
  const blueprintSteps = [
    {
      id: 1,
      title: "Discovery & Strategic Alignment",
      description:
        "Our journey begins with an immersive discovery phase. We conduct in-depth workshops, stakeholder interviews, and market analysis to thoroughly understand your business objectives, operational challenges, and competitive landscape. The key outcome is a clearly defined project scope, strategic roadmap, and success metrics, ensuring complete alignment before any development begins.",
      icon: Target,
      image: "/strategic-planning-meeting.png",
    },
    {
      id: 2,
      title: "Solution Architecture & Prototyping",
      description:
        "Leveraging insights from the discovery phase, our expert architects design a robust, scalable, and future-proof solution. We create detailed technical specifications, data models, and user flow diagrams. Interactive prototypes and wireframes are developed to provide a tangible preview of the user experience, allowing for early feedback and iterative refinement.",
      icon: Layers,
      image: "/ui-ux-design-prototype.png",
    },
    {
      id: 3,
      title: "Agile Development & Iterative Implementation",
      description:
        "We embrace agile methodologies (Scrum/Kanban) to develop your solution in manageable sprints. This iterative approach fosters flexibility, transparency through regular demos, and continuous collaboration. Our development teams prioritize clean code, robust functionality, and adherence to best practices, ensuring a high-quality build throughout the lifecycle.",
      icon: GitFork,
      image: "/agile-team-collaboration.png",
    },
    {
      id: 4,
      title: "Comprehensive Quality Assurance & Testing",
      description:
        "Quality is paramount. Our dedicated QA team implements a multi-layered testing strategy, encompassing functional, integration, performance, security, and usability testing. We utilize both manual and automated testing tools to identify and rectify issues proactively, ensuring the solution is reliable, secure, and performs optimally under all conditions.",
      icon: ClipboardCheck,
      image: "/quality-assurance-testing.png",
    },
    {
      id: 5,
      title: "Seamless Deployment & Go-Live Orchestration",
      description:
        "We meticulously plan and execute the deployment process, whether to cloud environments (AWS, Azure, GCP) or on-premise infrastructure. Our team manages data migration, system configuration, and final checks to ensure a smooth transition. Comprehensive go-live support is provided to address any immediate concerns and ensure operational stability from day one.",
      icon: Settings2,
      image: "/server-deployment-dashboard.png",
    },
    {
      id: 6,
      title: "Continuous Optimization & Proactive Support",
      description:
        "Our commitment extends beyond launch. We offer tailored ongoing support packages, proactive system monitoring, and performance analytics. We work with you to identify opportunities for optimization, feature enhancements, and scaling the solution to meet evolving business needs, ensuring sustained value and long-term success.",
      icon: RefreshCw,
      image: "/customer-support-team-collaboration.png",
    },
  ]

  const guidingPrinciples = [
    {
      title: "Client-Centricity",
      description: "Your success is our primary driver. We tailor every solution to your unique needs and goals.",
      icon: HeartHandshake,
    },
    {
      title: "Transparent Communication",
      description: "Open, honest, and frequent communication is maintained throughout the project lifecycle.",
      icon: Megaphone,
    },
    {
      title: "Agile Adaptability",
      description: "We embrace change and adapt our approach to meet evolving requirements and market dynamics.",
      icon: GitFork,
    },
    {
      title: "Uncompromising Quality",
      description: "We are committed to delivering excellence and robust solutions that stand the test of time.",
      icon: ShieldCheck,
    },
    {
      title: "Data-Driven Decisions",
      description: "We leverage data and analytics to inform strategies and optimize outcomes.",
      icon: DatabaseZap,
    },
    {
      title: "Collaborative Partnership",
      description: "We work as an extension of your team, fostering a true partnership for shared success.",
      icon: Users,
    },
  ]

  const toolsAndMethodologies = [
    "Agile (Scrum, Kanban)",
    "JIRA & Confluence",
    "Figma & Adobe XD",
    "Git & CI/CD Pipelines",
    "Automated Testing Frameworks (Selenium, Cypress)",
    "Cloud Platforms (AWS, Azure, GCP)",
    "DevOps Practices",
    "User Story Mapping",
    "Regular Stakeholder Reviews",
  ]

  return (
    <div className="bg-slate-950 text-slate-50">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{
              backgroundImage: 'url(/images/home.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/40"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-cyan-500/40 to-teal-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/38 to-cyan-500/40 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-cyan-400/65 rounded-full bg-gradient-to-br from-cyan-500/25 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-teal-400/60 bg-gradient-to-br from-teal-500/20 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-cyan-400/70 to-teal-400/70 rounded-full shadow-lg shadow-cyan-400/40"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/70 to-cyan-400/70 rounded-full shadow-lg shadow-teal-400/40"
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
        
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center">
            <motion.h1 
              className="text-4xl md:text-6xl font-bold text-white mb-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Success Blueprint
            </motion.h1>
            <motion.p 
              className="text-xl md:text-2xl text-slate-300 mb-8 max-w-4xl mx-auto"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Our proven methodology for delivering exceptional results and driving sustainable business growth
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              <Button size="lg" asChild className="bg-cyan-500 hover:bg-cyan-600 text-white text-lg px-8 py-6">
                <Link href="/contact">Get Started</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Blueprint Overview Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-cyan-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/18 to-teal-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/15 to-cyan-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-cyan-400/50 to-teal-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/50 to-cyan-400/50 rounded-full"
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
            <motion.h2 
              className="text-3xl md:text-4xl font-semibold text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Our Proven Success Framework
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-lg text-slate-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              A systematic approach that has delivered exceptional results across diverse industries and project types.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blueprintSteps.map((step, idx) => (
              <motion.div
                key={step.id}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl border border-slate-700/30 hover:border-cyan-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center border border-cyan-500/40">
                    <step.icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-white">{step.title}</h3>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Our Guiding Principles Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-95"
            style={{
              backgroundImage: 'url(/images/home.png)'
            }}
          ></div>
          
          {/* Minimal overlay for text readability */}
          <div className="absolute inset-0 bg-slate-950/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-cyan-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-cyan-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-cyan-400/50 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent"
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
            <motion.h2 
              className="text-3xl md:text-4xl font-semibold text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Our Guiding Principles
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-lg text-slate-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              The core values that drive our success and ensure exceptional outcomes for every client.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guidingPrinciples.map((principle, idx) => (
              <motion.div
                key={principle.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-cyan-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <principle.icon className="w-10 h-10 text-cyan-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{principle.title}</h3>
                <p className="text-slate-300 text-sm">{principle.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tools & Methodologies Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/25 via-transparent to-teal-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-cyan-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-cyan-500/18 to-teal-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-teal-500/15 to-cyan-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-cyan-400/50 to-teal-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-teal-400/50 to-cyan-400/50 rounded-full"
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
            <motion.h2 
              className="text-3xl md:text-4xl font-semibold text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Tools & Methodologies
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-lg text-slate-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Industry-leading tools and proven methodologies that power our success framework.
            </motion.p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { name: "Agile/Scrum", icon: GitFork, description: "Iterative development with regular feedback cycles" },
              { name: "JIRA", icon: ClipboardCheck, description: "Project management and issue tracking" },
              { name: "Figma", icon: Layers, description: "Design collaboration and prototyping" },
              { name: "Git", icon: GitFork, description: "Version control and collaboration" },
              { name: "Docker", icon: Settings2, description: "Containerization and deployment" },
              { name: "AWS/Azure", icon: DatabaseZap, description: "Cloud infrastructure and services" },
              { name: "Postman", icon: ClipboardCheck, description: "API testing and documentation" },
              { name: "Jenkins", icon: RefreshCw, description: "CI/CD automation" },
            ].map((tool, idx) => (
              <motion.div
                key={tool.name}
                className="bg-slate-800/50 backdrop-blur-sm p-4 rounded-lg text-center border border-slate-700/30 hover:border-cyan-500/40 transition-colors"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.05 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <tool.icon className="w-8 h-8 text-cyan-400 mx-auto mb-3" />
                <h4 className="font-semibold text-white text-sm mb-1">{tool.name}</h4>
                <p className="text-xs text-slate-400">{tool.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study Spotlight Section */}
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
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-cyan-500/25 to-teal-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-teal-500/22 to-cyan-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-cyan-400/50 rounded-full bg-gradient-to-br from-cyan-500/20 to-transparent"
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
            <motion.h2 
              className="text-3xl md:text-4xl font-semibold text-white mb-4"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              Case Study Spotlight
            </motion.h2>
            <motion.p 
              className="max-w-2xl mx-auto text-lg text-slate-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true, amount: 0.2 }}
            >
              See how our Success Blueprint delivered exceptional results for a leading healthcare provider.
            </motion.p>
          </div>
          <motion.div
            className="bg-slate-800/50 backdrop-blur-sm p-8 rounded-lg shadow-xl border border-slate-700/30 hover:border-cyan-500/40 transition-colors"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-semibold text-white mb-4">HealthPlus Clinics Digital Transformation</h3>
                <p className="text-slate-300 mb-6">
                  A comprehensive digital transformation project that modernized patient care systems and improved operational efficiency.
                </p>
                <div className="space-y-3">
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
                    <span>40% reduction in patient wait times</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
                    <span>60% improvement in staff productivity</span>
                  </div>
                  <div className="flex items-center text-slate-300">
                    <CheckCircle className="w-5 h-5 text-cyan-400 mr-3 flex-shrink-0" />
                    <span>99.9% system uptime achieved</span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-24 h-24 bg-cyan-500/20 rounded-full mb-4 border border-cyan-500/40">
                  <TrendingUp className="w-12 h-12 text-cyan-400" />
                </div>
                <h4 className="text-xl font-semibold text-white mb-2">Project Success Metrics</h4>
                <p className="text-slate-300 text-sm">
                  Delivered on time and within budget, exceeding all performance expectations.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-cyan-900/40 via-transparent to-teal-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-transparent to-cyan-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-teal-900/35 via-transparent to-slate-700/45"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-cyan-500/30 to-teal-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-teal-500/25 to-cyan-500/30 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-cyan-400/55 rounded-full bg-gradient-to-br from-cyan-500/25 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-cyan-400/60 to-teal-400/60 rounded-full shadow-lg shadow-cyan-400/40"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-teal-400/60 to-cyan-400/60 rounded-full shadow-lg shadow-teal-400/40"
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
          <div className="inline-block bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6">
            Ready to Succeed?
          </div>
          <motion.h2 
            className="text-3xl md:text-4xl font-semibold text-white mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            Start Your Success Journey Today
          </motion.h2>
          <motion.p 
            className="text-lg text-slate-300 mb-10"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            Let our proven Success Blueprint guide your project to exceptional results and sustainable growth.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, amount: 0.2 }}
          >
            <Button size="lg" asChild className="bg-cyan-500 hover:bg-cyan-600 text-white group text-lg px-10 py-7">
              <Link href="/contact">
                Get Started{" "}
                <Rocket className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
