"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Download, Calendar, Filter } from "lucide-react";

export default function ReportsPage() {
  const reports = [
    { name: "Monthly Performance Report", date: "Nov 2024", type: "Performance", status: "Ready" },
    { name: "Lead Generation Analysis", date: "Nov 2024", type: "Leads", status: "Ready" },
    { name: "Email Campaign Summary", date: "Oct 2024", type: "Email", status: "Ready" },
    { name: "SEO Rankings Report", date: "Oct 2024", type: "SEO", status: "Ready" },
    { name: "Revenue Attribution", date: "Q3 2024", type: "Revenue", status: "Ready" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Reports</h1>
          <p className="text-slate-400 mt-1">Generate and download business reports</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700">
          <FileText className="h-4 w-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="flex gap-4">
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <Calendar className="h-4 w-4 mr-2" />
          Date Range
        </Button>
        <Button variant="outline" className="border-slate-700 text-slate-300">
          <Filter className="h-4 w-4 mr-2" />
          Filter
        </Button>
      </div>

      <div className="space-y-4">
        {reports.map((report, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <FileText className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{report.name}</h3>
                  <p className="text-sm text-slate-400">{report.date} • {report.type}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-1 rounded">
                  {report.status}
                </span>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
