'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What is competitive analysis and why is it important?',
    answer: 'Competitive analysis is the systematic evaluation of your competitors\' strategies, strengths, weaknesses, and market positioning. It\'s crucial for understanding your market landscape, identifying opportunities, developing effective strategies, and maintaining competitive advantage. Our analysis helps you make informed decisions based on comprehensive market intelligence.'
  },
  {
    question: 'How do you identify and select competitors for analysis?',
    answer: 'We use a multi-layered approach to identify competitors including direct competitors (same products/services), indirect competitors (alternative solutions), and emerging threats. We analyze market share, target audiences, geographic presence, and business models to create a comprehensive competitive landscape map tailored to your specific market position.'
  },
  {
    question: 'What information sources do you use for competitive intelligence?',
    answer: 'We gather intelligence from multiple sources including public financial reports, company websites, social media presence, patent filings, job postings, customer reviews, industry reports, news articles, and market research databases. All our research methods are ethical and comply with legal standards and privacy regulations.'
  },
  {
    question: 'How long does a comprehensive competitive analysis take?',
    answer: 'A complete competitive analysis typically takes 6-8 weeks depending on the complexity of your market and number of competitors analyzed. We provide initial findings within 2 weeks and deliver regular progress updates throughout the process. For urgent strategic decisions, we can provide expedited analysis within 3-4 weeks.'
  },
  {
    question: 'What deliverables will I receive from the analysis?',
    answer: 'You\'ll receive a comprehensive report including competitor profiles, SWOT analysis, market positioning maps, benchmarking data, strategic recommendations, and an executive summary. We also provide ongoing monitoring dashboards and quarterly updates to track competitive movements and market changes.'
  },
  {
    question: 'How do you ensure the accuracy and reliability of your analysis?',
    answer: 'We use multiple data sources to cross-verify information, employ experienced analysts with industry expertise, and follow rigorous fact-checking processes. Our methodologies are based on proven frameworks like Porter\'s Five Forces and SWOT analysis. We clearly distinguish between verified facts and analytical interpretations in our reports.'
  },
  {
    question: 'Can you analyze competitors in international markets?',
    answer: 'Yes, we conduct competitive analysis across global markets. Our team has experience analyzing competitors in North America, Europe, Asia-Pacific, and emerging markets. We understand cultural nuances, regulatory differences, and local market dynamics that affect competitive strategies in different regions.'
  },
  {
    question: 'How do you handle confidential or sensitive information?',
    answer: 'We maintain strict confidentiality protocols and never engage in any unethical intelligence gathering. All information is sourced from publicly available sources or through legitimate business channels. We sign comprehensive NDAs and follow industry best practices for handling sensitive competitive intelligence.'
  },
  {
    question: 'How often should competitive analysis be updated?',
    answer: 'We recommend comprehensive analysis annually with quarterly monitoring updates. However, frequency depends on your industry dynamics - fast-moving sectors like technology may require more frequent analysis, while stable industries might need less frequent updates. We provide ongoing monitoring services to track key competitive movements.'
  },
  {
    question: 'What happens after the analysis is complete?',
    answer: 'Beyond delivering the report, we provide strategic consultation to help you implement findings, develop competitive strategies, and create action plans. We offer ongoing support including competitive monitoring, strategy refinement, and regular updates on market developments that could affect your competitive position.'
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
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Questions</span>
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about competitive analysis
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
                className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-orange-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-left text-lg font-semibold text-white">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 p-1">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-orange-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-orange-400" />
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