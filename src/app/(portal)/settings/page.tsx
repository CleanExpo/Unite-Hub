"use client";

import React from "react";
import {
  User,
  Bell,
  CreditCard,
  Key,
  Mail,
  Globe,
  Shield,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="mt-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Business Name</Label>
                  <Input defaultValue="Your Business" />
                </div>
                <div>
                  <Label>Contact Email</Label>
                  <Input type="email" defaultValue="contact@business.com" />
                </div>
              </div>
              <div>
                <Label>Business Description</Label>
                <Input defaultValue="Your business description..." />
              </div>
              <div>
                <Label>Website URL</Label>
                <Input type="url" defaultValue="https://yourbusiness.com" />
              </div>
              <Button>Save Changes</Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </h3>
            <div className="space-y-4">
              <SettingToggle
                label="Email Notifications"
                description="Receive notifications about new emails and auto-replies"
                defaultChecked={true}
              />
              <SettingToggle
                label="Campaign Updates"
                description="Get notified when campaigns are published or completed"
                defaultChecked={true}
              />
              <SettingToggle
                label="Persona Updates"
                description="Notifications when new personas are generated"
                defaultChecked={false}
              />
              <SettingToggle
                label="Weekly Reports"
                description="Receive weekly summary of your marketing performance"
                defaultChecked={true}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="mt-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription & Billing
            </h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
                <div>
                  <p className="font-semibold text-gray-900">
                    Professional Plan
                  </p>
                  <p className="text-sm text-gray-600">
                    Billed monthly at $99/month
                  </p>
                </div>
                <Badge className="bg-green-500">Active</Badge>
              </div>
              <Button variant="outline">Change Plan</Button>
              <Button variant="outline" className="ml-2">
                View Billing History
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Connected Integrations
            </h3>
            <div className="space-y-3">
              <IntegrationItem
                icon={Mail}
                name="Gmail"
                status="connected"
                description="Email monitoring and auto-replies"
              />
              <IntegrationItem
                icon={Globe}
                name="Facebook"
                status="disconnected"
                description="Post campaigns to Facebook"
              />
              <IntegrationItem
                icon={Globe}
                name="Instagram"
                status="disconnected"
                description="Manage Instagram campaigns"
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SettingToggle({
  label,
  description,
  defaultChecked,
}: {
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <div className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex-1">
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}

function IntegrationItem({
  icon: Icon,
  name,
  status,
  description,
}: {
  icon: any;
  name: string;
  status: "connected" | "disconnected";
  description: string;
}) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
      <div className="flex items-center gap-4">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="h-5 w-5 text-blue-700" />
        </div>
        <div>
          <p className="font-medium text-gray-900">{name}</p>
          <p className="text-sm text-gray-600">{description}</p>
        </div>
      </div>
      <Button
        variant={status === "connected" ? "outline" : "default"}
        size="sm"
      >
        {status === "connected" ? "Disconnect" : "Connect"}
      </Button>
    </div>
  );
}
