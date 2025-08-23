'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Plus, Minus } from 'lucide-react';

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([0]);

  const faqs = [
    {
      question: 'What is agile marketing and how does it differ from traditional marketing?',
      answer: 'Agile marketing applies software development principles to marketing, emphasizing iterative campaigns, cross-functional collaboration, and rapid response to change. Unlike traditional marketing with long planning cycles, agile marketing works in short sprints (typically 1-4 weeks), tests quickly, learns fast, and adapts based on data. This approach enables teams to be more responsive to market changes and customer feedback while delivering consistent value.'
    },
    {
      question: 'How long does it take to implement agile marketing in my organization?',
      answer: 'Agile marketing transformation typically takes 3-6 months for full implementation, depending on team size and organizational complexity. You\'ll see initial improvements within 4-6 weeks of starting. We begin with a pilot team to validate the approach, run 2-3 sprints to establish processes, then gradually scale across the organization with ongoing coaching and support. The key is starting small and building momentum.'
    },
    {
      question: 'What are the main benefits of agile marketing for Brisbane businesses?',
      answer: 'Agile marketing delivers faster time-to-market (typically 50-70% reduction), improved campaign performance through continuous testing and optimization, better team collaboration and satisfaction, increased transparency and accountability, and the ability to quickly pivot strategies based on market feedback. Brisbane businesses particularly benefit from the ability to respond quickly to local market conditions and seasonal trends.'
    },
    {
      question: 'Do I need to change my entire marketing team structure?',
      answer: 'Not necessarily. Agile marketing can be implemented gradually, starting with pilot projects or specific teams. We help you assess your current structure and identify the best approach. Some organizations create cross-functional squads, while others adapt existing teams with new processes. The key is finding the right balance between structure and flexibility that works for your culture and business goals.'
    },
    {
      question: 'What tools do we need for agile marketing?',
      answer: 'While agile marketing is more about mindset and processes than tools, certain platforms can enhance your effectiveness. Common tools include project management software (Jira, Asana, Monday.com), collaboration platforms (Slack, Microsoft Teams), analytics dashboards, and content management systems. We help you evaluate your current tool stack and recommend improvements based on your specific needs and budget.'
    },
    {
      question: 'How do you measure success in agile marketing?',
      answer: 'We track both agile-specific metrics and traditional marketing KPIs. Agile metrics include team velocity (work completed per sprint), cycle time (idea to launch), burn-down rates, and team satisfaction scores. Marketing metrics include conversion rates, ROI, lead quality, and customer acquisition costs. The key is establishing baseline measurements and showing continuous improvement over time.'
    },
    {
      question: 'Can agile marketing work for B2B companies?',
      answer: 'Absolutely! Agile marketing is particularly effective for B2B companies dealing with longer sales cycles and complex decision-making processes. It enables better alignment between marketing and sales teams, faster response to lead feedback, and more targeted account-based marketing approaches. We\'ve successfully implemented agile marketing for numerous B2B companies in Brisbane across industries like technology, professional services, and manufacturing.'
    },
    {
      question: 'What if my team resists the change to agile marketing?',
      answer: 'Change resistance is common and expected. We address this through comprehensive change management, including clear communication about benefits, gradual implementation to reduce overwhelm, hands-on training and coaching, celebrating early wins to build momentum, and addressing individual concerns. Our experience shows that most teams embrace agile marketing once they experience the improved collaboration and faster results.'
    },
    {
      question: 'How much does agile marketing transformation cost?',
      answer: 'Investment varies based on organization size, complexity, and scope of transformation. Our agile marketing services start from $5,500 for team training up to $15,000+ for full organizational transformation. We offer customized packages and can work within your budget to deliver maximum value. The ROI typically pays for itself within 6-12 months through improved efficiency and campaign performance.'
    },
    {
      question: 'Do you provide ongoing support after the initial implementation?',
      answer: 'Yes, we offer various levels of ongoing support including monthly coaching sessions, quarterly health checks, advanced training modules, and access to our agile marketing community. Continuous improvement is core to agile methodology, so we help you refine processes, address new challenges, and scale practices as your organization grows. Many clients opt for our retainer programs for sustained success.'
    }
  ];

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <section className="py-20 bg-slate-950/50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl font-bold text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-300">
            Everything you need to know about agile marketing transformation
          </p>
        </motion.div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="bg-slate-900/50 backdrop-blur-sm border border-slate-800 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-300"
            >
              <button
                onClick={() => toggleItem(index)}
                className="w-full px-6 py-4 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:ring-inset"
              >
                <h3 className="text-lg font-semibold text-white pr-4">
                  {faq.question}
                </h3>
                <div className="flex-shrink-0">
                  {openItems.includes(index) ? (
                    <Minus className="w-5 h-5 text-purple-400" />
                  ) : (
                    <Plus className="w-5 h-5 text-purple-400" />
                  )}
                </div>
              </button>
              
              <motion.div
                initial={false}
                animate={{
                  height: openItems.includes(index) ? 'auto' : 0,
                  opacity: openItems.includes(index) ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                <div className="px-6 pb-4">
                  <p className="text-gray-300 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-center mt-16"
        >
          <div className="bg-slate-900/30 backdrop-blur-sm border border-slate-800 rounded-2xl p-8">
            <h3 className="text-2xl font-bold text-white mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-300 mb-6">
              Get personalized answers from our agile marketing experts
            </p>
            <a
              href="/contact"
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-300 shadow-lg hover:shadow-purple-500/25"
            >
              Schedule a Consultation
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}