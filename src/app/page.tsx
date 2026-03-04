"use client";

import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Lock,
  Zap,
  BarChart3,
  Megaphone,
  Shield,
  GraduationCap,
  ShoppingCart,
  Calculator,
} from "lucide-react";

const nexusProducts = [
  { name: "Synthex", icon: Megaphone, color: "text-purple-400", desc: "Social Media" },
  { name: "DR / NRPG", icon: Shield, color: "text-blue-400", desc: "Industry Authority" },
  { name: "RestoreAssist", icon: GraduationCap, color: "text-emerald-400", desc: "Training" },
  { name: "CCW", icon: ShoppingCart, color: "text-amber-400", desc: "Wholesale" },
  { name: "ATO AI", icon: Calculator, color: "text-orange-400", desc: "Tax Compliance" },
];

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push("/founder/workspace");
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white flex flex-col items-center justify-center px-6">
      {/* Logo + Title */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 mb-6 shadow-lg shadow-blue-600/20">
          <Zap className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-2">
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            Unite-Hub
          </span>
        </h1>
        <p className="text-zinc-500 text-sm tracking-widest uppercase">
          Unite-Group Nexus
        </p>
      </div>

      {/* The Nexus — Product Ring */}
      <div className="flex flex-wrap justify-center gap-3 mb-10 max-w-md">
        {nexusProducts.map((p) => {
          const Icon = p.icon;
          return (
            <div
              key={p.name}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/80 border border-zinc-800"
            >
              <Icon className={`w-3.5 h-3.5 ${p.color}`} />
              <div>
                <div className="text-xs font-medium text-zinc-300">{p.name}</div>
                <div className="text-[10px] text-zinc-600">{p.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Login */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          href="/login"
          className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all shadow-lg shadow-blue-600/20"
        >
          Open Nexus
          <ArrowRight className="w-4 h-4" />
        </Link>

        <div className="flex items-center justify-center gap-2 text-xs text-zinc-600">
          <Lock className="w-3 h-3" />
          <span>Founder access only</span>
        </div>
      </div>

      {/* Footer */}
      <footer className="absolute bottom-6 text-center">
        <div className="text-xs text-zinc-700">
          Unite-Group &copy; {new Date().getFullYear()}
        </div>
        <div className="text-[10px] text-zinc-800 mt-1">
          6 businesses. 1 platform. The Nexus.
        </div>
      </footer>
    </div>
  );
}
