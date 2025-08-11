"use client"

import { motion } from "framer-motion"
import Image from "next/image"
import Link from "next/link"
import {
  AppWindow,
  Code,
  Smartphone,
  Server,
  Cloud,
  CheckCircle,
  ArrowRight,
  DollarSignIcon,
  Search,
  Palette,
  Zap,
  Shield,
  Rocket,
  RefreshCw,
  Lightbulb,
  Users,
  HelpCircle,
  Briefcase,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const devServices = [
  {
    title: "Web Applications",
    icon: AppWindow,
    description: "Scalable, responsive web applications built with modern frameworks and best practices.",
    items: [
      "Progressive Web Apps (PWA)",
      "Single Page Applications (SPA)",
      "E-commerce Platforms",
      "SaaS Solutions",
      "Enterprise Portals",
    ],
  },
  {
    title: "Mobile Development",
    icon: Smartphone,
    description: "Native and cross-platform mobile apps that deliver exceptional user experiences.",
    items: [
      "iOS & Android Apps",
      "Cross-platform Solutions",
      "Offline Functionality",
      "Push Notifications",
      "App Store Deployment",
    ],
  },
  {
    title: "Backend & APIs",
    icon: Server,
    description: "Robust backend systems and APIs that power your applications.",
    items: [
      "RESTful & GraphQL APIs",
      "Microservices Architecture",
      "Database Design",
      "Real-time Features",
      "Third-party Integrations",
    ],
  },
  {
    title: "Cloud Solutions",
    icon: Cloud,
    description: "Cloud-native applications with auto-scaling and high availability.",
    items: [
      "Cloud Migration",
      "Serverless Architecture",
      "DevOps Implementation",
      "Container Orchestration",
      "CI/CD Pipelines",
    ],
  },
]

const techStackTabs = [
  {
    value: "frontend",
    label: "Frontend",
    icon: Palette,
    techs: [
      { name: "React/Next.js", expertise: "Expert" },
      { name: "TypeScript", expertise: "Expert" },
      { name: "Tailwind CSS", expertise: "Expert" },
      { name: "Vue.js", expertise: "Advanced" },
      { name: "Angular", expertise: "Advanced" },
    ],
  },
  {
    value: "backend",
    label: "Backend",
    icon: Server,
    techs: [
      { name: "Node.js/Express", expertise: "Expert" },
      { name: "Python/Django", expertise: "Expert" },
      { name: "PostgreSQL/MongoDB", expertise: "Expert" },
      { name: "Docker/Kubernetes", expertise: "Advanced" },
      { name: "GraphQL", expertise: "Advanced" },
    ],
  },
  {
    value: "mobile",
    label: "Mobile",
    icon: Smartphone,
    techs: [
      { name: "React Native", expertise: "Expert" },
      { name: "Swift (iOS)", expertise: "Advanced" },
      { name: "Kotlin (Android)", expertise: "Advanced" },
      { name: "Flutter", expertise: "Proficient" },
      { name: "Firebase", expertise: "Expert" },
    ],
  },
  {
    value: "cloud",
    label: "Cloud & DevOps",
    icon: Cloud,
    techs: [
      { name: "AWS/Azure/GCP", expertise: "Expert" },
      { name: "Terraform/Ansible", expertise: "Advanced" },
      { name: "Jenkins/GitLab CI", expertise: "Expert" },
      { name: "Serverless Framework", expertise: "Advanced" },
      { name: "Prometheus/Grafana", expertise: "Proficient" },
    ],
  },
]

// const pricingPackages = [
//   {
//     name: "Starter",
//     price: "A$5,000+",
//     duration: "4-6 weeks",
//     description: "Perfect for MVPs and small projects.",
//     features: [
//       "Single platform (web or mobile)",
//       "Core features implementation",
//       "Basic UI/UX design",
//       "Cloud deployment",
//       "30-day support",
//     ],
//     ctaText: "Get Started",
//     isRecommended: false,
//   },
//   {
//     name: "Professional",
//     price: "A$15,000+",
//     duration: "8-12 weeks",
//     description: "Ideal for growing businesses.",
//     features: [
//       "Multi-platform support",
//       "Advanced features",
//       "Custom UI/UX design",
//       "API integrations",
//       "Performance optimization",
//       "90-day support",
//     ],
//     ctaText: "Get Started",
//     isRecommended: true,
//   },
//   {
//     name: "Enterprise",
//     price: "Custom",
//     duration: "3-6 months+",
//     description: "Complete digital transformation.",
//     features: [
//       "Full-scale applications",
//       "Microservices architecture",
//       "Enterprise integrations",
//       "Advanced security",
//       "Dedicated team",
//       "12-month support",
//     ],
//     ctaText: "Contact Sales",
//     isRecommended: false,
//   },
// ]

const devProcessSteps = [
  {
    number: "01",
    title: "Discovery",
    duration: "1-2 weeks",
    description: "Requirements gathering and technical planning.",
    icon: Search,
  },
  {
    number: "02",
    title: "Design",
    duration: "2-3 weeks",
    description: "UI/UX design and architecture planning.",
    icon: Palette,
  },
  {
    number: "03",
    title: "Development",
    duration: "4-12 weeks",
    description: "Agile development with weekly demos.",
    icon: Code,
  },
  {
    number: "04",
    title: "Testing",
    duration: "1-2 weeks",
    description: "Comprehensive testing and quality assurance.",
    icon: Shield,
  },
  {
    number: "05",
    title: "Deployment",
    duration: "1 week",
    description: "Launch preparation and go-live support.",
    icon: Rocket,
  },
  {
    number: "06",
    title: "Support",
    duration: "Ongoing",
    description: "Maintenance and continuous improvement.",
    icon: RefreshCw,
  },
]

const whyChooseUsDev = [
  {
    icon: Lightbulb,
    title: "Innovative Solutions",
    description:
      "We leverage the latest technologies to build future-proof applications that solve real-world problems.",
  },
  {
    icon: Users,
    title: "Client-Centric Approach",
    description:
      "Your vision is our priority. We collaborate closely with you at every stage to ensure we meet your goals.",
  },
  {
    icon: CheckCircle,
    title: "Quality & Reliability",
    description:
      "Our rigorous testing and quality assurance processes ensure robust, secure, and high-performing software.",
  },
  {
    icon: Briefcase,
    title: "Experienced Team",
    description:
      "Our team of skilled developers, designers, and strategists bring years of experience to your project.",
  },
]

const devFaqs = [
  {
    id: "dev-faq1",
    question: "What is your typical development process?",
    answer:
      "We follow an agile development methodology, which includes iterative sprints, regular communication, and continuous feedback. Our process typically involves discovery, design, development, testing, deployment, and ongoing support.",
  },
  {
    id: "dev-faq2",
    question: "How much does custom software development cost?",
    answer:
      "The cost varies greatly depending on the project's complexity, features, and timeline. We offer flexible pricing packages starting from A$5,000 for MVPs. We provide detailed quotes after an initial consultation and discovery phase.",
  },
  {
    id: "dev-faq3",
    question: "How long will it take to develop my software?",
    answer:
      "Timelines depend on the project scope. A simple MVP might take 4-6 weeks, while a complex enterprise application could take 3-6 months or longer. We provide estimated timelines after understanding your requirements.",
  },
  {
    id: "dev-faq4",
    question: "Do you provide post-launch support and maintenance?",
    answer:
      "Yes, all our development packages include a period of post-launch support. We also offer ongoing maintenance and support plans to ensure your software continues to perform optimally and evolves with your business needs.",
  },
]

export default function CustomSoftwareDevelopmentPage() {
  return (
    <div className="bg-slate-950 text-slate-200">
      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-purple-900/30 to-slate-950 relative overflow-hidden"
      >
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/45 via-transparent to-violet-900/50"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/55 via-transparent to-purple-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/40 via-transparent to-slate-700/50"></div>
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-700/45 via-transparent to-purple-800/40"></div>
          
          {/* Large Bold Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-purple-500/40 to-violet-500/38 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-violet-500/38 to-purple-500/40 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-purple-400/65 rounded-full bg-gradient-to-br from-purple-500/38 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-violet-400/60 bg-gradient-to-br from-violet-500/35 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-purple-400/70 to-violet-400/70 rounded-full shadow-lg shadow-purple-400/50"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-violet-400/70 to-purple-400/70 rounded-full shadow-lg shadow-violet-400/50"
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
          <AppWindow className="w-20 h-20 text-purple-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Custom Software Development
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Transform your ideas into powerful software solutions. We build scalable, secure applications that drive
            business growth and deliver exceptional user experiences.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-purple-500 hover:bg-purple-600 text-white group">
              <Link href="/contact?service=Custom%20Software%20Development">
                Start Your Project{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="/case-studies">View Our Portfolio</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Our Development Services Section */}
      <section id="our-services" className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/35 via-transparent to-violet-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-purple-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 right-1/6 w-72 h-72 bg-gradient-to-br from-purple-500/25 to-violet-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, -25, 0], y: [0, 20, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 left-1/6 w-80 h-80 bg-gradient-to-tl from-violet-500/22 to-purple-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 left-12 w-18 h-18 border-2 border-purple-400/50 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent"
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
            className="absolute bottom-1/6 right-12 w-14 h-14 border-2 border-violet-400/45 bg-gradient-to-br from-violet-500/18 to-transparent"
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
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our Development Services</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              End-to-end software development solutions tailored to your business needs.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {devServices.map((service, idx) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 shadow-lg h-full hover:border-purple-500/60 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <service.icon className="w-10 h-10 text-purple-400" />
                      <CardTitle className="text-2xl text-white">{service.title}</CardTitle>
                    </div>
                    <CardDescription className="text-slate-300">{service.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.items.map((item) => (
                        <li key={item} className="flex items-center text-slate-300 text-sm">
                          <CheckCircle size={16} className="text-purple-400 mr-2 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/25 via-transparent to-violet-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-purple-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/18 to-violet-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-violet-500/15 to-purple-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-purple-400/50 to-violet-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-violet-400/50 to-purple-400/50 rounded-full"
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
        
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-12 md:mb-16">
            <Code className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our Technology Stack</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Cutting-edge technologies to build modern, scalable applications.
            </p>
          </div>
          <Tabs defaultValue="frontend" className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 bg-slate-800/80 backdrop-blur-sm p-1 rounded-lg border border-slate-700/60">
              {techStackTabs.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="flex items-center justify-center data-[state=active]:bg-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg text-slate-300 hover:bg-slate-700/50 transition-all duration-200 py-2 px-3 text-sm font-medium rounded-md mt-[-3px] ml-[-3px]"
                >
                  <tab.icon className="w-5 h-5 mr-2 inline-block" /> {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {techStackTabs.map((tab) => (
              <TabsContent key={tab.value} value={tab.value} className="mt-8">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {tab.techs.map((tech, idx) => (
                    <motion.div
                      key={tech.name}
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                      viewport={{ once: true, amount: 0.1 }}
                      className="bg-slate-800/60 backdrop-blur-sm p-4 rounded-lg shadow-md text-center border border-slate-700/50 hover:border-purple-500/40 transition-colors"
                    >
                      <h4 className="font-semibold text-white text-md mb-1">{tech.name}</h4>
                      <p className="text-xs text-purple-300">{tech.expertise}</p>
                    </motion.div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* Why Choose Us for Software Development Section */}
      <section className="py-16 md:py-24 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/35 via-transparent to-violet-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/45 via-transparent to-purple-900/35"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/30 via-transparent to-slate-700/40"></div>
          
          {/* Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-purple-500/25 to-violet-500/22 rounded-full filter blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.1, 1] }}
            transition={{
              duration: 28,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-violet-500/22 to-purple-500/25 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-12 w-20 h-20 border-2 border-purple-400/50 rounded-full bg-gradient-to-br from-purple-500/20 to-transparent"
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
            className="absolute bottom-1/6 left-12 w-16 h-16 border-2 border-violet-400/45 bg-gradient-to-br from-violet-500/18 to-transparent"
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
            <Briefcase className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
              Why Choose Unite Group for Software Development?
            </h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Partner with us to build software that not only meets your needs but exceeds your expectations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsDev.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800/50 backdrop-blur-sm p-6 rounded-lg shadow-xl text-center border border-slate-700/30 hover:border-purple-500/40 transition-colors"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-purple-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-300 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Software Development FAQs Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/20 via-transparent to-violet-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/30 via-transparent to-purple-900/20"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/15 via-transparent to-slate-700/25"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 right-1/4 w-56 h-56 bg-gradient-to-br from-purple-500/15 to-violet-500/12 rounded-full filter blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 left-1/4 w-64 h-64 bg-gradient-to-tl from-violet-500/12 to-purple-500/15 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-purple-400/40 to-violet-400/40 rounded-full"
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
            className="absolute bottom-1/4 right-1/3 w-1 h-1 bg-gradient-to-r from-violet-400/40 to-purple-400/40 rounded-full"
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
            <HelpCircle className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Software Development FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Answers to common questions about our custom software development services.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {devFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 backdrop-blur-sm border-slate-700/80 rounded-lg mb-3 px-2 hover:border-purple-500/30 transition-colors"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-purple-400 mr-3 flex-shrink-0" />
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

  ÷

      {/* Development Process Section */}
      <section className="py-16 md:py-24 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/25 via-transparent to-violet-900/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/35 via-transparent to-purple-900/25"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/20 via-transparent to-slate-700/30"></div>
          
          {/* Subtle Animated Orbs */}
          <motion.div
            className="absolute top-1/3 left-1/4 w-64 h-64 bg-gradient-to-br from-purple-500/18 to-violet-500/15 rounded-full filter blur-3xl"
            animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/3 right-1/4 w-72 h-72 bg-gradient-to-tl from-violet-500/15 to-purple-500/18 rounded-full filter blur-3xl"
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
            className="absolute top-1/4 right-1/3 w-2 h-2 bg-gradient-to-r from-purple-400/50 to-violet-400/50 rounded-full"
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
            className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-gradient-to-r from-violet-400/50 to-purple-400/50 rounded-full"
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
            <Zap className="w-12 h-12 text-purple-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our Development Process</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Agile methodology with continuous delivery and transparent communication.
            </p>
          </div>
          <div className="relative">
            {/* Desktop Timeline Line */}
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500/30 to-transparent transform -translate-y-1/2"></div>
            <div className="grid md:grid-cols-6 gap-x-8 gap-y-12">
              {devProcessSteps.map((step, idx) => (
                <motion.div
                  key={step.title}
                  className="text-center relative md:pt-8"
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  {/* Desktop Timeline Dot */}
                  <div className="hidden md:block absolute top-1/2 left-1/2 w-4 h-4 bg-purple-500 rounded-full shadow-md z-10 transform -translate-x-1/2 -translate-y-1/2 border-2 border-slate-950"></div>
                  <div className="md:absolute md:-top-2 md:left-1/2 md:transform md:-translate-x-1/2 mb-4 md:mb-0">
                    <div className="p-3 bg-slate-800/80 backdrop-blur-sm border border-slate-700/60 rounded-full inline-block mb-3 md:mb-0 hover:border-purple-500/50 transition-colors">
                      <step.icon className="w-8 h-8 text-purple-400" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                  <p className="text-xs text-purple-300 mb-1">{step.duration}</p>
                  <p className="text-sm text-slate-300">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 md:py-32 bg-slate-900 relative overflow-hidden">
        {/* Background Patterns */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Multi-layered Bold Gradient Backgrounds */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"></div>
          <div className="absolute inset-0 bg-gradient-to-tl from-purple-900/40 via-transparent to-violet-900/45"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800/50 via-transparent to-purple-900/40"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-violet-900/35 via-transparent to-slate-700/45"></div>
          
          {/* Large Animated Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/6 w-96 h-96 bg-gradient-to-br from-purple-500/30 to-violet-500/25 rounded-full filter blur-3xl"
            animate={{ x: [0, 35, 0], y: [0, -30, 0], scale: [1, 1.15, 1] }}
            transition={{
              duration: 30,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
          
          <motion.div
            className="absolute bottom-1/4 right-1/6 w-80 h-80 bg-gradient-to-tl from-violet-500/25 to-purple-500/30 rounded-full filter blur-3xl"
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
            className="absolute top-1/6 right-16 w-24 h-24 border-2 border-purple-400/55 rounded-full bg-gradient-to-br from-purple-500/25 to-transparent"
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
            className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-violet-400/50 bg-gradient-to-br from-violet-500/20 to-transparent"
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
            className="absolute top-1/3 right-1/4 w-3 h-3 bg-gradient-to-r from-purple-400/60 to-violet-400/60 rounded-full shadow-lg shadow-purple-400/40"
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
            className="absolute bottom-1/3 left-1/4 w-2.5 h-2.5 bg-gradient-to-r from-violet-400/60 to-purple-400/60 rounded-full shadow-lg shadow-violet-400/40"
            animate={{ 
              y: [0, 25, 0],
              opacity: [0.8, 1, 0.8],
              scale: [1, 0.9, 1]
            }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "easeInOut",
            }}
          />
        </div>
        
        <div className="container mx-auto max-w-screen-md px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-6">Ready to Build Something Amazing?</h2>
          <p className="text-lg text-slate-300 mb-10">
            Let's discuss your project and create a custom solution that exceeds expectations.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-purple-500 hover:bg-purple-600 text-white group text-lg px-8 py-6">
              <Link href="/contact?service=Custom%20Software%20Development">
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
              <Link href="/contact?service=Custom%20Software%20Development&action=schedule_consultation">
                Schedule Consultation
              </Link>
            </Button>
          </div>
          <p className="mt-8 text-sm text-slate-400">
            🚀 Fast delivery • 🛡️ Secure by design • 📱 Mobile-first approach
          </p>
        </div>
      </section>
    </div>
  )
}
