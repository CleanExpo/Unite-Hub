"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Users,
  UserPlus,
  Heart,
  DollarSign,
  Trophy,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  ArrowRight,
  AlertTriangle,
  Award,
  Briefcase
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function HiringRetention() {
  const hiringFunnel = [
    {
      stage: "Job Ad",
      applicants: "100",
      conversion: "100%",
      bestPractices: [
        "Post on Seek + Indeed + Facebook",
        "Include salary range",
        "Highlight culture & benefits",
        "Use trade-specific language"
      ]
    },
    {
      stage: "Phone Screen",
      applicants: "25",
      conversion: "25%",
      bestPractices: [
        "5-minute calls max",
        "Verify licenses",
        "Check availability",
        "Gauge enthusiasm"
      ]
    },
    {
      stage: "Trade Test",
      applicants: "10",
      conversion: "40%",
      bestPractices: [
        "Practical skills test",
        "Safety knowledge check",
        "Problem-solving scenarios",
        "Time management"
      ]
    },
    {
      stage: "Culture Fit",
      applicants: "5",
      conversion: "50%",
      bestPractices: [
        "Meet the team",
        "Share company values",
        "Discuss growth path",
        "Check references"
      ]
    },
    {
      stage: "Offer",
      applicants: "2",
      conversion: "40%",
      bestPractices: [
        "Move fast (24hrs)",
        "Competitive package",
        "Clear expectations",
        "Sign-on bonus"
      ]
    }
  ];

  const retentionStrategies = [
    {
      strategy: "Competitive Pay",
      impact: "Critical",
      implementation: "Pay 10% above market + performance bonuses",
      result: "50% lower turnover",
      cost: "$8K/year per person"
    },
    {
      strategy: "Career Pathway",
      impact: "High",
      implementation: "Clear progression: Apprentice → Tradesman → Leading Hand → Supervisor",
      result: "73% stay 3+ years",
      cost: "$2K training/year"
    },
    {
      strategy: "Tool Allowance",
      impact: "High",
      implementation: "$2K/year tool allowance or company tools",
      result: "82% satisfaction",
      cost: "$2K/year per person"
    },
    {
      strategy: "Flexibility",
      impact: "High",
      implementation: "4-day weeks, RDOs, family-friendly",
      result: "91% retention",
      cost: "Minimal"
    },
    {
      strategy: "Recognition",
      impact: "Medium",
      implementation: "Monthly awards, public praise, team BBQs",
      result: "Improved morale",
      cost: "$500/month"
    }
  ];

  const compensationBenchmarks = [
    { role: "1st Year Apprentice", market: "$35-40K", top10: "$42-45K", package: "$45-50K" },
    { role: "4th Year Apprentice", market: "$55-60K", top10: "$62-68K", package: "$65-72K" },
    { role: "Qualified Tradesman", market: "$75-85K", top10: "$88-95K", package: "$90-105K" },
    { role: "Leading Hand", market: "$85-95K", top10: "$98-108K", package: "$105-120K" },
    { role: "Site Supervisor", market: "$95-110K", top10: "$115-125K", package: "$120-140K" }
  ];

  const onboardingChecklist = [
    { day: "Day 1", tasks: ["Safety induction", "Meet team", "Tools & uniform", "First job shadow"] },
    { day: "Week 1", tasks: ["Complete 5 jobs supervised", "System training", "Quality standards", "Safety quiz"] },
    { day: "Month 1", tasks: ["Solo simple jobs", "Customer interaction", "Paperwork training", "30-day review"] },
    { day: "Month 3", tasks: ["Full autonomy", "Performance review", "Pay review", "Growth plan"] }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Hiring and Retention for Trade Businesses',
          description: 'Strategic hiring and employee retention services for trade businesses. Build strong teams, reduce turnover, and create a positive workplace culture.',
          provider: 'Unite Group',
          serviceType: 'HR and Employee Retention Consulting',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/trade-business-scaling" className="text-gray-400 hover:text-white transition">
              Business Scaling
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-emerald-400">Hiring & Retention</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-10 h-10 text-emerald-400" />
              <span className="px-4 py-1 bg-emerald-400/10 border border-emerald-400/30 rounded-full text-emerald-400 text-sm">
                Build Your A-Team
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Hire & Keep{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Top Tradies
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Stop losing good workers to competitors. Build a hiring funnel that attracts quality tradies 
              and a culture that keeps them for years, not months.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <UserPlus className="w-6 h-6 text-emerald-400 mb-2" />
                <div className="text-2xl font-bold text-white">14 days</div>
                <div className="text-sm text-gray-400">Time to hire</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Heart className="w-6 h-6 text-red-400 mb-2" />
                <div className="text-2xl font-bold text-white">91%</div>
                <div className="text-sm text-gray-400">Retention rate</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <DollarSign className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">2.3x</div>
                <div className="text-sm text-gray-400">ROI on culture</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Trophy className="w-6 h-6 text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">4.8★</div>
                <div className="text-sm text-gray-400">Team satisfaction</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Hiring Funnel */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              The <span className="gradient-text">5-Stage Hiring Funnel</span>
            </h2>
            <p className="text-xl text-gray-400">
              From 100 applicants to 1 great hire
            </p>
          </div>

          <div className="space-y-6">
            {hiringFunnel.map((stage, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="grid lg:grid-cols-3 gap-6 items-center">
                  <div>
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <h3 className="text-xl font-bold text-white">{stage.stage}</h3>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-gray-400">Candidates:</span>
                      <span className="text-2xl font-bold text-emerald-400">{stage.applicants}</span>
                      <span className="text-gray-400">({stage.conversion})</span>
                    </div>
                  </div>
                  
                  <div className="lg:col-span-2">
                    <h4 className="text-sm font-semibold text-gray-400 mb-2">Best Practices</h4>
                    <div className="grid sm:grid-cols-2 gap-2">
                      {stage.bestPractices.map((practice, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{practice}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {index < hiringFunnel.length - 1 && (
                  <div className="flex justify-center mt-4">
                    <ArrowRight className="w-6 h-6 text-emerald-400 rotate-90" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Compensation Benchmarks */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Brisbane <span className="gradient-text">Pay Benchmarks 2024</span>
            </h2>
            <p className="text-xl text-gray-400">
              What you need to pay to attract and keep the best
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Role</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Market Average</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Top 10%</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Total Package</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {compensationBenchmarks.map((role, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{role.role}</td>
                    <td className="px-6 py-4 text-gray-300">{role.market}</td>
                    <td className="px-6 py-4 text-yellow-400">{role.top10}</td>
                    <td className="px-6 py-4 text-emerald-400 font-semibold">{role.package}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
            <p className="text-sm text-gray-300">
              <span className="font-semibold text-white">Total Package includes:</span> Base salary + super + tool allowance + vehicle/travel + bonuses
            </p>
          </div>
        </div>
      </section>

      {/* Retention Strategies */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              5 Proven <span className="gradient-text">Retention Strategies</span>
            </h2>
            <p className="text-xl text-gray-400">
              Keep your best people from jumping ship
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {retentionStrategies.map((strategy, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{strategy.strategy}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    strategy.impact === 'Critical' ? 'bg-red-500/20 text-red-400' :
                    strategy.impact === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {strategy.impact}
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">How to implement</p>
                    <p className="text-gray-300">{strategy.implementation}</p>
                  </div>
                  
                  <div className="flex items-center justify-between pt-3 border-t border-white/10">
                    <div>
                      <p className="text-sm text-gray-400">Result</p>
                      <p className="font-semibold text-emerald-400">{strategy.result}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Cost</p>
                      <p className="font-semibold text-white">{strategy.cost}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Onboarding Checklist */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              90-Day <span className="gradient-text">Onboarding Program</span>
            </h2>
            <p className="text-xl text-gray-400">
              Turn new hires into productive team members fast
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              {onboardingChecklist.map((phase, index) => (
                <div key={index} className="bg-white/5 rounded-xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Clock className="w-6 h-6 text-emerald-400" />
                    <h3 className="text-xl font-bold text-white">{phase.day}</h3>
                  </div>
                  <ul className="space-y-2">
                    {phase.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to Build Your <span className="gradient-text">Dream Team?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get our complete hiring & retention playbook
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105">
              Get Hiring Help
            </Link>
            <Link href="/trade-business-scaling" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Scaling Guide
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}