"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { Check, X, FileText, Image as ImageIcon, Video } from "lucide-react";

interface ApprovalItem {
  id: string;
  type: "design" | "content" | "video" | "document";
  title: string;
  client: string;
  submittedBy: {
    name: string;
    avatar?: string;
    initials: string;
  };
  submittedAt: string;
  priority: "high" | "medium" | "low";
  description?: string;
}

interface ApprovalCardProps {
  approval: ApprovalItem;
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  className?: string;
}

const typeConfig = {
  design: {
    icon: ImageIcon,
    color: "text-[#FF00FF]",
    bgColor: "bg-[#FF00FF]/[0.06] border-[#FF00FF]/20",
  },
  content: {
    icon: FileText,
    color: "text-[#00F5FF]",
    bgColor: "bg-[#00F5FF]/[0.06] border-[#00F5FF]/20",
  },
  video: {
    icon: Video,
    color: "text-[#FF4444]",
    bgColor: "bg-[#FF4444]/[0.06] border-[#FF4444]/20",
  },
  document: {
    icon: FileText,
    color: "text-white/40",
    bgColor: "bg-white/[0.03] border-white/[0.06]",
  },
};

const priorityConfig = {
  high: "border-[#FF4444]/30 text-[#FF4444]",
  medium: "border-[#FFB800]/30 text-[#FFB800]",
  low: "border-white/[0.06] text-white/40",
};

export function ApprovalCard({ approval, onApprove, onDecline, className }: ApprovalCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const typeInfo = typeConfig[approval.type];
  const TypeIcon = typeInfo.icon;

  const handleApprove = async () => {
    setIsProcessing(true);
    await onApprove?.(approval.id);
    setIsProcessing(false);
  };

  const handleDecline = async () => {
    setIsProcessing(true);
    await onDecline?.(approval.id);
    setIsProcessing(false);
  };

  return (
    <div className={cn("bg-white/[0.02] border border-white/[0.06] rounded-sm hover:border-white/10 transition-colors", className)}>
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Type Icon */}
          <div className={cn("p-3 border rounded-sm", typeInfo.bgColor)}>
            <TypeIcon className={cn("h-5 w-5", typeInfo.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-mono text-sm font-bold text-white/90 mb-1">{approval.title}</h4>
                <p className="text-xs font-mono text-white/30">{approval.client}</p>
              </div>
              <span className={cn("px-1.5 py-0.5 border rounded-sm text-[10px] font-mono ml-2", priorityConfig[approval.priority])}>
                {approval.priority.charAt(0).toUpperCase() + approval.priority.slice(1)}
              </span>
            </div>

            {approval.description && (
              <p className="text-xs font-mono text-white/40 mb-3 line-clamp-2">{approval.description}</p>
            )}

            {/* Submitted By */}
            <div className="flex items-center gap-2 mb-3">
              <div className="h-6 w-6 border border-white/[0.06] bg-white/[0.04] rounded-sm flex items-center justify-center">
                <span className="text-[9px] font-mono font-bold text-[#00F5FF]">{approval.submittedBy.initials}</span>
              </div>
              <span className="text-[10px] font-mono text-white/30">
                {approval.submittedBy.name} · {approval.submittedAt}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#00FF88]/10 border border-[#00FF88]/30 rounded-sm text-xs font-mono text-[#00FF88] hover:bg-[#00FF88]/20 transition-colors disabled:opacity-50"
              >
                <Check className="h-4 w-4" />
                Approve
              </button>
              <button
                onClick={handleDecline}
                disabled={isProcessing}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#FF4444]/[0.06] border border-[#FF4444]/20 rounded-sm text-xs font-mono text-[#FF4444] hover:bg-[#FF4444]/10 transition-colors disabled:opacity-50"
              >
                <X className="h-4 w-4" />
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Approval list container
interface ApprovalListProps {
  approvals: ApprovalItem[];
  onApprove?: (id: string) => void;
  onDecline?: (id: string) => void;
  className?: string;
}

export function ApprovalList({ approvals, onApprove, onDecline, className }: ApprovalListProps) {
  return (
    <div className={cn("bg-white/[0.02] border border-white/[0.06] rounded-sm", className)}>
      <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
        <h3 className="text-sm font-mono font-bold text-white/90">Pending Approvals</h3>
        <span className="px-2 py-0.5 bg-[#FFB800]/10 border border-[#FFB800]/30 rounded-sm text-[10px] font-mono text-[#FFB800]">
          {approvals.length} pending
        </span>
      </div>
      <div className="p-4">
        {approvals.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 border border-white/[0.06] rounded-sm bg-white/[0.02] mb-4">
              <Check className="h-8 w-8 text-white/20" />
            </div>
            <p className="text-white/30 font-mono text-sm">No pending approvals</p>
          </div>
        ) : (
          <div className="space-y-3">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprove={onApprove}
                onDecline={onDecline}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
