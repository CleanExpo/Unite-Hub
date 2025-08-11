"use client";

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { motion } from "framer-motion"

export default function CtaSection() {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-r from-cyan-600 to-sky-700 text-white relative overflow-hidden">
      {/* Background Patterns */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Enhanced Gradient Backgrounds */}
        <div className="absolute inset-0 bg-gradient-to-r from-cyan-600 via-sky-600 to-sky-700"></div>
        <div className="absolute inset-0 bg-gradient-to-tl from-cyan-500/30 via-transparent to-sky-500/35"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-sky-500/25 via-transparent to-cyan-500/30"></div>
        <div className="absolute inset-0 bg-gradient-to-bl from-cyan-400/20 via-transparent to-sky-400/25"></div>
        
        {/* Large Animated Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/6 w-80 h-80 bg-gradient-to-br from-cyan-400/25 to-sky-400/20 rounded-full filter blur-3xl"
          animate={{ x: [0, 30, 0], y: [0, -25, 0], scale: [1, 1.2, 1] }}
          transition={{
            duration: 30,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/4 right-1/6 w-96 h-96 bg-gradient-to-tl from-sky-400/20 to-cyan-400/25 rounded-full filter blur-3xl"
          animate={{ x: [0, -35, 0], y: [0, 30, 0], scale: [1, 0.85, 1] }}
          transition={{
            duration: 35,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 8,
          }}
        />
        
        {/* Geometric Elements */}
        <motion.div
          className="absolute top-1/6 right-16 w-24 h-24 border-2 border-cyan-300/50 rounded-full bg-gradient-to-br from-cyan-400/20 to-transparent"
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
          className="absolute bottom-1/6 left-16 w-20 h-20 border-2 border-sky-300/45 bg-gradient-to-br from-sky-400/18 to-transparent"
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
        
        {/* Star Shapes - Unique to CTA */}
        <motion.div
          className="absolute top-1/3 left-1/4 w-16 h-16 border-2 border-cyan-300/50 bg-gradient-to-br from-cyan-400/20 to-transparent"
          style={{
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }}
          animate={{ 
            x: [0, 20, 0], 
            y: [0, -25, 0], 
            rotate: [0, 180, 0],
            scale: [1, 1.15, 1]
          }}
          transition={{
            duration: 24,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 1,
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 right-1/4 w-12 h-12 border-2 border-sky-300/50 bg-gradient-to-br from-sky-400/18 to-transparent"
          style={{
            clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
          }}
          animate={{ 
            x: [0, -18, 0], 
            y: [0, 25, 0], 
            rotate: [0, -180, 0],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 22,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 4,
          }}
        />
        
        {/* Floating Elements */}
        <motion.div
          className="absolute top-1/3 right-1/4 w-4 h-4 bg-gradient-to-r from-cyan-300/60 to-sky-300/60 rounded-full shadow-lg shadow-cyan-300/30"
          animate={{ 
            y: [0, -30, 0],
            opacity: [0.8, 1, 0.8],
            scale: [1, 1.2, 1]
          }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
          }}
        />
        
        <motion.div
          className="absolute bottom-1/3 left-1/4 w-3 h-3 bg-gradient-to-r from-sky-300/60 to-cyan-300/60 rounded-full shadow-lg shadow-sky-300/30"
          animate={{ 
            y: [0, 25, 0],
            opacity: [0.7, 1, 0.7],
            scale: [1, 0.9, 1]
          }}
          transition={{
            duration: 20,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 2,
          }}
        />
        
        <motion.div
          className="absolute top-2/3 left-1/3 w-2.5 h-2.5 bg-gradient-to-r from-cyan-200/70 to-sky-200/70 rounded-full"
          animate={{ 
            y: [0, -20, 0],
            opacity: [0.6, 1, 0.6]
          }}
          transition={{
            duration: 16,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 5,
          }}
        />
        
        <motion.div
          className="absolute bottom-2/3 right-1/3 w-2 h-2 bg-gradient-to-r from-sky-200/70 to-cyan-200/70 rounded-full"
          animate={{ 
            y: [0, 18, 0],
            opacity: [0.7, 1, 0.7]
          }}
          transition={{
            duration: 14,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeInOut",
            delay: 7,
          }}
        />
      </div>
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <motion.h2 
          className="text-3xl md:text-4xl font-bold mb-6"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Ready to Write Your Success Story?
        </motion.h2>
        <motion.p 
          className="text-lg md:text-xl max-w-2xl mx-auto mb-8 text-sky-100"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          Let's discuss how Unite Group can partner with you to overcome your challenges and achieve your business
          ambitions.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true, amount: 0.3 }}
        >
          <Button
            asChild
            size="lg"
            className="bg-white text-sky-700 hover:bg-sky-50 font-semibold px-10 py-3 text-lg shadow-xl transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl"
          >
            <Link href="/contact">
              Get In Touch <ArrowRight size={20} className="ml-2" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
