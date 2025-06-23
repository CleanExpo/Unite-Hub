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

const seoPackages = [
  {
    name: "Local Business",
    price: "A$1,500/month",
    description: "Perfect for local businesses targeting specific geographic areas.",
    features: [
      "Technical SEO optimization",
      "Local SEO setup",
      "10 optimized pages",
      "Monthly reporting",
      "Google My Business management",
    ],
    idealFor: "Local businesses, service providers",
    isPopular: false,
  },
  {
    name: "Growth",
    price: "A$3,500/month",
    description: "Comprehensive SEO for businesses ready to scale.",
    features: [
      "Everything in Local",
      "Content strategy & creation",
      "Link building campaigns",
      "25 optimized pages",
      "Competitor analysis",
      "Bi-weekly calls",
    ],
    idealFor: "Growing businesses, e-commerce",
    isPopular: true,
  },
  {
    name: "Enterprise",
    price: "A$7,500/month",
    description: "Full-service SEO for market leaders.",
    features: [
      "Everything in Growth",
      "Dedicated SEO team",
      "Advanced technical SEO",
      "Unlimited pages",
      "International SEO",
      "Weekly strategy calls",
    ],
    idealFor: "Large businesses, multi-location",
    isPopular: false,
  },
]

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
        className="py-20 md:py-32 bg-gradient-to-br from-slate-900 via-green-900/30 to-slate-950 relative"
      >
        <div className="absolute inset-0 opacity-10">
          <Image src="/abstract-seo-graph.png" alt="Abstract SEO Graph" layout="fill" objectFit="cover" />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <TargetIcon className="w-20 h-20 text-green-400 mx-auto mb-8" />
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6">Strategic SEO Services</h1>
          <p className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10">
            Dominate search results with data-driven SEO strategies. We don't just improve rankings – we transform your
            organic presence into a revenue-generating machine.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-green-500 hover:bg-green-600 text-white group">
              <Link href="/contact?service=Strategic%20SEO%20Services&action=free_audit">
                Get Free SEO Audit{" "}
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white"
            >
              <Link href="/#case-studies">View Case Studies</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      {/* Stats Section */}
      <section className="py-16 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={stat.label}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.5 }}
              >
                <stat.icon className="w-10 h-10 text-green-400 mx-auto mb-3" />
                <div className="text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-slate-400 mt-1 text-sm">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comprehensive SEO Solutions Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Comprehensive SEO Solutions</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Every aspect of SEO covered to ensure maximum visibility and growth.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            {seoSolutions.map((solution, idx) => (
              <motion.div
                key={solution.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg h-full hover:border-green-500/60 transition-colors">
                  <CardHeader>
                    <div className="flex items-center gap-4 mb-2">
                      <solution.icon className="w-10 h-10 text-green-400" />
                      <CardTitle className="text-2xl text-white">{solution.title}</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400">{solution.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {solution.items.map((item) => (
                        <li key={item} className="flex items-center text-slate-300 text-sm">
                          <CheckCircle size={16} className="text-green-400 mr-2 flex-shrink-0" />
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

      {/* Why Choose Unite Group for SEO Section */}
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <Briefcase className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Why Choose Unite Group for Your SEO?</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Achieve sustainable organic growth with a trusted SEO partner.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUsSeo.map((item, idx) => (
              <motion.div
                key={item.title}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-green-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-slate-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO FAQs Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <HelpCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">SEO Frequently Asked Questions</h2>
            <p className="max-w-xl mx-auto text-lg text-slate-300">Your SEO questions, answered by our experts.</p>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {seoFaqs.map((faq) => (
              <AccordionItem
                key={faq.id}
                value={faq.id}
                className="bg-slate-800/50 border-slate-700/80 rounded-lg mb-3 px-2"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4 px-4 text-base font-medium text-slate-100">
                  <div className="flex items-center">
                    <HelpCircle size={20} className="text-green-400 mr-3 flex-shrink-0" />
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
      <section className="py-16 md:py-24 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <BarChart className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">Our SEO Process</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              A proven methodology that delivers consistent, measurable results.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {seoProcessSteps.map((step, idx) => (
              <motion.div
                key={step.title}
                className="bg-slate-800 p-6 rounded-lg shadow-xl text-center flex flex-col items-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <div className="relative w-16 h-16 flex items-center justify-center bg-slate-700 text-green-400 rounded-full text-2xl font-bold mb-4 border-2 border-green-500/50">
                  {step.number}
                </div>
                <step.icon className="w-8 h-8 text-green-400 mb-2" />
                <h3 className="text-lg font-semibold text-white mb-1">{step.title}</h3>
                <p className="text-xs text-green-300 mb-2">{step.week}</p>
                <p className="text-sm text-slate-400 flex-grow">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SEO Packages Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <DollarSignIcon className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">SEO Packages</h2>
            <p className="max-w-2xl mx-auto text-lg text-slate-300">
              Flexible plans designed to match your business goals and budget.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 items-stretch">
            {seoPackages.map((pkg, idx) => (
              <motion.div
                key={pkg.name}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.2 }}
                className="flex"
              >
                <Card
                  className={`w-full flex flex-col bg-slate-800/70 backdrop-blur-sm border-slate-700/50 shadow-xl relative overflow-hidden ${pkg.isPopular ? "border-2 border-green-500 shadow-green-500/30" : "border-slate-700"}`}
                >
                  {pkg.isPopular && (
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-4 py-1.5 rounded-bl-lg">
                      Most Popular
                    </div>
                  )}
                  <CardHeader className="pt-8">
                    <CardTitle className="text-2xl font-semibold text-white mb-1">{pkg.name}</CardTitle>
                    <p className="text-3xl font-bold text-green-300 mb-2">{pkg.price}</p>
                    <CardDescription className="text-slate-400 text-sm min-h-[40px]">{pkg.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-grow flex flex-col">
                    <ul className="space-y-2.5 mb-6 flex-grow">
                      {pkg.features.map((feature, fIdx) => (
                        <li key={fIdx} className="flex items-start text-sm text-slate-300">
                          <CheckCircle size={18} className="text-green-400 mr-2.5 mt-0.5 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-slate-500 mb-4">Ideal for: {pkg.idealFor}</p>
                    <Button
                      asChild
                      className={`w-full font-semibold text-lg py-3 mt-auto ${pkg.isPopular ? "bg-green-500 hover:bg-green-600 text-white" : "bg-slate-700 hover:bg-slate-600 text-slate-100"}`}
                    >
                      <Link href={`/contact?service=Strategic%20SEO%20Services&package=${pkg.name}`}>Get Started</Link>
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Limited Time Offer Section */}
      <section className="py-20 md:py-32 bg-slate-900">
        <div className="container mx-auto max-w-screen-lg px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-500/20 to-cyan-500/20 p-8 md:p-12 rounded-xl shadow-2xl text-center">
            <h2 className="text-3xl font-semibold text-white mb-3">Limited Time Offer</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-green-300 mb-4">Get Your Free SEO Audit Report</h3>
            <p className="text-slate-300 text-lg max-w-xl mx-auto mb-8">
              Discover exactly what's holding your website back from ranking #1. Our comprehensive audit reveals
              opportunities worth thousands in potential revenue.
            </p>
            <Button size="xl" asChild className="bg-green-500 hover:bg-green-600 text-white group text-lg px-10 py-7">
              <Link href="/contact?service=Strategic%20SEO%20Services&action=free_audit">
                Claim Your Free Audit{" "}
                <ArrowRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
            <p className="mt-6 text-sm text-slate-400">
              A$750 Value • No Obligations • 📊 20+ page detailed report • 🔍 Technical analysis • 📈 Competitor
              insights
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
