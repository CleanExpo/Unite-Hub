'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, FileText, Send, Building, Wrench, Clock, DollarSign, Plus, Trash2 } from 'lucide-react';

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  rate: number;
  total: number;
}

export default function QuoteGenerator() {
  const [projectType, setProjectType] = useState('residential');
  const [jobCategory, setJobCategory] = useState('plumbing');
  const [urgency, setUrgency] = useState('standard');
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { id: '1', description: 'Initial assessment and diagnosis', quantity: 1, rate: 150, total: 150 },
    { id: '2', description: 'Labour (per hour)', quantity: 3, rate: 95, total: 285 },
    { id: '3', description: 'Materials and supplies', quantity: 1, rate: 250, total: 250 }
  ]);
  
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const [totals, setTotals] = useState({
    subtotal: 0,
    gst: 0,
    total: 0,
    deposit: 0
  });

  const jobTemplates = {
    plumbing: {
      standard: [
        { description: 'Initial assessment and diagnosis', quantity: 1, rate: 150 },
        { description: 'Labour (per hour)', quantity: 3, rate: 95 },
        { description: 'Materials and supplies', quantity: 1, rate: 250 },
        { description: 'Waste disposal', quantity: 1, rate: 75 }
      ],
      emergency: [
        { description: 'Emergency callout fee', quantity: 1, rate: 250 },
        { description: 'Labour - after hours (per hour)', quantity: 2, rate: 150 },
        { description: 'Materials and supplies', quantity: 1, rate: 300 },
        { description: 'Temporary repair', quantity: 1, rate: 125 }
      ]
    },
    electrical: {
      standard: [
        { description: 'Electrical inspection', quantity: 1, rate: 180 },
        { description: 'Labour (per hour)', quantity: 4, rate: 110 },
        { description: 'Electrical components', quantity: 1, rate: 350 },
        { description: 'Testing and certification', quantity: 1, rate: 120 }
      ],
      emergency: [
        { description: 'Emergency callout', quantity: 1, rate: 275 },
        { description: 'Labour - emergency rate (per hour)', quantity: 2, rate: 165 },
        { description: 'Materials - urgent supply', quantity: 1, rate: 400 },
        { description: 'Safety inspection', quantity: 1, rate: 150 }
      ]
    },
    hvac: {
      standard: [
        { description: 'System diagnostic', quantity: 1, rate: 220 },
        { description: 'Labour (per hour)', quantity: 5, rate: 125 },
        { description: 'Parts and components', quantity: 1, rate: 850 },
        { description: 'Refrigerant recharge', quantity: 1, rate: 180 },
        { description: 'System testing', quantity: 1, rate: 150 }
      ],
      emergency: [
        { description: 'Emergency service call', quantity: 1, rate: 350 },
        { description: 'Labour - priority rate (per hour)', quantity: 3, rate: 185 },
        { description: 'Emergency parts', quantity: 1, rate: 1200 },
        { description: 'Temporary cooling/heating', quantity: 1, rate: 250 }
      ]
    }
  };

  useEffect(() => {
    calculateTotals();
  }, [lineItems]);

  useEffect(() => {
    loadTemplate();
  }, [jobCategory, urgency]);

  const loadTemplate = () => {
    const template = jobTemplates[jobCategory as keyof typeof jobTemplates][urgency as 'standard' | 'emergency'];
    const newItems = template.map((item, index) => ({
      id: (index + 1).toString(),
      ...item,
      total: item.quantity * item.rate
    }));
    setLineItems(newItems);
  };

  const calculateTotals = () => {
    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const gst = subtotal * 0.1;
    const total = subtotal + gst;
    const deposit = total * 0.3;
    
    setTotals({
      subtotal: Math.round(subtotal),
      gst: Math.round(gst),
      total: Math.round(total),
      deposit: Math.round(deposit)
    });
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: Date.now().toString(),
      description: 'Additional work',
      quantity: 1,
      rate: 100,
      total: 100
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: any) => {
    const updated = lineItems.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'rate') {
          updatedItem.total = updatedItem.quantity * updatedItem.rate;
        }
        return updatedItem;
      }
      return item;
    });
    setLineItems(updated);
  };

  const removeLineItem = (id: string) => {
    setLineItems(lineItems.filter(item => item.id !== id));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
            <Calculator className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-bold text-gray-900">Instant Quote Generator</h3>
            <p className="text-gray-600">Professional quotes in 60 seconds</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
            <FileText className="h-4 w-4" />
            <span className="font-medium">Preview</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors">
            <Send className="h-4 w-4" />
            <span className="font-medium">Send Quote</span>
          </button>
        </div>
      </div>

      {/* Quote Settings */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Building className="inline h-4 w-4 mr-1" />
            Project Type
          </label>
          <select
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="residential">Residential</option>
            <option value="commercial">Commercial</option>
            <option value="industrial">Industrial</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Wrench className="inline h-4 w-4 mr-1" />
            Job Category
          </label>
          <select
            value={jobCategory}
            onChange={(e) => setJobCategory(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="plumbing">Plumbing</option>
            <option value="electrical">Electrical</option>
            <option value="hvac">HVAC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Clock className="inline h-4 w-4 mr-1" />
            Service Type
          </label>
          <select
            value={urgency}
            onChange={(e) => setUrgency(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="standard">Standard Service</option>
            <option value="emergency">Emergency/After Hours</option>
          </select>
        </div>
      </div>

      {/* Customer Information */}
      <div className="bg-gray-50 rounded-xl p-6 mb-8">
        <h4 className="font-bold text-lg mb-4 text-gray-900">Customer Information</h4>
        <div className="grid md:grid-cols-2 gap-4">
          <input
            type="text"
            placeholder="Customer Name"
            value={customerInfo.name}
            onChange={(e) => setCustomerInfo({...customerInfo, name: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="email"
            placeholder="Email Address"
            value={customerInfo.email}
            onChange={(e) => setCustomerInfo({...customerInfo, email: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={customerInfo.phone}
            onChange={(e) => setCustomerInfo({...customerInfo, phone: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Job Address"
            value={customerInfo.address}
            onChange={(e) => setCustomerInfo({...customerInfo, address: e.target.value})}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Line Items */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-bold text-lg text-gray-900">Quote Items</h4>
          <button
            onClick={addLineItem}
            className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-700">Description</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">Qty</th>
                <th className="text-center px-4 py-3 text-sm font-medium text-gray-700">Rate</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-gray-700">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {lineItems.map((item, index) => (
                <tr key={item.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-4 py-3">
                    <input
                      type="text"
                      value={item.description}
                      onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                      className="w-20 px-2 py-1 text-center border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => updateLineItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                      className="w-24 px-2 py-1 text-center border border-gray-200 rounded focus:ring-1 focus:ring-green-500"
                    />
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    ${item.total.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeLineItem(item.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
        <div className="space-y-3">
          <div className="flex justify-between items-center text-gray-700">
            <span>Subtotal</span>
            <span className="font-medium">${totals.subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-gray-700">
            <span>GST (10%)</span>
            <span className="font-medium">${totals.gst.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-green-300">
            <span className="text-xl font-bold text-gray-900">Total</span>
            <span className="text-2xl font-bold text-green-600">${totals.total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-green-200">
            <span className="text-gray-700">Deposit Required (30%)</span>
            <span className="font-bold text-green-600">${totals.deposit.toFixed(2)}</span>
          </div>
        </div>

        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Quote Valid For</span>
            </div>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>7 days</option>
              <option>14 days</option>
              <option>30 days</option>
            </select>
          </div>

          <div className="bg-white rounded-lg p-4 border border-green-200">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Payment Terms</span>
            </div>
            <select className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm">
              <option>30% deposit, balance on completion</option>
              <option>50% deposit, 50% on completion</option>
              <option>Net 7 days</option>
            </select>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button className="flex-1 px-6 py-3 bg-white text-green-600 rounded-xl font-bold hover:bg-gray-50 transition-colors border border-green-300">
            Save as Template
          </button>
          <button className="flex-1 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-bold hover:shadow-xl transition-all duration-300">
            Generate PDF Quote
          </button>
        </div>
      </div>
    </div>
  );
}