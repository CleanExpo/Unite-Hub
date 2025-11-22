"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutGrid,
  FileText,
  CheckCircle,
  Archive,
  Settings,
  CheckCheck,
} from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

export function WorkspaceSidebar() {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    {
      href: "/demo-workspace",
      label: "Dashboard",
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      href: "/demo-workspace/brief",
      label: "Smart Brief",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      href: "/demo-workspace/queue",
      label: "Review Queue",
      icon: <CheckCircle className="w-4 h-4" />,
      badge: 3,
    },
    {
      href: "/demo-workspace/vault",
      label: "The Vault",
      icon: <Archive className="w-4 h-4" />,
    },
    {
      href: "/demo-workspace/settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-[220px] bg-[#0d2137]/80 backdrop-blur-sm p-6 border-r border-cyan-900/30 flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="font-bold text-lg text-white mb-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold shadow-lg shadow-cyan-500/20">
            UH
          </div>
          <span className="bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
            Unite-Hub
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400 pl-2.5"
                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className={`mr-3 ${isActive ? "text-cyan-400" : ""}`}>
                  {item.icon}
                </span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Health */}
      <div className="bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 p-3 rounded-xl flex items-center">
        <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-emerald-500/30">
          <CheckCheck className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-xs text-gray-400">
          System Health:
          <span className="block font-semibold text-emerald-400">Optimal</span>
        </div>
      </div>
    </aside>
  );
}
