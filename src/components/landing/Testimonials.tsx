'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'CEO, TechStart Solutions',
    company: 'TechStart Solutions',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Unite Group transformed our digital infrastructure completely. Their AI-powered solutions increased our operational efficiency by 300%. The team's expertise and dedication are unmatched.',
    rating: 5,
    industry: 'Technology'
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'Operations Director',
    company: 'Global Logistics Inc.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: 'The CRM system Unite Group implemented has revolutionized how we manage client relationships. Our sales team productivity increased by 250% within the first quarter.',
    rating: 5,
    industry: 'Logistics'
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    role: 'Marketing Director',
    company: 'Innovate Retail',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    content: 'Working with Unite Group was a game-changer. Their cloud migration service was seamless, and we saw immediate cost savings of 40% on our IT infrastructure.',
    rating: 5,
    industry: 'Retail'
  },
  {
    id: 4,
    name: 'Michael Thompson',
    role: 'CTO',
    company: 'FinTech Pioneers',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: 'The AI predictive analytics platform Unite Group built for us has given us a competitive edge. We can now forecast market trends with 95% accuracy.',
    rating: 5,
    industry: 'Finance'
  },
  {
    id: 5,
    name: 'Lisa Wang',
    role: 'Founder & CEO',
    company: 'HealthTech Innovations',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    content: 'Unite Group's expertise in healthcare technology is exceptional. They helped us achieve HIPAA compliance while improving our system performance by 200%.',
    rating: 5,
    industry: 'Healthcare'
  },
  {
    id: 6,
    name: 'James Anderson',
    role: 'VP of Engineering',
    company: 'EduTech Solutions',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    content: 'The custom learning management system Unite Group developed has transformed our business. Student engagement increased by 180% after implementation.',
    rating: 5,
    industry: 'Education'
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what industry leaders have to say about their experience with Unite Group.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-gray-200">
                  <Quote className="w-12 h-12" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-6 italic relative z-10">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback> 'use client'

import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    id: 1,
    name: 'Sarah Mitchell',
    role: 'CEO, TechStart Solutions',
    company: 'TechStart Solutions',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    content: 'Unite Group transformed our digital infrastructure completely. Their AI-powered solutions increased our operational efficiency by 300%. The team's expertise and dedication are unmatched.',
    rating: 5,
    industry: 'Technology'
  },
  {
    id: 2,
    name: 'David Chen',
    role: 'Operations Director',
    company: 'Global Logistics Inc.',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=David',
    content: 'The CRM system Unite Group implemented has revolutionized how we manage client relationships. Our sales team productivity increased by 250% within the first quarter.',
    rating: 5,
    industry: 'Logistics'
  },
  {
    id: 3,
    name: 'Emma Rodriguez',
    role: 'Marketing Director',
    company: 'Innovate Retail',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Emma',
    content: 'Working with Unite Group was a game-changer. Their cloud migration service was seamless, and we saw immediate cost savings of 40% on our IT infrastructure.',
    rating: 5,
    industry: 'Retail'
  },
  {
    id: 4,
    name: 'Michael Thompson',
    role: 'CTO',
    company: 'FinTech Pioneers',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Michael',
    content: 'The AI predictive analytics platform Unite Group built for us has given us a competitive edge. We can now forecast market trends with 95% accuracy.',
    rating: 5,
    industry: 'Finance'
  },
  {
    id: 5,
    name: 'Lisa Wang',
    role: 'Founder & CEO',
    company: 'HealthTech Innovations',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lisa',
    content: 'Unite Group's expertise in healthcare technology is exceptional. They helped us achieve HIPAA compliance while improving our system performance by 200%.',
    rating: 5,
    industry: 'Healthcare'
  },
  {
    id: 6,
    name: 'James Anderson',
    role: 'VP of Engineering',
    company: 'EduTech Solutions',
    image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=James',
    content: 'The custom learning management system Unite Group developed has transformed our business. Student engagement increased by 180% after implementation.',
    rating: 5,
    industry: 'Education'
  }
]

export default function Testimonials() {
  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            What Our Clients Say
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Don't just take our word for it. Here's what industry leaders have to say about their experience with Unite Group.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 text-gray-200">
                  <Quote className="w-12 h-12" />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <p className="text-gray-700 mb-6 italic relative z-10">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>

                  <div className="flex items-center">
                    <Avatar className="h-12 w-12 mr-4">
                      <AvatarImage src={testimonial.image} alt={testimonial.name} />
                      <AvatarFallback>{testimonial.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-gray-500">{testimonial.company}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {testimonial.industry}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center justify-center space-x-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">500+</p>
              <p className="text-gray-600">Happy Clients</p>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">98%</p>
              <p className="text-gray-600">Client Satisfaction</p>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-600">Support Available</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
.Value -replace "'", "'" </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold text-gray-900">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                      <p className="text-sm text-gray-500">{testimonial.company}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {testimonial.industry}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <div className="inline-flex items-center justify-center space-x-8">
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">500+</p>
              <p className="text-gray-600">Happy Clients</p>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">98%</p>
              <p className="text-gray-600">Client Satisfaction</p>
            </div>
            <div className="w-px h-12 bg-gray-300"></div>
            <div className="text-center">
              <p className="text-4xl font-bold text-gray-900">24/7</p>
              <p className="text-gray-600">Support Available</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
