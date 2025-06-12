'use client'

import React, { useEffect, useRef } from 'react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowRight, Sparkles, Zap, Globe, Shield } from 'lucide-react'
import { useParams } from 'next/navigation'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  life: number
}

export default function AnimatedHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particles = useRef<Particle[]>([])
  const animationRef = useRef<number>()
  const mousePosition = useRef({ x: 0, y: 0 })
  
  const params = useParams()
  const locale = (params?.locale as string) || 'en'
  
  const { scrollY } = useScroll()
  const y = useTransform(scrollY, [0, 500], [0, 150])
  const opacity = useTransform(scrollY, [0, 300], [1, 0])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Initialize particles
    const colors = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981']
    for (let i = 0; i < 100; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      })
    }

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      mousePosition.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }
    }

    canvas.addEventListener('mousemove', handleMouseMove)

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.current.forEach((particle, index) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Mouse interaction
        const dx = mousePosition.current.x - particle.x
        const dy = mousePosition.current.y - particle.y
        const distance = Math.sqrt(dx * dx + dy * dy)
        
        if (distance < 100) {
          const force = (100 - distance) / 100
          particle.vx += (dx / distance) * force * 0.02
          particle.vy += (dy / distance) * force * 0.02
        }

        // Damping
        particle.vx *= 0.99
        particle.vy *= 0.99

        // Boundaries
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

        // Draw particle
        ctx.save()
        ctx.globalAlpha = particle.life
        ctx.fillStyle = particle.color
        ctx.shadowBlur = 10
        ctx.shadowColor = particle.color
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()

        // Connect nearby particles
        particles.current.slice(index + 1).forEach(otherParticle => {
          const dx = otherParticle.x - particle.x
          const dy = otherParticle.y - particle.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 100) {
            ctx.save()
            ctx.globalAlpha = (1 - distance / 100) * 0.2
            ctx.strokeStyle = particle.color
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.stroke()
            ctx.restore()
          }
        })
      })

      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      canvas.removeEventListener('mousemove', handleMouseMove)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        style={{ opacity: 0.5 }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/50 to-white z-10" />

      {/* Content */}
      <motion.div
        style={{ y, opacity }}
        className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center"
      >
        {/* Animated Badge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center space-x-2 bg-blue-50 rounded-full px-4 py-2 mb-8"
        >
          <Sparkles className="w-5 h-5 text-blue-600 animate-pulse" />
          <span className="text-sm font-medium text-blue-800">
            AI-Powered Enterprise Solutions
          </span>
        </motion.div>

        {/* Main Heading */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-bold text-gray-900 mb-6"
        >
          Transform Your Business
          <br />
          <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Into The Future
          </span>
        </motion.h1>

        {/* Subheading */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto"
        >
          Unite Group delivers cutting-edge technology solutions that empower businesses
          to achieve exponential growth through AI, automation, and innovation.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16"
        >
          <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white">
            <Link href={`/${locale}/book-consultation`}>
              Book Free Consultation
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="border-2">
            <Link href={`/${locale}/dashboard`}>
              Explore Dashboard
              <Zap className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </motion.div>

        {/* Feature Icons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
        >
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-3">
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Global Scale</h3>
            <p className="text-sm text-gray-600">Deploy worldwide in seconds</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-3">
              <Zap className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Lightning Fast</h3>
            <p className="text-sm text-gray-600">99.9% uptime guaranteed</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-gray-900">Enterprise Security</h3>
            <p className="text-sm text-gray-600">Bank-level encryption</p>
          </div>
        </motion.div>
      </motion.div>

      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 animate-gradient-shift" />
      </div>
    </section>
  )
}
