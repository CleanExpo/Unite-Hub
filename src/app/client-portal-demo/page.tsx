"use client";

import React from "react";
import { ModernSidebar } from "@/components/layout/ModernSidebar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MilestoneTracker } from "@/components/client-portal/MilestoneTracker";
import { DeliverablesGrid } from "@/components/client-portal/DeliverablesGrid";
import { MessageThread } from "@/components/client-portal/MessageThread";
import { Search, Bell, MessageSquare, Plus, Download, Star } from "lucide-react";

// Mock data
const activeProjects = [
  {
    id: "1",
    title: "Website Redesign",
    type: "Web Design + Development",
    status: "active" as const,
    progress: 65,
    team: [
      { initials: "C" },
      { initials: "R" },
      { initials: "P" },
    ],
    milestones: [
      { id: "1", title: "Discovery & Planning", status: "completed" as const, date: "Completed" },
      { id: "2", title: "Design Mockups", status: "completed" as const, date: "Completed" },
      { id: "3", title: "Development", status: "in-progress" as const, date: "In Progress" },
      { id: "4", title: "Testing & Launch", status: "pending" as const, date: "Dec 15" },
    ],
  },
];

const completedProjects = [
  {
    id: "2",
    title: "Brand Identity",
    type: "Logo & Brand Guidelines",
    status: "completed" as const,
    progress: 100,
    team: [
      { initials: "C" },
      { initials: "P" },
    ],
    deliverables: [
      { id: "1", name: "Brand Guidelines", type: "pdf" as const, size: "2.4 MB" },
      { id: "2", name: "Logo Files", type: "zip" as const, size: "8.7 MB" },
      { id: "3", name: "Color Palette", type: "pdf" as const, size: "452 KB" },
      { id: "4", name: "Typography Guide", type: "pdf" as const, size: "1.2 MB" },
    ],
  },
];

const messages = [
  {
    id: "1",
    author: "Claire",
    initials: "C",
    role: "Design Lead",
    time: "2 hours ago",
    text: "Hi John! I've uploaded the revised homepage mockups with the logo adjustments you requested. Let me know what you think! 🎨",
  },
  {
    id: "2",
    author: "Rana",
    initials: "R",
    role: "Developer",
    time: "Yesterday",
    text: "Development is progressing smoothly. The staging site will be ready for you to test by end of week. I'll send you the link then.",
  },
  {
    id: "3",
    author: "Phill",
    initials: "P",
    role: "Project Manager",
    time: "2 days ago",
    text: "Quick update: We're on track for the Dec 15 launch date. I'll schedule a review call for next week to go over the staging site together.",
  },
];

const invoices = [
  {
    id: "INV-1234",
    description: "Website Redesign (Deposit)",
    amount: "$5,000",
    date: "Oct 15, 2025",
    status: "paid" as const,
  },
  {
    id: "INV-1198",
    description: "Brand Identity Package",
    amount: "$8,000",
    date: "Sep 28, 2025",
    status: "paid" as const,
  },
];

export default function ClientPortalDemo() {
  const handleDownloadDeliverable = (deliverable: any) => {
    console.log("Download:", deliverable);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Modified for Client Portal */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-[280px] bg-white border-r border-gray-200 flex flex-col">
        <div className="flex items-center justify-between h-20 px-6 border-b border-gray-200">
          <div>
            <span className="text-xl font-bold">
              <span className="text-unite-blue">Unite-</span>
              <span className="text-unite-orange">Hub</span>
            </span>
            <span className="block text-xs text-gray-500">Client Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="/portal/projects" className="flex items-center px-3 py-2.5 rounded-lg bg-gradient-to-r from-unite-teal to-unite-blue text-white">
            <span className="mr-3">📊</span>
            <span className="text-sm font-medium">My Projects</span>
          </a>
          <a href="/client/dashboard/production" className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="mr-3">📁</span>
            <span className="text-sm font-medium">Deliverables</span>
          </a>
          <a href="/portal/messages" className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="mr-3">💬</span>
            <span className="text-sm font-medium">Messages</span>
            <span className="ml-auto bg-unite-orange text-white px-2 py-0.5 rounded-full text-xs font-bold">2</span>
          </a>
          <a href="/portal/invoices" className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="mr-3">📄</span>
            <span className="text-sm font-medium">Invoices</span>
          </a>
          <a href="/portal/settings" className="flex items-center px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-100">
            <span className="mr-3">⚙️</span>
            <span className="text-sm font-medium">Settings</span>
          </a>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-2.5 bg-gray-50 rounded-lg">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-orange text-white font-bold">
                AC
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="text-sm font-semibold">John Smith</div>
              <div className="text-xs text-gray-500">Acme Corp</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 ml-[280px]">
        {/* Header */}
        <header className="h-[70px] bg-white border-b border-gray-200 flex items-center px-8 gap-6">
          <h1 className="text-2xl font-bold">My Projects</h1>

          <div className="flex-1" />

          <Button variant="outline" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Message Team
          </Button>
          <Button className="bg-gradient-to-r from-unite-teal to-unite-blue text-white gap-2">
            <Plus className="h-4 w-4" />
            New Project Request
          </Button>
        </header>

        {/* Content */}
        <main className="p-8">
          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-unite-teal to-unite-blue text-white p-8 rounded-2xl mb-8">
            <h2 className="text-3xl font-bold mb-2">Welcome back, John! 👋</h2>
            <p className="text-lg opacity-90">Your website redesign is progressing well. Claire uploaded new mockups for your review.</p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Active Project */}
            {activeProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
                      <p className="text-sm text-gray-600">{project.type}</p>
                    </div>
                    <Badge className="bg-unite-teal/10 text-unite-teal border-unite-teal/20">
                      Active
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Your team:</span>
                    <div className="flex gap-1">
                      {project.team.map((member, i) => (
                        <Avatar key={i} className="h-7 w-7">
                          <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white text-xs">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <MilestoneTracker milestones={project.milestones} progress={project.progress} />

                  <div className="flex gap-2 mt-6">
                    <Button size="sm" className="bg-unite-teal hover:bg-unite-teal/90 text-white gap-2">
                      📸 View Designs
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <MessageSquare className="h-4 w-4" />
                      Message Team
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Completed Project */}
            {completedProjects.map((project) => (
              <Card key={project.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="border-b">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <CardTitle className="text-lg mb-1">{project.title}</CardTitle>
                      <p className="text-sm text-gray-600">{project.type}</p>
                    </div>
                    <Badge className="bg-success-100 text-success-700 border-success-200">
                      Completed
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">Your team:</span>
                    <div className="flex gap-1">
                      {project.team.map((member, i) => (
                        <Avatar key={i} className="h-7 w-7">
                          <AvatarFallback className="bg-gradient-to-br from-unite-teal to-unite-blue text-white text-xs">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <h4 className="text-sm font-semibold mb-4">Final Deliverables</h4>
                  <DeliverablesGrid
                    deliverables={project.deliverables}
                    onDownload={handleDownloadDeliverable}
                  />

                  <div className="flex gap-2 mt-6">
                    <Button size="sm" className="bg-unite-teal hover:bg-unite-teal/90 text-white gap-2">
                      <Download className="h-4 w-4" />
                      Download All
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2">
                      <Star className="h-4 w-4" />
                      Leave Review
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Messages & Invoices */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Messages */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <MessageThread messages={messages} />

                <Button size="sm" className="mt-6 bg-unite-teal hover:bg-unite-teal/90 text-white gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </Button>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card>
              <CardHeader>
                <CardTitle>Invoices</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {invoices.map((invoice) => (
                  <div key={invoice.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-sm font-semibold">{invoice.id}</span>
                      <Badge className="bg-success-100 text-success-700 text-xs">
                        {invoice.status}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      <div className="flex justify-between">
                        <span>{invoice.description}</span>
                        <span className="font-semibold">{invoice.amount}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500">Paid on {invoice.date}</div>
                  </div>
                ))}

                <Button size="sm" variant="outline" className="w-full">
                  📄 View All Invoices
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
