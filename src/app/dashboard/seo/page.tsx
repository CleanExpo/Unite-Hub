"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, TrendingUp, Globe, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

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
          <p className="text-slate-400 mt-1">Monitor search rankings and optimization opportunities</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <RefreshCw className="h-4 w-4 mr-2" />
          Update Rankings
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Domain Authority</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">42</div>
            <p className="text-xs text-emerald-500 mt-1">+3 this month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Organic Traffic</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">8.2K</div>
            <p className="text-xs text-emerald-500 mt-1">+12% from last month</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-slate-400">Keywords Ranked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">156</div>
            <p className="text-xs text-slate-400 mt-1">Top 100 positions</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Search className="h-5 w-5" />
            Keyword Rankings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {rankings.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                <div>
                  <p className="font-medium text-white">{item.keyword}</p>
                  <p className="text-sm text-slate-400">{item.volume.toLocaleString()} monthly searches</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-2xl font-bold text-white">#{item.position}</span>
                  <span className={`text-sm flex items-center ${
                    item.change > 0 ? "text-emerald-500" : item.change < 0 ? "text-red-500" : "text-slate-400"
                  }`}>
                    {item.change > 0 ? `+${item.change}` : item.change === 0 ? "-" : item.change}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
