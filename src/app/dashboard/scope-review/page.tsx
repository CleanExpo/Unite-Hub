"use client";

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
          <h1 className="text-3xl font-bold text-white/90">Scope Review</h1>
          <p className="text-white/50 mt-1">Review and approve project scopes</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-[#FFB800]" />
          <div>
            <p className="text-2xl font-bold text-white/90">2</p>
            <p className="text-sm text-white/50">Pending Review</p>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center gap-3">
          <CheckCircle className="h-5 w-5 text-[#00FF88]" />
          <div>
            <p className="text-2xl font-bold text-white/90">1</p>
            <p className="text-sm text-white/50">Approved</p>
          </div>
        </div>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center gap-3">
          <Edit className="h-5 w-5 text-[#FFB800]" />
          <div>
            <p className="text-2xl font-bold text-white/90">1</p>
            <p className="text-sm text-white/50">Changes Requested</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((review, index) => (
          <div key={index} className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-white/[0.04] rounded-sm">
                <FileSearch className="h-5 w-5 text-[#00F5FF]" />
              </div>
              <div>
                <h3 className="font-medium text-white/90">{review.project}</h3>
                <p className="text-sm text-white/50">{review.client} • Submitted {review.submitted}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-1 rounded-sm font-mono ${
                review.status === "Approved" ? "bg-[#00FF88]/10 text-[#00FF88]" :
                review.status === "Pending" ? "bg-[#FFB800]/10 text-[#FFB800]" :
                "bg-[#FFB800]/10 text-[#FFB800]"
              }`}>
                {review.status}
              </span>
              <button className="bg-white/[0.04] border border-white/[0.06] text-white/60 font-mono text-sm rounded-sm px-3 py-1.5">
                Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
