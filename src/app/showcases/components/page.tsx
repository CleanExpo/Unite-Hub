 
"use client"

import { AnimationShowcase } from "@/components/showcases/animation-showcase"

export default function ComponentsShowcasePage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="bg-gradient-to-r from-blue-600 to-accent-600 text-white py-16">
        <div className="max-w-4xl mx-auto px-5">
          <h1 className="text-5xl font-bold mb-4">Animation Components Showcase</h1>
          <p className="text-xl text-white/90">
            Production-ready Framer Motion components for engaging user experiences
          </p>
        </div>
      </header>

      <AnimationShowcase />

      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-4xl mx-auto px-5 text-center">
          <p className="text-gray-400">
            These components are part of our Phase 2 UI/UX enhancement initiative.
            Ready to be integrated into your application.
          </p>
        </div>
      </footer>
    </main>
  )
}
