'use client';

/**
 * SidebarNav Component
 * Global UX Shell - Phase 15 Week 5-6
 *
 * Production-polished navigation with:
 * - Smooth transitions
 * - ARIA labels
 * - Keyboard navigation
 * - Consistent spacing (8px grid)
 */

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  LayoutDashboard,
  Users,
  Mail,
  Megaphone,
  FileText,
  Settings,
  Brain,
  Calendar,
  Bot,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

// Animation utilities
const navItemTransition = 'transition-all duration-150 ease-out';
const activeGlow = 'shadow-[0_0_12px_rgba(var(--primary)/0.3)]';
const focusRing = 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background';

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
  { title: 'Agents', href: '/founder/agents', icon: Bot },
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
    <TooltipProvider delayDuration={300}>
      <aside
        className={cn(
          'flex flex-col h-full bg-card border-r transition-all duration-300 ease-out',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
        role="navigation"
        aria-label="Main sidebar"
        aria-expanded={!collapsed}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b">
          {!collapsed && (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 transition-opacity duration-200 hover:opacity-80"
              aria-label="Unite-Hub Home"
            >
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center shadow-sm">
                <span className="text-primary-foreground font-bold text-sm">U</span>
              </div>
              <span className="font-semibold text-lg tracking-tight">Unite-Hub</span>
            </Link>
          )}
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/dashboard"
                  className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center mx-auto shadow-sm transition-transform duration-200 hover:scale-105"
                  aria-label="Unite-Hub Home"
                >
                  <span className="text-primary-foreground font-bold text-sm">U</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Unite-Hub</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main menu">
          <ul className="space-y-1 px-2" role="list">
            {navItems.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

              const linkContent = (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium',
                    navItemTransition,
                    focusRing,
                    isActive
                      ? `bg-primary text-primary-foreground ${activeGlow} scale-[1.02]`
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground hover:scale-[1.01]'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <item.icon className={cn(
                    'h-4 w-4 flex-shrink-0',
                    isActive && 'drop-shadow-sm'
                  )} aria-hidden="true" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate">{item.title}</span>
                      {item.badge && (
                        <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium tabular-nums">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              );

              return (
                <li key={item.href}>
                  {collapsed ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {linkContent}
                      </TooltipTrigger>
                      <TooltipContent
                        side="right"
                        className="animate-in fade-in-0 zoom-in-95 duration-200"
                      >
                        <p className="font-medium">{item.title}</p>
                      </TooltipContent>
                    </Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Collapse Toggle */}
        {onToggleCollapse && (
          <div className="p-2 border-t">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-center',
                    navItemTransition,
                    focusRing,
                    'hover:bg-muted'
                  )}
                  onClick={onToggleCollapse}
                  aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                  aria-expanded={!collapsed}
                >
                  {collapsed ? (
                    <ChevronRight className="h-4 w-4 transition-transform duration-200" aria-hidden="true" />
                  ) : (
                    <>
                      <ChevronLeft className="h-4 w-4 mr-2 transition-transform duration-200" aria-hidden="true" />
                      <span className="text-sm">Collapse</span>
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="animate-in fade-in-0 zoom-in-95 duration-200">
                  <p>Expand sidebar</p>
                </TooltipContent>
              )}
            </Tooltip>
          </div>
        )}
      </aside>
    </TooltipProvider>
  );
}

export default SidebarNav;
