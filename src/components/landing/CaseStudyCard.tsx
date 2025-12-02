'use client';

import { useState } from 'react';

interface MetricProps {
  label: string;
  before: string;
  after: string;
}

interface CaseStudyCardProps {
  company: string;
  industry: string;
  challenge: string;
  solution: string;
  metrics: MetricProps[];
  logoUrl?: string;
  testimonial: string;
  testimonialAuthor: string;
  delay?: number;
}

export function CaseStudyCard({
  company,
  industry,
  challenge,
  solution,
  metrics,
  testimonial,
  testimonialAuthor,
}: CaseStudyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="group relative bg-white rounded-2xl p-8 border border-[#e0e5ec] hover:border-[#347bf7] transition-all duration-300 h-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        transform: isHovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: isHovered
          ? '0 20px 40px -10px rgba(52, 123, 247, 0.2)'
          : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      }}
    >
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-2xl font-bold text-[#1a1a1a]">{company}</h3>
          <div className="text-2xl">📊</div>
        </div>
        <div className="inline-block px-3 py-1 rounded-full bg-[#347bf7]/10 text-[#347bf7] text-xs font-semibold">
          {industry}
        </div>
      </div>

      {/* Challenge & Solution */}
      <div className="mb-6 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#ff5722] text-lg">⚠️</span>
            <h4 className="text-sm font-bold text-[#666] uppercase tracking-wider">Challenge</h4>
          </div>
          <p className="text-[#666] text-sm leading-relaxed">{challenge}</p>
        </div>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[#00d4aa] text-lg">✓</span>
            <h4 className="text-sm font-bold text-[#666] uppercase tracking-wider">Solution</h4>
          </div>
          <p className="text-[#666] text-sm leading-relaxed">{solution}</p>
        </div>
      </div>

      {/* Metrics - Before/After */}
      <div className="mb-6 space-y-4">
        <h4 className="text-sm font-bold text-[#1a1a1a] uppercase tracking-wider mb-4">Results</h4>
        {metrics.map((metric, idx) => (
          <div key={idx} className="space-y-2">
            <p className="text-xs font-semibold text-[#666] uppercase">{metric.label}</p>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <div className="text-sm text-[#ff5722] font-medium line-through opacity-70">
                  {metric.before}
                </div>
              </div>
              <div className="text-[#00d4aa] text-sm">→</div>
              <div className="flex-1">
                <div className="text-lg text-[#00d4aa] font-bold">{metric.after}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Testimonial */}
      <div className="pt-6 border-t border-[#e0e5ec]">
        <blockquote className="text-[#666] text-sm italic leading-relaxed mb-3">
          "{testimonial}"
        </blockquote>
        <p className="text-xs font-semibold text-[#1a1a1a]">{testimonialAuthor}</p>
      </div>

      {/* Hover CTA */}
      <div
        className="absolute bottom-8 right-8 transition-opacity duration-300"
        style={{ opacity: isHovered ? 1 : 0 }}
      >
        <div className="flex items-center gap-2 text-[#347bf7] text-sm font-semibold">
          <span>Read Full Case Study</span>
          <span>→</span>
        </div>
      </div>
    </div>
  );
}
