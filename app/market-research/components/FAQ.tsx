'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What types of market research do you conduct?',
    answer: 'We conduct comprehensive market research including quantitative surveys, qualitative interviews, focus groups, observational studies, market sizing analysis, consumer behavior research, brand studies, and competitive intelligence. Our approach combines primary research (original data collection) with secondary research (existing data analysis) to provide complete market insights.'
  },
  {
    question: 'How do you ensure the quality and reliability of your research data?',
    answer: 'We maintain strict quality standards through multiple validation methods including sample size calculations for statistical significance, bias mitigation techniques, data verification processes, peer review of methodologies, and compliance with industry research standards. All our research follows established statistical principles and ethical guidelines.'
  },
  {
    question: 'How long does a typical market research project take?',
    answer: 'Project timelines vary based on scope and complexity. Quick insights projects take 2-3 weeks, focused studies require 4-6 weeks, and comprehensive research projects span 8-12 weeks. We provide detailed timelines during project planning and offer expedited services for urgent strategic decisions.'
  },
  {
    question: 'What sample sizes do you typically use for surveys?',
    answer: 'Sample sizes depend on your target population, desired confidence level, and margin of error. For quantitative surveys, we typically use 300-1,000+ respondents for consumer studies and 100-500 for B2B research. We calculate statistically appropriate sample sizes based on your specific research objectives and budget considerations.'
  },
  {
    question: 'Can you conduct research in international markets?',
    answer: 'Yes, we conduct market research across global markets in 100+ countries and 25+ languages. Our international research capabilities include cultural adaptation of research instruments, local market expertise, regulatory compliance, and cultural nuance interpretation to ensure accurate and relevant insights for each market.'
  },
  {
    question: 'How do you handle data privacy and confidentiality?',
    answer: 'We strictly adhere to data privacy regulations including GDPR, CCPA, and local privacy laws. All participant data is anonymized, securely stored, and only used for research purposes. We obtain proper consent, maintain comprehensive NDAs, and follow industry best practices for data security and participant privacy protection.'
  },
  {
    question: 'What deliverables will I receive from a market research project?',
    answer: 'You\'ll receive a comprehensive package including an executive summary, detailed research report with findings and insights, data visualization dashboard, strategic recommendations, presentation materials, and access to raw data. We also provide post-delivery consultation to help interpret findings and develop implementation strategies.'
  },
  {
    question: 'How much does market research typically cost?',
    answer: 'Research costs vary based on methodology, sample size, geographic scope, and project complexity. Quick insights projects start around $5,000, focused studies range from $15,000-$50,000, and comprehensive research projects can range from $50,000-$150,000+. We provide detailed quotes based on your specific requirements and budget.'
  },
  {
    question: 'Do you provide ongoing market monitoring services?',
    answer: 'Yes, we offer continuous market monitoring including quarterly tracking studies, competitive intelligence updates, trend monitoring, consumer sentiment tracking, and market performance dashboards. Ongoing monitoring helps you stay current with market changes and track the impact of strategic initiatives over time.'
  },
  {
    question: 'How do you help implement research findings?',
    answer: 'Beyond delivering research reports, we provide strategic consultation to help translate insights into actionable strategies. This includes workshops to discuss findings, strategic planning sessions, implementation roadmaps, and ongoing support to ensure research insights drive meaningful business improvements and strategic decision-making.'
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
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">Questions</span>
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about market research
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
                className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-emerald-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-left text-lg font-semibold text-white">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 p-1">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-emerald-400" />
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