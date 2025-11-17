"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, Filter, MoreHorizontal, Mail, ExternalLink, Users, TrendingUp, Target, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { Breadcrumbs } from "@/components/Breadcrumbs";

export default function ContactsPage() {
  const { currentOrganization } = useAuth();
  const workspaceId = currentOrganization?.org_id || null;
  const [searchTerm, setSearchTerm] = useState("");
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchContacts() {
      try {
        if (!workspaceId) {
          console.log("No workspace selected for contacts");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from("contacts")
          .select("*")
          .eq("workspace_id", workspaceId)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching contacts:", error);
          throw error;
        }
        setAllContacts(data || []);
      } catch (error) {
        console.error("Error fetching contacts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchContacts();
  }, [workspaceId]);

  // Filter by search term
  const contacts = allContacts.filter((contact: any) =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      <Breadcrumbs items={[{ label: "Contacts" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent mb-2">
            Contacts
          </h1>
          <p className="text-slate-400">Manage all your contacts and leads in one place</p>
        </div>
        <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg shadow-blue-500/50 transition-all gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search contacts by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 bg-slate-800/50 backdrop-blur-sm border-slate-700/50 text-white placeholder:text-slate-500 focus:border-blue-500/50"
          />
        </div>
        <Button variant="outline" className="border-slate-700/50 bg-slate-800/50 backdrop-blur-sm text-slate-300 hover:bg-slate-700/50 hover:border-slate-600/50 gap-2 h-12">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Contacts"
          value={contacts.length.toString()}
          icon={Users}
          gradient="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Prospects"
          value={contacts.filter((c: any) => c.status === "prospect").length.toString()}
          icon={Target}
          gradient="from-green-500 to-emerald-500"
        />
        <StatCard
          title="Hot Leads"
          value={contacts.filter((c: any) => (c.ai_score || 0) >= 80).length.toString()}
          icon={Sparkles}
          gradient="from-orange-500 to-red-500"
        />
        <StatCard
          title="Avg AI Score"
          value={contacts.length > 0
            ? Math.round(contacts.reduce((sum: number, c: any) => sum + (c.ai_score || 0), 0) / contacts.length).toString()
            : "0"}
          icon={TrendingUp}
          gradient="from-purple-500 to-pink-500"
        />
      </div>

      {/* Contacts Table */}
      <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white text-xl font-semibold">All Contacts</CardTitle>
          <CardDescription className="text-slate-400">View and manage your contact database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 animate-pulse"></div>
                <p className="text-slate-400">Loading contacts...</p>
              </div>
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-600/20 mb-4">
                <Users className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                {searchTerm ? "No contacts found" : "No contacts yet"}
              </h3>
              <p className="text-slate-400 mb-4">
                {searchTerm ? "Try a different search term" : "Add your first contact to get started"}
              </p>
              {!searchTerm && (
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 gap-2">
                  <Plus className="w-4 h-4" />
                  Add Contact
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700/50 hover:bg-slate-700/30">
                    <TableHead className="text-slate-300 font-semibold">Name</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Company</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Email</TableHead>
                    <TableHead className="text-slate-300 font-semibold">AI Score</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Status</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Last Interaction</TableHead>
                    <TableHead className="text-slate-300 font-semibold">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                  <TableRow key={contact.id} className="border-slate-700/50 hover:bg-slate-700/30 transition-colors">
                    <TableCell>
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="text-white font-semibold hover:text-blue-400 transition-colors"
                      >
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-slate-400">{contact.company || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                        >
                          <Mail className="w-4 h-4" />
                          {contact.email}
                        </a>
                        {contact.emailCount && contact.emailCount > 1 && (
                          <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs">
                            +{contact.emailCount - 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          (contact.ai_score || 0) >= 80
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : (contact.ai_score || 0) >= 70
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        }
                      >
                        {contact.ai_score || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          contact.status === "prospect"
                            ? "bg-green-500/20 text-green-400 border border-green-500/30"
                            : contact.status === "lead"
                            ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                            : "bg-slate-500/20 text-slate-400 border border-slate-500/30"
                        }
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">
                      {contact.last_interaction ? new Date(contact.last_interaction).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="hover:bg-slate-700/50">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                          <DropdownMenuItem className="text-slate-300 hover:text-white hover:bg-slate-700">
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/contacts/${contact.id}`}
                              className="text-slate-300 hover:text-white hover:bg-slate-700 flex items-center cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  gradient,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  gradient: string;
}) {
  return (
    <Card className="bg-slate-800/50 backdrop-blur-sm border-slate-700/50 hover:border-slate-600/50 transition-all group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-400 font-medium">{title}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
