"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Protected } from "@/components/auth/protected"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClientForm } from "@/components/crm/client-form"
import { ContactForm } from "@/components/crm/contact-form"
import { EmailSidebar } from "@/components/crm/email/email-sidebar"
import { EmailThreadView } from "@/components/crm/email/email-thread-view"
import { EmailComposer } from "@/components/crm/email/email-composer"
import {
  getClientWithContacts,
  getOpportunitiesByClientId,
  getTasksByClientId,
  getInteractionsByClientId,
} from "@/lib/crm"
import type { ClientWithContacts, Contact, Opportunity, Task, Interaction, PipelineStage } from "@/types/crm"
import {
  Building2,
  Users,
  Phone,
  Mail,
  MapPin,
  Globe,
  Calendar,
  CheckCircle,
  Clock,
  ArrowLeft,
  Plus,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"

export default function ClientDetailPage({ params }: { params: { id: string } }) {
  return (
    <Protected>
      <ClientDetail id={Number.parseInt(params.id)} />
    </Protected>
  )
}

function ClientDetail({ id }: { id: number }) {
  const { user } = useAuth()
  const router = useRouter()
  const [client, setClient] = useState<ClientWithContacts | null>(null)
  const [opportunities, setOpportunities] = useState<(Opportunity & { stage: PipelineStage | null })[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showEditClient, setShowEditClient] = useState(false)
  const [showAddContact, setShowAddContact] = useState(false)
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null)
  const [showEmailComposer, setShowEmailComposer] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        const [clientData, opportunitiesData, tasksData, interactionsData] = await Promise.all([
          getClientWithContacts(id),
          getOpportunitiesByClientId(id),
          getTasksByClientId(id),
          getInteractionsByClientId(id),
        ])
        setClient(clientData)
        setOpportunities(opportunitiesData)
        setTasks(tasksData)
        setInteractions(interactionsData)
      } catch (error) {
        console.error("Error loading client data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [id])

  const handleClientUpdated = (updatedClient: ClientWithContacts) => {
    setClient({ ...updatedClient, contacts: client?.contacts || [] })
    setShowEditClient(false)
  }

  const handleContactAdded = (contact: Contact) => {
    if (client) {
      setClient({
        ...client,
        contacts: [...client.contacts, contact],
      })
    }
    setShowAddContact(false)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-7xl mx-auto flex justify-center items-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <h2 className="text-2xl font-bold text-white mb-4">Client Not Found</h2>
              <p className="text-gray-300 mb-6">
                The client you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <Button
                onClick={() => router.push("/dashboard/crm")}
                className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              >
                Back to CRM Dashboard
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <Link
              href="/dashboard/crm"
              className="inline-flex items-center text-[#4ecdc4] hover:text-[#4ecdc4]/80 mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to CRM Dashboard
            </Link>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-white">{client.company_name}</h1>
                <p className="text-gray-300 mt-2">{client.industry || "No industry specified"}</p>
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={() => setShowEditClient(!showEditClient)}
                  variant="outline"
                  className="border-[#4ecdc4] text-[#4ecdc4] hover:bg-[#4ecdc4]/10"
                >
                  Edit Client
                </Button>
              </div>
            </div>
          </div>

          {showEditClient && (
            <div className="mb-8">
              <ClientForm client={client} onSuccess={handleClientUpdated} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="bg-[#001428] border-[#4ecdc4]/20 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-[#4ecdc4]" />
                  Client Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Contact Details</h3>
                  <ul className="space-y-3">
                    {client.website && (
                      <li className="flex items-start">
                        <Globe className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-300">Website</p>
                          <a
                            href={client.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[#4ecdc4] hover:underline"
                          >
                            {client.website}
                          </a>
                        </div>
                      </li>
                    )}
                    {(client.address || client.city || client.state || client.postal_code || client.country) && (
                      <li className="flex items-start">
                        <MapPin className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-300">Address</p>
                          <p className="text-white">
                            {[client.address, client.city, client.state, client.postal_code, client.country]
                              .filter(Boolean)
                              .join(", ")}
                          </p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Business Details</h3>
                  <ul className="space-y-3">
                    {client.annual_revenue !== null && (
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5 flex items-center justify-center">$</div>
                        <div>
                          <p className="text-sm font-medium text-gray-300">Annual Revenue</p>
                          <p className="text-white">${client.annual_revenue.toLocaleString()}</p>
                        </div>
                      </li>
                    )}
                    {client.employee_count !== null && (
                      <li className="flex items-start">
                        <Users className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-gray-300">Employees</p>
                          <p className="text-white">{client.employee_count.toLocaleString()}</p>
                        </div>
                      </li>
                    )}
                    {client.source && (
                      <li className="flex items-start">
                        <div className="h-5 w-5 text-[#4ecdc4] mr-2 mt-0.5 flex items-center justify-center">
                          <span className="text-xs">src</span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-300">Lead Source</p>
                          <p className="text-white capitalize">{client.source.replace("_", " ")}</p>
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#001428] border-[#4ecdc4]/20">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <Users className="mr-2 h-5 w-5 text-[#4ecdc4]" />
                    Contacts
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {client.contacts.length} contact{client.contacts.length !== 1 ? "s" : ""}
                  </CardDescription>
                </div>
                <Button
                  onClick={() => setShowAddContact(!showAddContact)}
                  size="sm"
                  className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                >
                  Add Contact
                </Button>
              </CardHeader>
              <CardContent>
                {showAddContact && (
                  <div className="mb-6">
                    <ContactForm clientId={client.id} onSuccess={handleContactAdded} />
                  </div>
                )}
                {client.contacts.length > 0 ? (
                  <ul className="space-y-4">
                    {client.contacts.map((contact) => (
                      <li key={contact.id} className="p-3 rounded-md bg-[#002a42] border border-[#4ecdc4]/10">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="text-white font-medium">
                              {contact.first_name} {contact.last_name}
                              {contact.is_primary && (
                                <span className="ml-2 text-xs bg-[#4ecdc4]/20 text-[#4ecdc4] px-2 py-0.5 rounded-full">
                                  Primary
                                </span>
                              )}
                            </h4>
                            <p className="text-sm text-gray-400">{contact.job_title || "No title"}</p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                            Edit
                          </Button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                          {contact.email && (
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 text-[#4ecdc4] mr-2" />
                              <a
                                href={`mailto:${contact.email}`}
                                className="text-sm text-gray-300 hover:text-[#4ecdc4]"
                              >
                                {contact.email}
                              </a>
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center">
                              <Phone className="h-4 w-4 text-[#4ecdc4] mr-2" />
                              <a href={`tel:${contact.phone}`} className="text-sm text-gray-300 hover:text-[#4ecdc4]">
                                {contact.phone}
                              </a>
                            </div>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-gray-400">No contacts added yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="opportunities" className="w-full">
            <TabsList className="bg-[#001428] border-[#4ecdc4]/20 mb-6">
              <TabsTrigger
                value="opportunities"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Opportunities
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Tasks
              </TabsTrigger>
              <TabsTrigger
                value="interactions"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Interactions
              </TabsTrigger>
              <TabsTrigger
                value="emails"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Emails
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Notes
              </TabsTrigger>
            </TabsList>
            <TabsContent value="opportunities">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Opportunities</CardTitle>
                    <CardDescription className="text-gray-400">
                      Deals and opportunities with this client
                    </CardDescription>
                  </div>
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">Add Opportunity</Button>
                </CardHeader>
                <CardContent>
                  {opportunities.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#4ecdc4]/10">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Title</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Stage</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Value</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Probability</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Expected Close</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opportunities.map((opportunity) => (
                            <tr key={opportunity.id} className="border-b border-[#4ecdc4]/10 hover:bg-[#4ecdc4]/5">
                              <td className="py-3 px-4 text-white">{opportunity.title}</td>
                              <td className="py-3 px-4">
                                <span
                                  className="px-2 py-1 rounded-full text-xs font-medium"
                                  style={{
                                    backgroundColor: opportunity.stage?.color
                                      ? `${opportunity.stage.color}20`
                                      : "#4ecdc420",
                                    color: opportunity.stage?.color || "#4ecdc4",
                                  }}
                                >
                                  {opportunity.stage?.name || "No Stage"}
                                </span>
                              </td>
                              <td className="py-3 px-4 text-right text-gray-300">
                                {opportunity.value ? `$${opportunity.value.toLocaleString()}` : "-"}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-300">
                                {opportunity.probability ? `${opportunity.probability}%` : "-"}
                              </td>
                              <td className="py-3 px-4 text-right text-gray-300">
                                {opportunity.expected_close_date
                                  ? new Date(opportunity.expected_close_date).toLocaleDateString()
                                  : "-"}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No opportunities found for this client.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tasks">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Tasks</CardTitle>
                    <CardDescription className="text-gray-400">
                      Follow-ups and to-dos related to this client
                    </CardDescription>
                  </div>
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">Add Task</Button>
                </CardHeader>
                <CardContent>
                  {tasks.length > 0 ? (
                    <ul className="space-y-3">
                      {tasks.map((task) => (
                        <li key={task.id} className="p-3 rounded-md bg-[#002a42] border border-[#4ecdc4]/10">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start">
                              <div className="mr-3 mt-0.5">
                                {task.status === "completed" ? (
                                  <CheckCircle className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Clock className="h-5 w-5 text-[#4ecdc4]" />
                                )}
                              </div>
                              <div>
                                <h4 className="text-white font-medium">{task.title}</h4>
                                {task.description && <p className="text-sm text-gray-300 mt-1">{task.description}</p>}
                                <div className="flex items-center mt-2">
                                  <Calendar className="h-4 w-4 text-gray-400 mr-1" />
                                  <span className="text-xs text-gray-400">
                                    {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                                  </span>
                                  {task.priority && (
                                    <span
                                      className={`ml-3 text-xs px-2 py-0.5 rounded-full ${
                                        task.priority === "high"
                                          ? "bg-red-500/20 text-red-500"
                                          : task.priority === "medium"
                                            ? "bg-yellow-500/20 text-yellow-500"
                                            : "bg-blue-500/20 text-blue-500"
                                      }`}
                                    >
                                      {task.priority}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                              {task.status === "completed" ? "Reopen" : "Complete"}
                            </Button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No tasks found for this client.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="interactions">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Interactions</CardTitle>
                    <CardDescription className="text-gray-400">
                      Calls, emails, and meetings with this client
                    </CardDescription>
                  </div>
                  <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">Log Interaction</Button>
                </CardHeader>
                <CardContent>
                  {interactions.length > 0 ? (
                    <div className="space-y-4">
                      {interactions.map((interaction) => (
                        <div key={interaction.id} className="p-4 rounded-md bg-[#002a42] border border-[#4ecdc4]/10">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-white font-medium">{interaction.subject}</h4>
                            <span className="text-xs bg-[#4ecdc4]/20 text-[#4ecdc4] px-2 py-0.5 rounded-full capitalize">
                              {interaction.type.replace("_", " ")}
                            </span>
                          </div>
                          {interaction.description && (
                            <p className="text-sm text-gray-300 mb-3">{interaction.description}</p>
                          )}
                          <div className="flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(interaction.date).toLocaleString()}
                            </div>
                            {interaction.duration && (
                              <div>
                                <Clock className="h-3 w-3 inline mr-1" />
                                {interaction.duration} minutes
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No interactions logged for this client.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="emails">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Email Communications</CardTitle>
                    <CardDescription className="text-gray-400">Email correspondence with this client</CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowEmailComposer(true)}
                    className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                  >
                    <Plus className="mr-2 h-4 w-4" /> Compose Email
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#001428] border border-[#4ecdc4]/20 rounded-md overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-3 h-[500px]">
                      {!selectedThreadId ? (
                        <>
                          <div className="md:col-span-1">
                            <EmailSidebar
                              clientId={client.id}
                              onSelectThread={setSelectedThreadId}
                              onComposeNew={() => setShowEmailComposer(true)}
                            />
                          </div>
                          <div className="hidden md:block md:col-span-2 border-l border-[#4ecdc4]/20">
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                              <Mail className="h-16 w-16 mb-4 opacity-30" />
                              <h3 className="text-xl font-medium text-white mb-2">No email selected</h3>
                              <p className="text-center max-w-md">
                                Select an email from the sidebar to view it here, or compose a new message to this
                                client.
                              </p>
                              <Button
                                onClick={() => setShowEmailComposer(true)}
                                className="mt-6 bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
                              >
                                Compose New Email
                              </Button>
                            </div>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="hidden md:block md:col-span-1">
                            <EmailSidebar
                              clientId={client.id}
                              onSelectThread={setSelectedThreadId}
                              onComposeNew={() => setShowEmailComposer(true)}
                            />
                          </div>
                          <div className="col-span-1 md:col-span-2 border-l border-[#4ecdc4]/20">
                            <EmailThreadView threadId={selectedThreadId} onBack={() => setSelectedThreadId(null)} />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="notes">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader>
                  <CardTitle className="text-white">Notes</CardTitle>
                  <CardDescription className="text-gray-400">Additional information about this client</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 rounded-md bg-[#002a42] border border-[#4ecdc4]/10">
                    <p className="text-gray-300">{client.notes || "No notes have been added for this client."}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <EmailComposer
        isOpen={showEmailComposer}
        onClose={() => setShowEmailComposer(false)}
        onSent={() => {
          setShowEmailComposer(false)
          // Refresh the email list if needed
        }}
        client={client}
        contacts={client.contacts}
      />
    </div>
  )
}
