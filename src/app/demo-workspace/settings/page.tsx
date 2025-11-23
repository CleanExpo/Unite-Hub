"use client";

import React from "react";
import { Settings, User, Bell, Palette, Shield, Zap, Save } from "lucide-react";
import { WorkspaceSidebar } from "@/components/workspace/WorkspaceSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-[#071318] relative overflow-hidden">
      {/* Background gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 20% 20%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
            radial-gradient(ellipse at 80% 80%, rgba(20, 184, 166, 0.1) 0%, transparent 50%),
            linear-gradient(180deg, #0a1f2e 0%, #071318 100%)
          `,
        }}
      />

      {/* Main container */}
      <div className="relative z-10 h-screen p-4 flex justify-center items-center">
        <div className="w-full max-w-[1600px] h-[calc(100vh-32px)] bg-[#0a1f2e]/40 backdrop-blur-xl rounded-2xl shadow-2xl flex overflow-hidden border border-cyan-800/20">
          {/* Left Sidebar */}
          <WorkspaceSidebar />

          {/* Main Content */}
          <main className="flex-1 p-6 overflow-y-auto">
            {/* Header */}
            <header className="mb-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-cyan-500/20 rounded-lg">
                  <Settings className="w-5 h-5 text-cyan-400" />
                </div>
                <h1 className="text-xl font-bold text-white">Settings</h1>
              </div>
              <p className="text-sm text-gray-400">
                Manage your workspace preferences and integrations
              </p>
            </header>

            {/* Settings Sections */}
            <div className="space-y-6">
              {/* Profile Settings */}
              <Card className="bg-[#0d2137]/60 border-cyan-900/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-white text-lg">Profile</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Your personal information and preferences
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400 text-sm">Display Name</Label>
                      <Input
                        defaultValue="Demo User"
                        className="mt-1 bg-[#071318] border-cyan-900/30 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-400 text-sm">Email</Label>
                      <Input
                        defaultValue="demo@unite-hub.com"
                        className="mt-1 bg-[#071318] border-cyan-900/30 text-white"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Notifications */}
              <Card className="bg-[#0d2137]/60 border-cyan-900/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-white text-lg">Notifications</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Control how you receive updates
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Email Notifications</Label>
                      <p className="text-xs text-gray-400">Receive updates via email</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Content Ready Alerts</Label>
                      <p className="text-xs text-gray-400">Get notified when content is ready for approval</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Weekly Reports</Label>
                      <p className="text-xs text-gray-400">Receive weekly performance summaries</p>
                    </div>
                    <Switch />
                  </div>
                </CardContent>
              </Card>

              {/* AI Preferences */}
              <Card className="bg-[#0d2137]/60 border-cyan-900/30">
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-400" />
                    <CardTitle className="text-white text-lg">AI Preferences</CardTitle>
                  </div>
                  <CardDescription className="text-gray-400">
                    Configure AI content generation settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Auto-Generate Content</Label>
                      <p className="text-xs text-gray-400">Automatically create content based on briefs</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-white">Smart Suggestions</Label>
                      <p className="text-xs text-gray-400">Get AI-powered improvement suggestions</p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </CardContent>
              </Card>

              {/* Save Button */}
              <div className="flex justify-end">
                <Button className="bg-cyan-500 hover:bg-cyan-600 text-white">
                  <Save className="w-4 h-4 mr-2" /> Save Changes
                </Button>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
