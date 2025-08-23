"use client";

import React from 'react';
import Link from 'next/link';
import SchemaMarkup from '@/components/SchemaMarkup';
import { 
  FileCheck,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  Smartphone,
  Download,
  Upload,
  Camera,
  ArrowRight,
  XCircle,
  WifiOff,
  Mic,
  QrCode,
  GitBranch,
  Copy,
  TrendingDown
} from 'lucide-react';

export default function DigitalSWMS() {
  const swmsRequirements = [
    {
      element: "Job Hazard Analysis",
      required: true,
      description: "Identify all potential hazards",
      digitalBenefit: "Pre-populated hazard library",
      penalty: "$3,600"
    },
    {
      element: "Risk Assessment Matrix",
      required: true,
      description: "Likelihood x Consequence scoring",
      digitalBenefit: "Auto-calculated risk scores",
      penalty: "$1,800"
    },
    {
      element: "Control Measures",
      required: true,
      description: "Hierarchy of controls for each risk",
      digitalBenefit: "Suggested controls database",
      penalty: "$3,600"
    },
    {
      element: "PPE Requirements",
      required: true,
      description: "Specific PPE for each task",
      digitalBenefit: "Visual PPE checklists",
      penalty: "$1,500"
    },
    {
      element: "Worker Sign-offs",
      required: true,
      description: "All workers must acknowledge",
      digitalBenefit: "Digital signatures with timestamps",
      penalty: "$3,000"
    },
    {
      element: "Emergency Procedures",
      required: true,
      description: "Site-specific emergency plans",
      digitalBenefit: "GPS-linked emergency contacts",
      penalty: "$1,800"
    }
  ];

  const swmsTemplates = [
    {
      category: "Electrical",
      templates: [
        "Switchboard installation",
        "Overhead power lines",
        "Underground cables",
        "Live electrical work",
        "Solar panel installation"
      ],
      customizations: "Voltage levels, isolation procedures"
    },
    {
      category: "Plumbing",
      templates: [
        "Confined space entry",
        "Hot water system",
        "Sewerage work",
        "Gas fitting",
        "Roof plumbing"
      ],
      customizations: "Permit requirements, gas pressures"
    },
    {
      category: "Construction",
      templates: [
        "Working at heights",
        "Excavation work",
        "Concrete pumping",
        "Scaffolding",
        "Demolition"
      ],
      customizations: "Fall distances, soil types"
    },
    {
      category: "HVAC",
      templates: [
        "Refrigerant handling",
        "Duct installation",
        "Rooftop units",
        "Asbestos areas",
        "Commercial kitchens"
      ],
      customizations: "Chemical types, access methods"
    }
  ];

  const digitalFeatures = [
    {
      feature: "Offline Mode",
      description: "Works without internet on site",
      benefit: "Never stuck without access",
      icon: WifiOff
    },
    {
      feature: "Photo Evidence",
      description: "Attach hazard photos instantly",
      benefit: "Visual proof of conditions",
      icon: Camera
    },
    {
      feature: "Voice-to-Text",
      description: "Speak instead of type",
      benefit: "5x faster completion",
      icon: Mic
    },
    {
      feature: "QR Code Access",
      description: "Instant SWMS retrieval",
      benefit: "No searching or printing",
      icon: QrCode
    },
    {
      feature: "Version Control",
      description: "Track all changes",
      benefit: "Audit trail for WorkSafe",
      icon: GitBranch
    },
    {
      feature: "Bulk Operations",
      description: "Apply to multiple jobs",
      benefit: "Save hours weekly",
      icon: Copy
    }
  ];

  const implementation = {
    week1: {
      title: "Setup & Import",
      tasks: [
        "Upload existing SWMS",
        "Customize templates",
        "Set up job types",
        "Configure approvals"
      ]
    },
    week2: {
      title: "Training",
      tasks: [
        "Supervisor training",
        "Worker app training",
        "Practice scenarios",
        "Q&A session"
      ]
    },
    week3: {
      title: "Pilot",
      tasks: [
        "Test on 5 jobs",
        "Gather feedback",
        "Refine process",
        "Address issues"
      ]
    },
    week4: {
      title: "Full Rollout",
      tasks: [
        "All jobs digital",
        "Remove paper forms",
        "Monitor compliance",
        "Celebrate success"
      ]
    }
  };

  const roi = {
    timeSaved: "8 hours/week",
    complianceRate: "100%",
    finesAvoided: "$13,300",
    paperworkReduction: "95%",
    incidentReduction: "67%"
  };

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Digital SWMS Management for Trades',
          description: 'Digital Safe Work Method Statements management system for trade businesses. Create, manage, and track SWMS compliance digitally with mobile access.',
          provider: 'Unite Group',
          serviceType: 'Digital SWMS Management Software',
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
            <span className="text-orange-400">Digital SWMS</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <FileCheck className="w-10 h-10 text-orange-400" />
              <span className="px-4 py-1 bg-orange-400/10 border border-orange-400/30 rounded-full text-orange-400 text-sm">
                100% Compliant SWMS
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Digital SWMS in{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                30 Seconds
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Stop wasting hours on paperwork. Create, sign, and submit 
              compliant SWMS from your phone in seconds, not hours.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-orange-400 mb-2" />
                <div className="text-2xl font-bold text-white">30 sec</div>
                <div className="text-sm text-gray-400">Per SWMS</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Shield className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">100%</div>
                <div className="text-sm text-gray-400">Compliant</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <FileCheck className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">500+</div>
                <div className="text-sm text-gray-400">Templates</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Smartphone className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">Mobile</div>
                <div className="text-sm text-gray-400">First design</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SWMS Requirements */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Mandatory <span className="gradient-text">SWMS Elements</span>
            </h2>
            <p className="text-xl text-gray-400">
              Every element required by WorkSafe Queensland
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {swmsRequirements.map((req, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3">
                    {req.required ? (
                      <AlertTriangle className="w-6 h-6 text-orange-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle className="w-6 h-6 text-green-400 flex-shrink-0" />
                    )}
                    <div>
                      <h3 className="text-lg font-bold text-white">{req.element}</h3>
                      <p className="text-sm text-gray-400 mt-1">{req.description}</p>
                    </div>
                  </div>
                  <span className="text-red-400 font-semibold">{req.penalty}</span>
                </div>
                
                <div className="pl-9">
                  <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                    <p className="text-sm text-green-400">
                      <span className="font-semibold">Digital Benefit:</span> {req.digitalBenefit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Template Library */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              500+ Pre-Built <span className="gradient-text">SWMS Templates</span>
            </h2>
            <p className="text-xl text-gray-400">
              Industry-specific, lawyer-approved, ready to use
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {swmsTemplates.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">{category.category}</h3>
                <ul className="space-y-2 mb-4">
                  {category.templates.map((template, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <FileCheck className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>{template}</span>
                    </li>
                  ))}
                </ul>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-xs text-gray-400">
                    <span className="text-white font-semibold">Customizable:</span> {category.customizations}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500/20 border border-orange-500/30 rounded-lg text-orange-400 font-semibold hover:bg-orange-500/30 transition">
              <Download className="w-5 h-5" />
              Access Full Template Library
            </Link>
          </div>
        </div>
      </section>

      {/* Implementation Timeline */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4-Week <span className="gradient-text">Implementation</span>
            </h2>
            <p className="text-xl text-gray-400">
              From paper chaos to digital compliance
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Object.entries(implementation).map(([week, details], index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-orange-400 font-bold capitalize">{week.replace(/(\d)/, ' $1')}</span>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                </div>
                
                <h3 className="text-xl font-bold text-white mb-4">{details.title}</h3>
                
                <ul className="space-y-2">
                  {details.tasks.map((task, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <ArrowRight className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                      <span>{task}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Metrics */}
      <section className="py-20 px-6 bg-gradient-to-br from-orange-500/5 to-red-500/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Digital SWMS <span className="gradient-text">ROI</span>
            </h2>
            <p className="text-xl text-gray-400">
              The numbers speak for themselves
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div className="text-center p-6 bg-white/5 rounded-xl">
                <Clock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">Time Saved</p>
                <p className="text-3xl font-bold text-white">{roi.timeSaved}</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl">
                <Shield className="w-8 h-8 text-green-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">Compliance Rate</p>
                <p className="text-3xl font-bold text-green-400">{roi.complianceRate}</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl">
                <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">Fines Avoided</p>
                <p className="text-3xl font-bold text-yellow-400">{roi.finesAvoided}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="text-center p-6 bg-white/5 rounded-xl">
                <FileCheck className="w-8 h-8 text-blue-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">Paperwork Reduction</p>
                <p className="text-3xl font-bold text-blue-400">{roi.paperworkReduction}</p>
              </div>
              <div className="text-center p-6 bg-white/5 rounded-xl">
                <TrendingDown className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                <p className="text-sm text-gray-400 mb-2">Incident Reduction</p>
                <p className="text-3xl font-bold text-purple-400">{roi.incidentReduction}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready for <span className="gradient-text">Digital SWMS?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Never write another SWMS by hand again
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-orange-500/30 transition-all transform hover:scale-105">
              Get SWMS Demo
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