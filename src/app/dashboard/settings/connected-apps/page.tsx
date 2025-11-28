'use client';

/**
 * Connected Apps Settings Page
 *
 * Manage OAuth connections to Google Workspace and Microsoft 365.
 */

import React from 'react';
import { ConnectedAppsGrid } from '@/components/connected-apps';
import { Settings, ArrowLeft, Shield } from 'lucide-react';
import Link from 'next/link';

export default function ConnectedAppsSettingsPage() {
  return (
    <div className="container mx-auto max-w-4xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/dashboard/settings"
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Settings className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Connected Apps</h1>
            <p className="text-muted-foreground">
              Connect your email accounts to sync communications and extract insights.
            </p>
          </div>
        </div>
      </div>

      {/* Security Notice */}
      <div className="mb-6 flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
        <Shield className="h-5 w-5 shrink-0 text-blue-600 dark:text-blue-400" />
        <div className="text-sm">
          <p className="font-medium text-blue-800 dark:text-blue-200">
            Secure Connection
          </p>
          <p className="mt-1 text-blue-700 dark:text-blue-300">
            Your OAuth tokens are encrypted at rest using AES-256-GCM. We only request
            the minimum permissions needed for email sync. You can revoke access at
            any time.
          </p>
        </div>
      </div>

      {/* Connected Apps Grid */}
      <ConnectedAppsGrid />

      {/* Features Section */}
      <div className="mt-12">
        <h2 className="mb-4 text-lg font-semibold">What you get</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Email Sync</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Automatically sync your email threads and link them to CRM contacts.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">AI Insights</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Extract action items, deadlines, and opportunities from emails.
            </p>
          </div>
          <div className="rounded-lg border bg-card p-4">
            <h3 className="font-medium">Client Intelligence</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              View communication history and insights on each client profile.
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
              What permissions do you request?
              <span className="text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              <p className="mb-2">
                <strong>Google:</strong> Read email (gmail.readonly), send email
                (gmail.send), manage labels (gmail.labels)
              </p>
              <p>
                <strong>Microsoft:</strong> Read mail (Mail.Read), send mail
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
              By default, we perform incremental syncs every 5 minutes. You can also
              trigger a manual sync at any time. Initial sync imports the last 90 days
              of emails.
            </div>
          </details>
          <details className="group rounded-lg border bg-card">
            <summary className="flex cursor-pointer items-center justify-between p-4 font-medium">
              What happens if I disconnect?
              <span className="text-muted-foreground transition group-open:rotate-180">
                ▼
              </span>
            </summary>
            <div className="border-t px-4 py-3 text-sm text-muted-foreground">
              Disconnecting will revoke our access to your email account. All synced
              email data and extracted insights will be permanently deleted from our
              system.
            </div>
          </details>
        </div>
      </div>
    </div>
  );
}
