"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Database,
  LayoutDashboard,
  Lock,
  Zap,
} from "lucide-react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // If logged in, go straight to founder workspace
  useEffect(() => {
    if (!loading && user) {
      router.push("/founder/workspace");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center px-6">
      {/* Logo + Title */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mb-6">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-3">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Unite-Hub
          </span>
        </h1>
        <p className="text-zinc-400 text-lg">
          Command Centre
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-6 mb-12 text-center">
        <div>
          <div className="text-2xl font-bold text-blue-400">6</div>
          <div className="text-xs text-zinc-500 mt-1">Businesses</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-cyan-400">231</div>
          <div className="text-xs text-zinc-500 mt-1">Active Issues</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-emerald-400">24/7</div>
          <div className="text-xs text-zinc-500 mt-1">Bron Online</div>
        </div>
      </div>

      {/* Login */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          Open Command Centre
          <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
          <Lock className="w-3 h-3" />
          <span>Private — Founder access only</span>
        </div>
      </div>

      {/* Quick Links (when logged out) */}
      <div className="mt-16 grid grid-cols-3 gap-4 text-center">
        <QuickLink icon={<LayoutDashboard className="w-4 h-4" />} label="Dashboard" href="/founder/dashboard" />
        <QuickLink icon={<Database className="w-4 h-4" />} label="Workspace" href="/founder/workspace" />
        <QuickLink icon={<Building2 className="w-4 h-4" />} label="Businesses" href="/founder/businesses" />
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-xs text-zinc-700">
        Unite-Hub &copy; {new Date().getFullYear()} — Built by Bron 🦞
      </footer>
    </div>
  );
}

function QuickLink({ icon, label, href }: { icon: React.ReactNode; label: string; href: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1.5 px-4 py-3 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 transition-colors"
    >
      {icon}
      <span className="text-[11px]">{label}</span>
    </Link>
  );
}
