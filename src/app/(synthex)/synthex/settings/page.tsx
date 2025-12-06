'use client';

/**
 * Synthex Settings
 *
 * Account and integration settings:
 * - Account settings
 * - Integration connections
 * - Notification preferences
 * - Billing management
 * - Brand Voice (Phase B19)
 *
 * TODO[PHASE_B2]: Wire up Gmail/social integrations
 * TODO[PHASE_B3]: Implement notification preferences
 *
 * Backlog: Settings page (not in original backlog)
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Settings,
  User,
  Link2,
  Bell,
  CreditCard,
  Mail,
  Shield,
  Globe,
  Sparkles,
  Bot,
  Palette,
} from 'lucide-react';
import BrandVoicePanel from '@/components/synthex/brand/BrandVoicePanel';
import IntegrationsPanel from '@/components/synthex/settings/IntegrationsPanel';
import PlanUsagePanel from '@/components/synthex/settings/PlanUsagePanel';

export default function SynthexSettingsPage() {
  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-100">Settings</h1>
        <p className="text-gray-400 mt-2">
          Manage your account and preferences
        </p>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="account" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="account" className="data-[state=active]:bg-gray-700">
            <User className="h-4 w-4 mr-2" />
            Account
          </TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-gray-700">
            <Link2 className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-gray-700">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="billing" className="data-[state=active]:bg-gray-700">
            <CreditCard className="h-4 w-4 mr-2" />
            Billing
          </TabsTrigger>
          <TabsTrigger value="brand" className="data-[state=active]:bg-gray-700">
            <Palette className="h-4 w-4 mr-2" />
            Brand Voice
          </TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-gray-700">
            <Bot className="h-4 w-4 mr-2" />
            AI Settings
          </TabsTrigger>
        </TabsList>

        {/* Account Tab */}
        <TabsContent value="account" className="space-y-6">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Profile Settings</CardTitle>
              <CardDescription className="text-gray-400">
                Update your account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* TODO[PHASE_B2]: Wire up profile updates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Business Name</Label>
                  <Input
                    placeholder="Your business name"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Email</Label>
                  <Input
                    placeholder="your@email.com"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Website</Label>
                  <Input
                    placeholder="https://yourwebsite.com"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                    disabled
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-gray-300">Industry</Label>
                  <Input
                    placeholder="Your industry"
                    className="bg-gray-800 border-gray-700 text-gray-100"
                    disabled
                  />
                </div>
              </div>
              <Button disabled>Save Changes</Button>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-400" />
                Security
              </CardTitle>
              <CardDescription className="text-gray-400">
                Manage your security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button variant="outline" className="border-gray-700" disabled>
                Change Password
              </Button>
              <Button variant="outline" className="border-gray-700" disabled>
                Enable Two-Factor Authentication
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Tab */}
        <TabsContent value="integrations" className="space-y-6">
          <IntegrationsPanel />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100">Notification Preferences</CardTitle>
              <CardDescription className="text-gray-400">
                Choose how you want to be notified
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              {/* TODO[PHASE_B3]: Implement notification settings */}
              <Bell className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">Notification settings coming soon</p>
              <Badge variant="secondary" className="mt-4">Phase B3</Badge>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Billing Tab - Phase B22 */}
        <TabsContent value="billing">
          <PlanUsagePanel />
        </TabsContent>

        {/* Brand Voice Tab */}
        <TabsContent value="brand">
          <BrandVoicePanel />
        </TabsContent>

        {/* AI Settings Tab */}
        <TabsContent value="ai">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-100 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-400" />
                AI Agent Configuration
              </CardTitle>
              <CardDescription className="text-gray-400">
                Configure AI agent behavior and automation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12 text-center">
              <Bot className="h-12 w-12 text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500">AI agent configuration coming soon</p>
              <p className="text-sm text-gray-600 mt-2 max-w-md mx-auto">
                Configure AI agent automation rules, response templates,
                and workflow triggers.
              </p>
              <Badge variant="secondary" className="mt-4">Coming Soon</Badge>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
