"use client";

import React from 'react';
import Link from 'next/link';
import { 
  DollarSign,
  TrendingUp,
  PiggyBank,
  Calculator,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Briefcase,
  CreditCard,
  FileText,
  Target
} from 'lucide-react';
import SchemaMarkup from '@/components/SchemaMarkup';

export default function FinancialManagement() {
  const cashFlowStrategies = [
    {
      strategy: "Progress Billing",
      impact: "Immediate",
      implementation: "30% deposit, 40% midway, 30% completion",
      benefit: "Never fund jobs from your pocket",
      improvement: "+$45K working capital"
    },
    {
      strategy: "Payment Terms",
      impact: "High",
      implementation: "7-day terms, 2% early payment discount",
      benefit: "14 days faster payment average",
      improvement: "-65% overdue accounts"
    },
    {
      strategy: "Credit Cards on File",
      impact: "High",
      implementation: "Require card for all residential",
      benefit: "Instant payment ability",
      improvement: "100% collection rate"
    },
    {
      strategy: "Supplier Terms",
      impact: "Medium",
      implementation: "Negotiate 30-60 day accounts",
      benefit: "Use their money, not yours",
      improvement: "+$25K float"
    }
  ];

  const pricingStrategy = {
    components: [
      { item: "Direct Labor", percentage: "28%", amount: "$280" },
      { item: "Materials", percentage: "25%", amount: "$250" },
      { item: "Overheads", percentage: "22%", amount: "$220" },
      { item: "Sales & Marketing", percentage: "8%", amount: "$80" },
      { item: "Admin", percentage: "7%", amount: "$70" },
      { item: "Net Profit", percentage: "10%", amount: "$100" }
    ],
    totalJob: "$1,000",
    minimumMargin: "35%",
    emergencyRate: "2.5x normal"
  };

  const financialKPIs = [
    {
      metric: "Gross Profit Margin",
      target: "> 45%",
      calculation: "(Revenue - Direct Costs) / Revenue",
      warning: "< 35%",
      action: "Review pricing immediately"
    },
    {
      metric: "Net Profit Margin",
      target: "> 10%",
      calculation: "Net Profit / Revenue",
      warning: "< 5%",
      action: "Cut unnecessary expenses"
    },
    {
      metric: "Cash Conversion Cycle",
      target: "< 30 days",
      calculation: "AR Days + Inventory Days - AP Days",
      warning: "> 45 days",
      action: "Improve collections"
    },
    {
      metric: "Current Ratio",
      target: "> 1.5",
      calculation: "Current Assets / Current Liabilities",
      warning: "< 1.2",
      action: "Build cash reserves"
    },
    {
      metric: "Revenue per Employee",
      target: "> $200K",
      calculation: "Annual Revenue / FTE Count",
      warning: "< $150K",
      action: "Improve productivity"
    }
  ];

  const monthlyFinancials = {
    revenue: "$350,000",
    directCosts: "$192,500",
    grossProfit: "$157,500",
    overheads: "$122,500",
    netProfit: "$35,000",
    margins: {
      gross: "45%",
      net: "10%"
    }
  };

  const growthInvestments = [
    {
      investment: "New Service Vehicle",
      cost: "$65,000",
      roi: "8 months",
      benefit: "+$12K/month revenue"
    },
    {
      investment: "Apprentice Program",
      cost: "$8,000/year",
      roi: "18 months",
      benefit: "50% labor cost reduction"
    },
    {
      investment: "Marketing Campaign",
      cost: "$3,000/month",
      roi: "3 months",
      benefit: "+25 leads/month"
    },
    {
      investment: "Software Systems",
      cost: "$500/month",
      roi: "1 month",
      benefit: "15 hrs/week saved"
    }
  ];

  return (
    <>
      <SchemaMarkup 
        schema={{
          type: 'Service',
          name: 'Financial Management for Trade Businesses',
          description: 'Professional financial management services for trade businesses. Cash flow optimization, profit planning, and financial systems for sustainable growth.',
          provider: 'Unite Group',
          serviceType: 'Financial Management Consulting',
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
            <span className="text-emerald-400">Financial Management</span>
          </nav>

          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <DollarSign className="w-10 h-10 text-emerald-400" />
              <span className="px-4 py-1 bg-emerald-400/10 border border-emerald-400/30 rounded-full text-emerald-400 text-sm">
                Profit Optimization
              </span>
            </div>
            
            <h1 className="text-5xl lg:text-6xl font-black mb-6 leading-tight">
              Master Your{' '}
              <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Money Machine
              </span>
            </h1>
            
            <p className="text-xl text-gray-300 mb-8 leading-relaxed">
              Turn your trade business into a profitable, cash-flowing machine. 
              Price for profit, manage cash like a pro, and build wealth while you scale.
            </p>

            <div className="grid sm:grid-cols-4 gap-4 mb-8">
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <TrendingUp className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">45%</div>
                <div className="text-sm text-gray-400">Gross margin</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <PiggyBank className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">10%</div>
                <div className="text-sm text-gray-400">Net profit</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <CreditCard className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">14 days</div>
                <div className="text-sm text-gray-400">Cash cycle</div>
              </div>
              <div className="bg-white/5 backdrop-blur border border-white/10 rounded-lg p-4">
                <Calculator className="w-6 h-6 text-yellow-400 mb-2" />
                <div className="text-2xl font-bold text-white">$200K</div>
                <div className="text-sm text-gray-400">Per employee</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cash Flow Strategies */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              4 <span className="gradient-text">Cash Flow Hacks</span> That Work
            </h2>
            <p className="text-xl text-gray-400">
              Never run out of cash again
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {cashFlowStrategies.map((strategy, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">{strategy.strategy}</h3>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    strategy.impact === 'Immediate' ? 'bg-red-500/20 text-red-400' :
                    strategy.impact === 'High' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    {strategy.impact} Impact
                  </span>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-400 mb-1">How to implement</p>
                    <p className="text-gray-300">{strategy.implementation}</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-400 mb-1">Benefit</p>
                    <p className="text-white">{strategy.benefit}</p>
                  </div>
                  
                  <div className="pt-3 border-t border-white/10">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-400" />
                      <span className="text-emerald-400 font-semibold">{strategy.improvement}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Strategy */}
      <section className="py-20 px-6 bg-black/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              The Perfect <span className="gradient-text">Pricing Formula</span>
            </h2>
            <p className="text-xl text-gray-400">
              How to price every job for profit
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-8">
              <h3 className="text-2xl font-bold text-white mb-6">$1,000 Job Breakdown</h3>
              
              <div className="space-y-3 mb-6">
                {pricingStrategy.components.map((component, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-gray-300">{component.item}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-400">{component.percentage}</span>
                      <span className="text-white font-semibold">{component.amount}</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-white/10">
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Minimum Margin</p>
                  <p className="text-2xl font-bold text-yellow-400">{pricingStrategy.minimumMargin}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Total Job</p>
                  <p className="text-2xl font-bold text-white">{pricingStrategy.totalJob}</p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 mb-1">Emergency Rate</p>
                  <p className="text-2xl font-bold text-red-400">{pricingStrategy.emergencyRate}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Financial KPIs */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              5 KPIs to <span className="gradient-text">Watch Like a Hawk</span>
            </h2>
            <p className="text-xl text-gray-400">
              Early warning system for financial health
            </p>
          </div>

          <div className="space-y-6">
            {financialKPIs.map((kpi, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <div className="grid lg:grid-cols-5 gap-4 items-center">
                  <div>
                    <h3 className="text-lg font-bold text-white">{kpi.metric}</h3>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Target</p>
                    <p className="text-emerald-400 font-semibold">{kpi.target}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Calculation</p>
                    <p className="text-white text-sm">{kpi.calculation}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Warning Level</p>
                    <p className="text-red-400 font-semibold">{kpi.warning}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Action Required</p>
                    <p className="text-yellow-400 text-sm">{kpi.action}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Monthly P&L */}
      <section className="py-20 px-6 bg-gradient-to-br from-emerald-500/5 to-teal-500/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-black mb-4">
              Target <span className="gradient-text">Monthly P&L</span>
            </h2>
            <p className="text-xl text-gray-400">
              What good looks like for a 15-person trade business
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-6">Income Statement</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Revenue</span>
                    <span className="text-white font-semibold">{monthlyFinancials.revenue}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Direct Costs</span>
                    <span className="text-red-400">-{monthlyFinancials.directCosts}</span>
                  </div>
                  <div className="flex justify-between font-semibold pt-2 border-t border-white/10">
                    <span className="text-white">Gross Profit</span>
                    <span className="text-emerald-400">{monthlyFinancials.grossProfit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Overheads</span>
                    <span className="text-red-400">-{monthlyFinancials.overheads}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-white/10">
                    <span className="text-white">Net Profit</span>
                    <span className="text-green-400">{monthlyFinancials.netProfit}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-6">Key Margins</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Gross Margin</span>
                      <span className="text-2xl font-bold text-emerald-400">{monthlyFinancials.margins.gross}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-400" style={{width: monthlyFinancials.margins.gross}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-gray-300">Net Margin</span>
                      <span className="text-2xl font-bold text-green-400">{monthlyFinancials.margins.net}</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className="h-full bg-green-400" style={{width: monthlyFinancials.margins.net}}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Growth Investments */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black mb-4">
              Smart <span className="gradient-text">Growth Investments</span>
            </h2>
            <p className="text-xl text-gray-400">
              Where to invest for maximum ROI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {growthInvestments.map((investment, index) => (
              <div key={index} className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-6">
                <Briefcase className="w-8 h-8 text-emerald-400 mb-4" />
                <h3 className="text-lg font-bold text-white mb-2">{investment.investment}</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Cost</span>
                    <span className="text-white">{investment.cost}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">ROI</span>
                    <span className="text-yellow-400">{investment.roi}</span>
                  </div>
                </div>
                <div className="pt-4 border-t border-white/10">
                  <p className="text-sm text-emerald-400 font-semibold">{investment.benefit}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-black mb-6">
            Ready to <span className="gradient-text">Maximize Profits?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            Get our complete financial management toolkit
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="https://unitegroup.com.au/consultation" 
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg font-bold text-white hover:shadow-2xl hover:shadow-emerald-500/30 transition-all transform hover:scale-105">
              Get Financial Review
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