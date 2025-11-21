'use client';

/**
 * TopNavBar Component
 * Global UX Shell - Phase 15 Week 5-6
 *
 * Production-polished header with:
 * - Accessible theme toggle
 * - Keyboard shortcuts
 * - Smooth transitions
 * - ARIA labels
 */

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Moon, Sun, Search, Menu, LogOut, User, Settings, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface TopNavBarProps {
  onMenuClick?: () => void;
  className?: string;
}

export function TopNavBar({ onMenuClick, className }: TopNavBarProps) {
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const initials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : 'U';

  return (
    <header
      className={cn(
        'h-16 border-b bg-card px-4 flex items-center justify-between',
        'transition-colors duration-200',
        className
      )}
      role="banner"
    >
      {/* Left side */}
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden transition-transform duration-150 active:scale-95"
            onClick={onMenuClick}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>
        )}

        {/* Search */}
        <div className="hidden md:flex items-center gap-2 w-64 relative">
          <Search className="h-4 w-4 text-muted-foreground absolute left-3" aria-hidden="true" />
          <Input
            placeholder="Search... (⌘K)"
            className="h-9 pl-9 border-0 bg-muted focus-visible:ring-2 focus-visible:ring-primary/50 transition-all duration-200"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-1">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="relative transition-transform duration-150 active:scale-95"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {mounted && (
            <>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all duration-200 dark:-rotate-90 dark:scale-0" aria-hidden="true" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all duration-200 dark:rotate-0 dark:scale-100" aria-hidden="true" />
            </>
          )}
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-transform duration-150 active:scale-95"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4" aria-hidden="true" />
          {/* Notification indicator with pulse animation */}
          <span className="absolute top-1 right-1 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive" />
          </span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="relative h-9 w-9 rounded-full transition-transform duration-150 hover:scale-105 focus-visible:ring-2 focus-visible:ring-primary/50"
              aria-label="User menu"
            >
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt="" />
                <AvatarFallback className="text-xs font-medium">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-56 animate-in fade-in slide-in-from-top-2 duration-200"
            align="end"
            forceMount
          >
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.user_metadata?.full_name || 'User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/profile" className="flex items-center gap-2">
                <User className="h-4 w-4" aria-hidden="true" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" aria-hidden="true" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/billing" className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" aria-hidden="true" />
                Billing
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut()}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="h-4 w-4 mr-2" aria-hidden="true" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

export default TopNavBar;
