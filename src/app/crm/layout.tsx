'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  Shield,
  UserCog,
  LogOut
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useStaffCheck } from '@/hooks/useStaffCheck';

interface CRMLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: 'Dashboard', href: '/crm/dashboard', icon: LayoutDashboard },
  { name: 'Clients', href: '/crm/clients', icon: Users },
  { name: 'Campaigns', href: '/crm/campaigns', icon: BarChart3 },
  { name: 'Analytics', href: '/crm/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/crm/settings', icon: Settings },
];

const adminNavigation = [
  { name: 'Staff Management', href: '/crm/staff', icon: UserCog, ownerOnly: true },
  { name: 'Trusted Devices', href: '/crm/admin/devices', icon: Shield },
];

export default function CRMLayout({ children }: CRMLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, user } = useAuth();
  const { isOwner, staffUser, loading } = useStaffCheck();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-accent-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* Sidebar */}
      <aside className="w-64 bg-bg-card border-r border-border-subtle flex flex-col">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-border-subtle">
          <Link href="/crm/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">UH</span>
            </div>
            <span className="text-text-primary font-semibold">Unite-Hub CRM</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
            Main
          </p>
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-500/10 text-accent-500'
                    : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}

          {/* Admin Section */}
          <div className="pt-6">
            <p className="px-3 text-xs font-semibold text-text-tertiary uppercase tracking-wider mb-2">
              Admin
            </p>
            {adminNavigation.map((item) => {
              // Skip owner-only items if not owner
              if (item.ownerOnly && !isOwner) {
                return null;
              }

              const active = pathname === item.href || pathname.startsWith(item.href + '/');
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-accent-500/10 text-accent-500'
                      : 'text-text-secondary hover:bg-bg-surface hover:text-text-primary'
                  }`}
                >
                  <item.icon className="w-5 h-5" />
                  {item.name}
                  {item.ownerOnly && (
                    <span className="ml-auto text-xs bg-accent-500/20 text-accent-500 px-1.5 py-0.5 rounded">
                      Owner
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Info */}
        <div className="p-4 border-t border-border-subtle">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-full bg-accent-500/10 flex items-center justify-center">
              <span className="text-accent-500 font-semibold">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user?.email}
              </p>
              <p className="text-xs text-text-tertiary capitalize">
                {staffUser?.role || 'Staff'}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-bg-surface rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
