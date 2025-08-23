"use client";

import React from 'react';
import Link from 'next/link';
import { 
  RefreshCw,
  Zap,
  GitBranch,
  Database,
  Clock,
  DollarSign,
  CheckCircle,
  ArrowRight,
  AlertTriangle,
  Play,
  Pause,
  Settings,
  TrendingUp
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function WorkflowAutomation() {
  const workflows = [
    {
      name: "Quote-to-Cash Workflow",
      trigger: "New quote created",
      steps: [
        "Send quote via email/SMS",
        "Follow up Day 3 if no response",
        "Follow up Day 7 with discount",
        "Convert to job on acceptance",
        "Schedule crew automatically",
        "Send invoice on completion",
        "Chase payment if overdue"
      ],
      timeSaved: "12 hrs/week",
      moneyImpact: "+$8,400/month"
    },
    {
      name: "New Lead Workflow",
      trigger: "Form submission/phone call",
      steps: [
        "Add to CRM instantly",
        "Send welcome SMS",
        "Assign to sales rep",
        "Book site visit",
        "Send quote within 24hrs",
        "Add to nurture sequence",
        "Track conversion"
      ],
      timeSaved: "8 hrs/week",
      moneyImpact: "+47% conversion"
    },
    {
      name: "Job Completion Workflow",
      trigger: "Job marked complete",
      steps: [
        "Generate invoice",
        "Send to customer",
        "Update inventory",
        "Log crew hours",
        "Request review (Day 3)",
        "Schedule follow-up",
        "Update P&L report"
      ],
      timeSaved: "6 hrs/week",
      moneyImpact: "14-day faster payment"
    }
  ];

  const integrations = [
    {
      from: "Website Forms",
      to: "CRM (ServiceM8/Tradify)",
      automation: "Instant lead capture",
      setup: "15 minutes"
    },
    {
      from: "CRM",
      to: "Accounting (Xero/MYOB)",
      automation: "Auto-sync invoices",
      setup: "30 minutes"
    },
    {
      from: "Calendar",
      to: "SMS Service",
      automation: "Appointment reminders",
      setup: "20 minutes"
    },
    {
      from: "Job Management",
      to: "Inventory",
      automation: "Stock updates",
      setup: "45 minutes"
    },
    {
      from: "Email",
      to: "Project Management",
      automation: "Task creation",
      setup: "25 minutes"
    }
  ];

  const zapierTemplates = [
    {
      name: "Quote Follow-Up Sequence",
      description: "Automatically follow up on quotes until accepted or declined",
      apps: ["ServiceM8", "Gmail", "Twilio"],
      preBuilt: true,
      monthlyValue: "$3,200"
    },
    {
      name: "Review Request Automation",
      description: "Request Google reviews 3 days after job completion",
      apps: ["Tradify", "Google Business", "SMS"],
      preBuilt: true,
      monthlyValue: "$1,800"
    },
    {
      name: "Invoice Payment Tracker",
      description: "Chase overdue invoices automatically",
      apps: ["Xero", "Email", "Slack"],
      preBuilt: true,
      monthlyValue: "$4,500"
    },
    {
      name: "Lead Distribution System",
      description: "Route leads to right team member based on location/type",
      apps: ["Web Forms", "CRM", "Calendar"],
      preBuilt: false,
      monthlyValue: "$2,400"
    }
  ];

  const metrics = [
    { label: "Average Setup Time", value: "2 hours", icon: Clock },
    { label: "Workflows Running", value: "24/7", icon: RefreshCw },
    { label: "ROI Timeframe", value: "7 days", icon: TrendingUp },
    { label: "Monthly Cost", value: "$29-99", icon: DollarSign }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Workflow Automation for Contractors',
          description: 'Complete workflow automation solutions for contractors. Automate end-to-end processes from lead generation to project completion and payment.',
          provider: 'Unite Group',
          serviceType: 'Workflow Automation Services',
          areaServed: ['Brisbane', 'Queensland', 'Australia']
        }}
      />
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5"></div>
        
        <div className="max-w-7xl mx-auto relative">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link href="/" className="text-gray-400 hover:text-white transition">Home</Link>
            <span className="text-gray-600">/</span>
            <Link href="/contractor-business-automation" className="text-gray-400 hover:text-white transition">
              Business Automation
            </Link>
            <span className="text-gray-600">/</span>
            <span className="text-purple-400">Workflow Automation</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <RefreshCw className="w-10 h-10 text-purple-400" />
              <span className="px-4 py-1 bg-purple-400/10 border border-purple-400/30 rounded-full text-purple-400 text-sm">
                Set & Forget Systems
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Build Workflows That{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Run Your Business
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Connect your tools and create intelligent workflows that handle quotes, 
              jobs, and payments automatically. No coding required - just drag, drop, and profit.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              {metrics.map((metric, index) => (
                <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                  <metric.icon className="w-6 h-6 text-purple-400 mb-2" />
                  <div className="text-2xl font-bold text-white">{metric.value}</div>
                  <div className="text-sm text-gray-400">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Top 3 Workflows */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              3 Essential <span className="gradient-text">Trade Workflows</span>
            </h2>
            <p className="text-xl text-gray-400">
              Start with these high-impact automations
            </p>
          </div>

          <div className="space-y-8">
            {workflows.map((workflow, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">{workflow.name}</h3>
                    <div className="flex items-center gap-2">
                      <Play className="w-4 h-4 text-green-400" />
                      <span className="text-sm text-gray-400">Trigger: {workflow.trigger}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-400 mb-1">Impact</div>
                    <div className="text-lg font-bold text-green-400">{workflow.moneyImpact}</div>
                    <div className="text-sm text-blue-400">{workflow.timeSaved} saved</div>
                  </div>
                </div>

                <div className="grid lg:grid-cols-7 gap-2 items-center">
                  {workflow.steps.map((step, i) => (
                    <React.Fragment key={i}>
                      <div className="bg-white/5 rounded-lg p-3 text-center">
                        <div className="text-xs text-purple-400 mb-1">Step {i + 1}</div>
                        <div className="text-sm text-gray-300">{step}</div>
                      </div>
                      {i < workflow.steps.length - 1 && (
                        <ArrowRight className="w-5 h-5 text-purple-400 mx-auto hidden lg:block" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Integration Map */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Connect <span className="gradient-text">Everything</span>
            </h2>
            <p className="text-xl text-gray-400">
              Your tools working together automatically
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {integrations.map((integration, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-purple-400" />
                    <GitBranch className="w-6 h-6 text-purple-400" />
                  </div>
                  <span className="text-xs text-green-400 font-semibold">{integration.setup}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm text-gray-400">From</div>
                  <div className="font-bold text-white">{integration.from}</div>
                  <ArrowRight className="w-4 h-4 text-purple-400 my-2" />
                  <div className="text-sm text-gray-400">To</div>
                  <div className="font-bold text-white">{integration.to}</div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-sm text-gray-300">{integration.automation}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zapier Templates */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Pre-Built <span className="gradient-text">Workflow Templates</span>
            </h2>
            <p className="text-xl text-gray-400">
              Copy these proven workflows in minutes
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {zapierTemplates.map((template, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{template.name}</h3>
                  {template.preBuilt && (
                    <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded">
                      PRE-BUILT
                    </span>
                  )}
                </div>
                
                <p className="text-gray-300 mb-4">{template.description}</p>
                
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.apps.map((app, i) => (
                    <span key={i} className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
                      {app}
                    </span>
                  ))}
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-white/10">
                  <span className="text-sm text-gray-400">Monthly Value</span>
                  <span className="text-lg font-bold text-green-400">{template.monthlyValue}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Setup Guide */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Start Your First <span className="gradient-text">Workflow in 30 Minutes</span>
            </h2>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Sign up for Zapier (Free)</h3>
                  <p className="text-gray-300">Start with the free plan - handles 100 tasks/month</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Connect Your First App</h3>
                  <p className="text-gray-300">Start with your CRM (ServiceM8, Tradify, etc)</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Choose a Template</h3>
                  <p className="text-gray-300">Use our "Quote Follow-Up" template to start</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-2">Test & Launch</h3>
                  <p className="text-gray-300">Send a test quote and watch the magic happen</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-center">
              <Link href="https://unitegroup.com.au/consultation" 
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
                Get Workflow Setup Help
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Automate Your Workflows?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            We'll build your first 3 workflows and train your team
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Start Automating Today
            </Link>
            <Link href="/contractor-business-automation" 
              className="px-8 py-4 bg-white/10 backdrop-blur border border-white/20 rounded-lg font-bold text-white hover:bg-white/20 transition">
              Back to Automation Hub
            </Link>
          </div>
        </div>
      </section>
      </div>
    </>
  );
}