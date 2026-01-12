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
      if (!user) {
return;
}

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
      <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-bg-card flex items-center justify-center">
        <div className="text-text-primary">Loading your dashboard...</div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-bg-card flex items-center justify-center">
        <div className="text-text-primary">Redirecting to login...</div>
      </div>
    );
  }

  // Show loading while organization is loading
  if (!orgId) {
    if (authLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-bg-card flex items-center justify-center">
          <div className="text-center">
            <div className="text-text-primary text-lg">Loading authentication...</div>
          </div>
        </div>
      );
    }

    if (loadingTimeout || (organizations && organizations.length === 0)) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-bg-card flex items-center justify-center">
          <div className="text-center max-w-md p-8 bg-bg-raised/50 backdrop-blur-sm rounded-lg border border-border-medium">
            <h2 className="text-2xl font-bold text-text-primary mb-4">No Organization Found</h2>
            <p className="text-text-secondary mb-6">
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
                className="bg-info-600 hover:bg-info-700 text-white"
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
                className="border-border-medium text-text-secondary hover:bg-bg-hover"
              >
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-bg-card flex items-center justify-center">
        <div className="text-center">
          <div className="text-text-primary text-lg">Loading organization...</div>
          <div className="text-text-muted text-sm mt-2">This should only take a moment</div>
        </div>
      </div>
    );
  }

  return (
    <PageErrorBoundary>
      <ClientProvider orgId={orgId}>
        <div className="min-h-screen bg-gradient-to-br from-bg-base via-bg-raised to-bg-card">
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
                          ? "text-text-primary"
                          : "text-text-muted hover:text-text-primary"
                      } h-auto px-2 py-1`}>
                        CRM
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-bg-raised border-border-medium w-56">
                      <DropdownMenuLabel className="text-text-muted">Client Management</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/contacts" className="w-full">Contacts</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/projects" className="w-full">Projects</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/brief" className="w-full">Client Briefs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border-medium" />
                      <DropdownMenuLabel className="text-text-muted">Communication</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/emails" className="w-full">Emails</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/messages" className="w-full">Messages</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/meetings" className="w-full">Meetings</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Content & Media */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/content") || isActive("/dashboard/media") || isActive("/dashboard/calendar")
                          ? "text-text-primary"
                          : "text-text-muted hover:text-text-primary"
                      } h-auto px-2 py-1`}>
                        Content
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-bg-raised border-border-medium w-56">
                      <DropdownMenuLabel className="text-text-muted">Content Tools</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/content" className="w-full">Content Generation</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/media" className="w-full">Media Library</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/calendar" className="w-full">Content Calendar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/vault" className="w-full">Asset Vault</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border-medium" />
                      <DropdownMenuLabel className="text-text-muted">Publishing</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/sites" className="w-full">Sites</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/campaigns" className="w-full">Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/drip-campaigns" className="w-full">Drip Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
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
                          ? "text-text-primary"
                          : "text-text-muted hover:text-text-primary"
                      } h-auto px-2 py-1`}>
                        AI Tools
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-bg-raised border-border-medium w-56">
                      <DropdownMenuLabel className="text-text-muted">Intelligence</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/intelligence" className="w-full">Contact Intelligence</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/ai-tools" className="w-full">AI Assistants</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/insights" className="w-full">Analytics Insights</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/analytics" className="w-full">Analytics</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/seo" className="w-full">SEO Tools</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/audits" className="w-full">Website Audits</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border-medium" />
                      <DropdownMenuLabel className="text-text-muted">Automation</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/queue" className="w-full">Task Queue</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/tasks" className="w-full">Tasks</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
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
                          ? "text-text-primary"
                          : "text-text-muted hover:text-text-primary"
                      } h-auto px-2 py-1`}>
                        Operations
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-bg-raised border-border-medium w-56">
                      <DropdownMenuLabel className="text-text-muted">Business</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/billing" className="w-full">Billing & Payments</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/reports" className="w-full">Reports</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/time-tracker" className="w-full">Time Tracker</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/resources" className="w-full">Resources</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border-medium" />
                      <DropdownMenuLabel className="text-text-muted">Organization</DropdownMenuLabel>
                      <PermissionGate permission="org:view_members">
                        <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                          <Link href="/dashboard/team" className="w-full">Team Members</Link>
                        </DropdownMenuItem>
                      </PermissionGate>
                      <PermissionGate permission="workspace:view">
                        <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
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
                    <Button variant="outline" className="flex items-center gap-2 h-auto py-2 px-3 border-border-medium bg-bg-raised hover:bg-bg-hover text-text-primary">
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
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-text-muted" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-bg-raised border-border-medium w-64">
                    <div className="px-2 py-2 border-b border-border-medium">
                      <p className="text-sm font-medium text-text-primary">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-text-muted">{user?.email}</p>
                      {currentOrganization && (
                        <div className="mt-2">
                          <RoleBadge role={currentOrganization.role} showIcon showTooltip />
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                      <Link href="/dashboard/profile" className="w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGate permission="settings:view">
                      <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                        <Link href="/dashboard/settings" className="w-full">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuItem asChild className="text-text-secondary hover:text-text-primary">
                      <Link href="https://docs.unite-hub.com" target="_blank" rel="noopener noreferrer" className="w-full">
                        Help
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-error-400 cursor-pointer"
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
          ? "text-text-primary border-b-2 border-info-500"
          : "text-text-muted hover:text-text-primary"
      } pb-1 transition`}
    >
      {children}
    </Link>
  );
}
