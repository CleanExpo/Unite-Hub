'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, TrendingUp, DollarSign, Users, Clock, BarChart3 } from 'lucide-react';

interface ROICalculatorProps {
  industry: 'trades' | 'construction' | 'electrical' | 'plumbing' | 'hvac';
  calculatorType: 'automation' | 'seo' | 'safety' | 'scaling' | 'digital';
}

export default function ROICalculator({ industry, calculatorType }: ROICalculatorProps) {
  const [staffCount, setStaffCount] = useState(10);
  const [avgHourlyRate, setAvgHourlyRate] = useState(85);
  const [weeklyJobs, setWeeklyJobs] = useState(25);
  const [currentConversion, setCurrentConversion] = useState(20);
  const [results, setResults] = useState({
    monthlySavings: 0,
    annualSavings: 0,
    roiPercentage: 0,
    paybackPeriod: 0,
    efficiencyGain: 0,
    revenueIncrease: 0
  });

  const calculatorConfigs = {
    automation: {
      title: 'Automation ROI Calculator',
      subtitle: 'See how much time and money you\'ll save',
      baseInvestment: 299,
      factors: {
        adminTimeSaved: 36, // hours per week
        errorReduction: 0.95,
        jobCapacityIncrease: 1.35,
        overtimeReduction: 0.60
      }
    },
    seo: {
      title: 'Local SEO ROI Calculator',
      subtitle: 'Calculate your lead generation potential',
      baseInvestment: 499,
      factors: {
        leadIncrease: 2.5,
        conversionImprovement: 1.45,
        avgJobValue: 2800,
        organicTrafficGrowth: 3.2
      }
    },
    safety: {
      title: 'Safety Compliance ROI Calculator',
      subtitle: 'Avoid fines and reduce incidents',
      baseInvestment: 199,
      factors: {
        incidentReduction: 0.78,
        complianceRate: 1.0,
        avgFineSaved: 15000,
        insuranceSavings: 0.15
      }
    },
    scaling: {
      title: 'Business Scaling ROI Calculator',
      subtitle: 'Project your growth potential',
      baseInvestment: 799,
      factors: {
        revenueMultiplier: 2.3,
        profitMarginIncrease: 1.28,
        customerRetention: 1.35,
        operationalEfficiency: 1.42
      }
    },
    digital: {
      title: 'Digital Transformation ROI Calculator',
      subtitle: 'Calculate your digital advantage',
      baseInvestment: 599,
      factors: {
        paperlesssSavings: 4800,
        customerSatisfaction: 1.45,
        jobCompletionSpeed: 1.32,
        bidWinRate: 1.38
      }
    }
  };

  useEffect(() => {
    calculateROI();
  }, [staffCount, avgHourlyRate, weeklyJobs, currentConversion, calculatorType]);

  const calculateROI = () => {
    const config = calculatorConfigs[calculatorType];
    const monthlyRevenue = weeklyJobs * 4 * avgHourlyRate * 8; // Assuming 8-hour jobs
    
    let monthlySavings = 0;
    let revenueIncrease = 0;
    
    switch(calculatorType) {
      case 'automation': {
        const factors = calculatorConfigs.automation.factors;
        const adminCost = factors.adminTimeSaved * avgHourlyRate * 4;
        const overtimeSavings = staffCount * avgHourlyRate * 10 * factors.overtimeReduction * 4;
        const capacityRevenue = monthlyRevenue * (factors.jobCapacityIncrease - 1);
        monthlySavings = adminCost + overtimeSavings;
        revenueIncrease = capacityRevenue;
        break;
      }
        
      case 'seo': {
        const factors = calculatorConfigs.seo.factors;
        const newLeads = weeklyJobs * (factors.leadIncrease - 1) * 4;
        const improvedConversion = newLeads * (currentConversion / 100) * factors.conversionImprovement;
        revenueIncrease = improvedConversion * factors.avgJobValue;
        monthlySavings = revenueIncrease * 0.3; // Assuming 30% profit margin
        break;
      }
        
      case 'safety': {
        const factors = calculatorConfigs.safety.factors;
        const incidentCost = 5000 * (1 - factors.incidentReduction) / 12;
        const fineSavings = factors.avgFineSaved / 12;
        const insuranceSave = (staffCount * 200 * 12 * factors.insuranceSavings) / 12;
        monthlySavings = incidentCost + fineSavings + insuranceSave;
        revenueIncrease = 0; // Safety doesn't directly increase revenue
        break;
      }
        
      case 'scaling': {
        const factors = calculatorConfigs.scaling.factors;
        const scaledRevenue = monthlyRevenue * (factors.revenueMultiplier - 1);
        const marginImprovement = monthlyRevenue * (factors.profitMarginIncrease - 1) * 0.2;
        const retentionValue = monthlyRevenue * 0.1 * (factors.customerRetention - 1);
        revenueIncrease = scaledRevenue;
        monthlySavings = marginImprovement + retentionValue;
        break;
      }
        
      case 'digital': {
        const factors = calculatorConfigs.digital.factors;
        const paperSave = factors.paperlesssSavings / 12;
        const speedRevenue = monthlyRevenue * (factors.jobCompletionSpeed - 1);
        const winRateRevenue = monthlyRevenue * (factors.bidWinRate - 1) * 0.3;
        monthlySavings = paperSave + (speedRevenue * 0.3);
        revenueIncrease = speedRevenue + winRateRevenue;
        break;
      }
    }
    
    const totalMonthlyBenefit = monthlySavings + (revenueIncrease * 0.3);
    const annualSavings = totalMonthlyBenefit * 12;
    const roiPercentage = ((annualSavings - (config.baseInvestment * 12)) / (config.baseInvestment * 12)) * 100;
    const paybackPeriod = config.baseInvestment / totalMonthlyBenefit;
    const efficiencyGain = calculatorType === 'automation' ? 36 : 
                           calculatorType === 'digital' ? 32 : 
                           calculatorType === 'scaling' ? 42 : 25;
    
    setResults({
      monthlySavings: Math.round(monthlySavings),
      annualSavings: Math.round(annualSavings),
      roiPercentage: Math.round(roiPercentage),
      paybackPeriod: Math.round(paybackPeriod * 10) / 10,
      efficiencyGain: efficiencyGain,
      revenueIncrease: Math.round(revenueIncrease)
    });
  };

  const config = calculatorConfigs[calculatorType];

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black rounded-2xl p-8 text-white">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
          <Calculator className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-2xl font-bold">{config.title}</h3>
          <p className="text-gray-400">{config.subtitle}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Number of Staff
          </label>
          <input
            type="range"
            min="3"
            max="30"
            value={staffCount}
            onChange={(e) => setStaffCount(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>3</span>
            <span className="text-blue-400 font-bold">{staffCount} staff</span>
            <span>30</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Average Hourly Rate
          </label>
          <input
            type="range"
            min="50"
            max="150"
            value={avgHourlyRate}
            onChange={(e) => setAvgHourlyRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>$50</span>
            <span className="text-blue-400 font-bold">${avgHourlyRate}/hr</span>
            <span>$150</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Jobs Per Week
          </label>
          <input
            type="range"
            min="5"
            max="50"
            value={weeklyJobs}
            onChange={(e) => setWeeklyJobs(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>5</span>
            <span className="text-blue-400 font-bold">{weeklyJobs} jobs</span>
            <span>50</span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Current Conversion Rate
          </label>
          <input
            type="range"
            min="10"
            max="50"
            value={currentConversion}
            onChange={(e) => setCurrentConversion(Number(e.target.value))}
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400 mt-1">
            <span>10%</span>
            <span className="text-blue-400 font-bold">{currentConversion}%</span>
            <span>50%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-400">Monthly Savings</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${results.monthlySavings.toLocaleString()}
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="h-5 w-5 text-blue-400" />
            <span className="text-sm text-gray-400">Annual ROI</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {results.roiPercentage}%
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-purple-400" />
            <span className="text-sm text-gray-400">Payback Period</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {results.paybackPeriod} months
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-5 w-5 text-orange-400" />
            <span className="text-sm text-gray-400">Efficiency Gain</span>
          </div>
          <div className="text-2xl font-bold text-orange-400">
            +{results.efficiencyGain}%
          </div>
        </div>

        <div className="bg-gray-800/50 rounded-xl p-4 border border-gray-700">
          <div className="flex items-center gap-2 mb-2">
            <Users className="h-5 w-5 text-cyan-400" />
            <span className="text-sm text-gray-400">Revenue Increase</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">
            ${results.revenueIncrease.toLocaleString()}
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl p-4 border border-green-500/30">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-5 w-5 text-green-400" />
            <span className="text-sm text-gray-300">Annual Savings</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            ${results.annualSavings.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl p-6 border border-blue-500/30">
        <h4 className="font-bold text-lg mb-3">Your Personalized Results:</h4>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            Save ${results.monthlySavings.toLocaleString()} every month in operational costs
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            Achieve {results.roiPercentage}% return on investment within first year
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            Recover your investment in just {results.paybackPeriod} months
          </li>
          <li className="flex items-start">
            <span className="text-green-400 mr-2">✓</span>
            Increase team efficiency by {results.efficiencyGain}%
          </li>
        </ul>
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-4">
        <button className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300">
          Get Detailed ROI Report
        </button>
        <button className="flex-1 px-6 py-3 bg-gray-800 text-white rounded-xl font-bold hover:bg-gray-700 transition-all duration-300 border border-gray-600">
          Schedule Demo
        </button>
      </div>
    </div>
  );
}