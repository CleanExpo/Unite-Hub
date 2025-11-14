"use client";

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Check, X, Clock, FileText, Image as ImageIcon, Video } from "lucide-react";

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
    color: "text-purple-600",
    bgColor: "bg-purple-100",
  },
  content: {
    icon: FileText,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  video: {
    icon: Video,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  document: {
    icon: FileText,
    color: "text-gray-600",
    bgColor: "bg-gray-100",
  },
};

const priorityConfig = {
  high: "bg-red-100 text-red-700 border-red-200",
  medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
  low: "bg-gray-100 text-gray-700 border-gray-200",
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
    <Card className={cn("hover:shadow-md transition-shadow duration-200", className)}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          {/* Type Icon */}
          <div className={cn("p-3 rounded-lg", typeInfo.bgColor)}>
            <TypeIcon className={cn("h-5 w-5", typeInfo.color)} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-unite-navy mb-1">{approval.title}</h4>
                <p className="text-sm text-gray-600">{approval.client}</p>
              </div>
              <Badge variant="outline" className={cn("text-xs ml-2", priorityConfig[approval.priority])}>
                {approval.priority.charAt(0).toUpperCase() + approval.priority.slice(1)}
              </Badge>
            </div>

            {approval.description && (
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{approval.description}</p>
            )}

            {/* Submitted By */}
            <div className="flex items-center gap-2 mb-3">
              <Avatar className="h-6 w-6">
                {approval.submittedBy.avatar && (
                  <AvatarImage src={approval.submittedBy.avatar} alt={approval.submittedBy.name} />
                )}
                <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white text-xs">
                  {approval.submittedBy.initials}
                </AvatarFallback>
              </Avatar>
              <span className="text-xs text-gray-500">
                {approval.submittedBy.name} • {approval.submittedAt}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleApprove}
                disabled={isProcessing}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <Check className="h-4 w-4 mr-1" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={handleDecline}
                disabled={isProcessing}
                className="border-red-200 text-red-600 hover:bg-red-50"
              >
                <X className="h-4 w-4 mr-1" />
                Decline
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
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
    <Card className={className}>
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-unite-navy">
            Pending Approvals
          </CardTitle>
          <Badge variant="secondary" className="bg-unite-orange text-white">
            {approvals.length} pending
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        {approvals.length === 0 ? (
          <div className="text-center py-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Check className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">No pending approvals</p>
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
      </CardContent>
    </Card>
  );
}
