"use client";

import { useState } from "react";
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
import { Plus, Settings, Users, BarChart3, Trash2 } from "lucide-react";

export default function WorkspacesPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
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

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Workspaces</h1>
          <p className="text-slate-400">Manage all your client accounts</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
              <Plus className="w-4 h-4" />
              New Workspace
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-800 border-slate-700">
            <DialogHeader>
              <DialogTitle className="text-white">Create New Workspace</DialogTitle>
              <DialogDescription>Add a new client workspace</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Workspace Name</Label>
                <Input
                  placeholder="Client name or project"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-white mb-2 block">Description</Label>
                <Input
                  placeholder="What is this workspace for?"
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <Button className="w-full bg-blue-600 hover:bg-blue-700">Create Workspace</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Workspaces Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workspaces.map((workspace) => (
          <Card key={workspace.id} className="bg-slate-800 border-slate-700 hover:border-blue-600/50 transition">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-white">{workspace.name}</CardTitle>
                  <CardDescription>{workspace.description}</CardDescription>
                </div>
                <Badge className="bg-green-600">{workspace.status}</Badge>
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
                  <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Open
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300 hover:bg-slate-700 gap-2"
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600/30 text-red-400 hover:bg-red-900/20 gap-2"
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
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Account Usage</CardTitle>
          <CardDescription>Current plan: Professional</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-slate-400 text-sm mb-2">Workspaces Used</p>
              <div className="text-3xl font-bold text-white">3 / 5</div>
              <p className="text-xs text-slate-400 mt-1">Upgrade for unlimited</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Total Contacts</p>
              <div className="text-3xl font-bold text-white">20 / 50,000</div>
              <p className="text-xs text-slate-400 mt-1">Well within limit</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-2">Team Members</p>
              <div className="text-3xl font-bold text-white">10 / Unlimited</div>
              <p className="text-xs text-slate-400 mt-1">All included</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
