"use client";

/**
 * Synthex Header Component
 * Phase 4 of Unite-Hub Rebuild
 *
 * Header navigation for Synthex client portal with:
 * - Tier badge display
 * - Navigation links
 * - User menu
 * - Mobile responsive
 */

import React from 'react';
import Link from 'next/link';
import {
  Home,
  Lightbulb,
  FolderKanban,
  FileText,
  TrendingUp,
  Settings,
  Menu,
  LogOut,
  Crown,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SynthexHeaderProps {
  clientName: string;
  currentTier: 'starter' | 'professional' | 'elite';
  subscriptionStatus: 'active' | 'trial' | 'past_due' | 'cancelled';
  trialEndsAt: string | null;
}

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/synthex',
    icon: Home,
  },
  {
    label: 'Ideas',
    href: '/synthex/ideas',
    icon: Lightbulb,
  },
  {
    label: 'Projects',
    href: '/synthex/projects',
    icon: FolderKanban,
  },
  {
    label: 'Reports',
    href: '/synthex/reports',
    icon: FileText,
  },
  {
    label: 'SEO',
    href: '/synthex/seo',
    icon: TrendingUp,
  },
];

export function SynthexHeader({
  clientName,
  currentTier,
  subscriptionStatus,
  trialEndsAt,
}: SynthexHeaderProps) {
  // Tier badge styling
  const getTierBadge = () => {
    switch (currentTier) {
      case 'elite':
        return (
          <Badge className="bg-purple-600 text-white">
            <Crown className="h-3 w-3 mr-1" />
            Elite
          </Badge>
        );
      case 'professional':
        return (
          <Badge className="bg-blue-600 text-white">
            Professional
          </Badge>
        );
      case 'starter':
        return (
          <Badge variant="secondary">
            Starter
          </Badge>
        );
    }
  };

  // Trial warning
  const showTrialWarning = subscriptionStatus === 'trial' && trialEndsAt;
  const daysLeft = trialEndsAt
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : 0;

  // Subscription warning
  const showSubscriptionWarning = subscriptionStatus === 'past_due' || subscriptionStatus === 'cancelled';

  const handleLogout = async () => {
    // Call logout API
    const response = await fetch('/api/auth/client-logout', {
      method: 'POST',
    });

    if (response.ok) {
      window.location.href = '/client/login';
    }
  };

  return (
    <>
      <header className="bg-gray-900 border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <Link href="/synthex">
                <h1 className="text-xl font-bold text-gray-100">
                  Synthex
                </h1>
              </Link>
              {getTierBadge()}
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-gray-100 transition-colors"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User menu */}
            <div className="flex items-center space-x-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-3">
                    <div className="hidden md:block text-right">
                      <p className="text-sm font-medium text-gray-100">
                        {clientName}
                      </p>
                      <p className="text-xs text-gray-400">
                        {subscriptionStatus === 'trial' ? 'Trial' : 'Active'}
                      </p>
                    </div>
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-semibold">
                      {clientName.charAt(0).toUpperCase()}
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/synthex/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/synthex/billing">
                      <Crown className="mr-2 h-4 w-4" />
                      Billing & Upgrade
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile menu button */}
              <button
                className="md:hidden text-gray-400 hover:text-gray-100"
                aria-label="Toggle menu"
              >
                <Menu className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Trial Warning Banner */}
      {showTrialWarning && (
        <div className="bg-yellow-900/20 border-b border-yellow-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Alert className="bg-transparent border-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your trial ends in {daysLeft} day{daysLeft !== 1 ? 's' : ''}.{' '}
                <Link href="/synthex/billing" className="underline font-semibold">
                  Upgrade now
                </Link>{' '}
                to continue using Synthex.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}

      {/* Subscription Warning Banner */}
      {showSubscriptionWarning && (
        <div className="bg-red-900/20 border-b border-red-900/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <Alert className="bg-transparent border-0">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {subscriptionStatus === 'past_due'
                  ? 'Your payment is past due. '
                  : 'Your subscription has been cancelled. '}
                <Link href="/synthex/billing" className="underline font-semibold">
                  Update billing
                </Link>{' '}
                to restore access.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      )}
    </>
  );
}
