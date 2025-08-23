"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Settings,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  BarChart3,
  Target,
  Zap,
  FileText,
  Users,
  Package,
  Truck
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function ProcessOptimization() {
  const processes = [
    {
      process: "Quote to Cash",
      currentTime: "14 days",
      optimizedTime: "7 days",
      steps: [
        { name: "Lead capture", current: "Manual entry", optimized: "Auto-capture", saving: "30 min" },
        { name: "Site visit", current: "Drive twice", optimized: "Virtual + once", saving: "2 hrs" },
        { name: "Quote creation", current: "2 hours", optimized: "15 minutes", saving: "1.75 hrs" },
        { name: "Follow-up", current: "Manual calls", optimized: "Auto sequence", saving: "1 hr" },
        { name: "Job scheduling", current: "Phone tag", optimized: "Online booking", saving: "45 min" },
        { name: "Invoicing", current: "End of week", optimized: "Same day", saving: "3 days" },
        { name: "Payment", current: "30 days", optimized: "14 days", saving: "16 days" }
      ],
      impact: "$47,000/month faster cash flow"
    },
    {
      process: "Job Execution",
      currentTime: "8 hours",
      optimizedTime: "6 hours",
      steps: [
        { name: "Morning prep", current: "Scramble for info", optimized: "Pre-loaded tablets", saving: "20 min" },
        { name: "Travel", current: "Get lost/wrong address", optimized: "GPS + verified address", saving: "15 min" },
        { name: "Materials", current: "Multiple trips", optimized: "Pre-picked packs", saving: "45 min" },
        { name: "Documentation", current: "Paper forms", optimized: "Digital + photos", saving: "20 min" },
        { name: "Customer sign-off", current: "Chase later", optimized: "On-site digital", saving: "30 min" },
        { name: "Clean up", current: "Rush job", optimized: "Systematic", saving: "10 min" }
      ],
      impact: "+3 jobs per crew per week"
    }
  ];

  const bottlenecks = [
    {
      issue: "Quote approval delays",
      frequency: "67% of quotes",
      rootCause: "No follow-up system",
      solution: "3-7-14 day auto follow-up",
      result: "+31% conversion"
    },
    {
      issue: "Double-booked crews",
      frequency: "3x per week",
      rootCause: "Manual calendar",
      solution: "Central scheduling system",
      result: "Zero conflicts"
    },
    {
      issue: "Missing materials",
      frequency: "40% of jobs",
      rootCause: "No inventory tracking",
      solution: "Job packs + alerts",
      result: "-2 hrs per job"
    },
    {
      issue: "Invoice delays",
      frequency: "5-7 days average",
      rootCause: "Batch processing",
      solution: "Auto-generate on completion",
      result: "Same day invoicing"
    },
    {
      issue: "Payment collection",
      frequency: "45 day average",
      rootCause: "No reminders",
      solution: "Auto chase sequence",
      result: "14 day average"
    }
  ];

  const optimizationTools = [
    {
      category: "Process Mapping",
      tools: [
        { name: "Miro", purpose: "Visual workflows", price: "Free-$16/user" },
        { name: "Lucidchart", purpose: "Process diagrams", price: "$7.95/user" }
      ]
    },
    {
      category: "Time Tracking",
      tools: [
        { name: "Toggl", purpose: "Task timing", price: "$10/user" },
        { name: "RescueTime", purpose: "Automatic tracking", price: "$12/user" }
      ]
    },
    {
      category: "Analytics",
      tools: [
        { name: "Google Analytics", purpose: "Website metrics", price: "Free" },
        { name: "Databox", purpose: "Business KPIs", price: "$72/month" }
      ]
    }
  ];

  const kpis = [
    { metric: "Quote to cash cycle", target: "< 7 days", current: "14 days" },
    { metric: "First response time", target: "< 30 min", current: "4 hours" },
    { metric: "Jobs per day per crew", target: "4", current: "2.5" },
    { metric: "Invoice to payment", target: "14 days", current: "45 days" },
    { metric: "Customer satisfaction", target: "4.8★", current: "3.9★" },
    { metric: "Crew utilization", target: "85%", current: "62%" }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Process Optimization for Contractors',
          description: 'Business process optimization services for contractors. Streamline operations, eliminate bottlenecks, and maximize efficiency across all business functions.',
          provider: 'Unite Group',
          serviceType: 'Business Process Optimization',
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
            <span className="text-purple-400">Process Optimization</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Settings className="w-10 h-10 text-purple-400" />
              <span className="px-4 py-1 bg-purple-400/10 border border-purple-400/30 rounded-full text-purple-400 text-sm">
                Efficiency Engineering
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Eliminate Every{' '}
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                Wasted Minute
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Redesign your business processes from the ground up. Cut cycle times by 50%, 
              complete 40% more jobs, and get paid 3x faster.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Clock className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">-50%</div>
                <div className="text-sm text-gray-400">Cycle time</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">+40%</div>
                <div className="text-sm text-gray-400">Jobs completed</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <DollarSign className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">3x</div>
                <div className="text-sm text-gray-400">Faster payment</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Users className="w-6 h-6 text-cyan-400 mb-2" />
                <div className="text-2xl font-bold text-white">85%</div>
                <div className="text-sm text-gray-400">Utilization</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Deep Dives */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Process <span className="gradient-text">Transformation Maps</span>
            </h2>
            <p className="text-xl text-gray-400">
              Step-by-step optimization of your core processes
            </p>
          </div>

          <div className="space-y-12">
            {processes.map((process, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
                <div className="flex items-start justify-between mb-8">
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">{process.process}</h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Current:</span>
                        <span className="text-red-400 font-bold">{process.currentTime}</span>
                      </div>
                      <ArrowRight className="w-5 h-5 text-purple-400" />
                      <div className="flex items-center gap-2">
                        <span className="text-gray-400">Optimized:</span>
                        <span className="text-green-400 font-bold">{process.optimizedTime}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-400 mb-1">Impact</p>
                    <p className="text-lg font-bold text-cyan-400">{process.impact}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {process.steps.map((step, i) => (
                    <div key={i} className="grid md:grid-cols-4 gap-4 items-center p-4 bg-white/5 rounded-lg">
                      <div>
                        <p className="text-sm text-gray-400">Step {i + 1}</p>
                        <p className="font-semibold text-white">{step.name}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Current</p>
                        <p className="text-red-400">{step.current}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Optimized</p>
                        <p className="text-green-400">{step.optimized}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-400">Time Saved</p>
                        <p className="font-bold text-purple-400">{step.saving}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottleneck Analysis */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Your 5 Biggest <span className="gradient-text">Bottlenecks</span>
            </h2>
            <p className="text-xl text-gray-400">
              Fix these first for maximum impact
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {bottlenecks.map((bottleneck, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                  <div className="flex-grow">
                    <h3 className="text-xl font-bold text-white mb-1">{bottleneck.issue}</h3>
                    <p className="text-sm text-gray-400">Affects {bottleneck.frequency}</p>
                  </div>
                </div>
                
                <div className="space-y-3 pl-9">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Root Cause</p>
                    <p className="text-gray-300">{bottleneck.rootCause}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Solution</p>
                    <p className="text-purple-400">{bottleneck.solution}</p>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <CheckCircle className="w-5 h-5 text-green-400" />
                    <span className="font-bold text-green-400">{bottleneck.result}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* KPI Dashboard */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Key Performance <span className="gradient-text">Indicators</span>
            </h2>
            <p className="text-xl text-gray-400">
              Track these metrics to measure optimization success
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kpis.map((kpi, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <BarChart3 className="w-6 h-6 text-purple-400" />
                  <Target className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="text-lg font-bold text-white mb-3">{kpi.metric}</h3>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Current</span>
                    <span className="text-red-400 font-semibold">{kpi.current}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Target</span>
                    <span className="text-green-400 font-semibold">{kpi.target}</span>
                  </div>
                </div>
                <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" 
                    style={{width: `${Math.random() * 50 + 30}%`}}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Optimization Tools */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Process <span className="gradient-text">Optimization Tools</span>
            </h2>
            <p className="text-xl text-gray-400">
              Tools to analyze and improve your workflows
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {optimizationTools.map((category, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <h3 className="text-xl font-bold text-white mb-4">{category.category}</h3>
                <div className="space-y-3">
                  {category.tools.map((tool, i) => (
                    <div key={i} className="p-3 bg-white/5 rounded-lg">
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-white">{tool.name}</h4>
                        <span className="text-sm text-purple-400">{tool.price}</span>
                      </div>
                      <p className="text-sm text-gray-400">{tool.purpose}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Implementation Roadmap */}
      <section className="py-20 px-6 bg-gradient-to-br from-purple-500/5 to-pink-500/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              90-Day <span className="gradient-text">Optimization Sprint</span>
            </h2>
            <p className="text-xl text-gray-400">
              Transform your business processes in 3 months
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="space-y-8">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Days 1-30: Analysis</h3>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Map current processes end-to-end</li>
                    <li>• Time each step with stopwatch</li>
                    <li>• Identify top 5 bottlenecks</li>
                    <li>• Calculate cost of inefficiencies</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Days 31-60: Design</h3>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Redesign processes for efficiency</li>
                    <li>• Select automation tools</li>
                    <li>• Create new workflows</li>
                    <li>• Train team on changes</li>
                  </ul>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-2">Days 61-90: Implementation</h3>
                  <ul className="space-y-1 text-gray-300">
                    <li>• Roll out new processes</li>
                    <li>• Monitor KPIs daily</li>
                    <li>• Adjust based on feedback</li>
                    <li>• Celebrate wins publicly</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="mt-8 p-6 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-xl text-center">
              <p className="text-lg text-gray-300 mb-2">Expected Results</p>
              <p className="text-3xl font-black text-white">40% efficiency gain • $32K monthly impact</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Optimize Your Operations?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Free process audit identifies $10K+ in monthly savings
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-purple-500/30 transition-all transform hover:scale-105">
              Get Process Audit
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