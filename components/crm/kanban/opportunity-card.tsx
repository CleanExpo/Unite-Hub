"use client"

import { useState } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { MoreHorizontal, Calendar, DollarSign, CheckCircle, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { handleDragStart, handleDragEnd } from "@/lib/dnd-utils"
import type { OpportunityWithDetails } from "@/types/crm"

interface OpportunityCardProps {
  opportunity: OpportunityWithDetails
  onDelete: (id: number) => void
}

export function OpportunityCard({ opportunity, onDelete }: OpportunityCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  // Format the data for display
  const client = opportunity.client?.company_name || "No Client"
  const value = opportunity.value ? `$${opportunity.value.toLocaleString()}` : "Not specified"
  const probability = opportunity.probability ? `${opportunity.probability}%` : "Not specified"
  const closeDate = opportunity.expected_close_date
    ? format(new Date(opportunity.expected_close_date), "MMM d, yyyy")
    : "Not specified"

  return (
    <div
      draggable
      onDragStart={(e) => handleDragStart(e, `opportunity-${opportunity.id}`)}
      onDragEnd={handleDragEnd}
      className="bg-[#001428] border border-[#4ecdc4]/20 p-4 rounded-md shadow-sm mb-3 cursor-grab hover:border-[#4ecdc4]/40 transition-colors group"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-medium text-white truncate">{opportunity.title}</h3>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 text-gray-400 hover:text-white">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[#001428] border-[#4ecdc4]/20">
            <DropdownMenuLabel className="text-gray-200">Actions</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#4ecdc4]/10" />
            <DropdownMenuItem className="text-gray-200 hover:bg-[#4ecdc4]/10 cursor-pointer">
              <Link href={`/dashboard/crm/opportunities/${opportunity.id}`} className="flex w-full">
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="text-gray-200 hover:bg-[#4ecdc4]/10 cursor-pointer">
              Edit Opportunity
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-[#4ecdc4]/10" />
            <DropdownMenuItem
              className="text-red-500 hover:bg-red-500/10 cursor-pointer"
              onClick={() => onDelete(opportunity.id)}
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-sm text-gray-300 mb-2 truncate">{client}</div>

      <div className="flex justify-between mb-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-[#4ecdc4]">
                <DollarSign className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">{value}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#001428] border-[#4ecdc4]/20 text-gray-200">
              <p>Opportunity Value</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center text-gray-300">
                <CheckCircle className="h-3.5 w-3.5 mr-1" />
                <span className="text-xs">{probability}</span>
              </div>
            </TooltipTrigger>
            <TooltipContent className="bg-[#001428] border-[#4ecdc4]/20 text-gray-200">
              <p>Probability of Closing</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-[#4ecdc4]/10 text-xs text-gray-300 space-y-2">
          <div className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-2 text-[#4ecdc4]" />
            <span>Expected close: {closeDate}</span>
          </div>
          {opportunity.primary_contact && (
            <div className="flex items-center">
              <Users className="h-3.5 w-3.5 mr-2 text-[#4ecdc4]" />
              <span>
                Contact: {opportunity.primary_contact.first_name} {opportunity.primary_contact.last_name}
              </span>
            </div>
          )}
          {opportunity.description && <div className="text-gray-400 mt-2">{opportunity.description}</div>}
        </div>
      )}

      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="mt-2 text-xs text-[#4ecdc4] hover:text-[#4ecdc4]/80"
      >
        {isExpanded ? "Show less" : "Show more"}
      </button>
    </div>
  )
}
