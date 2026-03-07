// Force dynamic
export const dynamic = 'force-dynamic';
/**
 * Staff Settings Page - Phase 2 Step 3
 *
 * Settings and configuration for staff users
 * Will be wired to APIs in Phase 2 Step 4
 */

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';
import { PageContainer, Section } from '@/ui/layout/AppGrid';

export default function StaffSettingsPage() {
  return (
    <PageContainer>
      <Section>
        {/* Page header */}
        <div>
          <h1 className="text-3xl font-bold text-white font-mono">
            Settings
          </h1>
          <p className="text-white/40 mt-2 font-mono text-sm">
            Manage your account and preferences
          </p>
        </div>
      </Section>

      <Section>
        {/* Profile settings */}
        <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-5 w-5 text-white/40" />
            <h2 className="text-xl font-semibold text-white font-mono">
              Profile Information
            </h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Email"
              type="email"
              defaultValue="staff@unite-group.in"
              disabled
              helpText="Email cannot be changed"
            />

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 font-mono">
                Role
              </label>
              <Badge variant="info">Founder</Badge>
            </div>

            <div>
              <label className="block text-sm font-medium text-white/60 mb-2 font-mono">
                Status
              </label>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Notification settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="h-5 w-5 text-white/40" />
            <h2 className="text-xl font-semibold text-white font-mono">
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60 font-mono">
                  Task assignments
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Get notified when you&apos;re assigned to a task
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-[#00F5FF] bg-white/[0.04] border border-white/[0.06] rounded-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60 font-mono">
                  Project updates
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Get notified about project status changes
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 accent-[#00F5FF] bg-white/[0.04] border border-white/[0.06] rounded-sm"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60 font-mono">
                  Client messages
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Get notified about new client messages
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#00F5FF] bg-white/[0.04] border border-white/[0.06] rounded-sm"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Security settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-white/40" />
            <h2 className="text-xl font-semibold text-white font-mono">
              Security
            </h2>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>

            <div className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-sm">
              <p className="text-sm text-white/60 mb-2 font-mono">
                Last login
              </p>
              <p className="text-xs text-white/40 font-mono">
                Nov 19, 2025 at 9:00 AM
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* System preferences */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Database className="h-5 w-5 text-white/40" />
            <h2 className="text-xl font-semibold text-white font-mono">
              System Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60 font-mono">
                  Feature Flag: New UI
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Enable the new UI interface
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white/60 font-mono">
                  Feature Flag: AI Engine
                </p>
                <p className="text-xs text-white/40 mt-1 font-mono">
                  Enable AI-powered features
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end space-x-3">
        <Button variant="outline">
          Cancel
        </Button>
        <Button>
          Save Changes
        </Button>
      </div>
      </Section>
    </PageContainer>
  );
}
