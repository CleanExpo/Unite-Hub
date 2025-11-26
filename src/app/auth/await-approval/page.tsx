"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AlertCircle, Clock, Mail, ArrowRight } from "lucide-react";

export default function AwaitApprovalPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [approval, setApproval] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(600); // 10 minutes in seconds

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getSession();

        if (!user) {
          router.push("/login");
          return;
        }

        setUser(user);

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", user.id)
          .single();

        // If not admin, redirect to dashboard
        if (profile?.role !== "admin") {
          router.push("/synthex/dashboard");
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
          // No pending approval, might be on a trusted device or already approved
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
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 mb-4">
              <Clock className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
            <p className="text-slate-300">Loading approval status...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-red-600">
          <div className="p-8">
            <div className="flex items-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500 mr-3" />
              <h1 className="text-lg font-semibold text-red-500">Error</h1>
            </div>
            <p className="text-slate-300 mb-6">{error}</p>
            <Button
              onClick={() => router.push("/login")}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Return to Login
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const isExpiringSoon = timeRemaining < 60;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-800 border-slate-700 shadow-2xl">
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4">
              <Mail className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Awaiting Approval
            </h1>
            <p className="text-slate-400">
              Your new device needs to be approved
            </p>
          </div>

          {/* Message */}
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
            <p className="text-slate-300 text-sm">
              An approval request has been sent to <strong>Phill</strong>. Click
              the link in the email to approve access from your current device.
            </p>
          </div>

          {/* Timer */}
          <div className="mb-6">
            <div className="text-center mb-2">
              <p className="text-slate-400 text-sm">Approval expires in:</p>
            </div>
            <div
              className={`text-center text-4xl font-bold font-mono ${
                isExpiringSoon ? "text-red-400" : "text-blue-400"
              }`}
            >
              {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
            </div>
            {isExpiringSoon && (
              <p className="text-red-400 text-xs text-center mt-2">
                Expiring soon! Check your email urgently.
              </p>
            )}
          </div>

          {/* What to do */}
          <div className="bg-slate-700/30 border border-slate-600 rounded-lg p-4 mb-6">
            <h3 className="text-white font-semibold text-sm mb-3">
              What to do next:
            </h3>
            <ol className="space-y-2 text-sm text-slate-300">
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold mr-2 flex-shrink-0">
                  1
                </span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold mr-2 flex-shrink-0">
                  2
                </span>
                <span>Click the "Approve Device" link in the email from Phill</span>
              </li>
              <li className="flex items-start">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 text-xs font-semibold mr-2 flex-shrink-0">
                  3
                </span>
                <span>You'll be automatically redirected to the CRM</span>
              </li>
            </ol>
          </div>

          {/* Device info */}
          <div className="text-xs text-slate-500 bg-slate-700/20 p-3 rounded mb-6 border border-slate-600/50">
            <p className="mb-1">
              <strong>User:</strong> {user?.email}
            </p>
            <p>
              <strong>Status:</strong> Awaiting{" "}
              <span className="text-blue-400">Phill's approval</span>
            </p>
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <Button
              onClick={() => window.location.href = "https://mail.google.com"}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Mail className="w-4 h-4 mr-2" />
              Open Gmail
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full border-slate-600 hover:bg-slate-700"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Refresh Status
            </Button>
          </div>

          {/* Help text */}
          <p className="text-xs text-slate-500 text-center mt-6 border-t border-slate-700 pt-6">
            Having issues?{" "}
            <a
              href="mailto:phill.mcgurk@gmail.com"
              className="text-blue-400 hover:text-blue-300"
            >
              Contact Phill
            </a>
          </p>
        </div>
      </Card>
    </div>
  );
}
