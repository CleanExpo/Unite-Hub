"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Home,
  Loader2,
} from "lucide-react";
import Link from "next/link";

type StatusType =
  | "approved"
  | "denied"
  | "expired"
  | "not_found"
  | "unauthorized"
  | "invalid"
  | "already_approved"
  | "approval_failed"
  | "error";

interface StatusConfig {
  icon: React.ReactNode;
  title: string;
  message: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  actionLabel: string;
  actionHref: string;
}

function ApprovalResultContent() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "invalid") as StatusType;

  const statusConfigs: Record<StatusType, StatusConfig> = {
    approved: {
      icon: <CheckCircle className="w-16 h-16 text-green-400" />,
      title: "Device Approved!",
      message:
        "The device has been successfully approved and trusted for 90 days. The user can now access the CRM system.",
      bgColor: "bg-green-500/10",
      textColor: "text-green-200",
      borderColor: "border-green-500/30",
      actionLabel: "Go to Admin Dashboard",
      actionHref: "/admin/dashboard",
    },
    denied: {
      icon: <XCircle className="w-16 h-16 text-red-400" />,
      title: "Request Denied",
      message:
        "You have denied this device approval request. The user will need to submit a new request to access the CRM.",
      bgColor: "bg-red-500/10",
      textColor: "text-red-200",
      borderColor: "border-red-500/30",
      actionLabel: "Go to Pending Approvals",
      actionHref: "/admin/pending-approvals",
    },
    expired: {
      icon: <Clock className="w-16 h-16 text-yellow-400" />,
      title: "Approval Token Expired",
      message:
        "This approval request has expired (10-minute limit). The user will need to request a new approval.",
      bgColor: "bg-yellow-500/10",
      textColor: "text-yellow-200",
      borderColor: "border-yellow-500/30",
      actionLabel: "View Pending Approvals",
      actionHref: "/admin/pending-approvals",
    },
    not_found: {
      icon: <AlertCircle className="w-16 h-16 text-orange-400" />,
      title: "Request Not Found",
      message:
        "The approval request could not be found or the token is invalid. This link may have already been used or is incorrect.",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-200",
      borderColor: "border-orange-500/30",
      actionLabel: "Back to Dashboard",
      actionHref: "/admin/dashboard",
    },
    unauthorized: {
      icon: <XCircle className="w-16 h-16 text-red-400" />,
      title: "Unauthorized",
      message:
        "Only authorized administrators can approve device access requests. Please ensure you are logged in with the correct account.",
      bgColor: "bg-red-500/10",
      textColor: "text-red-200",
      borderColor: "border-red-500/30",
      actionLabel: "Logout & Login Again",
      actionHref: "/login",
    },
    invalid: {
      icon: <AlertCircle className="w-16 h-16 text-orange-400" />,
      title: "Invalid Request",
      message:
        "The approval request contains invalid or missing parameters. Please check the link and try again.",
      bgColor: "bg-orange-500/10",
      textColor: "text-orange-200",
      borderColor: "border-orange-500/30",
      actionLabel: "Back to Dashboard",
      actionHref: "/admin/dashboard",
    },
    already_approved: {
      icon: <CheckCircle className="w-16 h-16 text-blue-400" />,
      title: "Already Approved",
      message:
        "This device was already approved previously. No further action is needed.",
      bgColor: "bg-blue-500/10",
      textColor: "text-blue-200",
      borderColor: "border-blue-500/30",
      actionLabel: "View Approved Devices",
      actionHref: "/admin/trusted-devices",
    },
    approval_failed: {
      icon: <AlertCircle className="w-16 h-16 text-red-400" />,
      title: "Approval Failed",
      message:
        "An error occurred while processing the approval. Please try again or contact support.",
      bgColor: "bg-red-500/10",
      textColor: "text-red-200",
      borderColor: "border-red-500/30",
      actionLabel: "Try Again",
      actionHref: "/admin/pending-approvals",
    },
    error: {
      icon: <AlertCircle className="w-16 h-16 text-red-400" />,
      title: "Server Error",
      message:
        "An unexpected error occurred while processing your request. Please try again later.",
      bgColor: "bg-red-500/10",
      textColor: "text-red-200",
      borderColor: "border-red-500/30",
      actionLabel: "Back to Dashboard",
      actionHref: "/admin/dashboard",
    },
  };

  const config = statusConfigs[status];

  return (
    <Card
      className={`w-full max-w-md ${config.bgColor} border ${config.borderColor}`}
    >
      <div className="p-8 text-center">
        <div className="flex justify-center mb-6">{config.icon}</div>
        <h1 className="text-2xl font-bold text-white mb-2">
          {config.title}
        </h1>
        <p className={`text-sm ${config.textColor} mb-8 leading-relaxed`}>
          {config.message}
        </p>
        <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
          <p className="text-xs text-slate-400 mb-2">Status Code:</p>
          <p className="text-sm font-mono text-slate-300">{status}</p>
        </div>
        <div className="space-y-3">
          <Link href={config.actionHref} className="block">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
              {config.actionLabel}
            </Button>
          </Link>
          {status !== "approved" && (
            <Link href="/admin/dashboard" className="block">
              <Button
                variant="outline"
                className="w-full border-slate-600 hover:bg-slate-700"
              >
                <Home className="w-4 h-4 mr-2" />
                Go to Dashboard
              </Button>
            </Link>
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-slate-600">
          <p className="text-xs text-slate-500">
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="text-blue-400 hover:text-blue-300"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </Card>
  );
}

function LoadingFallback() {
  return (
    <Card className="w-full max-w-md bg-slate-800/50 border border-slate-600">
      <div className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <Loader2 className="w-16 h-16 text-blue-400 animate-spin" />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
        <p className="text-sm text-slate-400">Please wait while we check your approval status.</p>
      </div>
    </Card>
  );
}

export default function ApprovalResultPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ApprovalResultContent />
      </Suspense>
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
