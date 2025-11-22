"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Image from "next/image";
import Link from "next/link";
import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const [currentSlide, setCurrentSlide] = useState(1);

  const nextSlide = () => {
    if (currentSlide < 2) setCurrentSlide(currentSlide + 1);
  };

  const prevSlide = () => {
    if (currentSlide > 0) setCurrentSlide(currentSlide - 1);
  };

  return (
    <div className="min-h-screen bg-[#f4f7fa] overflow-x-hidden">
      {/* Header / Navbar */}
      <header className="absolute top-0 left-0 w-full z-50 py-5 bg-transparent">
        <div className="max-w-[1200px] mx-auto px-5 flex justify-between items-center">
          <Link href="/" className="logo">
            <Image
              src="/logos/unite-hub-logo.png"
              alt="Unite-Hub Logo"
              width={180}
              height={50}
              className="h-10 w-auto"
            />
          </Link>

          <nav className="hidden md:flex gap-8 items-center">
            <a href="#" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity flex items-center gap-1">
              Services <ChevronDown className="w-3 h-3" />
            </a>
            <a href="#how-it-works" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
              How it Works
            </a>
            <a href="#pricing" className="text-white text-sm font-medium opacity-90 hover:opacity-100 transition-opacity">
              Pricing
            </a>
          </nav>

          <div className="hidden md:flex gap-4">
            {loading ? (
              <div className="h-10 w-20 bg-white/20 rounded animate-pulse" />
            ) : user ? (
              <Link
                href="/dashboard/overview"
                className="px-6 py-2.5 rounded-md font-semibold text-sm bg-[#007bff] border border-[#007bff] text-white hover:-translate-y-0.5 transition-transform"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-md font-semibold text-sm bg-transparent border border-white/50 text-white hover:-translate-y-0.5 transition-transform"
                >
                  Sign In
                </Link>
                <Link
                  href="/login"
                  className="px-6 py-2.5 rounded-md font-semibold text-sm bg-[#007bff] border border-[#007bff] text-white hover:-translate-y-0.5 transition-transform"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative bg-[radial-gradient(circle_at_center_top,#0d2a5c_0%,#051224_70%)] text-white pt-40 pb-20 text-center overflow-hidden">
        {/* Wave pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.03) 0px, transparent 2px, transparent 100px)'
          }}
        />

        <div className="max-w-[1200px] mx-auto px-5 relative">
          <h1 className="text-5xl md:text-6xl font-extrabold mb-5 leading-tight">
            Autonomous Digital<br />Growth for SMBs.
          </h1>
          <p className="text-lg opacity-90 max-w-[600px] mx-auto mb-10 leading-relaxed">
            Stop Struggling. Start Growing. Your complete marketing, SEO, and website handled automatically.
          </p>
          <div className="flex justify-center gap-5 mb-16">
            <Link
              href="/dashboard/overview"
              className="bg-gradient-to-r from-[#347bf7] to-[#5a9dff] text-white py-3.5 px-8 rounded-lg text-base font-semibold border-none shadow-[0_4px_15px_rgba(52,123,247,0.4)] hover:-translate-y-0.5 transition-transform"
            >
              ACCESS YOUR HUB
            </Link>
            <Link
              href="/login"
              className="bg-gradient-to-r from-[#ff5722] to-[#ff784e] text-white py-3.5 px-8 rounded-lg text-base font-semibold border-none shadow-[0_4px_15px_rgba(255,87,34,0.4)] hover:-translate-y-0.5 transition-transform"
            >
              START 30-DAY TRIAL
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="text-center pb-20 bg-gradient-to-b from-[#051224] via-[#051224] to-[#f4f7fa]" style={{ paddingTop: '1px' }}>
        <div className="max-w-[1200px] mx-auto px-5">
          <h2 className="text-white text-3xl font-bold mb-12 pt-12">Choose Your Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            {/* Starter Plan */}
            <div className="bg-white rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-1">
              <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#0056b3] to-[#007bff] flex items-center justify-center">
                <span className="text-white font-bold text-lg">UH</span>
              </div>
              <h3 className="text-2xl font-bold mb-4 text-[#1a1a1a]">Starter Member</h3>
              <div className="text-[42px] font-extrabold text-[#1a1a1a] mb-8">
                $495<span className="text-base text-[#666] font-medium">/mo</span>
              </div>
              <ul className="text-left inline-block mb-9">
                <li className="mb-3 text-[#666] flex items-center">
                  <span className="text-[#1a1a1a] text-xl mr-2.5">•</span>
                  Essential Tools
                </li>
                <li className="mb-3 text-[#666] flex items-center">
                  <span className="text-[#1a1a1a] text-xl mr-2.5">•</span>
                  Basic Analytics
                </li>
                <li className="mb-3 text-[#666] flex items-center">
                  <span className="text-[#1a1a1a] text-xl mr-2.5">•</span>
                  Community Support
                </li>
              </ul>
              <Link
                href="/login"
                className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all"
              >
                Sign Up Now
              </Link>
            </div>

            {/* Professional Plan (Highlighted) */}
            <div className="bg-[#0a1e3b] rounded-[20px] p-10 text-center text-white transform scale-105 border-2 border-[#ff5722] shadow-[0_0_30px_rgba(255,87,34,0.3)] z-10">
              <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-[#0a1e3b] border-2 border-[#ff5722] flex items-center justify-center">
                <span className="text-[#ff5722] font-bold text-lg">UH</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Professional Member</h3>
              <div className="text-[42px] font-extrabold mb-8">
                $895<span className="text-base text-white/70 font-medium">/mo</span>
              </div>
              <ul className="text-left inline-block mb-9">
                <li className="mb-3 text-white/80 flex items-center">
                  <span className="text-white text-xl mr-2.5">•</span>
                  Advanced Features
                </li>
                <li className="mb-3 text-white/80 flex items-center">
                  <span className="text-white text-xl mr-2.5">•</span>
                  Priority Support
                </li>
                <li className="mb-3 text-white/80 flex items-center">
                  <span className="text-white text-xl mr-2.5">•</span>
                  Full Automation
                </li>
              </ul>
              <Link
                href="/login"
                className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-gradient-to-r from-[#ff5722] to-[#ff784e] text-white border-none shadow-[0_4px_15px_rgba(255,87,34,0.4)] hover:-translate-y-0.5 transition-transform"
              >
                Sign Up Now
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-[20px] p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] transition-transform hover:-translate-y-1">
              <div className="h-20 w-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#0056b3] to-[#007bff] flex items-center justify-center">
                <span className="text-white font-bold text-lg">UH</span>
              </div>
              <h3 className="text-2xl font-bold mb-1 text-[#1a1a1a]">Enterprise Member</h3>
              <p className="text-base text-[#666] font-medium mb-3">Enterprise</p>
              <div className="text-4xl font-extrabold text-[#1a1a1a] mb-8">
                $1295<span className="text-base text-[#666] font-medium">/mo</span>
              </div>
              <ul className="text-left inline-block mb-9">
                <li className="mb-3 text-[#666] flex items-center">
                  <span className="text-[#1a1a1a] text-xl mr-2.5">•</span>
                  Dedicated Account Manager
                </li>
                <li className="mb-3 text-[#666] flex items-center">
                  <span className="text-[#1a1a1a] text-xl mr-2.5">•</span>
                  API Access
                </li>
                <li className="mb-3 text-[#666] flex items-center">
                  <span className="text-[#1a1a1a] text-xl mr-2.5">•</span>
                  Custom Solutions
                </li>
              </ul>
              <button className="inline-block w-4/5 py-3 px-8 rounded-md font-semibold bg-transparent border-2 border-[#1a1a1a] text-[#1a1a1a] hover:bg-[#1a1a1a] hover:text-white transition-all">
                Contact Us
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Carousel Section */}
      <section className="pb-20 overflow-hidden relative">
        <div className="max-w-[1200px] mx-auto px-5 flex justify-between mb-5">
          <span className="text-[#666] font-semibold">Value Stack</span>
          <span className="text-[#666] font-semibold">Value Stack</span>
        </div>

        <div className="relative max-w-[1400px] mx-auto h-[450px] flex items-center justify-center">
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{
              transform: `translateX(${currentSlide === 0 ? '630px' : currentSlide === 1 ? '0px' : '-630px'})`
            }}
          >
            {/* Card 1 - Website Transformation */}
            <div className={`min-w-[600px] mx-4 rounded-2xl overflow-hidden relative transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.2)] ${currentSlide === 0 ? 'opacity-100 scale-100 h-[420px] z-10' : 'opacity-50 scale-[0.85] h-[380px]'}`}>
              <div className="w-full h-full bg-[#e0e0e0] flex items-center justify-center p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2">Before & After</h3>
                  <p className="text-[#666]">Website Transformation</p>
                </div>
              </div>
            </div>

            {/* Card 2 - Analytics Dashboard */}
            <div className={`min-w-[600px] mx-4 rounded-2xl overflow-hidden relative transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.2)] bg-[#0a1e3b] ${currentSlide === 1 ? 'opacity-100 scale-100 h-[420px] z-10' : 'opacity-50 scale-[0.85] h-[380px]'}`}>
              <div className="w-full h-full flex items-center justify-center p-8">
                <div className="text-center">
                  <div className="inline-block bg-[#00d4aa] text-white text-sm font-semibold px-3 py-1 rounded mb-4">
                    Live Growth Tracking
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Real-Time Analytics</h3>
                  <p className="text-white/70">Dashboard</p>
                </div>
              </div>
            </div>

            {/* Card 3 - Video Testimonials */}
            <div className={`min-w-[600px] mx-4 rounded-2xl overflow-hidden relative transition-all duration-500 shadow-[0_15px_40px_rgba(0,0,0,0.2)] ${currentSlide === 2 ? 'opacity-100 scale-100 h-[420px] z-10' : 'opacity-50 scale-[0.85] h-[380px]'}`}>
              <div className="w-full h-full bg-[#e0e0e0] flex items-center justify-center p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#1a1a1a] mb-2">Client Success Stories</h3>
                  <p className="text-[#666]">(Video Testimonials)</p>
                  <div className="mt-4 w-16 h-16 mx-auto rounded-full bg-white/80 flex items-center justify-center">
                    <span className="text-[#1a1a1a] text-2xl">▶</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="flex justify-center items-center mt-8 gap-5">
          <button
            onClick={prevSlide}
            className="w-10 h-10 bg-[#e0e5ec] rounded-full flex items-center justify-center cursor-pointer text-[#1a1a1a] hover:bg-[#d0dbe7] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="flex gap-2">
            {[0, 1, 2].map((i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`rounded-full cursor-pointer transition-colors ${currentSlide === i ? 'w-3 h-3 bg-[#0056b3]' : 'w-2.5 h-2.5 bg-[#ccc]'}`}
              />
            ))}
          </div>

          <button
            onClick={nextSlide}
            className="w-10 h-10 bg-[#e0e5ec] rounded-full flex items-center justify-center cursor-pointer text-[#1a1a1a] hover:bg-[#d0dbe7] transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-[#eee]">
        <div className="max-w-[1200px] mx-auto px-5 flex flex-col md:flex-row justify-between items-center gap-5">
          <Link href="/" className="logo">
            <Image
              src="/logos/unite-hub-logo.png"
              alt="Unite-Hub Logo"
              width={150}
              height={40}
              className="h-10 w-auto"
            />
          </Link>

          <div className="flex gap-8">
            <a href="#" className="text-[#1a1a1a] text-sm font-medium flex items-center gap-1">
              Services <ChevronDown className="w-2.5 h-2.5" />
            </a>
            <Link href="/about" className="text-[#1a1a1a] text-sm font-medium">
              About
            </Link>
            <Link href="/contact" className="text-[#1a1a1a] text-sm font-medium">
              Contact
            </Link>
            <Link href="/privacy" className="text-[#1a1a1a] text-sm font-medium">
              Privacy Policy
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
