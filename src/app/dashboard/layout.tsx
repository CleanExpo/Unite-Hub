"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ClientProvider } from "@/contexts/ClientContext";
import ClientSelector from "@/components/client/ClientSelector";
import { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { RoleBadge } from "@/components/RoleBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { PageErrorBoundary } from "@/components/ErrorBoundary";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, signOut, currentOrganization, loading: authLoading } = useAuth();
  const [orgId, setOrgId] = useState<Id<"organizations"> | null>(null);

  // Automatically refresh session to keep user logged in
  useSessionRefresh();

  // Generate initials from user's full name
  const getInitials = (name: string | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  useEffect(() => {
    // Use the actual organization from AuthContext
    console.log('[DashboardLayout] currentOrganization changed:', currentOrganization);
    if (currentOrganization?.org_id) {
      console.log('[DashboardLayout] Setting orgId to:', currentOrganization.org_id);
      setOrgId(currentOrganization.org_id as Id<"organizations">);
    } else {
      console.log('[DashboardLayout] No org_id found in currentOrganization');
    }
  }, [currentOrganization]);

  const isActive = (href: string) => pathname.startsWith(href);

  // Show loading while auth is initializing
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading your dashboard...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Redirecting to login...</div>
      </div>
    );
  }

  // Show loading while organization is loading
  if (!orgId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-white">Loading organization...</div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <ClientProvider orgId={orgId}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
          <Toaster />
          {/* Top Navigation */}
          <nav className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Unite-Hub
                </Link>
                <div className="hidden lg:flex gap-6">
                  <NavLink href="/dashboard/overview" isActive={isActive("/dashboard/overview")}>
                    Dashboard
                  </NavLink>
                  <NavLink href="/dashboard/contacts" isActive={isActive("/dashboard/contacts")}>
                    Contacts
                  </NavLink>
                  <NavLink href="/dashboard/media" isActive={isActive("/dashboard/media")}>
                    Media
                  </NavLink>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/campaigns")
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      } h-auto px-2 py-1`}>
                        Campaigns
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/campaigns" className="w-full">Email Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/campaigns/drip" className="w-full">Drip Sequences</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/content") || isActive("/dashboard/intelligence")
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      } h-auto px-2 py-1`}>
                        AI Tools
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700">
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/content" className="w-full">Content Generation</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/intelligence" className="w-full">Contact Intelligence</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <PermissionGate permission="workspace:view">
                    <NavLink href="/dashboard/workspaces" isActive={isActive("/dashboard/workspaces")}>
                      Workspaces
                    </NavLink>
                  </PermissionGate>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ClientSelector />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 h-auto py-2 px-3 border-slate-700 bg-slate-800 hover:bg-slate-700 text-white">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        {profile?.avatar_url && (
                          <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                        )}
                        <AvatarFallback>{getInitials(profile?.full_name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start gap-0.5 min-w-0">
                        <span className="text-sm font-medium truncate max-w-[150px]">{profile?.full_name || user?.email?.split('@')[0] || 'User'}</span>
                        {currentOrganization && (
                          <div className="flex items-center">
                            <RoleBadge role={currentOrganization.role} size="sm" showIcon />
                          </div>
                        )}
                      </div>
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-slate-400" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700 w-64">
                    <div className="px-2 py-2 border-b border-slate-700">
                      <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                      {currentOrganization && (
                        <div className="mt-2">
                          <RoleBadge role={currentOrganization.role} showIcon showTooltip />
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                      <Link href="/dashboard/profile" className="w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGate permission="settings:view">
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/settings" className="w-full">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </PermissionGate>
                    <PermissionGate permission="org:view_members">
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/team" className="w-full">
                          Team Members
                        </Link>
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                      <Link href="https://docs.unite-hub.com" target="_blank" rel="noopener noreferrer" className="w-full">
                        Help
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 cursor-pointer"
                      onClick={async () => {
                        await signOut();
                        window.location.href = '/login';
                      }}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          {children}
        </div>
      </ClientProvider>
    </PageErrorBoundary>
  );
}

function NavLink({ href, isActive, children }: { href: string; isActive: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`${
        isActive
          ? "text-white border-b-2 border-blue-500"
          : "text-slate-400 hover:text-white"
      } pb-1 transition`}
    >
      {children}
    </Link>
  );
}
