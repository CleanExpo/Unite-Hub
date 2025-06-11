"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Code, 
  Search, 
  BarChart3, 
  Shield, 
  GraduationCap,
  MessageSquare,
  ArrowRight,
  Sparkles,
  Zap,
  Target,
  Users,
  Award,
  CheckCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Service {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
}

const services: Service[] = [
  {
    title: "Initial Consultation",
    description: "Transform your vision into actionable strategy",
    href: "/services/initial-consultation",
    icon: <MessageSquare className="h-6 w-6" />,
    features: ["Business Analysis", "Strategy Development", "Roadmap Creation"],
    color: "from-teal-500 to-cyan-500"
  },
  {
    title: "Software Development",
    description: "Custom solutions that scale with your business",
    href: "/services/software-development",
    icon: <Code className="h-6 w-6" />,
    features: ["Web Applications", "Mobile Apps", "Enterprise Software"],
    color: "from-blue-500 to-indigo-500"
  },
  {
    title: "Strategic SEO",
    description: "Dominate search results and drive organic growth",
    href: "/services/strategic-seo",
    icon: <Search className="h-6 w-6" />,
    features: ["SEO Audit", "Content Strategy", "Link Building"],
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Business Strategy",
    description: "Data-driven insights for competitive advantage",
    href: "/services/business-strategy",
    icon: <BarChart3 className="h-6 w-6" />,
    features: ["Market Analysis", "Growth Planning", "Digital Transformation"],
    color: "from-green-500 to-emerald-500"
  },
  {
    title: "Quality Assurance",
    description: "Ensure excellence in every release",
    href: "/services/quality-assurance",
    icon: <Shield className="h-6 w-6" />,
    features: ["Test Automation", "Performance Testing", "Security Testing"],
    color: "from-orange-500 to-red-500"
  },
  {
    title: "Expert Education",
    description: "Empower your team with cutting-edge skills",
    href: "/services/expert-education",
    icon: <GraduationCap className="h-6 w-6" />,
    features: ["Team Training", "Workshops", "Certification Programs"],
    color: "from-indigo-500 to-purple-500"
  }
];

const highlights = [
  { icon: <Zap />, text: "Quick Implementation" },
  { icon: <Target />, text: "Goal-Oriented Approach" },
  { icon: <Users />, text: "Dedicated Support" },
  { icon: <Award />, text: "Proven Results" }
];

export function ServiceMegaMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={() => setIsOpen(true)}
        className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
      >
        Services
        <ChevronDown className={cn(
          "h-4 w-4 transition-transform",
          isOpen && "rotate-180"
        )} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Mega Menu */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              onMouseLeave={() => setIsOpen(false)}
              className="absolute left-1/2 transform -translate-x-1/2 top-full mt-2 w-screen max-w-7xl z-50"
            >
              <div className="bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden">
                <div className="p-8">
                  {/* Header */}
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Our Services
                    </h3>
                    <p className="text-slate-400 max-w-2xl mx-auto">
                      Comprehensive solutions tailored to accelerate your business growth
                    </p>
                  </div>

                  {/* Services Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {services.map((service) => (
                      <Link
                        key={service.href}
                        href={service.href}
                        onClick={() => setIsOpen(false)}
                        className="group relative bg-slate-800 rounded-xl p-6 hover:bg-slate-700 transition-all hover:scale-105"
                      >
                        <div className={cn(
                          "absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity bg-gradient-to-br",
                          service.color
                        )} />
                        
                        <div className="relative">
                          <div className={cn(
                            "inline-flex p-3 rounded-lg mb-4 bg-gradient-to-br text-white",
                            service.color
                          )}>
                            {service.icon}
                          </div>
                          
                          <h4 className="text-lg font-bold text-white mb-2 group-hover:text-teal-400 transition-colors">
                            {service.title}
                          </h4>
                          
                          <p className="text-sm text-slate-400 mb-4">
                            {service.description}
                          </p>
                          
                          <ul className="space-y-1">
                            {service.features.map((feature) => (
                              <li key={feature} className="text-xs text-slate-500 flex items-center gap-2">
                                <CheckCircle className="h-3 w-3 text-teal-500" />
                                {feature}
                              </li>
                            ))}
                          </ul>
                          
                          <div className="mt-4 flex items-center text-sm font-medium text-teal-400 group-hover:text-teal-300">
                            Learn more
                            <ArrowRight className="ml-1 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>

                  {/* Bottom Section */}
                  <div className="border-t border-slate-800 pt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-6">
                        {highlights.map((highlight, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm">
                            <span className="text-teal-400">{highlight.icon}</span>
                            <span className="text-slate-400">{highlight.text}</span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <Link
                          href="/services"
                          onClick={() => setIsOpen(false)}
                          className="text-sm font-medium text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          View All Services
                        </Link>
                        <Link
                          href="/book-consultation"
                          onClick={() => setIsOpen(false)}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-cyan-600 text-white rounded-lg hover:from-teal-500 hover:to-cyan-500 transition-all text-sm font-medium"
                        >
                          <Sparkles className="h-4 w-4" />
                          Book Consultation
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
