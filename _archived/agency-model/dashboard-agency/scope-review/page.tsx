"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileSearch, CheckCircle, XCircle, Clock, Edit } from "lucide-react";

export default function ScopeReviewPage() {
  const reviews = [
    { project: "E-commerce Platform", client: "TechStart Inc", status: "Pending", submitted: "2 hours ago" },
    { project: "Mobile App Development", client: "HealthFirst", status: "Approved", submitted: "1 day ago" },
    { project: "Website Redesign", client: "LocalBiz Co", status: "Changes Requested", submitted: "3 days ago" },
    { project: "Marketing Automation", client: "GrowthLabs", status: "Pending", submitted: "5 hours ago" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Scope Review</h1>
          <p className="text-slate-400 mt-1">Review and approve project scopes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Clock className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-white">2</p>
              <p className="text-sm text-slate-400">Pending Review</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-emerald-500" />
            <div>
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-sm text-slate-400">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4 flex items-center gap-3">
            <Edit className="h-5 w-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-white">1</p>
              <p className="text-sm text-slate-400">Changes Requested</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <Card key={index} className="bg-slate-800/50 border-slate-700">
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <FileSearch className="h-5 w-5 text-cyan-500" />
                </div>
                <div>
                  <h3 className="font-medium text-white">{review.project}</h3>
                  <p className="text-sm text-slate-400">{review.client} • Submitted {review.submitted}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded ${
                  review.status === "Approved" ? "bg-emerald-500/20 text-emerald-400" :
                  review.status === "Pending" ? "bg-yellow-500/20 text-yellow-400" :
                  "bg-orange-500/20 text-orange-400"
                }`}>
                  {review.status}
                </span>
                <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
