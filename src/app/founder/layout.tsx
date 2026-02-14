"use client";

import { Breadcrumbs } from "@/components/layout/Breadcrumbs";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  LineChart,
  Bot,
  Lightbulb,
  Building2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const founderNavItems = [
  { label: "Dashboard", href: "/founder/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/founder/agents", icon: Bot },
  { label: "AI Phill", href: "/founder/ai-phill", icon: Brain },
  { label: "Businesses", href: "/founder/businesses", icon: Building2 },
  { label: "Analytics", href: "/founder/analytics", icon: LineChart },
  { label: "Insights", href: "/founder/insights", icon: Lightbulb },
];

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      {/* Founder Top Bar */}
      <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/overview"
              className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent"
            >
              Unite-Hub
            </Link>
            <ChevronRight className="w-4 h-4 text-slate-600" />
            <span className="text-sm font-medium text-slate-300">Founder OS</span>
          </div>
          <div className="hidden md:flex items-center gap-1">
            {founderNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                    isActive
                      ? "bg-slate-800 text-white"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
          <Link
            href="/dashboard/overview"
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </nav>

      {/* Breadcrumbs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <Breadcrumbs />
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
