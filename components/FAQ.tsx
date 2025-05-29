"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  {
    question: "What is AGI Auto Builder?",
    answer:
      "AGI Auto Builder is an AI-powered development platform that helps teams streamline their software development process from requirements gathering to deployment, using advanced AI techniques to accelerate development workflows.",
  },
  {
    question: "How does the AI-powered requirements analysis work?",
    answer:
      "Our AI analyzes your project documentation, identifies key requirements, dependencies, and priorities. It uses natural language processing to understand context and organize information in a structured way that makes development planning easier.",
  },
  {
    question: "Can I integrate AGI Auto Builder with my existing tools?",
    answer:
      "Yes, AGI Auto Builder offers integrations with popular development tools including GitHub, GitLab, Jira, Slack, and many others. Our API also allows for custom integrations with your specific toolchain.",
  },
  {
    question: "Is my code and data secure?",
    answer:
      "Absolutely. We implement industry-leading security practices including end-to-end encryption, regular security audits, and compliance with major security standards. Your code and data remain yours and are never used to train our models.",
  },
  {
    question: "Do you offer custom enterprise solutions?",
    answer:
      "Yes, our Enterprise plan includes custom solutions tailored to your organization's specific needs, including dedicated support, custom integrations, and advanced security features.",
  },
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 bg-agi-dark">
      <div className="mx-auto max-w-5xl px-4">
        <h2 className="mb-12 text-center text-3xl font-bold text-agi-blue">
          Frequently Asked Questions
        </h2>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded bg-agi-dark-light overflow-hidden"
            >
              <button
                className="w-full px-6 py-4 text-left flex justify-between items-center"
                onClick={() => toggleFAQ(index)}
              >
                <span className="font-medium">{faq.question}</span>
                {openIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-agi-blue" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-agi-blue" />
                )}
              </button>

              {openIndex === index && (
                <div className="px-6 pb-4 text-sm text-gray-300">
                  <p>{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
