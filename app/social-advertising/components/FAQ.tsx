'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'Which social media platforms do you advertise on?',
    answer: 'We manage advertising campaigns across all major social platforms including Facebook, Instagram, LinkedIn, TikTok, Twitter, YouTube, Snapchat, and Pinterest. We also stay current with emerging platforms and can expand to new channels as they become relevant to your audience and business objectives.'
  },
  {
    question: 'How much should I budget for social media advertising?',
    answer: 'Social advertising budgets vary based on your industry, target audience size, and objectives. We typically recommend starting with at least $3,000-$5,000 per month for meaningful results, though we can work with smaller budgets for specific campaigns. We focus on maximizing ROI regardless of budget size and provide transparent reporting on spend and performance.'
  },
  {
    question: 'How do you ensure my ads reach the right audience?',
    answer: 'We use advanced targeting strategies including demographic data, behavioral patterns, interests, lookalike audiences based on your best customers, and retargeting website visitors. Our AI-driven approach continuously optimizes targeting based on performance data, ensuring your ads reach users most likely to convert.'
  },
  {
    question: 'What types of ad creatives do you produce?',
    answer: 'We create a full range of ad formats including video ads, carousel ads, static images, stories, collection ads, and dynamic product ads. Our creative team produces platform-specific content optimized for each channel\'s unique requirements and audience behaviors, with multiple variations for A/B testing.'
  },
  {
    question: 'How quickly will I see results from social advertising?',
    answer: 'You\'ll typically see initial data and impressions within 24-48 hours of campaign launch. Meaningful performance insights usually emerge within 1-2 weeks, with significant optimization opportunities identified within the first month. Full campaign optimization and scaling generally occur over 60-90 days as we gather sufficient data and refine targeting.'
  },
  {
    question: 'How do you measure and report on campaign performance?',
    answer: 'We provide comprehensive reporting including reach, engagement, click-through rates, conversion rates, cost per acquisition, return on ad spend (ROAS), and attribution across the customer journey. You\'ll receive weekly performance updates and monthly strategic reports with actionable insights and optimization recommendations.'
  },
  {
    question: 'Can you help with social commerce and shopping ads?',
    answer: 'Absolutely! We specialize in social commerce including Instagram Shopping, Facebook Shops, Pinterest Product Rich Pins, and TikTok Shopping. We handle product catalog setup, dynamic retargeting campaigns, and shopping ad optimization to drive direct sales through social platforms.'
  },
  {
    question: 'Do you manage influencer marketing campaigns?',
    answer: 'Yes, we offer comprehensive influencer marketing services including influencer identification and vetting, campaign strategy development, contract negotiation, content approval, and performance tracking. We work with micro-influencers to celebrity partnerships depending on your brand and budget requirements.'
  },
  {
    question: 'How do you stay compliant with platform policies and regulations?',
    answer: 'We maintain strict compliance with all platform advertising policies, data privacy regulations (GDPR, CCPA), and industry standards. Our team stays updated on policy changes across all platforms and ensures all campaigns meet current guidelines. We also implement proper consent mechanisms and data handling practices.'
  },
  {
    question: 'What makes your social advertising approach different?',
    answer: 'Our approach combines data science with creative excellence. We use AI-driven optimization, advanced attribution modeling, and continuous testing to maximize performance. Unlike agencies that use one-size-fits-all strategies, we develop custom approaches based on your specific business model, audience, and growth objectives.'
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 bg-slate-950/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">Questions</span>
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about social media advertising
          </p>
        </motion.div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-blue-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-left text-lg font-semibold text-white">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 p-1">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-blue-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-blue-400" />
                    )}
                  </div>
                </div>
                
                {openIndex === index && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="mt-4 text-left"
                  >
                    <p className="text-gray-400 leading-relaxed">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}