'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Settings,
  Key,
  Database,
  Mail,
  Zap,
  Shield,
  Bell,
  Palette,
  Globe,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export default function AIDOSettingsPage() {
  const { currentOrganization } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Integration Settings
  const [gscConnected, setGscConnected] = useState(false);
  const [gbpConnected, setGbpConnected] = useState(false);
  const [ga4Connected, setGa4Connected] = useState(false);
  const [gmailConnected, setGmailConnected] = useState(false);

  // AI Settings
  const [aiModel, setAiModel] = useState('claude-sonnet-4-5-20250929');
  const [maxTokens, setMaxTokens] = useState('2048');
  const [temperature, setTemperature] = useState('0.7');
  const [autoGenerate, setAutoGenerate] = useState(true);

  // Email Settings
  const [emailSignature, setEmailSignature] = useState('');
  const [trackOpens, setTrackOpens] = useState(true);
  const [trackClicks, setTrackClicks] = useState(true);
  const [autoReply, setAutoReply] = useState(false);

  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [hotLeadAlerts, setHotLeadAlerts] = useState(true);
  const [weeklyReports, setWeeklyReports] = useState(true);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulate save delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // TODO: Actually save settings to database
      // const { supabaseBrowser } = await import('@/lib/supabase');
      // await supabaseBrowser.from('aido_settings').upsert({...});

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Settings className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          <h1 className="text-3xl font-bold">AIDO Settings</h1>
        </div>
        <p className="text-gray-600 dark:text-gray-400">
          Configure your AI-powered marketing automation preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Integrations */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <CardTitle>Data Integrations</CardTitle>
            </div>
            <CardDescription>
              Connect external data sources to enhance AIDO's intelligence
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Google Search Console</p>
                  <p className="text-sm text-gray-500">SEO performance data</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={gscConnected ? "default" : "outline"}>
                  {gscConnected ? "Connected" : "Not Connected"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/aido/onboarding'}>
                  {gscConnected ? "Manage" : "Connect"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Google Business Profile</p>
                  <p className="text-sm text-gray-500">Local SEO and reviews</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={gbpConnected ? "default" : "outline"}>
                  {gbpConnected ? "Connected" : "Not Connected"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/aido/onboarding'}>
                  {gbpConnected ? "Manage" : "Connect"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3 border-b">
              <div className="flex items-center gap-3">
                <Globe className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Google Analytics 4</p>
                  <p className="text-sm text-gray-500">Website traffic and behavior</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={ga4Connected ? "default" : "outline"}>
                  {ga4Connected ? "Connected" : "Not Connected"}
                </Badge>
                <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/aido/onboarding'}>
                  {ga4Connected ? "Manage" : "Connect"}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium">Gmail</p>
                  <p className="text-sm text-gray-500">Email synchronization</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={gmailConnected ? "default" : "outline"}>
                  {gmailConnected ? "Connected" : "Not Connected"}
                </Badge>
                <Button variant="outline" size="sm">
                  {gmailConnected ? "Manage" : "Connect"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Configuration */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-purple-600" />
              <CardTitle>AI Configuration</CardTitle>
            </div>
            <CardDescription>
              Customize how AIDO generates content and analyzes data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="ai-model">AI Model</Label>
              <select
                id="ai-model"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800"
              >
                <option value="claude-sonnet-4-5-20250929">Claude Sonnet 4.5 (Recommended)</option>
                <option value="claude-opus-4-5-20251101">Claude Opus 4 (Premium)</option>
                <option value="claude-haiku-4-5-20251001">Claude Haiku 4.5 (Fast)</option>
              </select>
              <p className="text-xs text-gray-500">Higher-tier models provide better quality but cost more</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-tokens">Max Tokens per Request</Label>
              <Input
                id="max-tokens"
                type="number"
                value={maxTokens}
                onChange={(e) => setMaxTokens(e.target.value)}
                placeholder="2048"
              />
              <p className="text-xs text-gray-500">Higher values allow longer responses (1000-8000)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">Creativity (Temperature)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                min="0"
                max="1"
                value={temperature}
                onChange={(e) => setTemperature(e.target.value)}
                placeholder="0.7"
              />
              <p className="text-xs text-gray-500">0 = Deterministic, 1 = Creative (0.0-1.0)</p>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Auto-generate content</p>
                <p className="text-sm text-gray-500">Automatically create marketing content for hot leads</p>
              </div>
              <Switch checked={autoGenerate} onCheckedChange={setAutoGenerate} />
            </div>
          </CardContent>
        </Card>

        {/* Email Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="w-5 h-5 text-green-600" />
              <CardTitle>Email Settings</CardTitle>
            </div>
            <CardDescription>
              Configure email tracking and automation
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email-signature">Email Signature</Label>
              <textarea
                id="email-signature"
                value={emailSignature}
                onChange={(e) => setEmailSignature(e.target.value)}
                placeholder="Best regards,&#10;Your Name&#10;Your Company"
                className="w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-800 min-h-[100px]"
              />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">Track email opens</p>
                <p className="text-sm text-gray-500">Monitor when recipients open your emails</p>
              </div>
              <Switch checked={trackOpens} onCheckedChange={setTrackOpens} />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">Track link clicks</p>
                <p className="text-sm text-gray-500">Monitor clicks on links in your emails</p>
              </div>
              <Switch checked={trackClicks} onCheckedChange={setTrackClicks} />
            </div>

            <div className="flex items-center justify-between py-2 border-t">
              <div>
                <p className="font-medium">AI auto-reply</p>
                <p className="text-sm text-gray-500">Let AIDO draft responses to common inquiries</p>
              </div>
              <Switch checked={autoReply} onCheckedChange={setAutoReply} />
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-orange-600" />
              <CardTitle>Notifications</CardTitle>
            </div>
            <CardDescription>
              Manage how AIDO keeps you informed
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Email notifications</p>
                <p className="text-sm text-gray-500">Receive updates via email</p>
              </div>
              <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
            </div>

            <div className="flex items-center justify-between py-2 border-b">
              <div>
                <p className="font-medium">Hot lead alerts</p>
                <p className="text-sm text-gray-500">Get notified when AI scores exceed 80</p>
              </div>
              <Switch checked={hotLeadAlerts} onCheckedChange={setHotLeadAlerts} />
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-medium">Weekly performance reports</p>
                <p className="text-sm text-gray-500">Receive weekly analytics summaries</p>
              </div>
              <Switch checked={weeklyReports} onCheckedChange={setWeeklyReports} />
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-4">
          <p className="text-sm text-gray-500">
            Changes are saved automatically
          </p>
          <Button onClick={handleSave} disabled={saving || saved}>
            {saving ? (
              <>
                <Settings className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Saved
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
