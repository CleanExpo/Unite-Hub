"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Mail,
  FileText,
  Users,
  Lightbulb,
  Target,
  Megaphone,
  Sparkles,
  Image as ImageIcon,
  Settings,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarNavigationProps {
  isOpen: boolean;
  onToggle: () => void;
}

const navigationItems = [
  { name: "Dashboard", href: "/portal/dashboard", icon: LayoutDashboard, enabled: true },
  { name: "Emails", href: "/portal/emails", icon: Mail, enabled: true },
  { name: "Assets", href: "/portal/assets", icon: FileText, enabled: true },
  { name: "Persona", href: "/portal/persona", icon: Users, enabled: true },
  { name: "Mind Map", href: "/portal/mindmap", icon: Lightbulb, enabled: true },
  { name: "Strategy", href: "/portal/strategy", icon: Target, enabled: true },
  { name: "Campaigns", href: "#", icon: Megaphone, enabled: false, badge: "Soon" },
  { name: "Hooks Library", href: "/portal/hooks", icon: Sparkles, enabled: true },
  { name: "AI Images", href: "/portal/images", icon: ImageIcon, enabled: true },
  { name: "Settings", href: "/portal/settings", icon: Settings, enabled: true },
];

export function SidebarNavigation({ isOpen, onToggle }: SidebarNavigationProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-20 bg-gray-900/50 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-30 flex flex-col bg-white border-r border-gray-200 transition-all duration-300",
          isOpen ? "w-64" : "w-20"
        )}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {isOpen && (
            <Link href="/portal/dashboard" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">UH</span>
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Unite-Hub
              </span>
            </Link>
          )}
          {!isOpen && (
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mx-auto">
              <span className="text-white font-bold text-sm">UH</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-1">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;
              const isDisabled = item.enabled === false;

              const content = (
                <>
                  <item.icon className={cn("h-5 w-5 flex-shrink-0", isOpen && "mr-3")} />
                  {isOpen && (
                    <span className="text-sm font-medium flex-1">{item.name}</span>
                  )}
                  {isOpen && item.badge && (
                    <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-600 rounded-full">
                      {item.badge}
                    </span>
                  )}
                </>
              );

              return (
                <li key={item.name}>
                  {isDisabled ? (
                    <div
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg cursor-not-allowed",
                        "text-gray-400 opacity-60"
                      )}
                      title={!isOpen ? `${item.name} (Coming Soon)` : undefined}
                    >
                      {content}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center px-3 py-2.5 rounded-lg transition-all duration-200",
                        isActive
                          ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/30"
                          : "text-gray-700 hover:bg-gray-100"
                      )}
                      title={!isOpen ? item.name : undefined}
                    >
                      {content}
                    </Link>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Toggle Button */}
        <div className="p-3 border-t border-gray-200">
          <button
            onClick={onToggle}
            className="w-full flex items-center justify-center px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {isOpen ? (
              <ChevronLeft className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>
    </>
  );
}
