"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabaseClient } from "@/lib/supabase/client";
import { Plus, Building2, Users, FolderOpen, CheckSquare, Settings, LogOut, Home, ArrowLeft } from "lucide-react";

interface Organization {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  size: string | null;
  created_at: string;
}

export default function Organizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    industry: "",
    size: ""
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    fetchOrganizations();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) {
      router.push("/login");
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      const result = await response.json();
      
      if (result.success) {
        setOrganizations(result.data || []);
      } else {
        console.error('Failed to fetch organizations:', result.error);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setOrganizations([result.data, ...organizations]);
        setFormData({ name: "", description: "", industry: "", size: "" });
        setIsDialogOpen(false);
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating organization:', error);
      alert('Failed to create organization');
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignOut = async () => {
    await supabaseClient.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg text-slate-300">Loading organizations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-8">
              <Link href="/" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-teal-400 to-cyan-400 rounded-lg flex items-center justify-center">
                  <span className="text-slate-900 font-bold text-lg">UG</span>
                </div>
                <h1 className="text-xl font-bold text-white">UNITE Group</h1>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                <Link href="/dashboard" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <Home className="h-4 w-4" />
                  Dashboard
                </Link>
                <Link href="/projects" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <FolderOpen className="h-4 w-4" />
                  Projects
                </Link>
                <Link href="/tasks" className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors">
                  <CheckSquare className="h-4 w-4" />
                  Tasks
                </Link>
                <Link href="/organizations" className="flex items-center gap-2 text-teal-400 font-medium">
                  <Users className="h-4 w-4" />
                  Organizations
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Link href="/profile" className="text-slate-300 hover:text-white transition-colors">
                <Settings className="h-5 w-5" />
              </Link>
              <Button 
                onClick={handleSignOut}
                variant="ghost" 
                size="sm"
                className="text-slate-300 hover:text-white hover:bg-slate-700"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="p-8 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-white mb-2">Organizations</h1>
            <p className="text-slate-300 text-lg">Manage your client organizations and accounts</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <Building2 className="h-8 w-8 text-teal-400" />
            <div>
              <h2 className="text-2xl font-semibold text-white">Organization Management</h2>
              <p className="text-slate-400">Create and manage client organizations</p>
            </div>
          </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-purple-600 hover:bg-purple-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add New Organization</DialogTitle>
              <DialogDescription>
                Create a new organization to manage projects and contacts.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Organization Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Enter organization name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="Brief description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Select value={formData.industry} onValueChange={(value) => handleChange('industry', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="size">Company Size</Label>
                <Select value={formData.size} onValueChange={(value) => handleChange('size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select size" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-10">1-10 employees</SelectItem>
                    <SelectItem value="11-50">11-50 employees</SelectItem>
                    <SelectItem value="51-200">51-200 employees</SelectItem>
                    <SelectItem value="201-1000">201-1000 employees</SelectItem>
                    <SelectItem value="1000+">1000+ employees</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                  Create Organization
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
        </div>

        {organizations.length === 0 ? (
          <Card className="bg-slate-800 border-slate-700">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Building2 className="h-12 w-12 text-slate-600 mb-4" />
              <h3 className="text-lg font-semibold mb-2 text-white">No organizations yet</h3>
              <p className="text-slate-400 text-center mb-4">
                Get started by creating your first organization to manage projects and contacts.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Organization
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">All Organizations</CardTitle>
              <CardDescription className="text-slate-400">
                {organizations.length} organization{organizations.length !== 1 ? 's' : ''} total
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">Name</TableHead>
                    <TableHead className="text-slate-300">Industry</TableHead>
                    <TableHead className="text-slate-300">Size</TableHead>
                    <TableHead className="text-slate-300">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {organizations.map((org) => (
                    <TableRow key={org.id} className="border-slate-700 hover:bg-slate-700">
                      <TableCell>
                        <div>
                          <div className="font-medium text-white">{org.name}</div>
                          {org.description && (
                            <div className="text-sm text-slate-400">{org.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-300">{org.industry || '-'}</TableCell>
                      <TableCell className="text-slate-300">{org.size || '-'}</TableCell>
                      <TableCell className="text-slate-300">
                        {new Date(org.created_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
