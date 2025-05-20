"use client"

import type React from "react"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { handleDragOver, handleDragLeave } from "@/lib/dnd-utils"
import { OpportunityCard } from "./opportunity-card"
import type { PipelineStage, OpportunityWithDetails } from "@/types/crm"

interface PipelineColumnProps {
  stage: PipelineStage
  opportunities: OpportunityWithDetails[]
  onOpportunityDrop: (opportunityId: number, stageId: number) => Promise<void>
  onDeleteOpportunity: (opportunityId: number) => void
  onAddOpportunity: (stageId: number) => void
}

export function PipelineColumn({
  stage,
  opportunities,
  onOpportunityDrop,
  onDeleteOpportunity,
  onAddOpportunity,
}: PipelineColumnProps) {
  const [isOver, setIsOver] = useState(false)

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsOver(false)

    // Get the opportunity ID from the drag data
    const data = e.dataTransfer.getData("text/plain")
    if (data.startsWith("opportunity-")) {
      const opportunityId = Number.parseInt(data.replace("opportunity-", ""), 10)
      await onOpportunityDrop(opportunityId, stage.id)
    }
  }

  return (
    <div
      className={`flex flex-col bg-[#00203a] p-3 rounded-md min-w-[320px] w-[320px] h-full transition-colors ${
        isOver ? "bg-[#4ecdc4]/5 border-[#4ecdc4]/40" : ""
      }`}
      onDragOver={(e) => {
        handleDragOver(e)
        setIsOver(true)
      }}
      onDragLeave={(e) => {
        handleDragLeave(e)
        setIsOver(false)
      }}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: stage.color || "#4ecdc4" }} />
          <h3 className="font-semibold text-white">{stage.name}</h3>
        </div>
        <div className="bg-[#001428] text-gray-300 text-xs px-2 py-1 rounded-full">{opportunities.length}</div>
      </div>

      <Button
        variant="ghost"
        className="flex items-center justify-center border border-dashed border-[#4ecdc4]/20 text-[#4ecdc4] hover:bg-[#4ecdc4]/5 py-2 mb-4"
        onClick={() => onAddOpportunity(stage.id)}
      >
        <Plus className="h-4 w-4 mr-1" />
        <span>Add Opportunity</span>
      </Button>

      <div className="overflow-y-auto flex-grow">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.id} opportunity={opportunity} onDelete={onDeleteOpportunity} />
        ))}
      </div>
    </div>
  )
}
