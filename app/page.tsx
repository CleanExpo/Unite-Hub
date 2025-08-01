"use client";

import type React from "react";
import { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useAnimation, useInView } from "framer-motion";
import {
  ChevronDown,
  ArrowRight,
  CheckCircle,
  TrendingUp,
  Settings,
  ShieldCheck,
  Sparkles,
  Phone,
  MapPin,
  Clock,
  FolderOpen,
  MessageSquare,
} from "lucide-react";

// Custom Components
import UniteAdvantageSection from "@/components/unite-advantage-section";
import PartnersSection from "@/components/partners-section";
import CaseStudiesSection from "@/components/case-studies-section";
import { services } from "@/lib/services-data";
import { iconMap } from "@/lib/icon-map";

const AnimatedSection: React.FC<{
  children: React.ReactNode;
  className?: string;
  delay?: number;
}> = ({ children, className, delay = 0 }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.15 });
  const controls = useAnimation();
  useEffect(() => {
    if (isInView) {
      controls.start("visible");
    }
  }, [isInView, controls]);
  return (
    <motion.section
      ref={ref}
      className={className}
      initial="hidden"
      animate={controls}
      variants={{
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, delay } },
      }}
    >
      {children}
    </motion.section>
  );
};

export default function UniteGroupLandingPage() {
  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen antialiased">
      {/* Hero Section */}
      <AnimatedSection className="relative pt-32 pb-28 md:pt-48 md:pb-40 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-900/30 opacity-30"></div>
          <motion.div
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-cyan-500/10 rounded-full filter blur-2xl"
            animate={{ x: [0, 20, 0], y: [0, -20, 0], rotate: [0, 10, 0] }}
            transition={{
              duration: 20,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-purple-500/10 rounded-full filter blur-3xl"
            animate={{ x: [0, -30, 0], y: [0, 30, 0], rotate: [0, -15, 0] }}
            transition={{
              duration: 25,
              repeat: Number.POSITIVE_INFINITY,
              ease: "linear",
            }}
          />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            className="inline-block bg-cyan-500/10 text-cyan-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            Simple Business Solutions
          </motion.div>
          <motion.h1
            className="text-4xl sm:text-5xl md:text-6xl font-semibold text-white mb-6 leading-tight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.7 }}
          >
            We Help Your Business{" "}
            <span className="text-cyan-400">Grow.</span>
          </motion.h1>
          <motion.p
            className="max-w-3xl mx-auto text-lg md:text-xl text-slate-300 mb-10 leading-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            We solve your business problems with simple, effective solutions that work.
          </motion.p>
          <motion.div
            className="flex flex-col sm:flex-row justify-center items-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <motion.a
              href="/services/initial-consultation"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-10 py-4 rounded-lg shadow-lg text-xl transition-colors duration-300 flex items-center group"
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 20px rgba(45, 212, 191, 0.5)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Start Here
              <ArrowRight
                size={20}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </motion.a>
            <motion.a
              href="/services"
              className="bg-transparent border-2 border-slate-600 hover:bg-slate-800 hover:border-slate-500 text-slate-100 font-semibold px-10 py-4 rounded-lg text-xl transition-colors duration-300 flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              See What We Do
              <ChevronDown
                size={20}
                className="ml-2 group-hover:translate-y-0.5 transition-transform"
              />
            </motion.a>
          </motion.div>
          <motion.div
            className="mt-12 grid grid-cols-2 sm:grid-cols-3 gap-6 max-w-3xl mx-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 0.7 }}
          >
            {[
              { icon: Clock, text: "Fast Results" },
              { icon: FolderOpen, text: "Simple Process" },
              { icon: MessageSquare, text: "Clear Communication" },
            ].map((item, idx) => (
              <div
                key={idx}
                className="flex flex-col items-center text-slate-300"
              >
                <item.icon size={28} className="text-cyan-400 mb-1" />
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </motion.div>
        </div>
      </AnimatedSection>

      {/* Simple Problem Section */}
      <AnimatedSection className="py-24 md:py-36 bg-slate-900">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-semibold text-white mb-4">
            Does This Sound Like You?
          </h2>
          <p className="max-w-3xl mx-auto text-lg text-slate-300 mb-10">
            Most businesses face these common challenges. We help you solve them.
          </p>
          <div className="grid md:grid-cols-3 gap-8 text-left">
            {[
              {
                title: "Your business isn't growing",
                desc: "You're stuck at the same level and don't know how to reach more customers or increase sales.",
                icon: TrendingUp,
              },
              {
                title: "Everything takes too long",
                desc: "Manual processes slow you down. You need better tools to work faster and smarter.",
                icon: Settings,
              },
              {
                title: "You worry about security",
                desc: "Your business data and customer information need better protection to build trust.",
                icon: ShieldCheck,
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                className="bg-slate-800 p-6 rounded-lg shadow-lg"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true, amount: 0.3 }}
              >
                <item.icon className="w-10 h-10 text-cyan-400 mb-3" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-slate-400 text-sm">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Services Overview Section */}
      <AnimatedSection id="services-overview" className="py-24 md:py-36">
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-semibold text-white text-center mb-4">
            How We Help You
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 text-center mb-16">
            We provide simple solutions that solve real business problems.
          </p>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "Business Planning",
                description: "We help you create a clear plan to grow your business. You'll know exactly what to do next and how to measure success.",
                icon: "Lightbulb",
                link: "/services/initial-consultation",
              },
              {
                title: "Custom Software",
                description: "We build software that does exactly what your business needs. It saves time, reduces errors, and helps you work better.",
                icon: "AppWindow",
                link: "/services/custom-software-development",
              },
              {
                title: "Get Found Online",
                description: "We help customers find your business when they search online. More visitors means more sales for your business.",
                icon: "BarChart3",
                link: "/services/strategic-seo-services",
              },
              {
                title: "Business Strategy",
                description: "We help you understand your market better and create a plan to beat your competition and grow faster.",
                icon: "Briefcase",
                link: "/services/business-strategy-consulting",
              },
              {
                title: "Quality Testing",
                description: "We make sure your software works perfectly for your customers. No bugs, no problems, just smooth operation.",
                icon: "ShieldCheck",
                link: "/services/quality-assurance-testing",
              },
              {
                title: "Team Training",
                description: "We teach your team the skills they need to succeed. Better skills mean better results for your business.",
                icon: "GraduationCap",
                link: "/services/education-training",
              },
            ].map((service, idx) => {
              const IconComponent = iconMap[service.icon] || TrendingUp;
              return (
                <motion.div
                  key={idx}
                  className="bg-slate-800/70 backdrop-blur-sm p-8 rounded-xl shadow-2xl border border-slate-700/50 flex flex-col hover:border-cyan-500/50 transition-all duration-300 group"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                  whileHover={{
                    y: -5,
                    boxShadow: "0 10px 30px -10px rgba(45, 212, 191, 0.2)",
                  }}
                >
                  <IconComponent className="w-12 h-12 text-cyan-400 mb-6" />
                  <h3 className="text-2xl font-semibold text-white mb-3">
                    {service.title}
                  </h3>
                  <p className="text-slate-400 mb-6 text-sm flex-grow">
                    {service.description}
                  </p>
                  <Link
                    href={service.link}
                    className="mt-auto inline-block text-cyan-400 font-semibold group-hover:text-cyan-300 transition-colors duration-300"
                  >
                    Learn More
                    <ArrowRight
                      size={16}
                      className="inline-block ml-1 group-hover:translate-x-1 transition-transform"
                    />
                  </Link>
                </motion.div>
              );
            })}
          </div>
          <div className="text-center mt-12">
            <Link
              href="/services"
              className="text-cyan-400 hover:text-cyan-300 font-semibold text-lg group"
            >
              See All Services
              <ArrowRight
                size={20}
                className="inline-block ml-1 group-hover:translate-x-1 transition-transform"
              />
            </Link>
          </div>
        </div>
      </AnimatedSection>

      <UniteAdvantageSection />
      <CaseStudiesSection />
      <PartnersSection />

      {/* Final Call to Action */}
      <AnimatedSection
        id="contact"
        className="py-28 md:py-44 bg-slate-900 relative overflow-hidden"
      >
        <div className="absolute inset-0 opacity-20">
          <Image
            src="/abstract-dark-background.png"
            alt="Abstract background"
            layout="fill"
            objectFit="cover"
            quality={50}
          />
        </div>
        <div className="container mx-auto max-w-screen-xl px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6">
            Ready to Get Started?
          </h2>
          <p className="max-w-2xl mx-auto text-lg text-slate-300 mb-12">
            Let's talk about your business and how we can help you grow.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
            <motion.a
              href="mailto:unitegroup.in@gmail.com"
              className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold px-10 py-4 rounded-lg shadow-xl text-lg transition-colors duration-300 flex items-center group"
              whileHover={{
                scale: 1.05,
                boxShadow: "0px 0px 25px rgba(45, 212, 191, 0.6)",
              }}
              whileTap={{ scale: 0.95 }}
            >
              Talk to Us
              <ArrowRight
                size={22}
                className="ml-2 group-hover:translate-x-1 transition-transform"
              />
            </motion.a>
            <motion.a
              href="/contact"
              className="border-2 border-cyan-500 text-cyan-400 hover:bg-cyan-500 hover:text-white font-semibold px-10 py-4 rounded-lg shadow-xl text-lg transition-all duration-300 flex items-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Us <Phone size={20} className="ml-2" />
            </motion.a>
          </div>
          <div className="mt-12 flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm text-slate-400">
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Simple Solutions
            </span>
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Fast Results
            </span>
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Clear Communication
            </span>
            <span>
              <CheckCircle size={16} className="inline mr-1 text-cyan-400" />
              Proven Results
            </span>
          </div>
        </div>
      </AnimatedSection>
    </div>
  );
}
