"use client";

import React from "react";
import { FileText, Layout, Image, Video, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ResourcesPage() {
  const resources = [
    {
      name: "Landing Pages",
      description: "Create and manage landing pages for campaigns",
      icon: Layout,
      href: "/dashboard/resources/landing-pages",
      count: 8,
    },
    {
      name: "Documents",
      description: "Store and organize important documents",
      icon: FileText,
      href: "/dashboard/media",
      count: 24,
    },
    {
      name: "Images",
      description: "Media library for images and graphics",
      icon: Image,
      href: "/dashboard/media",
      count: 156,
    },
    {
      name: "Videos",
      description: "Video content for campaigns",
      icon: Video,
      href: "/dashboard/media",
      count: 12,
    },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Resources</h1>
        <p className="text-muted-foreground">Manage your marketing resources and assets</p>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {resources.map((resource) => (
          <Card key={resource.name} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <resource.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>{resource.name}</CardTitle>
                </div>
                <span className="text-sm font-medium text-muted-foreground">
                  {resource.count} items
                </span>
              </div>
              <CardDescription>
                {resource.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" asChild>
                <Link href={resource.href}>
                  Browse {resource.name} <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
