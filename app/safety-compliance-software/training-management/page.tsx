'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, Check, ChevronRight, Shield, Award, Users, 
  BookOpen, Target, Clock, TrendingUp, AlertTriangle, 
  FileCheck, Calendar, BarChart3, Zap, Building, HardHat,
  UserCheck, Video, FileText, Award as Certificate, Download, Play
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function TrainingManagementPage() {
  const [activeModule, setActiveModule] = useState(0);

  const trainingModules = [
    {
      name: 'Working at Heights',
      duration: '4 hours',
      frequency: 'Annual',
      compliance: 'WHS Regulation 78',
      completion: 87
    },
    {
      name: 'Electrical Safety',
      duration: '2 hours',
      frequency: '2 years',
      compliance: 'AS/NZS 4836',
      completion: 92
    },
    {
      name: 'Manual Handling',
      duration: '1.5 hours',
      frequency: 'Annual',
      compliance: 'WHS Regulation 60',
      completion: 95
    },
    {
      name: 'Hazardous Materials',
      duration: '3 hours',
      frequency: '3 years',
      compliance: 'WHS Regulation 341',
      completion: 78
    }
  ];

  const complianceRequirements = [
    {
      trade: 'Electrical',
      mandatoryTraining: ['CPR', 'Test & Tag', 'Asbestos Awareness', 'Working at Heights'],
      licenseRenewals: ['Electrical License (3 years)', 'Contractor License (Annual)'],
      records: '5 years minimum'
    },
    {
      trade: 'Plumbing',
      mandatoryTraining: ['Confined Spaces', 'Gas Safety', 'Asbestos Awareness', 'Manual Handling'],
      licenseRenewals: ['Plumbing License (Annual)', 'Backflow Prevention (Annual)'],
      records: '7 years minimum'
    },
    {
      trade: 'Construction',
      mandatoryTraining: ['White Card', 'Working at Heights', 'Scaffold Safety', 'First Aid'],
      licenseRenewals: ['Builder License (Annual)', 'QBCC License (Annual)'],
      records: '5 years minimum'
    },
    {
      trade: 'HVAC',
      mandatoryTraining: ['Refrigerant Handling', 'Electrical Safety', 'Heights', 'Confined Spaces'],
      licenseRenewals: ['ARCTick (Annual)', 'Refrigerant License (2 years)'],
      records: '5 years minimum'
    }
  ];

  const features = [
    {
      icon: Calendar,
      title: 'Automated Scheduling',
      description: 'Never miss renewal dates with smart reminders',
      metric: '100% compliance rate'
    },
    {
      icon: Video,
      title: 'Mobile Learning',
      description: 'Complete training on-site via phone or tablet',
      metric: '3x faster completion'
    },
    {
      icon: Certificate,
      title: 'Digital Certificates',
      description: 'Instant verification and cloud storage',
      metric: 'Zero lost records'
    },
    {
      icon: UserCheck,
      title: 'Skills Matrix',
      description: 'Track team competencies at a glance',
      metric: '45% better allocation'
    },
    {
      icon: FileCheck,
      title: 'Audit Ready',
      description: 'One-click compliance reports for inspectors',
      metric: '2hr audit prep → 5min'
    },
    {
      icon: BarChart3,
      title: 'Training Analytics',
      description: 'Identify skill gaps and plan development',
      metric: '28% productivity gain'
    }
  ];

  const roiCalculator = {
    withoutSystem: {
      adminTime: '12 hrs/month',
      missedDeadlines: '3-4 per year',
      penaltyRisk: '$15,000 average',
      recordKeeping: '8 hrs/month',
      totalCost: '$8,400/year'
    },
    withSystem: {
      adminTime: '2 hrs/month',
      missedDeadlines: '0 per year',
      penaltyRisk: '$0',
      recordKeeping: 'Automated',
      totalCost: '$1,200/year',
      savings: '$7,200/year'
    }
  };

  const testimonials = [
    {
      company: 'Apex Electrical Brisbane',
      size: '12 electricians',
      quote: 'Cut our training admin from 2 days to 2 hours per month. The automated reminders alone saved us from $30K in potential compliance fines.',
      metric: '90% time saved on compliance'
    },
    {
      company: 'Gold Coast Plumbing Co',
      size: '8 staff',
      quote: 'Our team actually completes training now. The mobile app lets them do modules between jobs instead of weekend sessions.',
      metric: '100% training completion rate'
    }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Training Management System for Trades',
          description: 'Digital training management platform for trade businesses. Track employee certifications, safety training, and compliance requirements efficiently.',
          provider: 'Unite Group',
          serviceType: 'Training Management Software',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 lg:py-32">
          <div className="max-w-4xl">
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5" />
              <span className="text-orange-100 font-medium">Safety Training Management</span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Never Miss Another{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Training Deadline
              </span>
            </h1>
            
            <p className="text-xl mb-8 text-orange-50 leading-relaxed max-w-2xl">
              Automated training management for Queensland trades. Track licenses, certificates, 
              and competencies for your entire crew in one system.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-12">
              <Link
                href="https://unite-group.com/consultation"
                className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 rounded-xl font-bold hover:shadow-xl transition-all duration-300 group"
              >
                See Live Demo
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              
              <button className="inline-flex items-center justify-center px-8 py-4 bg-orange-600/20 text-white rounded-xl font-bold hover:bg-orange-600/30 transition-all duration-300 border border-orange-400/30">
                <Play className="mr-2 h-5 w-5" />
                Watch 2-Min Overview
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-orange-100">Compliance Rate</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">-85%</div>
                <div className="text-orange-100">Admin Time</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                <div className="text-3xl font-bold mb-1">$0</div>
                <div className="text-orange-100">Compliance Fines</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compliance Requirements by Trade */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Queensland Training Requirements{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                By Trade
              </span>
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Stay compliant with all mandatory training and license renewals
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {complianceRequirements.map((trade, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 border border-gray-200 hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">{trade.trade}</h3>
                  <HardHat className="h-8 w-8 text-orange-500" />
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">Mandatory Training:</h4>
                    <div className="flex flex-wrap gap-2">
                      {trade.mandatoryTraining.map((training, idx) => (
                        <span key={idx} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
                          {training}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-gray-700 mb-2">License Renewals:</h4>
                    <ul className="space-y-1">
                      {trade.licenseRenewals.map((license, idx) => (
                        <li key={idx} className="flex items-center text-gray-600">
                          <Certificate className="h-4 w-4 mr-2 text-orange-500" />
                          {license}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <FileText className="h-4 w-4 mr-2 text-orange-500" />
                      Record Keeping: {trade.records}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Training Module Dashboard */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-50 to-red-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Real-Time{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Training Dashboard
              </span>
            </h2>
            <p className="text-xl text-gray-600">
              Track all training and compliance in one view
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="grid lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold mb-6 text-gray-900">Active Training Modules</h3>
                <div className="space-y-4">
                  {trainingModules.map((module, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                        activeModule === index 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-200 hover:border-orange-300'
                      }`}
                      onClick={() => setActiveModule(index)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-gray-900">{module.name}</h4>
                        <span className={`text-sm font-medium ${
                          module.completion > 90 ? 'text-green-600' : 
                          module.completion > 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {module.completion}% Complete
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {module.duration}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {module.frequency}
                        </span>
                        <span className="flex items-center">
                          <Shield className="h-4 w-4 mr-1" />
                          {module.compliance}
                        </span>
                      </div>
                      
                      <div className="mt-3">
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-500 ${
                              module.completion > 90 ? 'bg-green-500' : 
                              module.completion > 80 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${module.completion}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-6 text-gray-900">Upcoming Deadlines</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
                      <div>
                        <div className="font-semibold text-gray-900">Working at Heights - 3 staff</div>
                        <div className="text-sm text-red-600">Expires in 5 days</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-red-500 text-white rounded-lg font-medium hover:bg-red-600 transition-colors">
                      Schedule Now
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                    <div className="flex items-center">
                      <AlertTriangle className="h-5 w-5 text-yellow-500 mr-3" />
                      <div>
                        <div className="font-semibold text-gray-900">Electrical License - J. Smith</div>
                        <div className="text-sm text-yellow-600">Renewal due in 2 weeks</div>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-yellow-500 text-white rounded-lg font-medium hover:bg-yellow-600 transition-colors">
                      Renew
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-xl">
                    <div className="flex items-center">
                      <Check className="h-5 w-5 text-green-500 mr-3" />
                      <div>
                        <div className="font-semibold text-gray-900">First Aid Certificates</div>
                        <div className="text-sm text-green-600">All staff compliant - next renewal in 45 days</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 p-4 bg-gradient-to-r from-orange-100 to-red-100 rounded-xl">
                  <h4 className="font-semibold text-gray-900 mb-2">Compliance Score</h4>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold text-orange-600">94%</div>
                    <div className="text-sm text-gray-600">
                      <div>✓ 47 of 50 requirements met</div>
                      <div>⚠ 3 expiring within 30 days</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                100% Compliance
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="group hover:scale-105 transition-all duration-300">
                <div className="bg-gradient-to-br from-gray-50 to-white rounded-2xl p-8 h-full border border-gray-200 hover:shadow-xl">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <feature.icon className="h-7 w-7 text-white" />
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600 mb-4">{feature.description}</p>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <span className="text-orange-600 font-bold">{feature.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Your Training Management{' '}
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                ROI Calculator
              </span>
            </h2>
            <p className="text-xl text-gray-300">
              See exactly how much you'll save with automated training management
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-red-400">Without System</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-red-500/20">
                  <span className="text-gray-300">Admin Time</span>
                  <span className="font-bold text-xl">{roiCalculator.withoutSystem.adminTime}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-red-500/20">
                  <span className="text-gray-300">Missed Deadlines</span>
                  <span className="font-bold text-xl text-red-400">{roiCalculator.withoutSystem.missedDeadlines}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-red-500/20">
                  <span className="text-gray-300">Penalty Risk</span>
                  <span className="font-bold text-xl text-red-400">{roiCalculator.withoutSystem.penaltyRisk}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-red-500/20">
                  <span className="text-gray-300">Record Keeping</span>
                  <span className="font-bold text-xl">{roiCalculator.withoutSystem.recordKeeping}</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-red-900/30 rounded-xl px-4 mt-6">
                  <span className="text-lg">Total Cost</span>
                  <span className="font-black text-2xl text-red-400">{roiCalculator.withoutSystem.totalCost}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-900/20 border border-green-500/30 rounded-2xl p-8">
              <h3 className="text-2xl font-bold mb-6 text-green-400">With Our System</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-green-500/20">
                  <span className="text-gray-300">Admin Time</span>
                  <span className="font-bold text-xl text-green-400">{roiCalculator.withSystem.adminTime}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-green-500/20">
                  <span className="text-gray-300">Missed Deadlines</span>
                  <span className="font-bold text-xl text-green-400">{roiCalculator.withSystem.missedDeadlines}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-green-500/20">
                  <span className="text-gray-300">Penalty Risk</span>
                  <span className="font-bold text-xl text-green-400">{roiCalculator.withSystem.penaltyRisk}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-green-500/20">
                  <span className="text-gray-300">Record Keeping</span>
                  <span className="font-bold text-xl text-green-400">{roiCalculator.withSystem.recordKeeping}</span>
                </div>
                <div className="flex justify-between items-center py-4 bg-green-900/30 rounded-xl px-4 mt-6">
                  <span className="text-lg">Annual Savings</span>
                  <span className="font-black text-2xl text-green-400">{roiCalculator.withSystem.savings}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link
              href="https://unite-group.com/consultation"
              className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300 group"
            >
              Calculate Your Exact Savings
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Brisbane Trades{' '}
              <span className="bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                Love Our System
              </span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 border border-orange-200">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-xl text-gray-900">{testimonial.company}</h3>
                    <p className="text-gray-600">{testimonial.size}</p>
                  </div>
                  <Award className="h-8 w-8 text-orange-500" />
                </div>
                
                <p className="text-gray-700 mb-6 text-lg italic">"{testimonial.quote}"</p>
                
                <div className="flex items-center justify-between pt-4 border-t border-orange-200">
                  <span className="text-orange-600 font-bold">{testimonial.metric}</span>
                  <div className="flex gap-1">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-orange-400 text-xl">★</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 via-red-500 to-pink-600 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-black mb-6">
            Start Your 30-Day{' '}
            <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
              Free Trial Today
            </span>
          </h2>
          
          <p className="text-xl mb-8 text-orange-50">
            No credit card required. Full system access. Expert onboarding included.
          </p>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/20">
            <h3 className="text-2xl font-bold mb-6">What's Included:</h3>
            <div className="grid md:grid-cols-2 gap-4 text-left">
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-400" />
                <span>Unlimited users & training modules</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-400" />
                <span>All Queensland compliance templates</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-400" />
                <span>Mobile app for field staff</span>
              </div>
              <div className="flex items-center">
                <Check className="h-5 w-5 mr-3 text-green-400" />
                <span>1-on-1 setup assistance</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="https://unite-group.com/consultation"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-orange-600 rounded-xl font-bold hover:shadow-xl transition-all duration-300 group"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <button className="inline-flex items-center justify-center px-8 py-4 bg-orange-600/20 text-white rounded-xl font-bold hover:bg-orange-600/30 transition-all duration-300 border border-orange-400/30">
              <Download className="mr-2 h-5 w-5" />
              Download Compliance Guide
            </button>
          </div>
        </div>
      </section>

      {/* Footer Navigation */}
      <footer className="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0">
              <Link href="/safety-compliance-software" className="text-orange-400 hover:text-orange-300 font-medium">
                ← Back to Safety & Compliance Software
              </Link>
            </div>
            
            <div className="flex gap-6">
              <Link href="/safety-compliance-software/digital-swms" className="hover:text-orange-400 transition-colors">
                Digital SWMS
              </Link>
              <Link href="/safety-compliance-software/incident-reporting" className="hover:text-orange-400 transition-colors">
                Incident Reporting
              </Link>
              <Link href="https://unite-group.com" className="hover:text-orange-400 transition-colors">
                Unite Group
              </Link>
            </div>
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}