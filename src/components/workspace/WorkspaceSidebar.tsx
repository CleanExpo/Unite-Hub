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
      href: "/client/workspace",
      label: "Dashboard",
      icon: <LayoutGrid className="w-4 h-4" />,
    },
    {
      href: "/client/ideas",
      label: "Smart Brief",
      icon: <FileText className="w-4 h-4" />,
    },
    {
      href: "/client/workspace/queue",
      label: "Review Queue",
      icon: <CheckCircle className="w-4 h-4" />,
      badge: 3,
    },
    {
      href: "/client/vault",
      label: "The Vault",
      icon: <Archive className="w-4 h-4" />,
    },
    {
      href: "/client/settings",
      label: "Settings",
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <aside className="w-[220px] bg-gray-50 p-6 border-r border-gray-200 flex flex-col justify-between">
      <div>
        {/* Logo */}
        <div className="font-bold text-lg text-gray-900 mb-10 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            UH
          </div>
          Unite-Hub
        </div>

        {/* Navigation */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-black/5 text-gray-900 border-l-4 border-[#B6F232] pl-2"
                    : "text-gray-500 hover:bg-black/[0.03] hover:text-gray-900"
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
                {item.badge && (
                  <span className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Health */}
      <div className="bg-green-50 p-3 rounded-xl flex items-center">
        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center mr-3">
          <CheckCheck className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="text-xs text-gray-500">
          System Health:
          <span className="block font-semibold text-green-500">Optimal</span>
        </div>
      </div>
    </aside>
  );
}
