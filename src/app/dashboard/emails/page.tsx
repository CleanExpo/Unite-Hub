"use client";

import React from "react";
import { Mail, Send, Inbox, Archive, Star, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function EmailsPage() {
  const emailStats = [
    { label: "Sent Today", value: "47", icon: Send, color: "text-blue-500" },
    { label: "Inbox", value: "23", icon: Inbox, color: "text-green-500" },
    { label: "Starred", value: "8", icon: Star, color: "text-yellow-500" },
    { label: "Scheduled", value: "12", icon: Clock, color: "text-purple-500" },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Email Management</h1>
          <p className="text-muted-foreground">Manage your email campaigns and sequences</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/emails/sequences">
            View Sequences <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {emailStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Sequences
            </CardTitle>
            <CardDescription>
              Create automated email sequences for lead nurturing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/emails/sequences">Manage Sequences</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Archive className="h-5 w-5" />
              Email Templates
            </CardTitle>
            <CardDescription>
              Browse and create reusable email templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" asChild className="w-full">
              <Link href="/dashboard/email-templates">View Templates</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
