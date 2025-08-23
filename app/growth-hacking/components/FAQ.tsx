'use client';

import { motion } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { useState } from 'react';

const faqs = [
  {
    question: 'What is growth hacking and how does it differ from traditional marketing?',
    answer: 'Growth hacking is a data-driven approach focused on rapid experimentation across marketing channels and product development to identify the most efficient ways to grow a business. Unlike traditional marketing, it emphasizes speed, scalability, and measurable results through continuous testing and optimization. We use scientific methods to find and scale what works, rather than relying on assumptions or long-term campaigns.'
  },
  {
    question: 'How quickly can I expect to see results from growth hacking?',
    answer: 'Growth hacking focuses on rapid experimentation with initial results typically visible within 2-4 weeks of implementation. We run weekly sprint cycles, meaning you\'ll see data and insights from our first experiments within days. However, sustainable growth requires continuous optimization over 3-6 months to establish scalable growth engines and compound effects.'
  },
  {
    question: 'What industries benefit most from growth hacking?',
    answer: 'While growth hacking originated in tech startups and SaaS companies, it\'s highly effective for e-commerce, marketplaces, mobile apps, B2B services, and any business with digital touchpoints seeking rapid, scalable growth. We\'ve successfully implemented growth strategies for businesses in healthcare, education, fintech, retail, and professional services.'
  },
  {
    question: 'What\'s included in your growth hacking services?',
    answer: 'Our comprehensive services include growth audits, experimentation frameworks, viral marketing campaigns, conversion optimization, retention strategies, referral programs, and analytics setup. We customize our approach based on your specific growth stage and objectives, typically including weekly experiments, bi-weekly reports, and monthly strategy sessions.'
  },
  {
    question: 'How do you measure growth hacking success?',
    answer: 'We use the AARRR (Pirate Metrics) framework: Acquisition, Activation, Retention, Revenue, and Referral. Key metrics include Customer Acquisition Cost (CAC), Lifetime Value (LTV), viral coefficient, activation rate, and Monthly Recurring Revenue (MRR) growth. We establish baseline metrics and set specific, measurable goals tailored to your business model.'
  },
  {
    question: 'What\'s the difference between growth hacking and growth marketing?',
    answer: 'Growth hacking is typically more experimental and scrappy, focusing on finding unconventional ways to achieve rapid growth with limited resources. Growth marketing is a more established discipline that scales proven tactics. We combine both approaches: using growth hacking to discover what works, then growth marketing to scale it systematically.'
  },
  {
    question: 'Do you require a minimum budget or contract length?',
    answer: 'We offer flexible engagement models starting from $5,000/month with a minimum 3-month commitment to ensure meaningful results. This allows sufficient time for experimentation, learning, and optimization. We also offer project-based engagements for specific growth challenges and comprehensive growth audits starting at $2,500.'
  },
  {
    question: 'How do you ensure data privacy and security during growth experiments?',
    answer: 'We adhere to strict data privacy standards including GDPR and Australian Privacy Principles. All experiments are designed with user privacy in mind, using anonymized data where possible. We implement secure tracking systems, obtain necessary consents, and ensure all growth tactics are ethical and compliant with platform policies.'
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
            Frequently Asked <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">Questions</span>
          </h2>
          <p className="text-xl text-gray-400">
            Everything you need to know about growth hacking
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
                className="w-full bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl p-6 hover:border-purple-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <h3 className="text-left text-lg font-semibold text-white">
                    {faq.question}
                  </h3>
                  <div className="flex-shrink-0 p-1">
                    {openIndex === index ? (
                      <Minus className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Plus className="w-5 h-5 text-purple-400" />
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