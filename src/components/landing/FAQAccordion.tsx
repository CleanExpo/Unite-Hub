'use client';

import { useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

interface FAQAccordionProps {
  items: FAQItem[];
  categories: string[];
}

export function FAQAccordion({ items, categories }: FAQAccordionProps) {
  const [openItems, setOpenItems] = useState<Set<number>>(new Set([0, 1])); // First 2 open by default

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const groupedItems = categories.map((category) => ({
    category,
    items: items.filter((item) => item.category === category),
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {groupedItems.map((group) => (
        <div key={group.category} className="space-y-4">
          {/* Category Header */}
          <h3 className="text-lg font-bold text-secondary-500 uppercase tracking-wider mb-4">
            {group.category}
          </h3>

          {/* FAQ Items */}
          <div className="space-y-3">
            {group.items.map((item, itemIdx) => {
              const globalIndex = items.findIndex(
                (i) => i.question === item.question && i.category === item.category
              );
              const isOpen = openItems.has(globalIndex);

              return (
                <div
                  key={itemIdx}
                  className={`border rounded-lg overflow-hidden transition-all duration-300 ${
                    isOpen
                      ? 'border-secondary-500 shadow-sm'
                      : 'border-border-base hover:border-secondary-500/50'
                  }`}
                >
                  {/* Question */}
                  <button
                    onClick={() => toggleItem(globalIndex)}
                    className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    aria-expanded={isOpen}
                    aria-controls={`faq-answer-${globalIndex}`}
                  >
                    <span
                      className={`font-semibold text-base transition-colors ${
                        isOpen ? 'text-secondary-500' : 'text-text-primary'
                      }`}
                    >
                      {item.question}
                    </span>
                    <span
                      className={`text-secondary-500 text-2xl font-light transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : 'rotate-0'
                      }`}
                    >
                      {isOpen ? '−' : '+'}
                    </span>
                  </button>

                  {/* Answer */}
                  <div
                    id={`faq-answer-${globalIndex}`}
                    className="overflow-hidden transition-all duration-300"
                    style={{
                      maxHeight: isOpen ? '500px' : '0',
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <div className="p-4 pt-0 text-text-secondary text-sm leading-relaxed">
                      {item.answer}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// FAQ Schema for SEO
export function FAQSchemaMarkup({ items }: { items: FAQItem[] }) {
  const schemaData = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
    />
  );
}

// Predefined FAQ data
export const faqData: FAQItem[] = [
  // Getting Started
  {
    category: 'Getting Started',
    question: 'How long does setup take?',
    answer:
      'Under 2 minutes. Connect your email, select platforms, hit "Go." No coding required.',
  },
  {
    category: 'Getting Started',
    question: 'Is there a free trial?',
    answer:
      'Yes, 14 days free. No credit card required. Full feature access.',
  },
  {
    category: 'Getting Started',
    question: 'What\'s the learning curve?',
    answer:
      'Steep at first glance, but intuitive in practice. Most teams are productive within 1 hour.',
  },
  {
    category: 'Getting Started',
    question: 'Can I cancel anytime?',
    answer:
      'Absolutely. Month-to-month pricing, cancel in 30 seconds from settings.',
  },

  // Platform & Security
  {
    category: 'Platform & Security',
    question: 'Which platforms does Synthex support?',
    answer:
      '8 major platforms: LinkedIn, Instagram, Facebook, TikTok, YouTube, X/Twitter, Reddit, Pinterest. More coming.',
  },
  {
    category: 'Platform & Security',
    question: 'Is my data secure?',
    answer:
      'Enterprise-grade security: SOC 2 Type II, end-to-end encryption, zero-knowledge architecture.',
  },
  {
    category: 'Platform & Security',
    question: 'Do you store my credentials?',
    answer:
      'No. We use OAuth 2.0. Your credentials never touch our servers—only encrypted access tokens.',
  },
  {
    category: 'Platform & Security',
    question: 'What about GDPR compliance?',
    answer:
      'Fully GDPR compliant. Data residency in EU available. Transparent data processing agreements.',
  },

  // ROI & Results
  {
    category: 'ROI & Results',
    question: 'How much time does Synthex save?',
    answer:
      'Average: 4.5 hours per client per month per team member. See our case studies for specifics.',
  },
  {
    category: 'ROI & Results',
    question: 'What\'s the typical ROI?',
    answer:
      'Most customers break even in week 1-2. 3x ROI by month 3. See pricing page for calculator.',
  },
  {
    category: 'ROI & Results',
    question: 'Can I track results across platforms?',
    answer:
      'Yes. Real-time analytics dashboard showing engagement, clicks, conversions across all 8 platforms.',
  },
  {
    category: 'ROI & Results',
    question: 'What support do I get?',
    answer:
      'Email support (24/48hr response), knowledge base, video tutorials, monthly group office hours.',
  },
];
