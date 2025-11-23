"use client";

import React from "react";
import { MessageSquare, Phone, Mail, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function MessagesPage() {
  const channels = [
    {
      name: "WhatsApp",
      description: "Manage WhatsApp conversations with contacts",
      icon: MessageSquare,
      href: "/dashboard/messages/whatsapp",
      status: "Active",
      unread: 5,
    },
    {
      name: "SMS",
      description: "Send and receive SMS messages",
      icon: Phone,
      href: "/dashboard/messages/sms",
      status: "Coming Soon",
      unread: 0,
    },
    {
      name: "Email",
      description: "Direct email messaging",
      icon: Mail,
      href: "/dashboard/emails",
      status: "Active",
      unread: 12,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Messages</h1>
        <p className="text-muted-foreground">Manage all your communication channels</p>
      </div>

      {/* Channel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {channels.map((channel) => (
          <Card key={channel.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <channel.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>{channel.name}</CardTitle>
                    {channel.unread > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {channel.unread} unread
                      </span>
                    )}
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  channel.status === "Active"
                    ? "bg-green-100 text-green-800"
                    : "bg-gray-100 text-gray-600"
                }`}>
                  {channel.status}
                </span>
              </div>
              <CardDescription className="mt-2">
                {channel.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                className="w-full"
                asChild
                disabled={channel.status !== "Active"}
              >
                <Link href={channel.href}>
                  Open {channel.name} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
