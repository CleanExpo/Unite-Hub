'use client';

/**
 * SidebarNav Component
 * Global UX Shell - Phase 15 Week 3-4
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Users,
  Mail,
  Megaphone,
  FileText,
  Settings,
  Brain,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard/overview', icon: LayoutDashboard },
  { title: 'Contacts', href: '/dashboard/contacts', icon: Users },
  { title: 'Campaigns', href: '/dashboard/campaigns', icon: Megaphone },
  { title: 'Emails', href: '/dashboard/emails/sequences', icon: Mail },
  { title: 'Content', href: '/dashboard/content', icon: FileText },
  { title: 'Calendar', href: '/dashboard/calendar', icon: Calendar },
  { title: 'AI Tools', href: '/dashboard/ai-tools/marketing-copy', icon: Brain },
  { title: 'Settings', href: '/dashboard/settings', icon: Settings },
];

interface SidebarNavProps {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export function SidebarNav({ collapsed = false, onToggleCollapse, className }: SidebarNavProps) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'flex flex-col h-full bg-card border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-64',
        className
      )}
    >
      {/* Logo */}
      <div className="flex items-center h-16 px-4 border-b">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold">U</span>
            </div>
            <span className="font-bold text-lg">Unite-Hub</span>
          </Link>
        )}
        {collapsed && (
          <div className="h-8 w-8 rounded bg-primary flex items-center justify-center mx-auto">
            <span className="text-primary-foreground font-bold">U</span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <item.icon className="h-4 w-4 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.title}</span>
                      {item.badge && (
                        <span className="text-xs bg-primary/20 px-1.5 py-0.5 rounded">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      {onToggleCollapse && (
        <div className="p-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <>
                <ChevronLeft className="h-4 w-4 mr-2" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      )}
    </aside>
  );
}

export default SidebarNav;
