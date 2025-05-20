"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Protected } from "@/components/auth/protected"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { ClientForm } from "@/components/crm/client-form"
import { getClients, getPipelineStages, getOpportunities } from "@/lib/crm"
import type { Client, PipelineStage, OpportunityWithDetails } from "@/types/crm"
import { Building2, Users, PieChart, Search, Plus, Briefcase, BarChart } from "lucide-react"
import Link from "next/link"

export default function CRMDashboardPage() {
  return (
    <Protected>
      <CRMDashboard />
    </Protected>
  )
}

function CRMDashboard() {
  const { user } = useAuth()
  const [clients, setClients] = useState<Client[]>([])
  const [filteredClients, setFilteredClients] = useState<Client[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [showAddClient, setShowAddClient] = useState(false)
  const [pipelineStages, setPipelineStages] = useState<PipelineStage[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityWithDetails[]>([])

  useEffect(() => {
    async function loadData() {
      try {
        const [clientsData, stagesData, opportunitiesData] = await Promise.all([
          getClients(),
          getPipelineStages(),
          getOpportunities(),
        ])
        setClients(clientsData)
        setFilteredClients(clientsData)
        setPipelineStages(stagesData)
        setOpportunities(opportunitiesData)
      } catch (error) {
        console.error("Error loading CRM data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredClients(clients)
    } else {
      const query = searchQuery.toLowerCase()
      setFilteredClients(
        clients.filter((client) => {
          return (
            client.company_name?.toLowerCase().includes(query) ||
            client.industry?.toLowerCase().includes(query) ||
            client.city?.toLowerCase().includes(query) ||
            client.country?.toLowerCase().includes(query)
          )
        }),
      )
    }
  }, [searchQuery, clients])

  const handleClientAdded = (client: Client) => {
    setClients((prev) => [...prev, client])
    setShowAddClient(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-white">CRM Dashboard</h1>
              <p className="text-gray-300 mt-2">Manage your clients and sales pipeline</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-full md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search clients..."
                  className="pl-9 bg-[#001428] border-[#4ecdc4]/20 text-white"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                onClick={() => setShowAddClient(!showAddClient)}
                className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
              >
                <Plus className="mr-2 h-4 w-4" /> Add Client
              </Button>
            </div>
          </div>

          {showAddClient && (
            <div className="mb-8">
              <ClientForm onSuccess={handleClientAdded} />
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-[#001428] border-[#4ecdc4]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <Building2 className="mr-2 h-5 w-5 text-[#4ecdc4]" />
                  Clients
                </CardTitle>
                <CardDescription className="text-gray-400">Total clients</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{clients.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#001428] border-[#4ecdc4]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5 text-[#4ecdc4]" />
                  Contacts
                </CardTitle>
                <CardDescription className="text-gray-400">Total contacts</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">0</p>
              </CardContent>
            </Card>

            <Card className="bg-[#001428] border-[#4ecdc4]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <Briefcase className="mr-2 h-5 w-5 text-[#4ecdc4]" />
                  Opportunities
                </CardTitle>
                <CardDescription className="text-gray-400">Active deals</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">{opportunities.length}</p>
              </CardContent>
            </Card>

            <Card className="bg-[#001428] border-[#4ecdc4]/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-white flex items-center">
                  <PieChart className="mr-2 h-5 w-5 text-[#4ecdc4]" />
                  Pipeline Value
                </CardTitle>
                <CardDescription className="text-gray-400">Total opportunity value</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-white">
                  ${opportunities.reduce((sum, opp) => sum + (opp.value || 0), 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="clients" className="w-full">
            <TabsList className="bg-[#001428] border-[#4ecdc4]/20 mb-6">
              <TabsTrigger
                value="clients"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Clients
              </TabsTrigger>
              <TabsTrigger
                value="pipeline"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                <Link href="/dashboard/crm/pipeline" className="w-full flex">
                  Sales Pipeline
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                <Link href="/dashboard/crm/analytics" className="w-full flex">
                  <BarChart className="mr-2 h-4 w-4" />
                  Analytics
                </Link>
              </TabsTrigger>
              <TabsTrigger
                value="tasks"
                className="data-[state=active]:bg-[#4ecdc4]/10 data-[state=active]:text-[#4ecdc4]"
              >
                Tasks
              </TabsTrigger>
            </TabsList>
            <TabsContent value="clients">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader>
                  <CardTitle className="text-white">Client List</CardTitle>
                  <CardDescription className="text-gray-400">Manage your clients and their information</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
                    </div>
                  ) : filteredClients.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#4ecdc4]/10">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Company</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Industry</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Location</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Website</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredClients.map((client) => (
                            <tr key={client.id} className="border-b border-[#4ecdc4]/10 hover:bg-[#4ecdc4]/5">
                              <td className="py-3 px-4 text-white">{client.company_name}</td>
                              <td className="py-3 px-4 text-gray-300">{client.industry || "-"}</td>
                              <td className="py-3 px-4 text-gray-300">
                                {[client.city, client.country].filter(Boolean).join(", ") || "-"}
                              </td>
                              <td className="py-3 px-4 text-gray-300">
                                {client.website ? (
                                  <a
                                    href={client.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#4ecdc4] hover:underline"
                                  >
                                    {client.website.replace(/^https?:\/\//, "")}
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                              <td className="py-3 px-4 text-right">
                                <Link href={`/dashboard/crm/clients/${client.id}`}>
                                  <Button variant="ghost" size="sm" className="text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">No clients found. Add your first client to get started.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="pipeline">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader>
                  <CardTitle className="text-white">Sales Pipeline</CardTitle>
                  <CardDescription className="text-gray-400">Track your deals and opportunities</CardDescription>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
                    </div>
                  ) : opportunities.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-[#4ecdc4]/10">
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Opportunity</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Client</th>
                            <th className="text-left py-3 px-4 text-sm font-medium text-gray-300">Stage</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Value</th>
                            <th className="text-right py-3 px-4 text-sm font-medium text-gray-300">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {opportunities.map((opportunity) => (
                            <tr key={opportunity.id} className="border-b border-[#4ecdc4]/10 hover:bg-[#4ecdc4]/5">
                              <td className="py-3 px-4 text-white">{opportunity.title}</td>
                              <td className="py-3 px-4 text-gray-300">{opportunity.client?.company_name || "-"}</td>
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
                              <td className="py-3 px-4 text-right">
                                <Link href={`/dashboard/crm/opportunities/${opportunity.id}`}>
                                  <Button variant="ghost" size="sm" className="text-[#4ecdc4] hover:bg-[#4ecdc4]/10">
                                    View
                                  </Button>
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-gray-400">
                        No opportunities found. Create your first opportunity to get started.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="analytics">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader>
                  <CardTitle className="text-white">Analytics</CardTitle>
                  <CardDescription className="text-gray-400">View detailed sales analytics and reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-400 mb-4">
                      View detailed analytics and reports about your sales pipeline, conversion rates, and performance
                      metrics.
                    </p>
                    <Link href="/dashboard/crm/analytics">
                      <Button className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]">
                        <BarChart className="mr-2 h-4 w-4" />
                        View Analytics Dashboard
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="tasks">
              <Card className="bg-[#001428] border-[#4ecdc4]/20">
                <CardHeader>
                  <CardTitle className="text-white">Tasks</CardTitle>
                  <CardDescription className="text-gray-400">Manage your follow-ups and to-dos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-400">No tasks found. Create your first task to get started.</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
