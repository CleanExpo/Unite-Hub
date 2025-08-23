'use client';

import React, { useState } from 'react';
import { Shield, AlertTriangle, Check, X, FileText, Download, Clock, Award } from 'lucide-react';

interface ChecklistItem {
  id: string;
  category: string;
  item: string;
  required: boolean;
  penalty?: string;
  frequency?: string;
}

export default function SafetyChecklist() {
  const [selectedTrade, setSelectedTrade] = useState('construction');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const checklists: Record<string, ChecklistItem[]> = {
    construction: [
      { id: 'c1', category: 'Licenses & Permits', item: 'QBCC License current', required: true, penalty: '$3,300', frequency: 'Annual' },
      { id: 'c2', category: 'Licenses & Permits', item: 'White Card for all workers', required: true, penalty: '$1,100 per worker' },
      { id: 'c3', category: 'Training', item: 'Working at Heights certification', required: true, penalty: '$5,500', frequency: 'Annual' },
      { id: 'c4', category: 'Training', item: 'First Aid Officer on site', required: true, penalty: '$2,200' },
      { id: 'c5', category: 'Documentation', item: 'SWMS for high-risk work', required: true, penalty: '$11,000' },
      { id: 'c6', category: 'Documentation', item: 'Site Safety Plan', required: true, penalty: '$5,500' },
      { id: 'c7', category: 'Equipment', item: 'PPE for all workers', required: true, penalty: '$1,100 per breach' },
      { id: 'c8', category: 'Equipment', item: 'Fall protection systems', required: true, penalty: '$5,500' },
      { id: 'c9', category: 'Insurance', item: 'WorkCover policy', required: true, penalty: '$13,200' },
      { id: 'c10', category: 'Insurance', item: 'Public Liability ($20M)', required: true }
    ],
    electrical: [
      { id: 'e1', category: 'Licenses', item: 'Electrical License', required: true, penalty: '$5,500', frequency: '3 years' },
      { id: 'e2', category: 'Licenses', item: 'Electrical Contractor License', required: true, penalty: '$3,300', frequency: 'Annual' },
      { id: 'e3', category: 'Training', item: 'CPR certification', required: true, penalty: '$1,100', frequency: '12 months' },
      { id: 'e4', category: 'Training', item: 'Test and Tag competency', required: true, penalty: '$2,200' },
      { id: 'e5', category: 'Documentation', item: 'Electrical Safety Plan', required: true, penalty: '$5,500' },
      { id: 'e6', category: 'Documentation', item: 'Test certificates filed', required: true, penalty: '$2,200' },
      { id: 'e7', category: 'Equipment', item: 'Insulated tools', required: true, penalty: '$1,100' },
      { id: 'e8', category: 'Equipment', item: 'Lock out/tag out equipment', required: true, penalty: '$3,300' },
      { id: 'e9', category: 'Testing', item: 'RCD testing equipment', required: true, penalty: '$2,200' },
      { id: 'e10', category: 'Insurance', item: 'Professional Indemnity', required: true }
    ],
    plumbing: [
      { id: 'p1', category: 'Licenses', item: 'Plumbing License', required: true, penalty: '$3,300', frequency: 'Annual' },
      { id: 'p2', category: 'Licenses', item: 'Backflow Prevention License', required: true, penalty: '$2,200', frequency: 'Annual' },
      { id: 'p3', category: 'Training', item: 'Confined Spaces Entry', required: true, penalty: '$5,500', frequency: '2 years' },
      { id: 'p4', category: 'Training', item: 'Gas Safety certification', required: true, penalty: '$3,300' },
      { id: 'p5', category: 'Documentation', item: 'Compliance certificates', required: true, penalty: '$2,200' },
      { id: 'p6', category: 'Documentation', item: 'TMV commissioning records', required: true, penalty: '$1,100' },
      { id: 'p7', category: 'Equipment', item: 'Gas detection equipment', required: true, penalty: '$2,200' },
      { id: 'p8', category: 'Equipment', item: 'Confined space equipment', required: true, penalty: '$3,300' },
      { id: 'p9', category: 'Testing', item: 'Water quality testing kit', required: false },
      { id: 'p10', category: 'Insurance', item: 'Public Liability ($10M)', required: true }
    ],
    hvac: [
      { id: 'h1', category: 'Licenses', item: 'ARCTick License', required: true, penalty: '$6,600', frequency: 'Annual' },
      { id: 'h2', category: 'Licenses', item: 'Refrigerant Handling License', required: true, penalty: '$3,300', frequency: '2 years' },
      { id: 'h3', category: 'Training', item: 'Working at Heights', required: true, penalty: '$5,500', frequency: 'Annual' },
      { id: 'h4', category: 'Training', item: 'Electrical Safety', required: true, penalty: '$2,200' },
      { id: 'h5', category: 'Documentation', item: 'Refrigerant log book', required: true, penalty: '$11,000' },
      { id: 'h6', category: 'Documentation', item: 'Equipment service records', required: true, penalty: '$2,200' },
      { id: 'h7', category: 'Equipment', item: 'Refrigerant recovery unit', required: true, penalty: '$5,500' },
      { id: 'h8', category: 'Equipment', item: 'Leak detection equipment', required: true, penalty: '$2,200' },
      { id: 'h9', category: 'Environmental', item: 'Ozone protection compliance', required: true, penalty: '$13,200' },
      { id: 'h10', category: 'Insurance', item: 'Environmental Liability', required: false }
    ]
  };

  const handleItemCheck = (itemId: string) => {
    const newCheckedItems = new Set(checkedItems);
    if (newCheckedItems.has(itemId)) {
      newCheckedItems.delete(itemId);
    } else {
      newCheckedItems.add(itemId);
    }
    setCheckedItems(newCheckedItems);
  };

  const currentChecklist = checklists[selectedTrade];
  const completionRate = Math.round((checkedItems.size / currentChecklist.length) * 100);
  const requiredItems = currentChecklist.filter(item => item.required);
  const requiredCompleted = requiredItems.filter(item => checkedItems.has(item.id)).length;
  const totalPenaltyRisk = currentChecklist
    .filter(item => item.required && !checkedItems.has(item.id) && item.penalty)
    .reduce((sum, item) => {
      const amount = parseInt(item.penalty?.replace(/[$,]/g, '') || '0');
      return sum + amount;
    }, 0);

  const categories = [...new Set(currentChecklist.map(item => item.category))];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Safety Compliance Checklist</h3>
            <p className="text-gray-600">Queensland WHS Requirements</p>
          </div>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
          <Download className="h-4 w-4" />
          <span className="font-medium">Export PDF</span>
        </button>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Select Your Trade</label>
        <select
          value={selectedTrade}
          onChange={(e) => {
            setSelectedTrade(e.target.value);
            setCheckedItems(new Set());
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="construction">Construction</option>
          <option value="electrical">Electrical</option>
          <option value="plumbing">Plumbing</option>
          <option value="hvac">HVAC / Air Conditioning</option>
        </select>
      </div>

      {/* Compliance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <div className="text-3xl font-bold text-blue-600 mb-1">{completionRate}%</div>
          <div className="text-sm text-gray-600">Compliance Rate</div>
          <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-blue-600 transition-all duration-500"
              style={{ width: `${completionRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
          <div className="text-3xl font-bold text-green-600 mb-1">
            {requiredCompleted}/{requiredItems.length}
          </div>
          <div className="text-sm text-gray-600">Required Items</div>
          <div className="mt-2 flex items-center text-xs text-green-700">
            <Check className="h-3 w-3 mr-1" />
            Mandatory compliance
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl p-4 border border-red-200">
          <div className="text-3xl font-bold text-red-600 mb-1">
            ${totalPenaltyRisk.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600">Penalty Risk</div>
          <div className="mt-2 flex items-center text-xs text-red-700">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Maximum exposure
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
          <div className="text-3xl font-bold text-purple-600 mb-1">
            {currentChecklist.filter(item => item.frequency).length}
          </div>
          <div className="text-sm text-gray-600">Renewals Needed</div>
          <div className="mt-2 flex items-center text-xs text-purple-700">
            <Clock className="h-3 w-3 mr-1" />
            Regular updates
          </div>
        </div>
      </div>

      {/* Checklist Items */}
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category} className="border border-gray-200 rounded-xl p-6">
            <h4 className="font-bold text-lg mb-4 text-gray-900 flex items-center">
              <FileText className="h-5 w-5 mr-2 text-orange-500" />
              {category}
            </h4>
            
            <div className="space-y-3">
              {currentChecklist
                .filter(item => item.category === category)
                .map(item => (
                  <div
                    key={item.id}
                    className={`flex items-start p-3 rounded-lg border transition-all cursor-pointer ${
                      checkedItems.has(item.id)
                        ? 'bg-green-50 border-green-300'
                        : item.required
                        ? 'bg-red-50 border-red-200 hover:border-red-300'
                        : 'bg-gray-50 border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleItemCheck(item.id)}
                  >
                    <div className="mr-3 mt-0.5">
                      {checkedItems.has(item.id) ? (
                        <div className="w-5 h-5 bg-green-500 rounded flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </div>
                      ) : (
                        <div className={`w-5 h-5 border-2 rounded ${
                          item.required ? 'border-red-400' : 'border-gray-400'
                        }`}></div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <span className={`font-medium ${
                            checkedItems.has(item.id) ? 'text-green-900' : 'text-gray-900'
                          }`}>
                            {item.item}
                          </span>
                          {item.required && (
                            <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              Required
                            </span>
                          )}
                          {item.frequency && (
                            <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                              Renew: {item.frequency}
                            </span>
                          )}
                        </div>
                        
                        {item.penalty && !checkedItems.has(item.id) && (
                          <span className="text-sm text-red-600 font-medium">
                            Risk: {item.penalty}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Compliance Status */}
      <div className={`mt-8 p-6 rounded-xl ${
        completionRate === 100 
          ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
          : completionRate >= 80
          ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white'
          : 'bg-gradient-to-r from-red-500 to-pink-500 text-white'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-2xl font-bold mb-2">
              {completionRate === 100 
                ? '✅ Fully Compliant!'
                : completionRate >= 80
                ? '⚠️ Almost There!'
                : '❌ High Risk - Action Required'}
            </h4>
            <p className="text-white/90">
              {completionRate === 100 
                ? 'Congratulations! Your business meets all Queensland safety requirements.'
                : `You have ${requiredItems.length - requiredCompleted} required items remaining. Total penalty risk: $${totalPenaltyRisk.toLocaleString()}`}
            </p>
          </div>
          
          {completionRate < 100 && (
            <button className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-xl font-bold hover:bg-white/30 transition-colors border border-white/30">
              Get Compliance Help
            </button>
          )}
        </div>
      </div>
    </div>
  );
}