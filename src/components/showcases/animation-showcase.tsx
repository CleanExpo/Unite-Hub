 
"use client"

import React from "react"
import { InfiniteSlider } from "@/components/ui/infinite-slider"
import { TextLoop } from "@/components/ui/text-loop"
import { MetricsCard } from "@/components/ui/metrics-card"
import { ImageComparison, ImageComparisonImage } from "@/components/ui/image-comparison"
import { ScrollProgress } from "@/components/ui/scroll-progress"
import { ProgressiveBlur } from "@/components/ui/progressive-blur"

export function AnimationShowcase() {

  return (
    <div className="w-full bg-white">
      {/* Scroll Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-gray-100 z-50">
        <ScrollProgress className="h-full bg-gradient-to-r from-blue-500 to-accent-500" />
      </div>

      {/* TextLoop Showcase */}
      <section className="py-20 px-5 bg-gradient-to-br from-blue-50 to-accent-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center">TextLoop Component</h2>
          <div className="text-center text-2xl font-semibold text-gray-800">
            <p className="mb-4">Smooth text rotation for headlines:</p>
            <div className="inline-block">
              <TextLoop interval={3000}>
                <span className="text-blue-600">Increase Engagement</span>
                <span className="text-accent-600">Show Multiple Benefits</span>
                <span className="text-purple-600">Rotate Value Props</span>
                <span className="text-orange-600">Keep Visitors Interested</span>
              </TextLoop>
            </div>
          </div>
          <p className="text-center text-gray-600 mt-8">Perfect for hero sections, CTAs, and dynamic headlines</p>
        </div>
      </section>

      {/* InfiniteSlider Showcase */}
      <section className="py-20 px-5 bg-white border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center">InfiniteSlider Component</h2>
          <p className="text-center text-gray-600 mb-8">Seamless scrolling for logos, brands, or features</p>
          <InfiniteSlider gap={32} duration={20}>
            <div className="flex items-center justify-center h-16 px-6 bg-gray-100 rounded-lg whitespace-nowrap font-semibold text-gray-700">
              🏢 Enterprise Solutions
            </div>
            <div className="flex items-center justify-center h-16 px-6 bg-blue-100 rounded-lg whitespace-nowrap font-semibold text-blue-700">
              🚀 Startup Ready
            </div>
            <div className="flex items-center justify-center h-16 px-6 bg-green-100 rounded-lg whitespace-nowrap font-semibold text-green-700">
              📊 Analytics Driven
            </div>
            <div className="flex items-center justify-center h-16 px-6 bg-purple-100 rounded-lg whitespace-nowrap font-semibold text-purple-700">
              🎨 Design Focused
            </div>
            <div className="flex items-center justify-center h-16 px-6 bg-orange-100 rounded-lg whitespace-nowrap font-semibold text-orange-700">
              ⚡ High Performance
            </div>
            <div className="flex items-center justify-center h-16 px-6 bg-pink-100 rounded-lg whitespace-nowrap font-semibold text-pink-700">
              🔒 Security First
            </div>
          </InfiniteSlider>
        </div>
      </section>

      {/* AnimatedNumber & MetricsCard Showcase */}
      <section className="py-20 px-5 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center">AnimatedNumber & MetricsCard</h2>
          <p className="text-center text-gray-600 mb-12">Smooth number animations for dashboards and KPI displays</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricsCard
              label="Total Contacts"
              value={1243}
              prefix=""
              suffix="contacts"
              icon="👥"
              trend={{ value: 12.5, direction: "up" }}
            />
            <MetricsCard
              label="Campaign Performance"
              value={87}
              prefix=""
              suffix="%"
              icon="📊"
              trend={{ value: 8.3, direction: "up" }}
            />
            <MetricsCard
              label="Email Open Rate"
              value={45}
              prefix=""
              suffix="%"
              icon="📧"
              trend={{ value: 5.2, direction: "down" }}
            />
          </div>
        </div>
      </section>

      {/* ImageComparison Showcase */}
      <section className="py-20 px-5 bg-white border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center">ImageComparison Component</h2>
          <p className="text-center text-gray-600 mb-8">Before/after slider for transformations and improvements</p>
          <ImageComparison className="rounded-lg overflow-hidden shadow-lg h-80">
            <ImageComparisonImage
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop"
              alt="Before"
              position="left"
            />
            <ImageComparisonImage
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=600&fit=crop"
              alt="After"
              position="right"
            />
          </ImageComparison>
        </div>
      </section>

      {/* ProgressiveBlur Showcase */}
      <section className="py-20 px-5 bg-gray-50 border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center">ProgressiveBlur Component</h2>
          <p className="text-center text-gray-600 mb-8">Elegant blur overlay for image galleries and showcases</p>
          <div className="relative h-96 rounded-lg overflow-hidden shadow-lg">
            <img
              src="https://images.unsplash.com/photo-1552664730-d307ca884978?w=900&h=600&fit=crop"
              alt="Gallery"
              className="w-full h-full object-cover"
            />
            <ProgressiveBlur
              className="absolute inset-0 pointer-events-none"
              blurIntensity={0.6}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 text-white">
              <h3 className="text-2xl font-bold mb-2">Beautiful Image Galleries</h3>
              <p className="text-sm">With smooth blur overlays for text readability</p>
            </div>
          </div>
        </div>
      </section>

      {/* ScrollProgress Showcase */}
      <section className="py-20 px-5 bg-white border-t">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold mb-6 text-center">ScrollProgress Component</h2>
          <p className="text-center text-gray-600 mb-8">
            Scroll indicator bar at the top of the page (notice the progress bar at the very top!)
          </p>
          <div className="bg-blue-50 p-8 rounded-lg">
            <p className="text-gray-700 leading-relaxed">
              This page demonstrates a ScrollProgress component - a progress bar that fills as you scroll down the page.
              It's perfect for long-form content like blog posts, documentation, or product pages. The smooth animated bar
              at the top shows readers how much content remains.
            </p>
          </div>
        </div>
      </section>

      {/* Summary Section */}
      <section className="py-20 px-5 bg-gradient-to-br from-blue-50 to-accent-50 border-t">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Component Library Summary</h2>
          <p className="text-gray-700 text-lg mb-8 leading-relaxed">
            These production-ready animation components are built with Framer Motion for optimal performance.
            Each component is customizable, accessible, and mobile-friendly. Perfect for creating engaging user experiences
            across your application.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-blue-600">TextLoop</p>
              <p className="text-gray-600">Rotating text</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-accent-600">InfiniteSlider</p>
              <p className="text-gray-600">Endless carousel</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-purple-600">AnimatedNumber</p>
              <p className="text-gray-600">Smooth counters</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-orange-600">ImageComparison</p>
              <p className="text-gray-600">Before/after</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-green-600">ProgressiveBlur</p>
              <p className="text-gray-600">Blur overlays</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="font-semibold text-pink-600">ScrollProgress</p>
              <p className="text-gray-600">Progress bars</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
