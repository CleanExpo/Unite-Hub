"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  CheckSquare,
  Activity,
  Users,
  Briefcase,
  Megaphone,
  Mail,
  BarChart3,
  Settings,
  Search,
  LogOut,
  Network,
  Brain,
  FolderOpen,
  Kanban,
  FileText,
} from "lucide-react";
import { ClientProvider } from "@/contexts/ClientContext";
import ClientSelector from "@/components/client/ClientSelector";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { RoleBadge } from "@/components/RoleBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { PageErrorBoundary } from "@/components/ErrorBoundary";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";
import { Button } from "@/components/ui/button";
import React from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, signOut, currentOrganization, organizations, loading: authLoading } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);

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
    if (currentOrganization?.org_id) {
      setOrgId(currentOrganization.org_id);
    }
  }, [currentOrganization]);

  // Set timeout for organisation loading
  useEffect(() => {
    if (!orgId && !authLoading) {
      const timer = setTimeout(() => {
        setLoadingTimeout(true);
      }, 10000);
      return () => clearTimeout(timer);
    } else {
      setLoadingTimeout(false);
    }
  }, [orgId, authLoading]);

  // Show loading while auth is initialising
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Loading your dashboard...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    router.push('/login');
    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Redirecting to login...</div>
      </div>
    );
  }

  // Show loading while organisation is loading
  if (!orgId) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg">Loading authentication...</div>
          </div>
        </div>
      );
    }

    if (loadingTimeout || (organizations && organizations.length === 0)) {
      return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-white/[0.02] rounded-sm border border-white/[0.06]">
            <h2 className="text-2xl font-bold text-white mb-4">No Organisation Found</h2>
            <p className="text-white/70 mb-6">
              You need to be part of an organisation to access the dashboard.
              {organizations && organizations.length === 0
                ? " It looks like you haven't been added to any organisations yet."
                : " There was an issue loading your organisation."}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  router.push('/onboarding');
                }}
                variant="primary"
              >
                Create Organisation
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  router.push('/login');
                }}
                className="bg-white/[0.03] border-white/[0.06] text-white/90 hover:bg-white/[0.05]"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg">Loading organisation...</div>
          <div className="text-white/40 text-sm mt-2">This should only take a moment</div>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <ClientProvider orgId={orgId}>
        <div className="min-h-screen bg-[#050505] flex">
          <Toaster />
          <SessionExpiryWarning />

          {/* LEFT SIDEBAR — 240px wide */}
          <aside
            className="w-60 bg-[#080808] flex flex-col flex-shrink-0 border-r border-white/[0.06]"
            style={{ borderRightWidth: '0.5px' }}
          >
            {/* Brand */}
            <div className="px-5 py-5 border-b border-white/[0.06]">
              <Link href="/dashboard/overview">
                <span className="text-base font-bold text-white/90 tracking-tight">Unite-Group</span>
                <span className="block text-xs text-white/30 mt-0.5">Control Platform</span>
              </Link>
            </div>

            {/* Primary nav */}
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {/* Primary */}
              <div className="pb-1 px-3">
                <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Primary</span>
              </div>
              <SidebarLink href="/dashboard/overview" icon={Home} label="Dashboard" pathname={pathname} />
              <SidebarLink href="/founder/os" icon={Brain} label="Founder OS" pathname={pathname} />
              <SidebarLink href="/founder/connections" icon={Network} label="Ecosystem" pathname={pathname} />

              {/* CRM */}
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">CRM</span>
              </div>
              <SidebarLink href="/dashboard/contacts" icon={Users} label="Contacts" pathname={pathname} />
              <SidebarLink href="/dashboard/deals" icon={Briefcase} label="Deals" pathname={pathname} />
              <SidebarLink href="/dashboard/campaigns" icon={Megaphone} label="Campaigns" pathname={pathname} />
              <SidebarLink href="/dashboard/emails" icon={Mail} label="Emails" pathname={pathname} />
              <SidebarLink href="/dashboard/tasks" icon={CheckSquare} label="Tasks" pathname={pathname} />

              {/* Operations */}
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Operations</span>
              </div>
              <SidebarLink href="/dashboard/projects" icon={FolderOpen} label="Projects" pathname={pathname} />
              <SidebarLink href="/kanban" icon={Kanban} label="Kanban" pathname={pathname} />
              <SidebarLink href="/dashboard/analytics" icon={BarChart3} label="Analytics" pathname={pathname} />
              <SidebarLink href="/dashboard/reports" icon={FileText} label="Reports" pathname={pathname} />

              {/* Platform */}
              <div className="pt-4 pb-1 px-3">
                <span className="text-[10px] font-semibold text-white/20 uppercase tracking-widest">Platform</span>
              </div>
              <PermissionGate permission="settings:view">
                <SidebarLink href="/dashboard/settings" icon={Settings} label="Settings" pathname={pathname} />
              </PermissionGate>
            </nav>

            {/* User section at bottom */}
            <div className="px-3 py-4 border-t border-white/[0.06]">
              <div className="flex items-center gap-3 px-3 py-2 rounded-sm hover:bg-white/[0.03] transition-colors">
                <Avatar className="h-7 w-7 flex-shrink-0">
                  {profile?.avatar_url && (
                    <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                  )}
                  <AvatarFallback className="text-xs bg-[#00F5FF]/10 text-[#00F5FF]">
                    {getInitials(profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-white/90 truncate">
                    {profile?.full_name || user?.email?.split('@')[0]}
                  </p>
                  <p className="text-[10px] text-white/30 truncate">
                    {currentOrganization?.name || 'No org'}
                  </p>
                </div>
                <button
                  onClick={async () => {
                    await signOut();
                    router.push('/login');
                  }}
                  className="text-white/20 hover:text-white/60 transition-colors flex-shrink-0"
                  title="Sign out"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </aside>

          {/* MAIN CONTENT */}
          <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
            {/* Top bar */}
            <header
              className="bg-[#050505] border-b border-white/[0.06] px-6 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderBottomWidth: '0.5px' }}
            >
              <div className="flex items-center gap-3 flex-1 max-w-md">
                <Search className="h-4 w-4 text-white/20 flex-shrink-0" />
                <input
                  type="text"
                  placeholder="Search contacts, deals, projects, campaigns..."
                  className="bg-transparent text-sm text-white/60 placeholder:text-white/20 outline-none w-full"
                />
              </div>
              <div className="flex items-center gap-3">
                <ClientSelector />
                {currentOrganization && (
                  <RoleBadge role={currentOrganization.role} size="sm" showIcon />
                )}
              </div>
            </header>

            {/* Page content */}
            <main className="flex-1 overflow-y-auto bg-[#050505]">
              {children}
            </main>
          </div>
        </div>
      </ClientProvider>
    </PageErrorBoundary>
  );
}

function SidebarLink({
  href,
  icon: Icon,
  label,
  pathname,
}: {
  href: string;
  icon: React.ElementType;
  label: string;
  pathname: string;
}) {
  const isActive = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      style={isActive ? { borderLeft: '2px solid #00F5FF' } : undefined}
      className={
        isActive
          ? 'flex items-center gap-3 px-3 py-2 rounded-sm text-[#00F5FF] bg-white/[0.04] text-sm font-medium transition-colors'
          : 'flex items-center gap-3 px-3 py-2 rounded-sm text-white/40 hover:text-white/80 hover:bg-white/[0.03] text-sm transition-colors'
      }
    >
      <Icon className="h-4 w-4 flex-shrink-0" />
      <span>{label}</span>
    </Link>
  );
}
