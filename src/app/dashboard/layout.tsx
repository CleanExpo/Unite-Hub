"use client";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Toaster } from "@/components/ui/toaster";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, Menu, X } from "lucide-react";
import { ClientProvider } from "@/contexts/ClientContext";
import ClientSelector from "@/components/client/ClientSelector";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSessionRefresh } from "@/hooks/useSessionRefresh";
import { RoleBadge } from "@/components/RoleBadge";
import { PermissionGate } from "@/components/PermissionGate";
import { PageErrorBoundary } from "@/components/ErrorBoundary";
import { SessionExpiryWarning } from "@/components/SessionExpiryWarning";
import { Breadcrumbs } from "@/components/layout/Breadcrumbs";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, profile, signOut, currentOrganization, organizations, loading: authLoading } = useAuth();
  const [orgId, setOrgId] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  // Close mobile menu on navigation
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (currentOrganization?.org_id) {
      setOrgId(currentOrganization.org_id);
    }
  }, [currentOrganization]);

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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
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
      <div className="min-h-screen bg-[#050505] flex items-center justify-center">
        <div className="text-white">Redirecting to login...</div>
      </div>
    );
  }

  // Show loading while organization is loading
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
                  if (typeof window !== 'undefined') {
                    window.location.href = '/onboarding';
                  }
                }}
                variant="primary"
              >
                Create Organisation
              </Button>
              <Button
                variant="outline"
                onClick={async () => {
                  await signOut();
                  if (typeof window !== 'undefined') {
                    window.location.href = '/login';
                  }
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
        <div className="min-h-screen bg-[#050505]">
          <Toaster />
          <SessionExpiryWarning />
          {/* Top Navigation */}
          <nav className="border-b border-white/[0.06] bg-[#050505] sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-4 lg:gap-8">
                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="lg:hidden p-2 -ml-2 text-white/40 hover:text-white/90"
                  aria-label="Toggle menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
                <Link href="/" className="text-2xl font-bold text-[#00F5FF]">
                  Unite-Group
                </Link>
                <div className="hidden lg:flex gap-4">
                  <NavLink href="/dashboard/overview" isActive={isActive("/dashboard/overview")}>
                    Dashboard
                  </NavLink>

                  {/* CRM & Clients */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/contacts") || isActive("/dashboard/deals") || isActive("/dashboard/projects") || isActive("/dashboard/brief")
                          ? "text-white/90"
                          : "text-white/40 hover:text-white/90"
                      } h-auto px-2 py-1`}>
                        CRM
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/[0.06] w-56">
                      <DropdownMenuLabel className="text-white/30">Client Management</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/contacts" className="w-full">Contacts</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/deals" className="w-full">Deals Pipeline</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/projects" className="w-full">Projects</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/brief" className="w-full">Client Briefs</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuLabel className="text-white/30">Communication</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/emails" className="w-full">Emails</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/messages" className="w-full">Messages</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/meetings" className="w-full">Meetings</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Content & Media */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/content") || isActive("/dashboard/media") || isActive("/dashboard/calendar")
                          ? "text-white/90"
                          : "text-white/40 hover:text-white/90"
                      } h-auto px-2 py-1`}>
                        Content
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/[0.06] w-56">
                      <DropdownMenuLabel className="text-white/30">Content Tools</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/content" className="w-full">Content Generation</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/media" className="w-full">Media Library</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/calendar" className="w-full">Content Calendar</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/vault" className="w-full">Asset Vault</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuLabel className="text-white/30">Publishing</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/sites" className="w-full">Sites</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/campaigns" className="w-full">Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/drip-campaigns" className="w-full">Drip Campaigns</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/email-templates" className="w-full">Email Templates</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* AI & Intelligence */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/intelligence") || isActive("/dashboard/ai-tools") || isActive("/dashboard/insights")
                          ? "text-white/90"
                          : "text-white/40 hover:text-white/90"
                      } h-auto px-2 py-1`}>
                        AI Tools
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/[0.06] w-56">
                      <DropdownMenuLabel className="text-white/30">Intelligence</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/intelligence" className="w-full">Contact Intelligence</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/ai-tools" className="w-full">AI Assistants</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/insights" className="w-full">Analytics Insights</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/analytics" className="w-full">Analytics</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/seo" className="w-full">SEO Tools</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/audits" className="w-full">Website Audits</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuLabel className="text-white/30">Automation</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/founder/agents" className="w-full">Autonomous Agents</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/queue" className="w-full">Task Queue</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/tasks" className="w-full">Tasks</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/approvals" className="w-full">Approvals</Link>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Operations */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className={`${
                        isActive("/dashboard/billing") || isActive("/dashboard/team") || isActive("/dashboard/workspaces")
                          ? "text-white/90"
                          : "text-white/40 hover:text-white/90"
                      } h-auto px-2 py-1`}>
                        Operations
                        <ChevronDown className="w-4 h-4 ml-1" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="bg-[#0a0a0a] border-white/[0.06] w-56">
                      <DropdownMenuLabel className="text-white/30">Business</DropdownMenuLabel>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/billing" className="w-full">Billing & Payments</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/reports" className="w-full">Reports</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/time-tracker" className="w-full">Time Tracker</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/resources" className="w-full">Resources</Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/[0.06]" />
                      <DropdownMenuLabel className="text-white/30">Organisation</DropdownMenuLabel>
                      <PermissionGate permission="org:view_members">
                        <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                          <Link href="/dashboard/team" className="w-full">Team Members</Link>
                        </DropdownMenuItem>
                      </PermissionGate>
                      <PermissionGate permission="workspace:view">
                        <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                          <Link href="/dashboard/workspaces" className="w-full">Workspaces</Link>
                        </DropdownMenuItem>
                      </PermissionGate>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <ClientSelector />

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 h-auto py-2 px-3 bg-white/[0.03] border-white/[0.06] text-white/90 hover:bg-white/[0.05]">
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
                      <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/40" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-[#0a0a0a] border-white/[0.06] w-64">
                    <div className="px-2 py-2 border-b border-white/[0.06]">
                      <p className="text-sm font-medium text-white">{profile?.full_name || 'User'}</p>
                      <p className="text-xs text-white/40">{user?.email}</p>
                      {currentOrganization && (
                        <div className="mt-2">
                          <RoleBadge role={currentOrganization.role} showIcon showTooltip />
                        </div>
                      )}
                    </div>
                    <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                      <Link href="/dashboard/profile" className="w-full">
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <PermissionGate permission="settings:view">
                      <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                        <Link href="/dashboard/settings" className="w-full">
                          Settings
                        </Link>
                      </DropdownMenuItem>
                    </PermissionGate>
                    <DropdownMenuItem asChild className="text-white/60 hover:text-white/90">
                      <Link href="https://docs.unite-group.in" target="_blank" rel="noopener noreferrer" className="w-full">
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
            </div>
          </nav>

          {/* Mobile Navigation Menu */}
          {mobileMenuOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 bg-black/60 z-40 lg:hidden"
                onClick={() => setMobileMenuOpen(false)}
              />
              {/* Slide-over panel */}
              <div className="fixed inset-y-0 left-0 w-72 bg-[#050505] border-r border-white/[0.06] z-50 lg:hidden overflow-y-auto">
                <div className="p-4 border-b border-white/[0.06] flex justify-between items-center">
                  <span className="text-lg font-bold text-white">Navigation</span>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-white/40 hover:text-white/90">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="p-4 space-y-1">
                  <MobileNavLink href="/dashboard/overview" active={isActive("/dashboard/overview")}>Dashboard</MobileNavLink>

                  <div className="pt-3 pb-1 text-xs font-semibold text-white/30 uppercase">CRM</div>
                  <MobileNavLink href="/dashboard/contacts" active={isActive("/dashboard/contacts")}>Contacts</MobileNavLink>
                  <MobileNavLink href="/dashboard/deals" active={isActive("/dashboard/deals")}>Deals Pipeline</MobileNavLink>
                  <MobileNavLink href="/dashboard/projects" active={isActive("/dashboard/projects")}>Projects</MobileNavLink>
                  <MobileNavLink href="/dashboard/brief" active={isActive("/dashboard/brief")}>Client Briefs</MobileNavLink>
                  <MobileNavLink href="/dashboard/emails" active={isActive("/dashboard/emails")}>Emails</MobileNavLink>
                  <MobileNavLink href="/dashboard/messages" active={isActive("/dashboard/messages")}>Messages</MobileNavLink>
                  <MobileNavLink href="/dashboard/meetings" active={isActive("/dashboard/meetings")}>Meetings</MobileNavLink>

                  <div className="pt-3 pb-1 text-xs font-semibold text-white/30 uppercase">Content</div>
                  <MobileNavLink href="/dashboard/content" active={isActive("/dashboard/content")}>Content Generation</MobileNavLink>
                  <MobileNavLink href="/dashboard/media" active={isActive("/dashboard/media")}>Media Library</MobileNavLink>
                  <MobileNavLink href="/dashboard/calendar" active={isActive("/dashboard/calendar")}>Content Calendar</MobileNavLink>
                  <MobileNavLink href="/dashboard/campaigns" active={isActive("/dashboard/campaigns")}>Campaigns</MobileNavLink>
                  <MobileNavLink href="/dashboard/sites" active={isActive("/dashboard/sites")}>Sites</MobileNavLink>

                  <div className="pt-3 pb-1 text-xs font-semibold text-white/30 uppercase">AI Tools</div>
                  <MobileNavLink href="/dashboard/intelligence" active={isActive("/dashboard/intelligence")}>Contact Intelligence</MobileNavLink>
                  <MobileNavLink href="/dashboard/ai-tools" active={isActive("/dashboard/ai-tools")}>AI Assistants</MobileNavLink>
                  <MobileNavLink href="/founder/agents" active={isActive("/founder/agents")}>Autonomous Agents</MobileNavLink>
                  <MobileNavLink href="/dashboard/analytics" active={isActive("/dashboard/analytics")}>Analytics</MobileNavLink>
                  <MobileNavLink href="/dashboard/seo" active={isActive("/dashboard/seo")}>SEO Tools</MobileNavLink>

                  <div className="pt-3 pb-1 text-xs font-semibold text-white/30 uppercase">Operations</div>
                  <MobileNavLink href="/dashboard/billing" active={isActive("/dashboard/billing")}>Billing</MobileNavLink>
                  <MobileNavLink href="/dashboard/reports" active={isActive("/dashboard/reports")}>Reports</MobileNavLink>
                  <MobileNavLink href="/dashboard/team" active={isActive("/dashboard/team")}>Team</MobileNavLink>
                  <MobileNavLink href="/dashboard/settings" active={isActive("/dashboard/settings")}>Settings</MobileNavLink>
                </nav>
              </div>
            </>
          )}

          {/* Breadcrumbs */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
            <Breadcrumbs />
          </div>

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
          ? "text-[#00F5FF] border-b border-b-[#00F5FF]"
          : "text-white/40 hover:text-white/90"
      } pb-1 transition`}
    >
      {children}
    </Link>
  );
}

function MobileNavLink({ href, active, children }: { href: string; active: boolean; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded-sm text-sm ${
        active
          ? "bg-white/[0.05] text-white font-medium"
          : "text-white/70 hover:bg-white/[0.03] hover:text-white/90"
      } transition-colors`}
    >
      {children}
    </Link>
  );
}
