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

const engagementModels = [
  {
    name: "Strategic Sprint",
    price: "A$15,000+",
    duration: "2-4 weeks",
    description: "Rapid strategy development for specific challenges.",
    features: [
      "Focused problem-solving",
      "Quick market analysis",
      "Action plan development",
      "Executive workshop",
      "Implementation roadmap",
    ],
    idealFor: "Urgent strategic decisions",
    isPopular: false,
  },
  {
    name: "Transformation Program",
    price: "A$50,000+",
    duration: "3-6 months",
    description: "Comprehensive business transformation initiative.",
    features: [
      "Full strategic assessment",
      "Multi-phase planning",
      "Change management",
      "Team enablement",
      "Progress monitoring",
      "Executive coaching",
    ],
    idealFor: "Major business pivots",
    isPopular: true,
  },
  {
    name: "Strategic Partnership",
    price: "Custom",
    duration: "12+ months",
    description: "Ongoing strategic advisory and implementation support.",
    features: [
      "Dedicated strategy team",
      "Quarterly planning cycles",
      "Board advisory services",
      "Continuous optimization",
      "Market intelligence",
      "C-suite mentoring",
    ],
    idealFor: "Long-term growth ambitions",
    isPopular: false,
  },
]

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
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-blue-900/30 to-slate-950 relative"
      >
        <div className="absolute inset-0 opacity-10">
          <Image src="/abstract-strategy-network.png" alt="Abstract Strategy Network" layout="fill" objectFit="cover" />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <Briefcase className="w-20 h-20 text-blue-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">
            Business Strategy Consulting
          </h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Transform your vision into reality with data-driven strategies. We help ambitious companies navigate
            complexity, seize opportunities, and achieve sustainable growth.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-blue-500 hover:bg-blue-600 text-white group">
              <Link href="/contact?service=Business%20Strategy%20Consulting">
                Schedule Strategy Session{" "}
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
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {heroStats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <stat.icon className="w-10 h-10 text-blue-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-300 mt-1 text-md">{stat.label}</div>
                <div className="text-slate-500 text-xs">{stat.subLabel}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Solutions Section */}
      <section id="our-approach" className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Strategic Solutions</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Comprehensive strategies tailored to your unique challenges and opportunities.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {strategicSolutions.map((solution, idx) => (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg h-full hover:border-blue-500/60 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <solution.icon className="w-10 h-10 text-blue-400" />
                      <CardTitle className="text-2xl text-white">{solution.title}</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400">{solution.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {solution.items.map((item) => (
                        <li key={item} className="flex items-center text-slate-300 text-sm">
                          <CheckCircle size={16} className="text-blue-400 mr-2 flex-shrink-0" />
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

      {/* The Unite Group Advantage Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <TargetIcon className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">The Unite Group Advantage</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">What sets our strategic consulting apart.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {uniteAdvantage.map((advantage, idx) => (
              <motion.div
                key={advantage.title}
                className="bg-slate-800 p-6 rounded-lg shadow-lg flex items-start space-x-4"
                initial={{ opacity: 0, x: idx % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="flex-shrink-0 bg-blue-500/10 p-3 rounded-lg mt-1">
                  <advantage.icon className="w-7 h-7 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white mb-1">{advantage.title}</h3>
                  <p className="text-slate-400 text-sm">{advantage.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategy Consulting FAQs Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Strategy Consulting FAQs</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">
              Common questions about our business strategy consulting services.
            </p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {strategyFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 border-slate-700/80 rounded-lg mb-3 px-2"
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
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Layers className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Proven Methodologies</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              World-class frameworks adapted to your specific context for optimal results.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {methodologies.map((method, idx) => (
              <motion.div
                key={method.phase}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <method.icon className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-3">{method.phase}</h3>
                <ul className="space-y-1">
                  {method.tools.map((tool) => (
                    <li key={tool} className="text-sm text-slate-400">
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Handshake className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Engagement Models</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Flexible engagement options to match your needs and timeline.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {engagementModels.map((model, idx) => (
              <motion.div
                key={model.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="flex"
              >
                <Card
                  className={`w-full flex flex-col bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl relative overflow-hidden ${model.isPopular ? "border-2 border-blue-500 shadow-blue-500/30" : "border-slate-700"}`}
                >
                  {model.isPopular && (
                    <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl font-semibold text-white mb-1">{model.name}</CardTitle>
                    <p className="text-3xl font-bold text-blue-300 mb-1">{model.price}</p>
                    <p className="text-sm text-slate-400 mb-2">{model.duration}</p>
                    <CardDescription className="text-slate-400 text-sm min-h-[40px]">
                      {model.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {model.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-slate-300">
                          <CheckCircle size={18} className="text-blue-400 mr-2.5 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500 mb-4">Ideal for: {model.idealFor}</p>
                    <Button
                      asChild
                      className={`w-full font-semibold text-lg py-3 mt-auto ${model.isPopular ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-100"}`}
                    >
                      <Link href={`/contact?service=Business%20Strategy%20Consulting&model=${model.name}`}>
                        Learn More
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
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
            Let's create a strategy that turns your vision into measurable success.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="xl" asChild className="bg-blue-500 hover:bg-blue-600 text-white group text-lg px-8 py-6">
              <Link href="/contact?service=Business%20Strategy%20Consulting">
                Book Strategy Session{" "}
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="xl"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white group text-lg px-8 py-6"
            >
              <Link href="/#case-studies">View Success Stories</Link>
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
