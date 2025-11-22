"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Menu,
  X,
  Play,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

export default function Home() {
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      title: "Before & After Website Transformation",
      description: "See how we transform outdated websites into modern, high-converting digital experiences.",
      type: "website"
    },
    {
      title: "Real-Time Analytics Dashboard",
      description: "Track your growth with live metrics and actionable insights.",
      badge: "Live Growth Tracking",
      type: "analytics"
    },
    {
      title: "Client Success Stories (Video Testimonials)",
      description: "Hear directly from our satisfied clients about their growth journey.",
      type: "testimonial"
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <div className="min-h-screen bg-[#F5F3EF]">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-90 transition-opacity">
              <Image
                src="/logos/unite-hub-logo.png"
                alt="Unite-Hub Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                priority
              />
              <span className="text-xl font-bold text-[#1E3A5F]">
                Unite-Hub
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-8">
              {/* Services Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className="flex items-center gap-1 text-sm text-[#1E3A5F] hover:text-[#FF6B35] transition-colors"
                >
                  Services
                  <ChevronDown className={`h-4 w-4 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {servicesOpen && (
                  <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2">
                    <a href="#" className="block px-4 py-2 text-sm text-[#1E3A5F] hover:bg-[#F5F3EF]">Website Design</a>
                    <a href="#" className="block px-4 py-2 text-sm text-[#1E3A5F] hover:bg-[#F5F3EF]">SEO Optimization</a>
                    <a href="#" className="block px-4 py-2 text-sm text-[#1E3A5F] hover:bg-[#F5F3EF]">Marketing Automation</a>
                    <a href="#" className="block px-4 py-2 text-sm text-[#1E3A5F] hover:bg-[#F5F3EF]">Social Media</a>
                  </div>
                )}
              </div>

              <a href="#how-it-works" className="text-sm text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                How it Works
              </a>
              <a href="#pricing" className="text-sm text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                Pricing
              </a>

              {loading ? (
                <div className="h-10 w-28 bg-gray-100 rounded-lg animate-pulse"></div>
              ) : user ? (
                <>
                  <Link href="/dashboard/overview">
                    <Button className="bg-[#1E3A5F] hover:bg-[#2a4a6f] text-white">
                      Dashboard
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    onClick={() => signOut()}
                    variant="ghost"
                    className="text-[#1E3A5F] hover:text-[#FF6B35]"
                  >
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" className="border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="bg-[#1E3A5F] hover:bg-[#2a4a6f] text-white">
                      Sign Up
                    </Button>
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-[#1E3A5F]"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-white border-t border-gray-100"
            >
              <div className="px-4 py-6 space-y-4">
                <a href="#" className="block text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                  Services
                </a>
                <a href="#how-it-works" className="block text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                  How it Works
                </a>
                <a href="#pricing" className="block text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                  Pricing
                </a>

                {loading ? (
                  <div className="h-10 bg-gray-100 rounded-lg animate-pulse"></div>
                ) : user ? (
                  <>
                    <Link href="/dashboard/overview" className="block">
                      <Button className="w-full bg-[#1E3A5F] hover:bg-[#2a4a6f] text-white">
                        Dashboard
                      </Button>
                    </Link>
                    <Button
                      onClick={() => signOut()}
                      variant="ghost"
                      className="w-full text-[#1E3A5F] hover:text-[#FF6B35]"
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block">
                      <Button variant="outline" className="w-full border-[#1E3A5F] text-[#1E3A5F]">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/login" className="block">
                      <Button className="w-full bg-[#1E3A5F] hover:bg-[#2a4a6f] text-white">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        {/* Navy gradient background with wave pattern */}
        <div className="relative bg-gradient-to-br from-[#1E3A5F] via-[#2a4a6f] to-[#1E3A5F] py-20 sm:py-28 lg:py-36">
          {/* Subtle wave pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <svg className="absolute w-full h-full" viewBox="0 0 1440 800" preserveAspectRatio="none">
              <path
                d="M0,200 C360,100 720,300 1080,200 C1260,150 1380,250 1440,200 L1440,800 L0,800 Z"
                fill="currentColor"
                className="text-white"
              />
              <path
                d="M0,400 C360,300 720,500 1080,400 C1260,350 1380,450 1440,400 L1440,800 L0,800 Z"
                fill="currentColor"
                className="text-white opacity-50"
              />
            </svg>
          </div>

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-6"
            >
              Autonomous Digital Growth for SMBs.
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-lg sm:text-xl md:text-2xl text-white/90 max-w-3xl mx-auto mb-10"
            >
              Stop Struggling, Start Growing. Your complete marketing, SEO, and website handled automatically.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#1E3A5F] hover:bg-[#0f2540] text-white font-semibold text-lg px-8 py-6 border-2 border-white/20"
                >
                  ACCESS YOUR HUB
                </Button>
              </Link>
              <Link href="/login">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold text-lg px-8 py-6"
                >
                  START 30-DAY TRIAL
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-[#F5F3EF]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#1E3A5F] mb-4">
              Choose Your Plan
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8"
          >
            {/* Starter Member */}
            <motion.div
              variants={fadeInUp}
              className="relative bg-white rounded-2xl p-8 shadow-sm"
            >
              {/* Logo icon */}
              <div className="flex justify-center mb-6">
                <Image
                  src="/logos/unite-hub-logo.png"
                  alt="Unite-Hub"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>

              <h3 className="text-xl font-bold text-[#1E3A5F] text-center mb-2">Starter Member</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-[#1E3A5F]">$495</span>
                <span className="text-[#1E3A5F]/60">/mo</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Essential Tools",
                  "Basic Analytics",
                  "Community Support"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#1E3A5F]">
                    <Check className="h-4 w-4 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block">
                <Button variant="outline" className="w-full border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white">
                  Sign Up Now
                </Button>
              </Link>
            </motion.div>

            {/* Professional Member - Highlighted */}
            <motion.div
              variants={fadeInUp}
              className="relative bg-white rounded-2xl p-8 shadow-lg"
              style={{
                background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #14b8a6, #a3e635) border-box',
                border: '3px solid transparent'
              }}
            >
              {/* Logo icon */}
              <div className="flex justify-center mb-6">
                <Image
                  src="/logos/unite-hub-logo.png"
                  alt="Unite-Hub"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>

              <h3 className="text-xl font-bold text-[#1E3A5F] text-center mb-2">Professional Member</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-[#1E3A5F]">$895</span>
                <span className="text-[#1E3A5F]/60">/mo</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Advanced Features",
                  "Priority Support",
                  "Full Automation"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#1E3A5F]">
                    <Check className="h-4 w-4 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block">
                <Button className="w-full bg-[#FF6B35] hover:bg-[#e55a28] text-white font-semibold">
                  Sign Up Now
                </Button>
              </Link>
            </motion.div>

            {/* Enterprise Member */}
            <motion.div
              variants={fadeInUp}
              className="relative bg-white rounded-2xl p-8 shadow-sm"
            >
              {/* Logo icon */}
              <div className="flex justify-center mb-6">
                <Image
                  src="/logos/unite-hub-logo.png"
                  alt="Unite-Hub"
                  width={48}
                  height={48}
                  className="h-12 w-12 object-contain"
                />
              </div>

              <h3 className="text-xl font-bold text-[#1E3A5F] text-center mb-2">Enterprise Member</h3>
              <div className="text-center mb-6">
                <span className="text-4xl font-bold text-[#1E3A5F]">$1295</span>
                <span className="text-[#1E3A5F]/60">/mo</span>
              </div>

              <ul className="space-y-3 mb-8">
                {[
                  "Dedicated Account Manager",
                  "API Access",
                  "Custom Solutions"
                ].map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm text-[#1E3A5F]">
                    <Check className="h-4 w-4 text-teal-500" />
                    {feature}
                  </li>
                ))}
              </ul>

              <Link href="/login" className="block">
                <Button variant="outline" className="w-full border-[#1E3A5F] text-[#1E3A5F] hover:bg-[#1E3A5F] hover:text-white">
                  Contact Us
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Value Stack Carousel */}
      <section className="relative py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="relative">
            {/* Carousel container */}
            <div className="overflow-hidden">
              <motion.div
                className="flex"
                initial={false}
                animate={{ x: `-${currentSlide * 100}%` }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              >
                {slides.map((slide, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-[#F5F3EF] rounded-2xl p-8 md:p-12">
                      <div className="grid md:grid-cols-2 gap-8 items-center">
                        <div>
                          <h3 className="text-2xl md:text-3xl font-bold text-[#1E3A5F] mb-4">
                            {slide.title}
                          </h3>
                          <p className="text-[#1E3A5F]/70 text-lg">
                            {slide.description}
                          </p>
                          {slide.badge && (
                            <span className="inline-block mt-4 px-4 py-2 bg-teal-500 text-white text-sm font-medium rounded-full">
                              {slide.badge}
                            </span>
                          )}
                        </div>
                        <div className="relative">
                          {slide.type === "website" && (
                            <div className="bg-white rounded-lg shadow-lg p-4 aspect-video flex items-center justify-center">
                              <div className="text-center">
                                <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-gradient-to-br from-[#1E3A5F] to-teal-500 flex items-center justify-center">
                                  <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                  </svg>
                                </div>
                                <p className="text-sm text-[#1E3A5F]/60">Website Preview</p>
                              </div>
                            </div>
                          )}
                          {slide.type === "analytics" && (
                            <div className="bg-white rounded-lg shadow-lg p-6">
                              <div className="flex items-center justify-between mb-4">
                                <span className="text-sm font-medium text-[#1E3A5F]">Growth Analytics</span>
                                <span className="text-xs px-2 py-1 bg-green-100 text-green-600 rounded-full">Live</span>
                              </div>
                              <div className="flex items-end gap-2 h-32">
                                {[40, 65, 45, 80, 55, 90, 70].map((height, i) => (
                                  <div
                                    key={i}
                                    className="flex-1 bg-gradient-to-t from-teal-500 to-teal-300 rounded-t"
                                    style={{ height: `${height}%` }}
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          {slide.type === "testimonial" && (
                            <div className="bg-white rounded-lg shadow-lg p-6 flex items-center justify-center aspect-video">
                              <div className="text-center">
                                <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#1E3A5F] to-teal-500 flex items-center justify-center">
                                  <Play className="w-8 h-8 text-white ml-1" />
                                </div>
                                <p className="text-sm text-[#1E3A5F]/60">Watch Testimonial</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Navigation arrows */}
            <button
              onClick={prevSlide}
              className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1E3A5F] hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={nextSlide}
              className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center text-[#1E3A5F] hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Dots */}
            <div className="flex justify-center gap-2 mt-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    currentSlide === index ? 'bg-[#1E3A5F]' : 'bg-[#1E3A5F]/20'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#F5F3EF] border-t border-[#1E3A5F]/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Logo and member status */}
            <div className="flex items-center gap-4">
              <Image
                src="/logos/unite-hub-logo.png"
                alt="Unite-Hub Logo"
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <div>
                <span className="text-lg font-bold text-[#1E3A5F]">Unite-Hub</span>
                <p className="text-sm text-[#1E3A5F]/60">Professional Member</p>
              </div>
            </div>

            {/* Links */}
            <div className="flex flex-wrap justify-center gap-6 text-sm">
              <div className="relative group">
                <button className="flex items-center gap-1 text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                  Services
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
              <a href="#" className="text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                About
              </a>
              <a href="#" className="text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                Contact
              </a>
              <Link href="/privacy" className="text-[#1E3A5F] hover:text-[#FF6B35] transition-colors">
                Privacy Policy
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-[#1E3A5F]/10 text-center">
            <p className="text-sm text-[#1E3A5F]/60">
              2025 Unite-Hub. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
