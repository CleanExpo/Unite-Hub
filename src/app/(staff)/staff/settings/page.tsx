// Force dynamic
export const dynamic = 'force-dynamic';
/**
 * Staff Settings Page - Phase 2 Step 3
 *
 * Settings and configuration for staff users
 * Will be wired to APIs in Phase 2 Step 4
 */

import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Settings, User, Bell, Shield, Database } from 'lucide-react';

export default function StaffSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">
          Settings
        </h1>
        <p className="text-gray-400 mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Profile settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <User className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-100">
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
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Role
              </label>
              <Badge variant="info">Founder</Badge>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
            <Bell className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-100">
              Notifications
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Task assignments
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Get notified when you're assigned to a task
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Project updates
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Get notified about project status changes
                </p>
              </div>
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Client messages
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Get notified about new client messages
                </p>
              </div>
              <input
                type="checkbox"
                className="h-4 w-4 text-blue-500 bg-gray-800 border-gray-700 rounded focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Security settings */}
      <Card>
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Shield className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-100">
              Security
            </h2>
          </div>

          <div className="space-y-4">
            <Button variant="outline" className="w-full">
              Change Password
            </Button>

            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-sm text-gray-300 mb-2">
                Last login
              </p>
              <p className="text-xs text-gray-400">
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
            <Database className="h-5 w-5 text-gray-400" />
            <h2 className="text-xl font-semibold text-gray-100">
              System Preferences
            </h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Feature Flag: New UI
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Enable the new UI interface
                </p>
              </div>
              <Badge variant="success">Enabled</Badge>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-300">
                  Feature Flag: AI Engine
                </p>
                <p className="text-xs text-gray-400 mt-1">
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
    </div>
  );
}
