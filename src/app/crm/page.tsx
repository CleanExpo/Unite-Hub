"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Shield, BarChart3, Users, Settings } from "lucide-react";
import Link from "next/link";

export default function CRMPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const approved = searchParams.get("approved") === "true";
  const message = searchParams.get("message");

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
        const { data: userProfile } = await supabase
          .from("profiles")
          .select("role, email")
          .eq("id", user.id)
          .single();

        setProfile(userProfile);

        // If not admin, redirect to synthex dashboard
        if (userProfile?.role !== "admin") {
          router.push("/synthex/dashboard");
          return;
        }

        setLoading(false);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load CRM");
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800 border-slate-700">
          <div className="p-8 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-700 mb-4">
              <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-slate-300">Loading CRM...</p>
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
            <h1 className="text-lg font-semibold text-red-500 mb-2">Error</h1>
            <p className="text-slate-300 mb-6">{error}</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Try Again
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 to-slate-800 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Approval Success Banner */}
        {approved && (
          <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-400">Device Approved</h3>
                <p className="text-sm text-green-200">{message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Unite-Hub CRM
          </h1>
          <p className="text-slate-400">
            Welcome, <strong>{profile?.email}</strong>
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {/* Contacts Card */}
          <Card className="bg-slate-800 border-slate-700 hover:border-blue-500/50 transition-colors">
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-blue-500/10 mb-4">
                <Users className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Contacts
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Manage your CRM contacts
              </p>
              <Link href="/crm/contacts">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  View Contacts
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Campaigns Card */}
          <Card className="bg-slate-800 border-slate-700 hover:border-purple-500/50 transition-colors">
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-purple-500/10 mb-4">
                <BarChart3 className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Campaigns
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                View email campaigns
              </p>
              <Link href="/crm/campaigns">
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  View Campaigns
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Security Card */}
          <Card className="bg-slate-800 border-slate-700 hover:border-green-500/50 transition-colors">
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-green-500/10 mb-4">
                <Shield className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Trusted Devices
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Manage approved devices
              </p>
              <Link href="/crm/admin/devices">
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Manage Devices
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>

          {/* Settings Card */}
          <Card className="bg-slate-800 border-slate-700 hover:border-orange-500/50 transition-colors">
            <div className="p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-orange-500/10 mb-4">
                <Settings className="w-6 h-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-1">
                Settings
              </h3>
              <p className="text-sm text-slate-400 mb-4">
                Account and security settings
              </p>
              <Link href="/crm/settings">
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  Go to Settings
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Quick Info */}
        <Card className="bg-slate-800 border-slate-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4">
              Quick Reference
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-slate-400">
              <div>
                <p className="font-semibold text-slate-300 mb-1">Your Role</p>
                <p className="capitalize">{profile?.role}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 mb-1">Email</p>
                <p>{profile?.email}</p>
              </div>
              <div>
                <p className="font-semibold text-slate-300 mb-1">Status</p>
                <p className="text-green-400">✓ Approved</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
