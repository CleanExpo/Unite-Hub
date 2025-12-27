"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { ClientProvider } from "@/contexts/ClientContext";
import ClientSelector from "@/components/client/ClientSelector";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { RoleBadge } from "@/components/RoleBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { PageErrorBoundary } from "@/components/ErrorBoundary";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";
import { Container } from "@/components/layout/Container";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, signOut, currentOrganization, organizations, loading: authLoading } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [dashboardMode, setDashboardMode] = useState<'simple' | 'advanced'>('simple');

  // Automatically refresh session to keep user logged in
  useSessionRefresh();

  // Generate initials from user's full name
  const getInitials = (name: string | undefined) => {
    if (!name) {
return "U";
}
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

  // Fetch dashboard mode preference (Pattern 2)
  useEffect(() => {
    async function fetchDashboardMode() {
      if (!user) return;

      try {
        const res = await fetch(`/api/dashboard/mode?userId=${user.id}`);
        if (res.ok) {
          const data = await res.json();
          setDashboardMode(data.data?.mode || 'simple');
        }
      } catch (error) {
        console.error('Failed to fetch dashboard mode:', error);
        // Default to simple on error
        setDashboardMode('simple');
      }
    }

    fetchDashboardMode();
  }, [user]);

  // Set timeout for organization loading
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
    if (authLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center">
            <div className="text-white text-lg">Loading authentication...</div>
          </div>
        </div>
      );
    }

    if (loadingTimeout || (organizations && organizations.length === 0)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700">
            <h2 className="text-2xl font-bold text-white mb-4">No Organization Found</h2>
            <p className="text-slate-300 mb-6">
              You need to be part of an organization to access the dashboard.
              {organizations && organizations.length === 0
                ? " It looks like you haven't been added to any organizations yet."
                : " There was an issue loading your organization."}
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.location.href = '/onboarding';
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Create Organization
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                  }
                }}
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-lg">Loading organization...</div>
          <div className="text-slate-400 text-sm mt-2">This should only take a moment</div>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <ClientProvider orgId={orgId}>
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
          <Toaster />
          <SessionExpiryWarning />
          {/* Top Navigation */}
          <nav className="border-b border-border-subtle bg-bg-card/90 backdrop-blur-sm sticky top-0 z-50">
            <Container size="full" padding="lg" className="py-4 flex justify-between items-center">
              <div className="flex items-center gap-8">
                <Link href="/" className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  Unite-Hub
                </Link>
                <div className="hidden lg:flex gap-4">
                  <NavLink href="/dashboard/overview" isActive={isActive("/dashboard/overview")}>
                    Dashboard
                  </NavLink>

                  {/* CRM & Clients */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/contacts") || isActive("/dashboard/projects") || isActive("/dashboard/brief")
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      } h-auto px-2 py-1`}>
                        CRM
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700 w-56">
                      <DropdownMenuLabel className="text-slate-400">Client Management</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/contacts" className="w-full">Contacts</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/projects" className="w-full">Projects</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/brief" className="w-full">Client Briefs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuLabel className="text-slate-400">Communication</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/emails" className="w-full">Emails</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/messages" className="w-full">Messages</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/meetings" className="w-full">Meetings</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Content & Media */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/content") || isActive("/dashboard/media") || isActive("/dashboard/calendar")
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      } h-auto px-2 py-1`}>
                        Content
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700 w-56">
                      <DropdownMenuLabel className="text-slate-400">Content Tools</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/content" className="w-full">Content Generation</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/media" className="w-full">Media Library</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/calendar" className="w-full">Content Calendar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/vault" className="w-full">Asset Vault</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuLabel className="text-slate-400">Publishing</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/sites" className="w-full">Sites</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/campaigns" className="w-full">Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/drip-campaigns" className="w-full">Drip Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/email-templates" className="w-full">Email Templates</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* AI & Intelligence - Advanced Mode Only */}
                  {dashboardMode === 'advanced' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/intelligence") || isActive("/dashboard/ai-tools") || isActive("/dashboard/insights")
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      } h-auto px-2 py-1`}>
                        AI Tools
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700 w-56">
                      <DropdownMenuLabel className="text-slate-400">Intelligence</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/intelligence" className="w-full">Contact Intelligence</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/ai-tools" className="w-full">AI Assistants</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/insights" className="w-full">Analytics Insights</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/analytics" className="w-full">Analytics</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/seo" className="w-full">SEO Tools</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/audits" className="w-full">Website Audits</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuLabel className="text-slate-400">Automation</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/queue" className="w-full">Task Queue</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/tasks" className="w-full">Tasks</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/approvals" className="w-full">Approvals</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}

                  {/* Operations - Advanced Mode Only */}
                  {dashboardMode === 'advanced' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/billing") || isActive("/dashboard/team") || isActive("/dashboard/workspaces")
                          ? "text-white"
                          : "text-slate-400 hover:text-white"
                      } h-auto px-2 py-1`}>
                        Operations
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-slate-800 border-slate-700 w-56">
                      <DropdownMenuLabel className="text-slate-400">Business</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/billing" className="w-full">Billing & Payments</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/reports" className="w-full">Reports</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/time-tracker" className="w-full">Time Tracker</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                        <Link href="/dashboard/resources" className="w-full">Resources</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-slate-700" />
                      <DropdownMenuLabel className="text-slate-400">Organization</DropdownMenuLabel>
                      <PermissionGate permission="org:view_members">
                        <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                          <Link href="/dashboard/team" className="w-full">Team Members</Link>
                        </DropdownMenuItem>
                      </PermissionGate>
                      <PermissionGate permission="workspace:view">
                        <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                          <Link href="/dashboard/workspaces" className="w-full">Workspaces</Link>
                        </DropdownMenuItem>
                      </PermissionGate>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  )}
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
                    <DropdownMenuItem asChild className="text-slate-300 hover:text-white">
                      <Link href="https://docs.unite-hub.com" target="_blank" rel="noopener noreferrer" className="w-full">
                        Help
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-400 cursor-pointer"
                      onClick={async () => {
                        await signOut();
                        if (typeof window !== 'undefined') {
                          window.location.href = '/login';
                        }
                      }}
                    >
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Container>
          </nav>

          {/* Main Content */}
          <Container size="full" padding="lg" className="py-8">
            {children}
          </Container>
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
