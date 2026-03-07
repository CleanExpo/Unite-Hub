"use client";

import { Search, RefreshCw } from "lucide-react";

export default function SEOPage() {
  const rankings = [
    { keyword: "crm software for small business", position: 3, change: 2, volume: 2400 },
    { keyword: "email marketing automation", position: 7, change: -1, volume: 5600 },
    { keyword: "lead generation tools", position: 12, change: 5, volume: 3200 },
    { keyword: "marketing automation platform", position: 5, change: 0, volume: 4100 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">SEO Dashboard</h1>
          <p className="text-white/50 mt-1">Monitor search rankings and optimization opportunities</p>
        </div>
        <button className="bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-4 py-2 flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Update Rankings
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <p className="text-sm font-medium text-white/40 mb-2">Domain Authority</p>
          <div className="text-3xl font-bold text-white">42</div>
          <p className="text-xs text-[#00FF88] mt-1">+3 this month</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <p className="text-sm font-medium text-white/40 mb-2">Organic Traffic</p>
          <div className="text-3xl font-bold text-white">8.2K</div>
          <p className="text-xs text-[#00FF88] mt-1">+12% from last month</p>
        </div>

        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
          <p className="text-sm font-medium text-white/40 mb-2">Keywords Ranked</p>
          <div className="text-3xl font-bold text-white">156</div>
          <p className="text-xs text-white/40 mt-1">Top 100 positions</p>
        </div>
      </div>

      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4">
        <h3 className="text-white font-semibold flex items-center gap-2 mb-4">
          <Search className="h-5 w-5" />
          Keyword Rankings
        </h3>
        <div className="space-y-4">
          {rankings.map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <div>
                <p className="font-medium text-white">{item.keyword}</p>
                <p className="text-sm text-white/40">{item.volume.toLocaleString()} monthly searches</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-white">#{item.position}</span>
                <span className={`text-sm flex items-center ${
                  item.change > 0 ? "text-[#00FF88]" : item.change < 0 ? "text-[#FF4444]" : "text-white/40"
                }`}>
                  {item.change > 0 ? `+${item.change}` : item.change === 0 ? "-" : item.change}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
