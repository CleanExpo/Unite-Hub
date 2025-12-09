"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  MessageSquare,
  BarChart3,
  Settings,
  Bell,
  LogOut,
  User,
  Sparkles,
  Code2,
  Wand2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/branding/Logo";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ModernSidebarProps {
  className?: string;
  userRole?: "owner" | "admin" | "member" | "viewer";
}

// Navigation items based on user role
const getNavigationItems = (role: string) => {
  const ownerItems = [
    { name: "Dashboard", href: "/dashboard/overview", icon: LayoutDashboard, badge: null },
    { name: "Team", href: "/dashboard/team", icon: Users, badge: null },
    { name: "Projects", href: "/dashboard/projects", icon: FolderKanban, badge: 3 },
    { name: "Approvals", href: "/dashboard/approvals", icon: CheckSquare, badge: 5 },
    { name: "AI Code Gen", href: "/dashboard/ai-tools/code-generator", icon: Code2, badge: null, gradient: true },
    { name: "AI Marketing", href: "/dashboard/ai-tools/marketing-copy", icon: Wand2, badge: null, gradient: true },
    { name: "Messages", href: "/dashboard/messages", icon: MessageSquare, badge: 12 },
    { name: "Reports", href: "/dashboard/reports", icon: BarChart3, badge: null },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
  ];

  const designerItems = [
    { name: "My Dashboard", href: "/dashboard/overview", icon: LayoutDashboard, badge: null },
    { name: "My Projects", href: "/dashboard/projects", icon: FolderKanban, badge: 2 },
    { name: "Tasks", href: "/dashboard/tasks", icon: CheckSquare, badge: 8 },
    { name: "Client Feedback", href: "/dashboard/feedback", icon: MessageSquare, badge: 3 },
    { name: "Time Tracking", href: "/dashboard/time", icon: BarChart3, badge: null },
    { name: "Settings", href: "/dashboard/settings", icon: Settings, badge: null },
  ];

  return role === "owner" ? ownerItems : designerItems;
};

export function ModernSidebar({ className }: ModernSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, currentOrganization, signOut } = useAuth();

  // Get user role from current organization or fallback
  const userRole = currentOrganization?.role || "member";
  const navigationItems = getNavigationItems(userRole);

  // Handle logout
  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  // Get user initials
  const getInitials = (name?: string) => {
    if (!name) {
return "U";
}
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen w-[280px] bg-white border-r border-gray-200 flex flex-col",
        className
      )}
    >
      {/* Logo Section */}
      <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
        <Link href="/dashboard/overview" className="flex items-center gap-3">
          <Logo size="sm" showText={true} />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto">
        <ul className="space-y-1">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group",
                    isActive
                      ? "bg-gradient-to-r from-unite-teal to-unite-blue text-white shadow-md"
                      : "text-gray-700 hover:bg-gray-100"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <item.icon
                      className={cn(
                        "h-5 w-5 flex-shrink-0",
                        isActive ? "text-white" : "text-gray-500 group-hover:text-unite-teal"
                      )}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  {item.badge !== null && item.badge > 0 && (
                    <Badge
                      variant="secondary"
                      className={cn(
                        "h-5 px-2 text-xs font-semibold",
                        isActive
                          ? "bg-white/20 text-white border-white/30"
                          : "bg-unite-orange text-white"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Notifications/Updates Section */}
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="bg-gradient-to-br from-unite-blue/10 to-unite-teal/10 rounded-lg p-4 border border-unite-teal/20">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-unite-teal rounded-lg">
              <Bell className="h-4 w-4 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-unite-navy mb-1">
                New Updates
              </h4>
              <p className="text-xs text-gray-600 mb-2">
                {userRole === "owner"
                  ? "5 pending approvals require your attention"
                  : "3 new client feedback items"}
              </p>
              <button className="text-xs font-medium text-unite-teal hover:text-unite-blue transition-colors">
                View All →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* User Profile Section */}
      <div className="px-4 py-3 border-t border-gray-200 bg-gray-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="w-full flex items-center gap-3 hover:bg-gray-100 rounded-lg p-2 transition-colors">
              <Avatar className="h-10 w-10">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : (
                  <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white font-semibold">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-unite-navy truncate">
                  {profile?.full_name || "User"}
                </p>
                <p className="text-xs text-gray-500 capitalize">{userRole}</p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/profile" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
