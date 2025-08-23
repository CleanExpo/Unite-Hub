'use client';

import { motion } from 'framer-motion';
import { TrendingUp, Users, DollarSign, Clock, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

const caseStudies = [
  {
    company: 'TechStart SaaS',
    industry: 'B2B Software',
    challenge: 'Struggling with 5% monthly growth and high CAC',
    solution: 'Implemented product-led growth strategy with freemium model and viral referral loops',
    results: [
      { metric: 'Monthly Growth', value: '47%', icon: TrendingUp },
      { metric: 'CAC Reduction', value: '68%', icon: DollarSign },
      { metric: 'User Activation', value: '3.2x', icon: Users },
      { metric: 'Time to Value', value: '-73%', icon: Clock }
    ],
    testimonial: 'Unite Group transformed our growth trajectory. Their data-driven approach and rapid experimentation delivered results beyond our expectations.',
    author: 'Sarah Chen',
    role: 'CEO, TechStart',
    image: '/placeholder-logo.svg'
  },
  {
    company: 'EcoMarket',
    industry: 'E-commerce',
    challenge: 'Low repeat purchase rate and minimal organic growth',
    solution: 'Built gamified loyalty program with social sharing mechanics and personalized retention campaigns',
    results: [
      { metric: 'Repeat Purchases', value: '+156%', icon: TrendingUp },
      { metric: 'Viral Coefficient', value: '2.8x', icon: Users },
      { metric: 'LTV', value: '+234%', icon: DollarSign },
      { metric: 'Churn Rate', value: '-61%', icon: Clock }
    ],
    testimonial: 'The growth hacking strategies Unite Group implemented completely revolutionized our customer engagement and retention.',
    author: 'Michael Torres',
    role: 'Founder, EcoMarket',
    image: '/placeholder-logo.svg'
  },
  {
    company: 'FitTech App',
    industry: 'Mobile Health',
    challenge: 'High user acquisition costs and poor activation rates',
    solution: 'Redesigned onboarding flow, implemented habit-forming features, and created viral workout challenges',
    results: [
      { metric: 'User Activation', value: '+312%', icon: TrendingUp },
      { metric: 'Daily Active Users', value: '5.4x', icon: Users },
      { metric: 'App Store Rating', value: '4.8★', icon: TrendingUp },
      { metric: 'Organic Downloads', value: '+427%', icon: Clock }
    ],
    testimonial: 'Their growth hacking expertise helped us achieve product-market fit and scale to 1M users in just 6 months.',
    author: 'Jessica Lee',
    role: 'CPO, FitTech',
    image: '/placeholder-logo.svg'
  }
];

export default function CaseStudies() {
  return (
    <section id="case-studies" className="py-20 bg-gradient-to-b from-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Growth <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Success Stories</span>
          </h2>
          <p className="text-xl text-gray-400 max-w-3xl mx-auto">
            Real businesses, real growth, real results
          </p>
        </motion.div>

        <div className="space-y-12">
          {caseStudies.map((study, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300"
            >
              <div className="grid lg:grid-cols-2 gap-8">
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold text-lg">{study.company[0]}</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{study.company}</h3>
                      <p className="text-sm text-gray-400">{study.industry}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm font-semibold text-purple-400 mb-1">Challenge</p>
                      <p className="text-gray-300">{study.challenge}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-purple-400 mb-1">Solution</p>
                      <p className="text-gray-300">{study.solution}</p>
                    </div>
                  </div>
                  
                  <blockquote className="border-l-2 border-purple-500 pl-4 italic text-gray-300">
                    "{study.testimonial}"
                    <footer className="mt-2 text-sm text-gray-400">
                      — {study.author}, {study.role}
                    </footer>
                  </blockquote>
                </div>
                
                <div>
                  <p className="text-sm font-semibold text-purple-400 mb-4">Key Results</p>
                  <div className="grid grid-cols-2 gap-4">
                    {study.results.map((result, idx) => (
                      <div key={idx} className="bg-slate-800/50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <result.icon className="w-4 h-4 text-purple-400" />
                          <span className="text-sm text-gray-400">{result.metric}</span>
                        </div>
                        <p className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {result.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  
                  <Link
                    href={`/case-studies/${study.company.toLowerCase().replace(' ', '-')}` as any}
                    className="inline-flex items-center gap-2 mt-6 text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    View Full Case Study
                    <ArrowUpRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}