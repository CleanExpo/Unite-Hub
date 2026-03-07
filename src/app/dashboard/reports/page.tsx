"use client";

import { motion } from "framer-motion";
import { FileText, Download, Calendar, Filter, BarChart3, TrendingUp, Mail, DollarSign } from "lucide-react";

const EASE = [0.19, 1, 0.22, 1] as const;

const REPORTS = [
  { name: "Monthly Performance Report", date: "Nov 2024", type: "Performance", colour: "#00F5FF", icon: TrendingUp },
  { name: "Lead Generation Analysis",   date: "Nov 2024", type: "Leads",       colour: "#00FF88", icon: BarChart3 },
  { name: "Email Campaign Summary",      date: "Oct 2024", type: "Email",       colour: "#FFB800", icon: Mail },
  { name: "Revenue Attribution",         date: "Q3 2024",  type: "Revenue",     colour: "#00FF88", icon: DollarSign },
];

export default function ReportsPage() {
  return (
    <div className="p-6 max-w-4xl">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: EASE }}
        className="flex items-start justify-between mb-8"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[#00F5FF]" />
            <h1 className="text-xl font-mono font-bold text-white/90 tracking-wide">REPORTS</h1>
          </div>
          <p className="text-sm text-white/40">Generate and download business intelligence reports</p>
        </div>
        <button className="flex items-center gap-2 bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold px-4 py-2 rounded-sm hover:bg-[#00F5FF]/90 transition-colors">
          <FileText className="h-4 w-4" />
          Generate Report
        </button>
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
        className="flex gap-3 mb-6"
      >
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-sm text-white/50 font-mono hover:bg-white/[0.06] transition-colors">
          <Calendar className="h-3.5 w-3.5" />
          Date Range
        </button>
        <button className="flex items-center gap-2 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-sm text-white/50 font-mono hover:bg-white/[0.06] transition-colors">
          <Filter className="h-3.5 w-3.5" />
          Filter
        </button>
      </motion.div>

      {/* Report list */}
      <div className="space-y-3">
        {REPORTS.map((report, i) => {
          const Icon = report.icon;
          return (
            <motion.div
              key={report.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 + i * 0.06, ease: EASE }}
              className="flex items-center justify-between bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 hover:border-white/[0.10] transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${report.colour}10`, border: `1px solid ${report.colour}30` }}
                >
                  <Icon className="h-4 w-4" style={{ color: report.colour }} />
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{report.name}</p>
                  <p className="text-xs text-white/30 font-mono mt-0.5">{report.date} · {report.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="text-[10px] font-mono px-2 py-0.5 rounded-sm border"
                  style={{ color: report.colour, borderColor: `${report.colour}40`, backgroundColor: `${report.colour}10` }}
                >
                  Ready
                </span>
                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-sm text-xs text-white/50 font-mono hover:bg-white/[0.07] hover:text-white/80 transition-colors opacity-0 group-hover:opacity-100">
                  <Download className="h-3 w-3" />
                  Download
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
