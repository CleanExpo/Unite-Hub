"use client";

import { useState } from "react";
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
import { Plus, Search, Filter, MoreHorizontal, Mail, Phone, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ContactsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();
  const [contacts] = useState([
    {
      id: 1,
      name: "John Smith",
      email: "john@techstartup.com",
      company: "TechStartup Inc",
      phone: "(555) 123-4567",
      aiScore: 85,
      status: "prospect",
      lastInteraction: "2 days ago",
      tags: ["Decision Maker", "Tech"],
      emailCount: 3,
    },
    {
      id: 2,
      name: "Lisa Johnson",
      email: "lisa@ecommerce.com",
      company: "eCommerce Solutions",
      phone: "(555) 234-5678",
      aiScore: 72,
      status: "lead",
      lastInteraction: "1 week ago",
      tags: ["Marketing Manager"],
      emailCount: 2,
    },
    {
      id: 3,
      name: "Carlos Rodriguez",
      email: "carlos@fintech.io",
      company: "FinTech Innovations",
      phone: "(555) 345-6789",
      aiScore: 65,
      status: "contact",
      lastInteraction: "3 weeks ago",
      tags: ["CEO", "Investor"],
      emailCount: 1,
    },
  ]);

  return (
    <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Contacts</h1>
          <p className="text-slate-400">Manage all your contacts and leads</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 gap-2">
          <Plus className="w-4 h-4" />
          Add Contact
        </Button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-800 border-slate-700 text-white"
          />
        </div>
        <Button variant="outline" className="border-slate-700 text-slate-300 hover:bg-slate-700 gap-2">
          <Filter className="w-4 h-4" />
          Filter
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatBox title="Total Contacts" value="247" color="text-blue-400" />
        <StatBox title="Prospects" value="45" color="text-green-400" />
        <StatBox title="Hot Leads" value="12" color="text-orange-400" />
        <StatBox title="Avg AI Score" value="73" color="text-purple-400" />
      </div>

      {/* Contacts Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">All Contacts</CardTitle>
          <CardDescription>View and manage your contact database</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-700 hover:bg-slate-700/50">
                <TableHead className="text-slate-300">Name</TableHead>
                <TableHead className="text-slate-300">Company</TableHead>
                <TableHead className="text-slate-300">Email</TableHead>
                <TableHead className="text-slate-300">AI Score</TableHead>
                <TableHead className="text-slate-300">Status</TableHead>
                <TableHead className="text-slate-300">Last Interaction</TableHead>
                <TableHead className="text-slate-300">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.map((contact) => (
                <TableRow key={contact.id} className="border-slate-700 hover:bg-slate-700/50">
                  <TableCell>
                    <Link
                      href={`/dashboard/contacts/${contact.id}`}
                      className="text-white font-semibold hover:text-blue-400 transition-colors"
                    >
                      {contact.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-400">{contact.company}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-blue-400 hover:text-blue-300 flex items-center gap-1"
                      >
                        <Mail className="w-4 h-4" />
                        {contact.email}
                      </a>
                      {contact.emailCount && contact.emailCount > 1 && (
                        <Badge variant="outline" className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs">
                          +{contact.emailCount - 1}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        contact.aiScore >= 80
                          ? "bg-green-600"
                          : contact.aiScore >= 70
                          ? "bg-blue-600"
                          : "bg-amber-600"
                      }
                    >
                      {contact.aiScore}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={
                        contact.status === "prospect"
                          ? "bg-green-600/20 text-green-300 border-green-600/30"
                          : contact.status === "lead"
                          ? "bg-blue-600/20 text-blue-300 border-blue-600/30"
                          : "bg-slate-600/20 text-slate-300 border-slate-600/30"
                      }
                      variant="outline"
                    >
                      {contact.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400">{contact.lastInteraction}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-300 hover:text-white">
                          <Mail className="w-4 h-4 mr-2" />
                          Send Email
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-slate-300 hover:text-white cursor-pointer"
                          onClick={() => router.push(`/dashboard/contacts/${contact.id}`)}
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:text-red-300">
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

function StatBox({ title, value, color }: { title: string; value: string; color: string }) {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardContent className="pt-6">
        <p className="text-slate-400 text-sm mb-1">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
