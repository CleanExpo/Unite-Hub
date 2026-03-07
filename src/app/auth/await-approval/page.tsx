"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { AlertCircle, Clock, Mail, ArrowRight } from "lucide-react";

export default function AwaitApprovalPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [approval, setApproval] = useState<{
    id: string;
    requested_at: string;
    expires_at: string;
    approved: boolean;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const fetchData = async () => {
      try {
        // getSession returns { session }, NOT { user } — this was the previous bug
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
          router.push("/login");
          return;
        }

        const user = session.user;
        setUserEmail(user.email ?? null);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", user.id)
          .single();

        // If not admin, redirect to dashboard
        if (profile?.role !== "admin") {
          router.push("/dashboard/overview");
          return;
        }

        // Get pending approval requests (most recent)
        const { data: approvals } = await supabase
          .from("admin_approvals")
          .select("id, requested_at, expires_at, approved")
          .eq("user_id", user.id)
          .eq("approved", false)
          .gte("expires_at", new Date().toISOString())
          .order("requested_at", { ascending: false })
          .limit(1);

        if (approvals && approvals.length > 0) {
          setApproval(approvals[0]);

          // Calculate time remaining
          const expiresAt = new Date(approvals[0].expires_at).getTime();
          const now = new Date().getTime();
          const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
          setTimeRemaining(remaining);
        } else {
          // No pending approval — redirect to CRM
          router.push("/crm");
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching approval data:", err);
        setError("Failed to load approval status");
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  // Timer countdown
  useEffect(() => {
    if (!approval || timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setError("Approval token has expired. Please try logging in again.");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [approval]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] rounded-sm p-8 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 mb-4">
            <Clock className="w-6 h-6 text-[#00F5FF] animate-spin" />
          </div>
          <p className="text-white/50 font-mono text-sm">Loading approval status...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white/[0.02] border border-[#FF4444]/30 rounded-sm p-8">
          <div className="flex items-center mb-4">
            <AlertCircle className="w-6 h-6 text-[#FF4444] mr-3" />
            <h1 className="text-lg font-mono font-semibold text-[#FF4444]">Error</h1>
          </div>
          <p className="text-white/50 font-mono text-sm mb-6">{error}</p>
          <button
            onClick={() => router.push("/login")}
            className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 transition-colors"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isExpiringSoon = timeRemaining < 60;

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/[0.02] border border-white/[0.06] rounded-sm p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 mb-4">
            <Mail className="w-8 h-8 text-[#00F5FF]" />
          </div>
          <h1 className="text-2xl font-mono font-bold text-white/90 mb-2">
            Awaiting Approval
          </h1>
          <p className="text-white/40 font-mono text-sm">
            Your new device needs to be approved
          </p>
        </div>

        {/* Message */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 mb-6">
          <p className="text-white/50 font-mono text-sm">
            An approval request has been sent to <strong className="text-white/80">Phill</strong>. Click
            the link in the email to approve access from your current device.
          </p>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <div className="text-center mb-2">
            <p className="text-white/30 font-mono text-sm">Approval expires in:</p>
          </div>
          <div
            className={`text-center text-4xl font-bold font-mono ${
              isExpiringSoon ? "text-[#FF4444]" : "text-[#00F5FF]"
            }`}
          >
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </div>
          {isExpiringSoon && (
            <p className="text-[#FF4444] text-xs text-center mt-2 font-mono">
              Expiring soon! Check your email urgently.
            </p>
          )}
        </div>

        {/* What to do */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-4 mb-6">
          <h3 className="text-white/70 font-mono font-semibold text-sm mb-3">
            What to do next:
          </h3>
          <ol className="space-y-2 text-sm text-white/50 font-mono">
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] text-xs font-semibold mr-2 flex-shrink-0">
                1
              </span>
              <span>Check your email inbox (and spam folder)</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] text-xs font-semibold mr-2 flex-shrink-0">
                2
              </span>
              <span>Click the &quot;Approve Device&quot; link in the email from Phill</span>
            </li>
            <li className="flex items-start">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-sm bg-[#00F5FF]/10 border border-[#00F5FF]/20 text-[#00F5FF] text-xs font-semibold mr-2 flex-shrink-0">
                3
              </span>
              <span>You&apos;ll be automatically redirected to the CRM</span>
            </li>
          </ol>
        </div>

        {/* Device info */}
        <div className="text-xs text-white/30 font-mono bg-white/[0.02] p-3 rounded-sm mb-6 border border-white/[0.04]">
          <p className="mb-1">
            <strong className="text-white/50">User:</strong> {userEmail}
          </p>
          <p>
            <strong className="text-white/50">Status:</strong> Awaiting{" "}
            <span className="text-[#00F5FF]">Phill&apos;s approval</span>
          </p>
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => { window.location.href = "https://mail.google.com"; }}
            className="w-full bg-[#00F5FF] text-[#050505] font-mono text-sm font-bold rounded-sm px-5 py-2.5 hover:bg-[#00F5FF]/90 transition-colors flex items-center justify-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Open Gmail
          </button>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-white/[0.04] border border-white/[0.06] text-white/50 font-mono text-sm rounded-sm px-5 py-2.5 hover:bg-white/[0.06] hover:text-white/70 transition-colors flex items-center justify-center gap-2"
          >
            <ArrowRight className="w-4 h-4" />
            Refresh Status
          </button>
        </div>

        {/* Help text */}
        <p className="text-xs text-white/30 font-mono text-center mt-6 pt-6 border-t border-white/[0.06]">
          Having issues?{" "}
          <a
            href="mailto:phill.mcgurk@gmail.com"
            className="text-[#00F5FF] hover:text-[#00F5FF]/80 transition-colors"
          >
            Contact Phill
          </a>
        </p>
      </div>
    </div>
  );
}
