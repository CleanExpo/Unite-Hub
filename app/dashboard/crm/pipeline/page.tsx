"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { Protected } from "@/components/auth/protected"
import { Button } from "@/components/ui/button"
import { PipelineColumn } from "@/components/crm/kanban/pipeline-column"
import { AddOpportunityModal } from "@/components/crm/kanban/add-opportunity-modal"
import { getPipelineStages, getOpportunities, updateOpportunity, deleteOpportunity } from "@/lib/crm"
import type { PipelineStage, OpportunityWithDetails, Opportunity } from "@/types/crm"
import { TrendingUp, Plus, RefreshCw } from "lucide-react"

export default function PipelinePage() {
  return (
    <Protected>
      <PipelineBoard />
    </Protected>
  )
}

function PipelineBoard() {
  const router = useRouter()
  const { user } = useAuth()
  const [stages, setStages] = useState<PipelineStage[]>([])
  const [opportunities, setOpportunities] = useState<OpportunityWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [selectedStageId, setSelectedStageId] = useState<number | undefined>(undefined)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  // Load pipeline stages and opportunities
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [stagesData, opportunitiesData] = await Promise.all([getPipelineStages(), getOpportunities()])
      setStages(stagesData)
      setOpportunities(opportunitiesData)
    } catch (error) {
      console.error("Error loading pipeline data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  // Refresh data
  const handleRefresh = async () => {
    setIsRefreshing(true)
    await loadData()
    setTimeout(() => setIsRefreshing(false), 500) // Show refresh animation for at least 500ms
  }

  // Handle opportunity drag and drop
  const handleOpportunityDrop = async (opportunityId: number, newStageId: number) => {
    try {
      // Find the opportunity to update
      const opportunity = opportunities.find((o) => o.id === opportunityId)
      if (!opportunity) return

      // Update locally first for immediate UI feedback
      setOpportunities((prev) =>
        prev.map((o) =>
          o.id === opportunityId
            ? { ...o, stage_id: newStageId, stage: stages.find((s) => s.id === newStageId) || null }
            : o,
        ),
      )

      // Update in the database
      await updateOpportunity(opportunityId, { stage_id: newStageId })
    } catch (error) {
      console.error("Error updating opportunity stage:", error)
      // If error, reload data to ensure UI is in sync with database
      loadData()
    }
  }

  // Handle opportunity deletion
  const handleDeleteOpportunity = async (opportunityId: number) => {
    if (!confirm("Are you sure you want to delete this opportunity?")) return

    try {
      // Delete locally first for immediate UI feedback
      setOpportunities((prev) => prev.filter((o) => o.id !== opportunityId))

      // Delete from the database
      await deleteOpportunity(opportunityId)
    } catch (error) {
      console.error("Error deleting opportunity:", error)
      // If error, reload data to ensure UI is in sync with database
      loadData()
    }
  }

  // Handle adding a new opportunity
  const handleAddOpportunity = (stageId: number) => {
    setSelectedStageId(stageId)
    setIsAddModalOpen(true)
  }

  // Handle successful opportunity creation
  const handleOpportunityCreated = async (newOpportunity: Opportunity) => {
    // Reload all opportunities to get the full details with relationships
    await loadData()
  }

  // Group opportunities by stage
  const getOpportunitiesByStage = (stageId: number) => {
    return opportunities.filter((o) => o.stage_id === stageId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
        <div className="container px-4 md:px-6 mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="w-8 h-8 rounded-full border-4 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001428] to-[#00253e] py-12">
      <div className="container px-4 md:px-6 mx-auto">
        <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center">
              <TrendingUp className="mr-2 h-8 w-8 text-[#4ecdc4]" />
              Sales Pipeline
            </h1>
            <p className="text-gray-300 mt-2">Drag and drop opportunities to change their stage</p>
          </div>
          <div className="flex items-center gap-4">
            <Button
              onClick={handleRefresh}
              variant="outline"
              className="border-[#4ecdc4]/20 text-white hover:bg-[#4ecdc4]/5"
              disabled={isRefreshing}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              onClick={() => {
                setSelectedStageId(undefined)
                setIsAddModalOpen(true)
              }}
              className="bg-[#4ecdc4] hover:bg-[#4ecdc4]/90 text-[#001428]"
            >
              <Plus className="mr-2 h-4 w-4" /> Add Opportunity
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="flex space-x-4 py-4 min-w-max">
            {stages.map((stage) => (
              <PipelineColumn
                key={stage.id}
                stage={stage}
                opportunities={getOpportunitiesByStage(stage.id)}
                onOpportunityDrop={handleOpportunityDrop}
                onDeleteOpportunity={handleDeleteOpportunity}
                onAddOpportunity={handleAddOpportunity}
              />
            ))}
          </div>
        </div>
      </div>

      <AddOpportunityModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleOpportunityCreated}
        initialStageId={selectedStageId}
      />
    </div>
  )
}
