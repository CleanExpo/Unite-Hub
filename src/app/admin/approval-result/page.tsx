"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
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
  accentClass: string;
  borderClass: string;
  actionLabel: string;
  actionHref: string;
}

function ApprovalResultContent() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") || "invalid") as StatusType;

  const statusConfigs: Record<StatusType, StatusConfig> = {
    approved: {
      icon: <CheckCircle className="w-16 h-16 text-[#00FF88]" />,
      title: "Device Approved!",
      message:
        "The device has been successfully approved and trusted for 90 days. The user can now access the CRM system.",
      accentClass: "text-[#00FF88]",
      borderClass: "border-[#00FF88]/20",
      actionLabel: "Go to Admin Dashboard",
      actionHref: "/admin/dashboard",
    },
    denied: {
      icon: <XCircle className="w-16 h-16 text-[#FF4444]" />,
      title: "Request Denied",
      message:
        "You have denied this device approval request. The user will need to submit a new request to access the CRM.",
      accentClass: "text-[#FF4444]",
      borderClass: "border-[#FF4444]/20",
      actionLabel: "Go to Pending Approvals",
      actionHref: "/admin/pending-approvals",
    },
    expired: {
      icon: <Clock className="w-16 h-16 text-[#FFB800]" />,
      title: "Approval Token Expired",
      message:
        "This approval request has expired (10-minute limit). The user will need to request a new approval.",
      accentClass: "text-[#FFB800]",
      borderClass: "border-[#FFB800]/20",
      actionLabel: "View Pending Approvals",
      actionHref: "/admin/pending-approvals",
    },
    not_found: {
      icon: <AlertCircle className="w-16 h-16 text-[#FFB800]" />,
      title: "Request Not Found",
      message:
        "The approval request could not be found or the token is invalid. This link may have already been used or is incorrect.",
      accentClass: "text-[#FFB800]",
      borderClass: "border-[#FFB800]/20",
      actionLabel: "Back to Dashboard",
      actionHref: "/admin/dashboard",
    },
    unauthorized: {
      icon: <XCircle className="w-16 h-16 text-[#FF4444]" />,
      title: "Unauthorised",
      message:
        "Only authorised administrators can approve device access requests. Please ensure you are logged in with the correct account.",
      accentClass: "text-[#FF4444]",
      borderClass: "border-[#FF4444]/20",
      actionLabel: "Logout & Login Again",
      actionHref: "/login",
    },
    invalid: {
      icon: <AlertCircle className="w-16 h-16 text-[#FFB800]" />,
      title: "Invalid Request",
      message:
        "The approval request contains invalid or missing parameters. Please check the link and try again.",
      accentClass: "text-[#FFB800]",
      borderClass: "border-[#FFB800]/20",
      actionLabel: "Back to Dashboard",
      actionHref: "/admin/dashboard",
    },
    already_approved: {
      icon: <CheckCircle className="w-16 h-16 text-[#00F5FF]" />,
      title: "Already Approved",
      message:
        "This device was already approved previously. No further action is needed.",
      accentClass: "text-[#00F5FF]",
      borderClass: "border-[#00F5FF]/20",
      actionLabel: "View Approved Devices",
      actionHref: "/admin/trusted-devices",
    },
    approval_failed: {
      icon: <AlertCircle className="w-16 h-16 text-[#FF4444]" />,
      title: "Approval Failed",
      message:
        "An error occurred while processing the approval. Please try again or contact support.",
      accentClass: "text-[#FF4444]",
      borderClass: "border-[#FF4444]/20",
      actionLabel: "Try Again",
      actionHref: "/admin/pending-approvals",
    },
    error: {
      icon: <AlertCircle className="w-16 h-16 text-[#FF4444]" />,
      title: "Server Error",
      message:
        "An unexpected error occurred while processing your request. Please try again later.",
      accentClass: "text-[#FF4444]",
      borderClass: "border-[#FF4444]/20",
      actionLabel: "Back to Dashboard",
      actionHref: "/admin/dashboard",
    },
  };

  const config = statusConfigs[status];

  return (
    <div className={`w-full max-w-md bg-white/[0.02] border rounded-sm ${config.borderClass}`}>
      <div className="p-8 text-center">
        <div className="flex justify-center mb-6">{config.icon}</div>
        <h1 className="text-2xl font-bold font-mono text-white/90 mb-2">
          {config.title}
        </h1>
        <p className={`text-sm font-mono ${config.accentClass} mb-8 leading-relaxed`}>
          {config.message}
        </p>
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 mb-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/20 mb-2">Status Code:</p>
          <p className="text-sm font-mono text-white/60">{status}</p>
        </div>
        <div className="space-y-3">
          <Link href={config.actionHref} className="block">
            <button className="w-full py-2.5 bg-[#00F5FF]/10 border border-[#00F5FF]/30 rounded-sm text-sm font-mono text-[#00F5FF] hover:bg-[#00F5FF]/20 transition-colors">
              {config.actionLabel}
            </button>
          </Link>
          {status !== "approved" && (
            <Link href="/admin/dashboard" className="block">
              <button className="w-full flex items-center justify-center gap-2 py-2.5 border border-white/[0.06] rounded-sm text-sm font-mono text-white/40 hover:text-white/90 hover:border-white/20 transition-colors">
                <Home className="w-4 h-4" />
                Go to Dashboard
              </button>
            </Link>
          )}
        </div>
        <div className="mt-8 pt-6 border-t border-white/[0.06]">
          <p className="text-[10px] font-mono text-white/20">
            Need help?{" "}
            <a
              href="mailto:support@example.com"
              className="text-[#00F5FF] hover:text-[#00F5FF]/70 transition-colors"
            >
              Contact Support
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] rounded-sm">
      <div className="p-8 text-center">
        <div className="flex justify-center mb-6">
          <Loader2 className="w-16 h-16 text-[#00F5FF] animate-spin" />
        </div>
        <h1 className="text-2xl font-bold font-mono text-white/90 mb-2">Loading...</h1>
        <p className="text-sm font-mono text-white/30">Please wait while we check your approval status.</p>
      </div>
    </div>
  );
}

export default function ApprovalResultPage() {
  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <Suspense fallback={<LoadingFallback />}>
        <ApprovalResultContent />
      </Suspense>
    </div>
  );
}
