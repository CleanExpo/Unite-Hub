"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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
import { Plus, Search, Filter, MoreHorizontal, Mail, ExternalLink, Users, TrendingUp, Target, Sparkles, Edit } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { useWorkspace } from "@/hooks/useWorkspace";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { AddContactModal } from "@/components/modals/AddContactModal";
import { SendEmailModal } from "@/components/modals/SendEmailModal";
import { DeleteContactModal } from "@/components/modals/DeleteContactModal";
import { EditContactModal } from "@/components/modals/EditContactModal";
import { ContactsListSkeleton } from "@/components/skeletons/ContactsListSkeleton";
import { StatsGridSkeleton } from "@/components/skeletons/StatsCardSkeleton";
import { ErrorState } from "@/components/ErrorState";

export default function ContactsPage() {
  const { workspaceId, loading: workspaceLoading } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [allContacts, setAllContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSendEmailModalOpen, setIsSendEmailModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any | null>(null);
  const router = useRouter();

  const fetchContacts = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!workspaceId) {
        console.log("No workspace selected for contacts");
        setLoading(false);
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("contacts")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (fetchError) {
        console.error("Error fetching contacts:", fetchError);
        setError(fetchError.message || "Failed to load contacts");
        return;
      }

      setAllContacts(data || []);
    } catch (err: unknown) {
      console.error("Error fetching contacts:", err);
      const message = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!workspaceLoading && workspaceId) {
      fetchContacts();
    }
  }, [workspaceId, workspaceLoading]);

  // Filter by search term
  const contacts = allContacts.filter((contact: any) =>
    contact.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    contact.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContactAdded = () => {
    // Refresh contacts list
    fetchContacts();
  };

  const handleSendEmail = (contact: any) => {
    setSelectedContact(contact);
    setIsSendEmailModalOpen(true);
  };

  const handleEmailSent = () => {
    // Optionally update last_interaction timestamp
    // Could refresh contacts or update locally
    console.log("Email sent successfully");
  };

  const handleDeleteClick = (contact: any) => {
    setSelectedContact(contact);
    setIsDeleteModalOpen(true);
  };

  const handleContactDeleted = () => {
    // Refresh contacts list
    fetchContacts();
  };

  const handleEditClick = (contact: any) => {
    setSelectedContact(contact);
    setIsEditModalOpen(true);
  };

  const handleContactUpdated = () => {
    // Refresh contacts list
    fetchContacts();
  };

  return (
    <motion.div
      className="p-6 space-y-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Breadcrumbs items={[{ label: "Contacts" }]} />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-mono font-bold text-white/90 tracking-wide mb-1">
            Contacts
          </h1>
          <p className="text-white/40 text-sm">Manage all your contacts and leads in one place</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90"
        >
          <Plus className="w-4 h-4" />
          Add Contact
        </button>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
          <Input
            placeholder="Search contacts by name, email, or company..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 bg-white/[0.04] border-white/[0.06] text-white/90 placeholder:text-white/20 rounded-sm focus:border-[#00F5FF]/50"
          />
        </div>
        <button className="flex items-center gap-2 border border-white/[0.06] bg-white/[0.02] text-white/40 font-mono text-sm rounded-sm px-4 py-2 hover:bg-white/[0.04] hover:border-white/[0.08]">
          <Filter className="w-4 h-4" />
          Filter
        </button>
      </div>

      {/* Stats */}
      {loading ? (
        <StatsGridSkeleton count={4} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Contacts"
            value={contacts.length.toString()}
            icon={Users}
            iconColor="text-[#00F5FF]"
          />
          <StatCard
            title="Prospects"
            value={contacts.filter((c: any) => c.status === "prospect").length.toString()}
            icon={Target}
            iconColor="text-[#00FF88]"
          />
          <StatCard
            title="Hot Leads"
            value={contacts.filter((c: any) => (c.ai_score || 0) >= 80).length.toString()}
            icon={Sparkles}
            iconColor="text-[#FFB800]"
          />
          <StatCard
            title="Avg AI Score"
            value={contacts.length > 0
              ? Math.round(contacts.reduce((sum: number, c: any) => sum + (c.ai_score || 0), 0) / contacts.length).toString()
              : "0"}
            icon={TrendingUp}
            iconColor="text-[#00F5FF]"
          />
        </div>
      )}

      {/* Contacts Table */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-sm">
        <div className="px-6 py-4 border-b border-white/[0.06]">
          <h2 className="text-xl font-mono font-bold text-white/90 tracking-wide">All Contacts</h2>
          <p className="text-white/40 text-sm mt-0.5">View and manage your contact database</p>
        </div>
        <div className="p-6">
          {error ? (
            <ErrorState
              title="Failed to load contacts"
              message={error}
              onRetry={fetchContacts}
            />
          ) : loading ? (
            <div className="overflow-x-auto">
              <ContactsListSkeleton rows={5} />
            </div>
          ) : contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-sm bg-white/[0.04] border border-white/[0.06] mb-4">
                <Users className="h-8 w-8 text-[#00F5FF]" />
              </div>
              <h3 className="text-base font-mono font-semibold text-white/90 mb-2">
                {searchTerm ? "No contacts found" : "No contacts yet"}
              </h3>
              <p className="text-white/40 text-sm mb-4">
                {searchTerm ? "Try a different search term" : "Add your first contact to get started"}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 mx-auto bg-[#00F5FF] text-[#050505] font-mono text-sm rounded-sm px-4 py-2 hover:bg-[#00F5FF]/90"
                >
                  <Plus className="w-4 h-4" />
                  Add Contact
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white/[0.04] hover:bg-transparent">
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Name</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Company</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Email</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">AI Score</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Status</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Last Interaction</TableHead>
                    <TableHead className="text-[10px] font-mono uppercase tracking-widest text-white/20">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                  <TableRow key={contact.id} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                    <TableCell>
                      <Link
                        href={`/dashboard/contacts/${contact.id}`}
                        className="text-white/90 font-mono font-semibold hover:text-[#00F5FF]"
                      >
                        {contact.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-white/40 font-mono text-sm">{contact.company || "—"}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <a
                          href={`mailto:${contact.email}`}
                          className="text-[#00F5FF] hover:text-[#00F5FF]/80 flex items-center gap-1 font-mono text-sm"
                        >
                          <Mail className="w-3.5 h-3.5" />
                          {contact.email}
                        </a>
                        {contact.emailCount && contact.emailCount > 1 && (
                          <Badge className="bg-transparent text-white/40 border border-white/[0.08] text-xs rounded-sm font-mono">
                            +{contact.emailCount - 1}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          (contact.ai_score || 0) >= 80
                            ? "bg-transparent text-[#00FF88] border border-[#00FF88]/30 rounded-sm font-mono text-xs"
                            : (contact.ai_score || 0) >= 70
                            ? "bg-transparent text-[#FFB800] border border-[#FFB800]/30 rounded-sm font-mono text-xs"
                            : "bg-transparent text-[#FFB800]/60 border border-[#FFB800]/20 rounded-sm font-mono text-xs"
                        }
                      >
                        {contact.ai_score || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          contact.status === "prospect"
                            ? "bg-transparent text-[#00FF88] border border-[#00FF88]/30 rounded-sm font-mono text-xs"
                            : contact.status === "lead"
                            ? "bg-transparent text-[#00F5FF] border border-[#00F5FF]/30 rounded-sm font-mono text-xs"
                            : "bg-transparent text-white/40 border border-white/[0.06] rounded-sm font-mono text-xs"
                        }
                      >
                        {contact.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-white/40 font-mono text-sm">
                      {contact.last_interaction ? new Date(contact.last_interaction).toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-1.5 rounded-sm text-white/40 hover:text-white/90 hover:bg-white/[0.04]">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#0a0a0a] border border-white/[0.06] rounded-sm">
                          <DropdownMenuItem
                            onClick={() => handleSendEmail(contact)}
                            className="text-white/60 hover:text-white/90 hover:bg-white/[0.04] cursor-pointer font-mono text-sm rounded-sm"
                          >
                            <Mail className="w-4 h-4 mr-2" />
                            Send Email
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleEditClick(contact)}
                            className="text-white/60 hover:text-white/90 hover:bg-white/[0.04] cursor-pointer font-mono text-sm rounded-sm"
                          >
                            <Edit className="w-4 h-4 mr-2" />
                            Edit Contact
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/contacts/${contact.id}`}
                              className="text-white/60 hover:text-white/90 hover:bg-white/[0.04] flex items-center cursor-pointer font-mono text-sm rounded-sm"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Profile
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteClick(contact)}
                            className="text-[#FF4444] hover:text-[#FF4444]/80 hover:bg-[#FF4444]/10 cursor-pointer font-mono text-sm rounded-sm"
                          >
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
        </div>
      </div>

      {/* Add Contact Modal */}
      {workspaceId && (
        <AddContactModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          workspaceId={workspaceId}
          onContactAdded={handleContactAdded}
        />
      )}

      {/* Send Email Modal */}
      {workspaceId && selectedContact && (
        <SendEmailModal
          isOpen={isSendEmailModalOpen}
          onClose={() => {
            setIsSendEmailModalOpen(false);
            setSelectedContact(null);
          }}
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          contactEmail={selectedContact.email}
          workspaceId={workspaceId}
          onEmailSent={handleEmailSent}
        />
      )}

      {/* Delete Contact Modal */}
      {workspaceId && selectedContact && (
        <DeleteContactModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedContact(null);
          }}
          contactId={selectedContact.id}
          contactName={selectedContact.name}
          workspaceId={workspaceId}
          onContactDeleted={handleContactDeleted}
        />
      )}

      {/* Edit Contact Modal */}
      {workspaceId && selectedContact && (
        <EditContactModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedContact(null);
          }}
          contactId={selectedContact.id}
          workspaceId={workspaceId}
          initialData={{
            name: selectedContact.name,
            email: selectedContact.email,
            company: selectedContact.company,
            job_title: selectedContact.job_title,
            phone: selectedContact.phone,
            status: selectedContact.status,
            tags: selectedContact.tags,
          }}
          onContactUpdated={handleContactUpdated}
        />
      )}
    </motion.div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  iconColor,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
  iconColor: string;
}) {
  return (
    <motion.div
      className="bg-white/[0.02] border border-white/[0.06] rounded-sm p-6 hover:border-white/[0.08] group"
      whileHover={{ borderColor: "rgba(255,255,255,0.08)" }}
    >
      <div className="flex items-start justify-between mb-4">
        <motion.div
          className="h-12 w-12 rounded-sm bg-white/[0.04] border border-white/[0.06] flex items-center justify-center"
          whileHover={{ scale: 1.1 }}
          transition={{ duration: 0.2 }}
        >
          <Icon className={`h-6 w-6 ${iconColor}`} />
        </motion.div>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-mono uppercase tracking-widest text-white/20">{title}</p>
        <p className="text-3xl font-mono font-bold text-white/90">{value}</p>
      </div>
    </motion.div>
  );
}
