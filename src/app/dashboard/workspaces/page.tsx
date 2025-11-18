"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Settings, Users, BarChart3, Trash2, Briefcase } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ErrorState } from "@/components/ErrorState";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";

export default function WorkspacesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [workspaces] = useState([
    {
      id: 1,
      name: "Duncan's Marketing",
      description: "Main agency workspace",
      clients: 12,
      campaigns: 24,
      members: 5,
      status: "active",
    },
    {
      id: 2,
      name: "Tech StartUp Co",
      description: "Client: Tech startup marketing",
      clients: 3,
      campaigns: 8,
      members: 2,
      status: "active",
    },
    {
      id: 3,
      name: "eCommerce Solutions",
      description: "Client: E-commerce platform",
      clients: 5,
      campaigns: 12,
      members: 3,
      status: "active",
    },
  ]);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Workspaces" }]} />
        <ErrorState
          title="Failed to Load Workspaces"
          message={error}
          onRetry={() => setError(null)}
        />
      </div>
    );
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Workspaces" }]} />

        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-48" />
            <Skeleton className="h-5 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-6 w-40" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-8 w-12" />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Skeleton className="h-9 flex-1" />
                    <Skeleton className="h-9 w-12" />
                    <Skeleton className="h-9 w-12" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Breadcrumbs items={[{ label: "Workspaces" }]} />
        <EmptyState
          icon={Briefcase}
          title="No Workspaces Yet"
          description="Create your first workspace to organize your clients and projects."
          actionLabel="Create Workspace"
          onAction={() => setIsCreateOpen(true)}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Workspaces" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Workspaces
          </h1>
          <p className="text-slate-400">Manage all your client accounts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2">
              <Plus className="w-4 h-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800/95 backdrop-blur-sm border-slate-700/50">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Workspace</DialogTitle>
              <DialogDescription className="text-slate-400">Add a new client workspace</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-slate-300 mb-2 block">Workspace Name</Label>
                <Input
                  placeholder="Client name or project"
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
              <div>
                <Label className="text-slate-300 mb-2 block">Description</Label>
                <Input
                  placeholder="What is this workspace for?"
                  className="bg-slate-900/50 border-slate-700/50 text-white placeholder:text-slate-500"
                />
              </div>
              <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50">
                Create Workspace
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-blue-600/50 transition-all group">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-white group-hover:text-blue-400 transition-colors">{workspace.name}</CardTitle>
                  <CardDescription className="text-slate-400">{workspace.description}</CardDescription>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border border-green-500/30">{workspace.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Stats */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Contacts</p>
                    <p className="text-2xl font-bold text-white">{workspace.clients}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Campaigns</p>
                    <p className="text-2xl font-bold text-white">{workspace.campaigns}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-1">Members</p>
                    <p className="text-2xl font-bold text-white">{workspace.members}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50 gap-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-900/20 hover:border-red-500/50 gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Usage Stats */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white text-xl">Account Usage</CardTitle>
          <CardDescription className="text-slate-400">Current plan: Professional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">Workspaces Used</p>
              <div className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">3 / 5</div>
              <p className="text-xs text-slate-500 mt-1">Upgrade for unlimited</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Total Contacts</p>
              <div className="text-3xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">20 / 50,000</div>
              <p className="text-xs text-slate-500 mt-1">Well within limit</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Team Members</p>
              <div className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">10 / Unlimited</div>
              <p className="text-xs text-slate-500 mt-1">All included</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
