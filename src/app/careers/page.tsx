'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Users, 
  Rocket, 
  Heart,
  Coffee,
  Trophy,
  GraduationCap,
  Globe,
  ArrowRight
} from 'lucide-react'

const openPositions = [
  {
    id: 1,
    title: 'Senior Full Stack Developer',
    department: 'Engineering',
    location: 'Noida, India',
    type: 'Full-time',
    experience: '5+ years',
    skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
    description: 'Join our engineering team to build scalable enterprise solutions using cutting-edge technologies.'
  },
  {
    id: 2,
    title: 'AI/ML Engineer',
    department: 'AI & Research',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years',
    skills: ['Python', 'TensorFlow', 'PyTorch', 'MLOps', 'NLP'],
    description: 'Work on innovative AI solutions that power our next-generation products.'
  },
  {
    id: 3,
    title: 'Product Manager',
    department: 'Product',
    location: 'Noida, India',
    type: 'Full-time',
    experience: '4+ years',
    skills: ['Product Strategy', 'Agile', 'Data Analysis', 'User Research'],
    description: 'Drive product vision and strategy for our enterprise SaaS platform.'
  },
  {
    id: 4,
    title: 'DevOps Engineer',
    department: 'Infrastructure',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years',
    skills: ['Kubernetes', 'Docker', 'CI/CD', 'Terraform', 'AWS'],
    description: 'Build and maintain world-class infrastructure for our cloud platform.'
  },
  {
    id: 5,
    title: 'Senior UI/UX Designer',
    department: 'Design',
    location: 'Noida, India',
    type: 'Full-time',
    experience: '4+ years',
    skills: ['Figma', 'User Research', 'Prototyping', 'Design Systems'],
    description: 'Create beautiful and intuitive user experiences for enterprise applications.'
  },
  {
    id: 6,
    title: 'Customer Success Manager',
    department: 'Customer Success',
    location: 'Remote',
    type: 'Full-time',
    experience: '3+ years',
    skills: ['SaaS', 'Account Management', 'Technical Support', 'Communication'],
    description: 'Help our enterprise clients achieve success with our platform.'
  }
]

const benefits = [
  {
    icon: <Heart className="h-6 w-6" />,
    title: 'Health & Wellness',
    description: 'Comprehensive health insurance for you and your family, plus wellness programs'
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: 'Learning & Development',
    description: 'Annual learning budget, conference attendance, and certification programs'
  },
  {
    icon: <Globe className="h-6 w-6" />,
    title: 'Remote Work',
    description: 'Flexible work arrangements with remote-first culture'
  },
  {
    icon: <Coffee className="h-6 w-6" />,
    title: 'Work-Life Balance',
    description: 'Unlimited PTO, flexible hours, and mental health support'
  },
  {
    icon: <Trophy className="h-6 w-6" />,
    title: 'Performance Rewards',
    description: 'Competitive salary, equity options, and performance bonuses'
  },
  {
    icon: <Rocket className="h-6 w-6" />,
    title: 'Career Growth',
    description: 'Clear career paths and mentorship programs'
  }
]

export default function CareersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-3xl mx-auto"
          >
            <h1 className="text-5xl font-bold mb-6">
              Join Our Mission to Transform Business
            </h1>
            <p className="text-xl opacity-90 mb-8">
              Be part of a team that&apos;s building the future of enterprise technology. 
              We&apos;re looking for talented individuals who are passionate about innovation and impact.
            </p>
            <Button size="lg" variant="secondary" className="mr-4">
              View Open Positions
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Company Values */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Our Values</h2>
            <p className="text-xl text-gray-600">What drives us every day</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Collaboration</h3>
              <p className="text-gray-600">We succeed together through teamwork and mutual support</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Innovation</h3>
              <p className="text-gray-600">We push boundaries and embrace new ideas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Integrity</h3>
              <p className="text-gray-600">We act with honesty and transparency in all we do</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="text-center"
            >
              <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Excellence</h3>
              <p className="text-gray-600">We strive for the highest quality in everything</p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Open Positions */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Open Positions</h2>
            <p className="text-xl text-gray-600">Find your next opportunity with us</p>
          </motion.div>

          <div className="space-y-6">
            {openPositions.map((position, index) => (
              <motion.div
                key={position.id}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-300">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{position.title}</CardTitle>
                        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            <span>{position.department}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            <span>{position.location}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            <span>{position.type}</span>
                          </div>
                        </div>
                      </div>
                      <Link href={`/careers/${position.id}`}>
                        <Button className="mt-4 md:mt-0">
                          Apply Now
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">{position.description}</p>
                    <div className="flex flex-wrap gap-2">
                      {position.skills.map((skill) => (
                        <Badge key={skill} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Benefits & Perks</h2>
            <p className="text-xl text-gray-600">We take care of our team</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="text-blue-600 mb-4">{benefit.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{benefit.title}</h3>
                    <p className="text-gray-600">{benefit.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-blue-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl font-bold mb-4">Don&apos;t See the Right Role?</h2>
            <p className="text-xl text-gray-600 mb-8">
              We&apos;re always looking for talented people. Send us your resume and we&apos;ll keep you in mind for future opportunities.
            </p>
            <Button size="lg" variant="outline">
              Send Your Resume
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  )
}
