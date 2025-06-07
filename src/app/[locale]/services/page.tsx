'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Code2, 
  Smartphone, 
  Cloud, 
  Shield, 
  Zap, 
  Users,
  Briefcase,
  Brain,
  Rocket,
  Target,
  Palette,
  HeartHandshake,
  Calendar
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
// Consultation booking functionality temporarily disabled

const services = [
  {
    id: 'web-development',
    icon: Code2,
    title: 'Web Development',
    description: 'Custom web applications built with modern frameworks and best practices',
    features: [
      'React, Next.js, Vue.js development',
      'Progressive Web Applications (PWA)',
      'E-commerce solutions',
      'API development and integration'
    ],
    color: 'from-blue-500 to-cyan-500'
  },
  {
    id: 'mobile-development',
    icon: Smartphone,
    title: 'Mobile Development',
    description: 'Native and cross-platform mobile applications for iOS and Android',
    features: [
      'React Native development',
      'Flutter applications',
      'Native iOS/Android apps',
      'App Store optimization'
    ],
    color: 'from-purple-500 to-pink-500'
  },
  {
    id: 'cloud-solutions',
    icon: Cloud,
    title: 'Cloud Solutions',
    description: 'Scalable cloud infrastructure and DevOps implementation',
    features: [
      'AWS, Azure, Google Cloud',
      'Kubernetes orchestration',
      'CI/CD pipelines',
      'Infrastructure as Code'
    ],
    color: 'from-green-500 to-teal-500'
  },
  {
    id: 'cybersecurity',
    icon: Shield,
    title: 'Cybersecurity',
    description: 'Comprehensive security solutions to protect your digital assets',
    features: [
      'Security audits and assessments',
      'Penetration testing',
      'Compliance implementation',
      'Security training'
    ],
    color: 'from-red-500 to-orange-500'
  },
  {
    id: 'ai-solutions',
    icon: Brain,
    title: 'AI & Machine Learning',
    description: 'Intelligent solutions powered by cutting-edge AI technology',
    features: [
      'Predictive analytics',
      'Natural Language Processing',
      'Computer vision',
      'Process automation'
    ],
    color: 'from-indigo-500 to-purple-500'
  },
  {
    id: 'consulting',
    icon: Briefcase,
    title: 'IT Consulting',
    description: 'Strategic technology consulting to drive digital transformation',
    features: [
      'Digital strategy development',
      'Technology roadmapping',
      'Architecture design',
      'Team augmentation'
    ],
    color: 'from-amber-500 to-yellow-500'
  }
]

export default function ServicesPage() {
  const handleBookConsultation = (service: { id: string; title: string }) => {
    // Redirect to contact page with service pre-selected
    window.location.href = `/contact?service=${service.id}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <section className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-6"
          >
            Our Services
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto"
          >
            Comprehensive technology solutions tailored to accelerate your business growth and digital transformation
          </motion.p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="h-full hover:shadow-2xl transition-shadow duration-300 group">
                  <CardHeader>
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${service.color} p-4 mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <service.icon className="w-full h-full text-white" />
                    </div>
                    <CardTitle className="text-2xl mb-2">{service.title}</CardTitle>
                    <CardDescription className="text-base">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {service.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-sm text-muted-foreground">
                          <Zap className="w-4 h-4 mr-2 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 mt-6">
                      <Button 
                        variant="outline" 
                        className="flex-1 group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                        onClick={() => handleBookConsultation({ id: service.id, title: service.title })}
                      >
                        <Calendar className="w-4 h-4 mr-2" />
                        Book Consultation
                      </Button>
                      <Button 
                        variant="ghost" 
                        className="px-3"
                        asChild
                      >
                        <Link href={`/contact?service=${service.id}`} title="More Info">
                          <Target className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-primary/10 to-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Users className="w-16 h-16 mx-auto mb-6 text-primary" />
            <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Business?</h2>
            <p className="text-xl text-muted-foreground mb-8">
              Let&apos;s discuss how our services can help you achieve your goals
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/contact">
                  Get Started Today
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/case-studies">
                  View Case Studies
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Consultation booking redirects to contact page */}
    </div>
  )
}
