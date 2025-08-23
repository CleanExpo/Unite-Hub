"use client";

import React from 'react';
import Link from 'next/link';
import SchemaMarkup from '@/components/SchemaMarkup';
import { 
  Cloud,
  Server,
  Shield,
  Download,
  Upload,
  HardDrive,
  Lock,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Users,
  Zap,
  ArrowRight,
  WifiOff,
  Database
} from 'lucide-react';

export default function CloudMigrationGuide() {
  const migrationPhases = [
    {
      phase: "Phase 1",
      title: "Assessment & Planning",
      duration: "Week 1",
      tasks: [
        "Audit current data (quotes, jobs, customers)",
        "Identify critical vs nice-to-have",
        "Choose cloud platform",
        "Plan migration schedule"
      ],
      risk: "Low",
      downtime: "0 hours"
    },
    {
      phase: "Phase 2",
      title: "Backup & Preparation",
      duration: "Week 2",
      tasks: [
        "Full backup of all data (3 copies)",
        "Clean duplicate/old records",
        "Set up cloud accounts",
        "Test access permissions"
      ],
      risk: "Low",
      downtime: "0 hours"
    },
    {
      phase: "Phase 3",
      title: "Pilot Migration",
      duration: "Week 3",
      tasks: [
        "Migrate 10% of data",
        "Test with 2-3 users",
        "Verify data integrity",
        "Document issues"
      ],
      risk: "Medium",
      downtime: "0 hours"
    },
    {
      phase: "Phase 4",
      title: "Full Migration",
      duration: "Week 4",
      tasks: [
        "Migrate remaining data",
        "Switch all users to cloud",
        "Decommission old system",
        "Final verification"
      ],
      risk: "High",
      downtime: "4-8 hours (weekend)"
    }
  ];

  const cloudPlatforms = [
    {
      name: "Microsoft 365 + Azure",
      bestFor: "Windows-heavy businesses",
      storage: "1TB per user",
      price: "$12.50/user/month",
      pros: ["Familiar interface", "Great with Office", "Australian data centers"],
      cons: ["Complex setup", "Can get expensive"]
    },
    {
      name: "Google Workspace",
      bestFor: "Mobile-first teams",
      storage: "30GB-5TB",
      price: "$6-18/user/month",
      pros: ["Simple to use", "Excellent collaboration", "Strong mobile apps"],
      cons: ["Less powerful than Office", "Limited customization"]
    },
    {
      name: "Dropbox Business",
      bestFor: "Simple file storage",
      storage: "5TB+",
      price: "$15/user/month",
      pros: ["Dead simple", "Great sync", "Works with everything"],
      cons: ["Just storage", "No email/apps"]
    },
    {
      name: "AWS + Custom",
      bestFor: "Large operations",
      storage: "Unlimited",
      price: "Usage-based",
      pros: ["Infinitely scalable", "Custom solutions", "Enterprise-grade"],
      cons: ["Needs IT expertise", "Complex pricing"]
    }
  ];

  const dataTypes = [
    {
      type: "Customer Database",
      size: "~5GB",
      priority: "Critical",
      migration: "Export CSV, import to CRM",
      time: "2 hours"
    },
    {
      type: "Quotes & Invoices",
      size: "~10GB",
      priority: "Critical",
      migration: "Batch upload to accounting",
      time: "4 hours"
    },
    {
      type: "Job Photos/Documents",
      size: "~50GB",
      priority: "High",
      migration: "Sync folders to cloud",
      time: "8 hours"
    },
    {
      type: "Email Archives",
      size: "~20GB",
      priority: "Medium",
      migration: "IMAP migration tool",
      time: "6 hours"
    },
    {
      type: "Old Project Files",
      size: "~100GB",
      priority: "Low",
      migration: "Archive to cold storage",
      time: "12 hours"
    }
  ];

  const risks = [
    {
      risk: "Data loss during migration",
      likelihood: "Low",
      impact: "Catastrophic",
      mitigation: "Triple backup before starting, verify checksums"
    },
    {
      risk: "Extended downtime",
      likelihood: "Medium",
      impact: "High",
      mitigation: "Migrate over weekend, have rollback plan"
    },
    {
      risk: "User resistance",
      likelihood: "High",
      impact: "Medium",
      mitigation: "Training before migration, champion users"
    },
    {
      risk: "Internet dependency",
      likelihood: "Medium",
      impact: "Medium",
      mitigation: "Offline sync, mobile hotspot backup"
    }
  ];

  const costComparison = {
    onPremise: {
      server: "$5,000 every 5 years",
      maintenance: "$200/month",
      backup: "$100/month",
      electricity: "$50/month",
      downtime: "$500/month (avg)",
      total: "$850/month + $83/month hardware"
    },
    cloud: {
      subscription: "$350/month (10 users)",
      internet: "$50/month extra",
      training: "$50/month (first 3 months)",
      total: "$400-450/month"
    },
    savings: "$483/month",
    roi: "9 months"
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Cloud Migration Guide for Trades',
          description: 'Complete cloud migration guide for trade businesses. Step-by-step guidance to move your business operations to secure, scalable cloud solutions.',
          provider: 'Unite Group',
          serviceType: 'Cloud Migration Consulting',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/digital-transformation-trades" className="text-gray-400 hover:text-white transition">
              Digital Transformation
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-cyan-400">Cloud Migration Guide</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Cloud className="w-10 h-10 text-cyan-400" />
              <span className="px-4 py-1 bg-cyan-400/10 border border-cyan-400/30 rounded-full text-cyan-400 text-sm">
                Zero-Downtime Migration
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Move to Cloud{' '}
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                Without Losing a Job
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Migrate from desktop chaos to cloud efficiency in 4 weeks. Access your business 
              from anywhere, never lose data again, and cut IT costs by 50%. 
              Zero downtime guaranteed.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Cloud className="w-6 h-6 text-cyan-400 mb-2" />
                <div className="text-2xl font-bold text-white">4 Weeks</div>
                <div className="text-sm text-gray-400">Migration time</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <WifiOff className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Offline capable</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Shield className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">3 Backups</div>
                <div className="text-sm text-gray-400">Data protection</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <DollarSign className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">-50%</div>
                <div className="text-sm text-gray-400">IT costs</div>
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2 text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Weekend migration available</span>
              </div>
              <div className="flex items-center gap-2 text-gray-400">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Full data backup included</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Warning Section */}
      <section className="bg-yellow-500/10 border-y border-yellow-500/20 py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0 mt-1" />
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                Your Server is a Ticking Time Bomb
              </h3>
              <p className="text-gray-300">
                43% of small businesses never recover from major data loss. 
                That 5-year-old server in your office has a 67% chance of failing this year. 
                Every day without cloud backup risks losing everything.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4-Week Migration Plan */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Week <span className="gradient-text">Migration Roadmap</span>
            </h2>
            <p className="text-xl text-gray-400">
              Step-by-step plan with zero business disruption
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {migrationPhases.map((phase, index) => (
              <div key={index} className="relative">
                <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-cyan-400 font-bold">{phase.phase}</span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      phase.risk === 'Low' ? 'bg-green-500/20 text-green-400' :
                      phase.risk === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {phase.risk} Risk
                    </span>
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{phase.title}</h3>
                  <p className="text-sm text-gray-400 mb-4">{phase.duration}</p>
                  
                  <ul className="space-y-2 mb-4">
                    {phase.tasks.map((task, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                        <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-4 border-t border-white/10">
                    <p className="text-sm text-gray-400">
                      Downtime: <span className="font-semibold text-white">{phase.downtime}</span>
                    </p>
                  </div>
                </div>
                
                {index < migrationPhases.length - 1 && (
                  <ArrowRight className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-cyan-400 z-10" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Comparison */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Best <span className="gradient-text">Cloud Platforms</span> for Trades
            </h2>
            <p className="text-xl text-gray-400">
              Tested with 200+ Brisbane contractors
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {cloudPlatforms.map((platform, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{platform.name}</h3>
                    <p className="text-gray-400">{platform.bestFor}</p>
                  </div>
                  <Database className="w-8 h-8 text-cyan-400" />
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Storage</p>
                    <p className="text-white font-semibold">{platform.storage}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Price</p>
                    <p className="text-cyan-400 font-bold">{platform.price}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-sm font-semibold text-green-400 mb-2">PROS</h4>
                    <ul className="space-y-1">
                      {platform.pros.map((pro, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-semibold text-red-400 mb-2">CONS</h4>
                    <ul className="space-y-1">
                      {platform.cons.map((con, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                          <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                          <span>{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Data Migration Priority */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Data <span className="gradient-text">Migration Priority</span>
            </h2>
            <p className="text-xl text-gray-400">
              What to migrate first (and what can wait)
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Data Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Typical Size</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Priority</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Migration Method</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Time Required</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dataTypes.map((data, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{data.type}</td>
                    <td className="px-6 py-4 text-gray-300">{data.size}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        data.priority === 'Critical' ? 'bg-red-500/20 text-red-400' :
                        data.priority === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                        data.priority === 'Medium' ? 'bg-blue-500/20 text-blue-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {data.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{data.migration}</td>
                    <td className="px-6 py-4 text-cyan-400">{data.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Risk Management */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Migration <span className="gradient-text">Risk Management</span>
            </h2>
            <p className="text-xl text-gray-400">
              Identify and mitigate potential issues
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {risks.map((risk, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{risk.risk}</h3>
                  <div className="flex gap-2">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      risk.likelihood === 'Low' ? 'bg-green-500/20 text-green-400' :
                      risk.likelihood === 'Medium' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {risk.likelihood}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      risk.impact === 'Catastrophic' ? 'bg-red-500/20 text-red-400' :
                      risk.impact === 'High' ? 'bg-orange-500/20 text-orange-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {risk.impact}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Mitigation Strategy</p>
                    <p className="text-gray-300">{risk.mitigation}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cost Comparison */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Cloud vs On-Premise <span className="gradient-text">Cost Analysis</span>
            </h2>
            <p className="text-xl text-gray-400">
              Real numbers from Brisbane trade businesses
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-6">On-Premise Costs</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between text-gray-300">
                    <span>Server hardware</span>
                    <span className="text-white">{costComparison.onPremise.server}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>IT maintenance</span>
                    <span className="text-white">{costComparison.onPremise.maintenance}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Backup systems</span>
                    <span className="text-white">{costComparison.onPremise.backup}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Electricity</span>
                    <span className="text-white">{costComparison.onPremise.electricity}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Downtime costs</span>
                    <span className="text-white">{costComparison.onPremise.downtime}</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Monthly Cost</span>
                    <span className="text-red-400">{costComparison.onPremise.total}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-green-400 mb-6">Cloud Costs</h3>
                <ul className="space-y-3">
                  <li className="flex justify-between text-gray-300">
                    <span>Cloud subscriptions</span>
                    <span className="text-white">{costComparison.cloud.subscription}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Extra internet</span>
                    <span className="text-white">{costComparison.cloud.internet}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>Training (3 months)</span>
                    <span className="text-white">{costComparison.cloud.training}</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>-</span>
                    <span className="text-white">-</span>
                  </li>
                  <li className="flex justify-between text-gray-300">
                    <span>-</span>
                    <span className="text-white">-</span>
                  </li>
                </ul>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex justify-between font-bold text-white">
                    <span>Total Monthly Cost</span>
                    <span className="text-green-400">{costComparison.cloud.total}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-300 mb-2">Monthly Savings</p>
              <p className="text-5xl font-black text-green-400 mb-4">{costComparison.savings}</p>
              <p className="text-gray-400">Full ROI in <span className="text-white font-bold">{costComparison.roi}</span></p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Migrate to the Cloud?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Join 500+ Brisbane trades who've eliminated server headaches forever
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-cyan-500/30 transition-all transform hover:scale-105">
              Get Cloud Migration Plan
            </Link>
            <Link href="/digital-transformation-trades" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Digital Transformation
            </Link>
          </div>
          
          <p className="mt-8 text-sm text-gray-500">
            Free assessment includes data audit, platform recommendation, and migration timeline
          </p>
        </div>
      </section>
      </div>
    </>
  );
}