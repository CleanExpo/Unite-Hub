"use client";

import React from 'react';
import Link from 'next/link';
import { 
  AlertTriangle,
  Camera,
  Clock,
  FileText,
  Phone,
  Shield,
  CheckCircle,
  TrendingDown,
  Users,
  MapPin,
  Calendar,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function IncidentReporting() {
  const reportingRequirements = [
    {
      incident: "Death or Serious Injury",
      timeframe: "Immediately",
      method: "Phone WorkSafe",
      penalty: "$50,000+",
      digitalHelp: "Auto-dial emergency contacts"
    },
    {
      incident: "Dangerous Incident",
      timeframe: "Immediately",
      method: "Phone + Written",
      penalty: "$30,000",
      digitalHelp: "Guided reporting wizard"
    },
    {
      incident: "Work-Related Illness",
      timeframe: "Within 48 hours",
      method: "Online form",
      penalty: "$10,000",
      digitalHelp: "Pre-filled forms"
    },
    {
      incident: "Near Miss",
      timeframe: "Internal only",
      method: "Company records",
      penalty: "N/A",
      digitalHelp: "Trend analysis dashboard"
    }
  ];

  const digitalFeatures = [
    {
      feature: "One-Touch Reporting",
      description: "Report in under 60 seconds",
      benefit: "Never miss deadlines",
      stats: "95% faster"
    },
    {
      feature: "Photo & Video Evidence",
      description: "Capture scene instantly",
      benefit: "Complete documentation",
      stats: "3x more detail"
    },
    {
      feature: "GPS Location Tagging",
      description: "Automatic site location",
      benefit: "Accurate incident mapping",
      stats: "100% accuracy"
    },
    {
      feature: "Witness Statements",
      description: "Digital signatures on-site",
      benefit: "Immediate collection",
      stats: "Zero lost statements"
    },
    {
      feature: "Automatic Notifications",
      description: "Alert all stakeholders",
      benefit: "Instant escalation",
      stats: "< 1 min response"
    },
    {
      feature: "Root Cause Analysis",
      description: "Built-in investigation tools",
      benefit: "Prevent recurrence",
      stats: "67% reduction"
    }
  ];

  const reportingProcess = [
    {
      step: "Immediate Response",
      time: "0-5 minutes",
      actions: [
        "Ensure safety",
        "Provide first aid",
        "Secure the scene",
        "Call emergency services"
      ],
      digital: "Emergency contact list, GPS location"
    },
    {
      step: "Initial Report",
      time: "5-30 minutes",
      actions: [
        "Open incident form",
        "Basic details",
        "Photos of scene",
        "Witness details"
      ],
      digital: "Mobile app, voice-to-text, camera integration"
    },
    {
      step: "Investigation",
      time: "1-24 hours",
      actions: [
        "Interview witnesses",
        "Review procedures",
        "Identify causes",
        "Gather evidence"
      ],
      digital: "Investigation templates, evidence vault"
    },
    {
      step: "Corrective Actions",
      time: "1-7 days",
      actions: [
        "Implement controls",
        "Update procedures",
        "Training needs",
        "Monitor effectiveness"
      ],
      digital: "Action tracking, automated follow-ups"
    }
  ];

  const metrics = {
    reportingTime: { before: "4 hours", after: "15 minutes" },
    dataAccuracy: { before: "60%", after: "98%" },
    lostTimeInjuries: { before: "8/year", after: "2/year" },
    complianceRate: { before: "75%", after: "100%" }
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Incident Reporting System for Trades',
          description: 'Digital incident reporting system for trade businesses. Streamline workplace incident reporting, investigation tracking, and safety compliance.',
          provider: 'Unite Group',
          serviceType: 'Incident Reporting Software',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-orange-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/safety-compliance-software" className="text-gray-400 hover:text-white transition">
              Safety & Compliance
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-orange-400">Incident Reporting</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <AlertTriangle className="w-10 h-10 text-orange-400" />
              <span className="px-4 py-1 bg-orange-400/10 border border-orange-400/30 rounded-full text-orange-400 text-sm">
                Real-Time Reporting
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Report Incidents in{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                60 Seconds
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Never miss a reporting deadline. Capture, document, and submit 
              incident reports instantly from your phone with photo evidence and witness statements.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-orange-400 mb-2" />
                <div className="text-2xl font-bold text-white">60 sec</div>
                <div className="text-sm text-gray-400">To report</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Camera className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">Photos</div>
                <div className="text-sm text-gray-400">Included</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingDown className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">-67%</div>
                <div className="text-sm text-gray-400">Incidents</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Shield className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Compliant</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reporting Requirements */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Queensland <span className="gradient-text">Reporting Requirements</span>
            </h2>
            <p className="text-xl text-gray-400">
              Know your legal obligations
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full bg-white/5 backdrop-blur border border-white/10 rounded-xl overflow-hidden">
              <thead className="bg-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Incident Type</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Timeframe</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Method</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Penalty</th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-white">Digital Help</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {reportingRequirements.map((req, index) => (
                  <tr key={index} className="hover:bg-white/5 transition">
                    <td className="px-6 py-4 text-white font-semibold">{req.incident}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        req.timeframe === 'Immediately' ? 'bg-red-500/20 text-red-400' :
                        req.timeframe === 'Within 48 hours' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-blue-500/20 text-blue-400'
                      }`}>
                        {req.timeframe}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-300">{req.method}</td>
                    <td className="px-6 py-4 text-red-400">{req.penalty}</td>
                    <td className="px-6 py-4 text-green-400">{req.digitalHelp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Digital Features */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Digital <span className="gradient-text">Reporting Features</span>
            </h2>
            <p className="text-xl text-gray-400">
              Everything you need for complete incident documentation
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {digitalFeatures.map((feature, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-3">{feature.feature}</h3>
                <p className="text-gray-300 mb-4">{feature.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Benefit</span>
                    <span className="text-white">{feature.benefit}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Impact</span>
                    <span className="text-orange-400 font-semibold">{feature.stats}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reporting Process */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Step <span className="gradient-text">Incident Response</span>
            </h2>
            <p className="text-xl text-gray-400">
              From incident to resolution
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {reportingProcess.map((step, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center text-white font-bold">
                    {index + 1}
                  </div>
                  <span className="text-xs text-gray-400">{step.time}</span>
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{step.step}</h3>
                
                <ul className="space-y-2 mb-4">
                  {step.actions.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
                
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-orange-400">
                    <span className="font-semibold">Digital:</span> {step.digital}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After Metrics */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500/5 to-red-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              The <span className="gradient-text">Digital Difference</span>
            </h2>
            <p className="text-xl text-gray-400">
              Real results from Brisbane contractors
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-6">Before Digital</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Reporting Time</span>
                    <span className="text-red-400 font-semibold">{metrics.reportingTime.before}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Data Accuracy</span>
                    <span className="text-red-400 font-semibold">{metrics.dataAccuracy.before}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Lost Time Injuries</span>
                    <span className="text-red-400 font-semibold">{metrics.lostTimeInjuries.before}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Compliance Rate</span>
                    <span className="text-red-400 font-semibold">{metrics.complianceRate.before}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-green-400 mb-6">After Digital</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Reporting Time</span>
                    <span className="text-green-400 font-semibold">{metrics.reportingTime.after}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Data Accuracy</span>
                    <span className="text-green-400 font-semibold">{metrics.dataAccuracy.after}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Lost Time Injuries</span>
                    <span className="text-green-400 font-semibold">{metrics.lostTimeInjuries.after}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-white/5 rounded">
                    <span className="text-gray-300">Compliance Rate</span>
                    <span className="text-green-400 font-semibold">{metrics.complianceRate.after}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready for <span className="gradient-text">Instant Incident Reporting?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Never miss a deadline or lose critical evidence again
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-orange-500/30 transition-all transform hover:scale-105">
              Get Reporting Demo
            </Link>
            <Link href="/safety-compliance-software" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Safety Solutions
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}