"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Shield,
  AlertTriangle,
  CheckCircle,
  FileCheck,
  Users,
  Clock,
  DollarSign,
  Smartphone,
  Database,
  TrendingDown,
  Award,
  ArrowRight,
  XCircle,
  BarChart3,
  ClipboardCheck,
  Star
} from 'lucide-react';
import SafetyChecklist from '@/components/SafetyChecklist';
import ROICalculator from '@/components/ROICalculator';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function SafetyComplianceSoftware() {
  const complianceRequirements = [
    {
      requirement: "SWMS (Safe Work Method Statements)",
      mandatory: true,
      penalty: "Up to $3,600 per breach",
      frequency: "Every job",
      digitalBenefit: "Pre-filled templates, instant access"
    },
    {
      requirement: "Toolbox Talks",
      mandatory: true,
      penalty: "Up to $1,800 per missed talk",
      frequency: "Daily",
      digitalBenefit: "Digital sign-offs, automatic reminders"
    },
    {
      requirement: "Incident Reporting",
      mandatory: true,
      penalty: "Up to $10,000 for non-reporting",
      frequency: "As required",
      digitalBenefit: "Instant notification, photo evidence"
    },
    {
      requirement: "License & Training Records",
      mandatory: true,
      penalty: "Up to $6,000 per unlicensed worker",
      frequency: "Ongoing",
      digitalBenefit: "Expiry alerts, central storage"
    },
    {
      requirement: "Site Inductions",
      mandatory: true,
      penalty: "Up to $3,000 per worker",
      frequency: "Per site",
      digitalBenefit: "QR code check-ins, video inductions"
    },
    {
      requirement: "PPE Registers",
      mandatory: true,
      penalty: "Up to $1,500 per violation",
      frequency: "Daily checks",
      digitalBenefit: "Photo verification, replacement tracking"
    }
  ];

  const softwareComparison = [
    {
      name: "SafetyCulture (iAuditor)",
      bestFor: "Small to medium trades",
      pricing: "$24/user/month",
      features: [
        "5000+ templates",
        "Mobile inspections",
        "Photo evidence",
        "Offline mode",
        "Basic reporting"
      ],
      pros: ["Easy to use", "Great mobile app", "Quick setup"],
      cons: ["Limited customization", "Basic analytics"],
      rating: 4.6
    },
    {
      name: "Hammertech",
      bestFor: "Large construction",
      pricing: "$99/user/month",
      features: [
        "Full safety suite",
        "Predictive analytics",
        "Subcontractor management",
        "Integration ready",
        "Advanced reporting"
      ],
      pros: ["Comprehensive", "Great for big projects", "AI insights"],
      cons: ["Expensive", "Complex setup"],
      rating: 4.7
    },
    {
      name: "SWMS Digital",
      bestFor: "Budget-conscious trades",
      pricing: "$19/month unlimited",
      features: [
        "SWMS templates",
        "Basic compliance",
        "Digital signatures",
        "Simple interface",
        "Cloud storage"
      ],
      pros: ["Affordable", "Australian-made", "Simple"],
      cons: ["Limited features", "Basic only"],
      rating: 4.3
    }
  ];

  const roi = {
    costs: {
      software: "$240/month (10 users)",
      training: "$500 one-time",
      setup: "$300 one-time"
    },
    savings: {
      paperwork: "$800/month (10 hrs)",
      incidents: "$2,500/month (reduced by 60%)",
      compliance: "$1,200/month (no fines)",
      insurance: "$400/month (15% discount)"
    },
    totalSaving: "$4,900/month",
    totalCost: "$240/month",
    netBenefit: "$4,660/month",
    payback: "5 days"
  };

  const metrics = [
    { icon: Shield, label: 'Incident Reduction', value: '-67%', color: 'text-green-400' },
    { icon: Clock, label: 'Time Saved', value: '12hrs/week', color: 'text-blue-400' },
    { icon: DollarSign, label: 'Fine Avoidance', value: '$14K/year', color: 'text-purple-400' },
    { icon: Award, label: 'Compliance Rate', value: '100%', color: 'text-yellow-400' }
  ];

  const implementationSteps = [
    {
      week: "Week 1",
      phase: "Setup & Import",
      tasks: [
        "Choose software platform",
        "Import worker details",
        "Upload existing documents",
        "Configure job types"
      ],
      milestone: "System ready"
    },
    {
      week: "Week 2",
      phase: "Training",
      tasks: [
        "Admin training (4 hrs)",
        "Supervisor training (2 hrs)",
        "Worker app training (1 hr)",
        "Practice runs"
      ],
      milestone: "Team trained"
    },
    {
      week: "Week 3",
      phase: "Pilot",
      tasks: [
        "Test on 5 jobs",
        "Gather feedback",
        "Adjust workflows",
        "Create shortcuts"
      ],
      milestone: "Process refined"
    },
    {
      week: "Week 4",
      phase: "Full Rollout",
      tasks: [
        "All jobs digital",
        "Remove paper forms",
        "Monitor compliance",
        "Generate first reports"
      ],
      milestone: "100% digital"
    }
  ];

  const caseStudy = {
    company: "Brisbane Commercial Electrical",
    size: "22 electricians, 5 apprentices",
    problem: "Failed WorkSafe audit, $18K in fines, lost major contract",
    solution: [
      "Implemented SafetyCulture across all crews",
      "Digital SWMS for every job type",
      "Daily toolbox talks with photo proof",
      "Real-time incident reporting",
      "Automated license expiry tracking"
    ],
    results: {
      compliance: "100% compliance achieved",
      incidents: "73% reduction in incidents",
      savings: "$4,200/month in admin time",
      insurance: "20% premium reduction",
      contracts: "Won $2.4M government contract"
    }
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Safety Compliance Software for Trades',
          description: 'Comprehensive safety compliance software solutions for trade businesses. Manage SWMS, incident reporting, training records, and workplace safety digitally.',
          provider: 'Unite Group',
          serviceType: 'Safety Compliance Software Solutions',
          areaServed: ['Brisbane', 'Queensland', 'Australia'],
          hasOfferCatalog: {
            name: 'Safety Compliance Services',
            itemListElement: [
              {
                name: 'Digital SWMS Management',
                description: 'Digital Safe Work Method Statements creation and management system'
              },
              {
                name: 'Incident Reporting System',
                description: 'Streamlined incident reporting and investigation tracking'
              },
              {
                name: 'Training Management Platform',
                description: 'Employee safety training tracking and certification management'
              }
            ]
          }
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <span className="text-orange-400">Safety & Compliance</span>
          </nav>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <Shield className="w-10 h-10 text-orange-400" />
                <span className="px-4 py-1 bg-orange-400/10 border border-orange-400/30 rounded-full text-orange-400 text-sm">
                  Zero Incidents, Zero Fines
                </span>
              </div>
              
              <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
                Never Fail a{' '}
                <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                  Safety Audit Again
                </span>
              </h1>
              
              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                Digital safety management that keeps your crew safe and your business compliant. 
                No more paper chaos, missed signatures, or surprise fines. 100% audit-ready, always.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <Link href="https://unitegroup.com.au/consultation" 
                  className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white text-center hover:shadow-2xl hover:shadow-orange-500/30 transition-all transform hover:scale-105">
                  Get Safety Audit
                </Link>
                <Link href="#software-comparison" 
                  className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white text-center hover:bg-white/20 transition">
                  Compare Software
                </Link>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>WorkSafe approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span>Insurance discounts</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
                  <metric.icon className={`w-8 h-8 ${metric.color} mb-3`} />
                  <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Requirements */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Queensland <span className="gradient-text">Compliance Requirements</span>
            </h2>
            <p className="text-xl text-gray-400">
              What you must track (and the fines if you don't)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Requirement</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Penalty</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Frequency</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Digital Benefit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {complianceRequirements.map((req, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {req.mandatory && <AlertTriangle className="w-4 h-4 text-orange-400" />}
                        <span className="text-white font-semibold">{req.requirement}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-red-400">{req.penalty}</td>
                    <td className="px-6 py-4 text-gray-300">{req.frequency}</td>
                    <td className="px-6 py-4 text-green-400">{req.digitalBenefit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-8 p-6 bg-red-500/10 border border-red-500/30 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-white mb-2">
                  Total Potential Fines: $36,100 Per Incident
                </h3>
                <p className="text-gray-300">
                  One failed audit can cost more than 10 years of safety software. 
                  Digital compliance isn't optional anymore - it's survival.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Software Comparison */}
      <section id="software-comparison" className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Top 3 <span className="gradient-text">Safety Software</span> for Trades
            </h2>
            <p className="text-xl text-gray-400">
              Tested by 200+ Brisbane contractors
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {softwareComparison.map((software, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-1">{software.name}</h3>
                    <p className="text-gray-400 text-sm">{software.bestFor}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                      <span className="text-white font-semibold">{software.rating}</span>
                    </div>
                  </div>
                </div>

                <div className="text-2xl font-bold text-orange-400 mb-6">{software.pricing}</div>

                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-400 mb-3">Features</h4>
                  <ul className="space-y-2">
                    {software.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2">Pros</h4>
                    <ul className="space-y-1">
                      {software.pros.map((pro, i) => (
                        <li key={i} className="text-xs text-gray-300">• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2">Cons</h4>
                    <ul className="space-y-1">
                      {software.cons.map((con, i) => (
                        <li key={i} className="text-xs text-gray-300">• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <Link href="https://unitegroup.com.au/consultation" 
                  className="block text-center px-6 py-3 bg-white/10 rounded-lg font-bold text-white hover:bg-white/20 transition">
                  Get Demo
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Week <span className="gradient-text">Implementation Plan</span>
            </h2>
            <p className="text-xl text-gray-400">
              Go from paper to digital in 28 days
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {implementationSteps.map((step, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-orange-400 font-bold">{step.week}</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{step.phase}</h3>
                
                <ul className="space-y-2 mb-6">
                  {step.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm font-semibold text-green-400">{step.milestone}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Case Study */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              From Fines to <span className="gradient-text">Full Compliance</span>
            </h2>
            <p className="text-xl text-gray-400">
              {caseStudy.company} transformation story
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-4">The Crisis</h3>
                <p className="text-gray-300 mb-6">{caseStudy.problem}</p>
                
                <h3 className="text-xl font-bold text-white mb-4">The Solution</h3>
                <ul className="space-y-2">
                  {caseStudy.solution.map((item, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-300">
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">The Results</h3>
                <div className="space-y-4">
                  {Object.entries(caseStudy.results).map(([key, value], index) => (
                    <div key={index} className="p-4 bg-white/5 rounded-lg">
                      <p className="text-sm text-gray-400 mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                      <p className="text-lg font-bold text-green-400">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500/5 to-red-500/5">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <h2 className="text-3xl font-black mb-6 text-center">
              Safety Software <span className="gradient-text">ROI Calculator</span>
            </h2>
            
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-lg font-bold text-red-400 mb-4">Monthly Costs</h3>
                <ul className="space-y-2">
                  {Object.entries(roi.costs).map(([key, value], index) => (
                    <li key={index} className="flex justify-between text-gray-300">
                      <span className="capitalize">{key}</span>
                      <span className="text-white">{value}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Cost</span>
                    <span className="text-red-400">{roi.totalCost}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-bold text-green-400 mb-4">Monthly Savings</h3>
                <ul className="space-y-2">
                  {Object.entries(roi.savings).map(([key, value], index) => (
                    <li key={index} className="flex justify-between text-gray-300">
                      <span className="capitalize">{key}</span>
                      <span className="text-white">{value}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Savings</span>
                    <span className="text-green-400">{roi.totalSaving}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-300 mb-2">Net Monthly Benefit</p>
              <p className="text-5xl font-black text-green-400 mb-2">{roi.netBenefit}</p>
              <p className="text-gray-400">Payback period: <span className="text-white font-bold">{roi.payback}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Safety Checklist */}
      <section className="py-20 px-6 bg-gray-900">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Your <span className="gradient-text">Compliance Checklist</span>
          </h2>
          <SafetyChecklist />
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-6 bg-gradient-to-br from-gray-900 to-black">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Calculate Your <span className="gradient-text">Safety ROI</span>
          </h2>
          <ROICalculator industry="trades" calculatorType="safety" />
        </div>
      </section>

      {/* Sub-Pages Navigation */}
      <section className="py-20 px-6 bg-gradient-to-t from-black/50 to-transparent">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-black text-center mb-12">
            Complete <span className="gradient-text">Safety Solutions</span>
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/safety-compliance-software/digital-swms" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <FileCheck className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                Digital SWMS
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Pre-filled templates for every job type
              </p>
              <span className="text-orange-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/safety-compliance-software/incident-reporting" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <AlertTriangle className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                Incident Reporting
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Real-time reporting with photo evidence
              </p>
              <span className="text-orange-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>

            <Link href="/safety-compliance-software/training-management" 
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 hover:bg-white/10 transition">
              <Award className="w-8 h-8 text-orange-400 mb-4" />
              <h3 className="text-xl font-bold text-white mb-2 group-hover:text-orange-400 transition">
                Training Management
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                Track licenses, certifications, and training
              </p>
              <span className="text-orange-400 text-sm font-semibold flex items-center gap-1">
                Learn more <ArrowRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready for <span className="gradient-text">100% Compliance?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Never worry about safety audits or WorkSafe fines again
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-orange-500/30 transition-all transform hover:scale-105">
              Get Free Safety Audit
            </Link>
            <Link href="https://unitegroup.com.au/services" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              View All Services
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free audit includes compliance gaps, software recommendations, and implementation plan
          </p>
        </div>
      </section>
      </div>
    </>
  );
}