'use client';

/**
 * Founder Connected Apps Management Page
 *
 * Allows founders/admins to manage all Connected Apps (Google, Microsoft,
 * and placeholders for future providers like Facebook, LinkedIn, X).
 */

import React from 'react';
import { ConnectedAppsGrid } from '@/components/connected-apps';
import { Settings, ArrowLeft, Shield, Zap, Globe } from 'lucide-react';
import Link from 'next/link';

export default function FounderConnectedAppsPage() {
  return (
    <div className="container mx-auto max-w-5xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/founder/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Connected Apps</h1>
            <p className="text-muted-foreground">
              Connect external services to sync emails, calendars, and more.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Shield className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            Enterprise-Grade Security
          </p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            All OAuth tokens are encrypted at rest using AES-256-GCM. We request only
            the minimum permissions needed. Connections can be revoked at any time,
            and all synced data will be permanently deleted.
          </p>
        </div>
      </div>

      {/* Connected Apps Grid */}
      <ConnectedAppsGrid />

      {/* Coming Soon Section */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Coming Soon</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4 opacity-60">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">LinkedIn</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Sync LinkedIn messages and connection data.
            </p>
            <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-xs">
              Q2 2025
            </span>
          </div>
          <div className="rounded-lg border bg-card p-4 opacity-60">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <h3 className="font-medium">Facebook</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Connect Facebook Messenger for business pages.
            </p>
            <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-xs">
              Q2 2025
            </span>
          </div>
          <div className="rounded-lg border bg-card p-4 opacity-60">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <h3 className="font-medium">X (Twitter)</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Sync direct messages and mentions.
            </p>
            <span className="mt-3 inline-block rounded-full bg-muted px-2 py-0.5 text-xs">
              Q3 2025
            </span>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">What Connected Apps Enable</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <Zap className="h-5 w-5 text-amber-500" />
            <h3 className="mt-2 font-medium">Email Sync</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Automatically import emails and link them to CRM contacts.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Zap className="h-5 w-5 text-green-500" />
            <h3 className="mt-2 font-medium">AI Insights</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Extract action items, deadlines, and opportunities from emails.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Zap className="h-5 w-5 text-blue-500" />
            <h3 className="mt-2 font-medium">Client Intelligence</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              View complete communication history per client profile.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <Zap className="h-5 w-5 text-purple-500" />
            <h3 className="mt-2 font-medium">Meeting Prep</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get AI summaries before client meetings with key talking points.
            </p>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
              What permissions are requested?
              <span className="text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Google Workspace:</strong> Read email (gmail.readonly), send email
                (gmail.send), manage labels (gmail.labels)
              </p>
              <p>
                <strong>Microsoft 365:</strong> Read mail (Mail.Read), send mail
                (Mail.Send), read user profile (User.Read)
              </p>
            </div>
          </details>
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
              How often are emails synced?
              <span className="text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              Incremental syncs run every 5 minutes by default. Initial sync imports
              the last 90 days of emails. Manual syncs can be triggered anytime.
            </div>
          </details>
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
              What happens when I disconnect?
              <span className="text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              Disconnecting revokes our access immediately. All synced email data,
              threads, and extracted insights are permanently deleted from our system.
            </div>
          </details>
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
              Can I connect multiple accounts?
              <span className="text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              Currently, you can connect one Google and one Microsoft account per
              workspace. Multi-account support is planned for Q2 2025.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
