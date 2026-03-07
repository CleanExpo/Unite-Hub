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
  CheckSquare,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SearchDialog } from "@/components/nexus/SearchDialog";

const founderNavItems = [
  { label: "Dashboard", href: "/founder/dashboard", icon: LayoutDashboard },
  { label: "Agents", href: "/founder/agents", icon: Bot },
  { label: "AI Phill", href: "/founder/ai-phill", icon: Brain },
  { label: "Businesses", href: "/founder/businesses", icon: Building2 },
  { label: "Analytics", href: "/founder/analytics", icon: LineChart },
  { label: "Insights", href: "/founder/insights", icon: Lightbulb },
  { label: "Approvals", href: "/founder/approvals", icon: CheckSquare },
];

export default function FounderLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#050505]">
      {/* Founder Top Bar */}
      <nav className="border-b border-white/[0.06] bg-[#050505]/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link
              href="/dashboard/overview"
              className="text-xl font-bold font-mono text-[#00F5FF]"
            >
              Unite-Group
            </Link>
            <ChevronRight className="w-4 h-4 text-white/20" />
            <span className="text-sm font-mono text-white/50">Founder OS</span>
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
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-sm font-mono transition-colors",
                    isActive
                      ? "bg-[#00F5FF]/10 text-[#00F5FF] border border-[#00F5FF]/20"
                      : "text-white/40 hover:text-white/90 hover:bg-white/[0.03]"
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
            className="text-sm font-mono text-white/40 hover:text-white/90 transition-colors"
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

      {/* Global Search (Cmd+K / Ctrl+K) */}
      <SearchDialog />
    </div>
  );
}
