'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

// Pipeline stages based on BizLink design
const PIPELINE_STAGES = [
  { id: 'contacted', label: 'Contacted', count: 12 },
  { id: 'negotiation', label: 'Negotiation', count: 17 },
  { id: 'offer_sent', label: 'Offer Sent', count: 13 },
  { id: 'deal_closed', label: 'Deal Closed', count: 12 },
] as const;

type StageId = (typeof PIPELINE_STAGES)[number]['id'];

interface Deal {
  id: string;
  company: string;
  description: string;
  dueDate: string;
  stage: StageId;
  comments: number;
  attachments: number;
  isExpanded?: boolean;
  email?: string;
  address?: string;
  manager?: string;
}

// Sample data matching BizLink screenshot
const SAMPLE_DEALS: Deal[] = [
  { id: '1', company: 'ByteBridge', description: 'Corporate and personal data protection on a turnkey basis', dueDate: '18 Apr', stage: 'contacted', comments: 2, attachments: 1 },
  { id: '2', company: 'AI Synergy', description: 'Innovative solutions based on artificial intelligence', dueDate: '31 Mar', stage: 'contacted', comments: 1, attachments: 3 },
  { id: '3', company: 'LeadBoost Agency', description: 'Lead attraction and automation for small business...', dueDate: 'No due date', stage: 'contacted', comments: 4, attachments: 7 },
  { id: '4', company: 'SkillUp Hub', description: 'Platform for professional development of specialists', dueDate: '09 Mar', stage: 'negotiation', comments: 4, attachments: 1 },
  { id: '5', company: 'Thera Well', description: 'Platform for psychological support and consultations', dueDate: 'No due date', stage: 'negotiation', comments: 7, attachments: 2 },
  { id: '6', company: 'SwiftCargo', description: 'International transportation of chemical goods', dueDate: '23 Apr', stage: 'negotiation', comments: 2, attachments: 5 },
  { id: '7', company: 'FitLife Nutrition', description: 'Nutritious food and nutraceuticals for individuals', dueDate: '10 Mar', stage: 'offer_sent', comments: 1, attachments: 3 },
  { id: '8', company: 'Prime Estate', description: 'Agency-developer of low-rise elite and commercial real estate', dueDate: '16 Apr', stage: 'offer_sent', comments: 1, attachments: 1, isExpanded: true, email: 'contact@primeestate.com', address: '540 Realty Blvd, Miami, FL 33132', manager: 'Antony Cardenas' },
  { id: '9', company: 'CloudSphere', description: 'Cloud services for data storage and processing for le...', dueDate: '24 Mar', stage: 'deal_closed', comments: 2, attachments: 1 },
  { id: '10', company: 'Advantage Medi', description: 'Full cycle of digital advertising and social media promotion', dueDate: '05 Apr', stage: 'deal_closed', comments: 1, attachments: 3 },
  { id: '11', company: 'Safebank Solutions', description: 'Innovative financial technologies and digital pay...', dueDate: '30 Mar', stage: 'deal_closed', comments: 4, attachments: 7 },
];

// Stats data
const STATS = {
  newCustomers: [5, 8, 6, 10, 7],
  successfulDeals: 68,
  tasksInProgress: 53,
  prepayments: 15890,
};

// Team members
const TEAM_MEMBERS = [
  { name: 'Sandra Perry', role: 'Product Manager', avatar: 'SP' },
  { name: 'Antony Cardenas', role: 'Sales Manager', avatar: 'AC' },
  { name: 'Jamal Connolly', role: 'Growth Marketer', avatar: 'JC' },
  { name: 'Cara Carr', role: 'SEO Specialist', avatar: 'CC' },
  { name: 'Iona Rollins', role: 'Designer', avatar: 'IR' },
];

function StatCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border border-gray-100 ${className}`}>
      {children}
    </div>
  );
}

function BarChart({ data, label }: { data: number[]; label: string }) {
  const max = Math.max(...data);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

  return (
    <div>
      <p className="text-sm font-medium text-gray-700 mb-3">{label}</p>
      <div className="flex items-end gap-2 h-16">
        {data.map((value, i) => (
          <div key={i} className="flex flex-col items-center flex-1">
            <div
              className="w-full bg-gray-800 rounded-t-sm transition-all"
              style={{ height: `${(value / max) * 100}%` }}
            />
            <span className="text-[10px] text-gray-400 mt-1">{days[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function CircularProgress({ value, label }: { value: number; label: string }) {
  const circumference = 2 * Math.PI * 40;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="flex items-center gap-3">
      <svg className="w-20 h-20 -rotate-90">
        <circle cx="40" cy="40" r="40" fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle
          cx="40" cy="40" r="40" fill="none"
          stroke="#1f2937" strokeWidth="8"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div>
        <p className="text-2xl font-semibold">{value}%</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function DealCard({ deal }: { deal: Deal }) {
  const isOverdue = deal.dueDate === 'No due date';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-3 cursor-pointer hover:shadow-md transition-shadow ${
        deal.isExpanded ? 'ring-2 ring-amber-400' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-medium text-gray-900">{deal.company}</h4>
        <button className="text-gray-400 hover:text-gray-600">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
          </svg>
        </button>
      </div>

      <p className="text-sm text-gray-500 mb-3 line-clamp-2">{deal.description}</p>

      {deal.isExpanded && (
        <div className="mb-3 p-3 bg-gray-50 rounded-lg text-sm space-y-2">
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {deal.address}
          </div>
          <div className="flex items-center gap-2 text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {deal.email}
          </div>
          <div className="flex items-center gap-2 text-gray-600 pt-2 border-t">
            <span className="text-xs text-gray-400">Manager</span>
            <span className="font-medium">{deal.manager}</span>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <span className={`text-xs px-2 py-1 rounded-full ${
          isOverdue
            ? 'bg-red-50 text-red-600'
            : 'bg-amber-50 text-amber-700'
        }`}>
          {deal.dueDate}
        </span>

        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {deal.comments}
          </span>
          <span className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
            {deal.attachments}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function PipelineColumn({ stage, deals }: { stage: typeof PIPELINE_STAGES[number]; deals: Deal[] }) {
  return (
    <div className="flex-1 min-w-[280px]">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-gray-900">{stage.label}</h3>
        <div className="flex items-center gap-1 text-gray-400 text-sm">
          <span>{stage.count}</span>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
          </svg>
        </div>
      </div>

      <div className="space-y-0">
        {deals.map(deal => (
          <DealCard key={deal.id} deal={deal} />
        ))}
      </div>
    </div>
  );
}

function Sidebar() {
  return (
    <div className="w-64 bg-white border-r border-gray-100 p-4 flex flex-col">
      {/* Logo */}
      <div className="mb-8">
        <h1 className="text-xl font-semibold">Unite-Hub</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 mb-8">
        {['Dashboard', 'Tasks', 'Activity', 'Customers', 'Settings'].map((item, i) => (
          <a
            key={item}
            href="#"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
              i === 3 ? 'bg-gray-100 text-gray-900 font-medium' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            {item}
            {item === 'Tasks' && (
              <span className="ml-auto bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full">2</span>
            )}
          </a>
        ))}
      </nav>

      {/* Projects */}
      <div className="mb-8">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Projects</h3>
        <div className="space-y-1">
          {['BizConnect', 'Growth Hub', 'Conversion Path', 'Marketing'].map((project, i) => (
            <a
              key={project}
              href="#"
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <span className={`w-2 h-2 rounded-full ${
                ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500'][i]
              }`} />
              {project}
              {i === 0 && <span className="ml-auto text-xs text-gray-400">7</span>}
            </a>
          ))}
        </div>
      </div>

      {/* Members */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wider">Members</h3>
          <button className="text-gray-400 hover:text-gray-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
        <div className="space-y-2">
          {TEAM_MEMBERS.map(member => (
            <div key={member.name} className="flex items-center gap-3 px-2 py-1.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                {member.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                <p className="text-xs text-gray-400 truncate">{member.role}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function PipelineKanban() {
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-100 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search customer..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h13M3 8h9m-9 4h6m4 0l4-4m0 0l4 4m-4-4v12" />
                </svg>
                Sort by
              </button>

              <button className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filters
              </button>
            </div>

            <div className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-gray-200" />
              <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add customer
              </button>
            </div>
          </div>
        </header>

        {/* Stats Row */}
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-4">
            <StatCard>
              <BarChart data={STATS.newCustomers} label="New customers" />
            </StatCard>

            <StatCard>
              <CircularProgress value={STATS.successfulDeals} label="Successful deals" />
            </StatCard>

            <StatCard className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-semibold">{STATS.tasksInProgress}</p>
                <p className="text-sm text-gray-500">Tasks in progress</p>
              </div>
            </StatCard>

            <StatCard className="flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl font-semibold">${STATS.prepayments.toLocaleString()}</p>
                <p className="text-sm text-gray-500">Prepayments from customers</p>
              </div>
            </StatCard>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-auto px-6 pb-6">
          <div className="flex gap-4">
            {PIPELINE_STAGES.map(stage => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                deals={SAMPLE_DEALS.filter(d => d.stage === stage.id)}
              />
            ))}
          </div>
        </div>
    </div>
  );
}

export default PipelineKanban;
