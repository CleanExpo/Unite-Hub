import { supabase } from "./supabase"
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns"
import type { OpportunityWithDetails, PipelineStage } from "@/types/crm"

// Get pipeline value by stage
export async function getPipelineValueByStage() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      value,
      stage:pipeline_stages(id, name, color)
    `,
    )
    .not("stage", "is", null)

  if (error) {
    console.error("Error fetching pipeline value by stage:", error)
    throw error
  }

  // Group and sum values by stage
  const valueByStage = data.reduce((acc: Record<string, number>, opportunity) => {
    if (!opportunity.stage) return acc
    const stageName = opportunity.stage.name
    const value = opportunity.value || 0

    if (!acc[stageName]) {
      acc[stageName] = 0
    }

    acc[stageName] += value
    return acc
  }, {})

  // Format for chart display
  return Object.entries(valueByStage).map(([stage, value]) => ({
    stage,
    value,
  }))
}

// Get opportunity count by stage
export async function getOpportunityCountByStage() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      stage:pipeline_stages(id, name, color)
    `,
    )
    .not("stage", "is", null)

  if (error) {
    console.error("Error fetching opportunity count by stage:", error)
    throw error
  }

  // Group and count by stage
  const countByStage = data.reduce((acc: Record<string, number>, opportunity) => {
    if (!opportunity.stage) return acc
    const stageName = opportunity.stage.name

    if (!acc[stageName]) {
      acc[stageName] = 0
    }

    acc[stageName] += 1
    return acc
  }, {})

  // Format for chart display
  return Object.entries(countByStage).map(([stage, count]) => ({
    stage,
    count,
  }))
}

// Calculate conversion rates between stages
export async function getStageConversionRates(opportunities: OpportunityWithDetails[], stages: PipelineStage[]) {
  // Sort stages by display order
  const sortedStages = [...stages].sort((a, b) => a.display_order - b.display_order)

  // Initialize conversion rates array
  const conversionRates = []

  // Calculate conversion rates between consecutive stages
  for (let i = 0; i < sortedStages.length - 1; i++) {
    const currentStage = sortedStages[i]
    const nextStage = sortedStages[i + 1]

    // Skip "Closed Lost" calculations
    if (currentStage.name === "Closed Lost" || nextStage.name === "Closed Lost") {
      continue
    }

    const currentStageCount = opportunities.filter((opp) => opp.stage?.id === currentStage.id).length
    const nextStageCount = opportunities.filter((opp) => opp.stage?.id === nextStage.id).length

    // Only calculate if there are opportunities in the current stage
    if (currentStageCount > 0) {
      // For the last stage (Closed Won), we calculate against all opportunities
      const conversionRate =
        nextStage.name === "Closed Won"
          ? (nextStageCount / opportunities.length) * 100
          : (nextStageCount / currentStageCount) * 100

      conversionRates.push({
        from: currentStage.name,
        to: nextStage.name,
        rate: Math.round(conversionRate * 10) / 10, // Round to 1 decimal place
      })
    }
  }

  return conversionRates
}

// Get win rate
export async function getWinRate() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      stage:pipeline_stages(name)
    `,
    )
    .not("stage", "is", null)

  if (error) {
    console.error("Error fetching win rate:", error)
    throw error
  }

  const totalOpportunities = data.length
  const closedWon = data.filter((opp) => opp.stage?.name === "Closed Won").length

  return totalOpportunities > 0 ? (closedWon / totalOpportunities) * 100 : 0
}

// Get average deal size
export async function getAverageDealSize() {
  const { data, error } = await supabase.from("opportunities").select("value").not("value", "is", null)

  if (error) {
    console.error("Error fetching average deal size:", error)
    throw error
  }

  const totalValue = data.reduce((sum, opp) => sum + (opp.value || 0), 0)

  return data.length > 0 ? totalValue / data.length : 0
}

// Get monthly pipeline value for the last 6 months
export async function getMonthlyPipelineValue() {
  const now = new Date()
  const months = []

  // Generate the last 6 months
  for (let i = 0; i < 6; i++) {
    const month = subMonths(now, i)
    months.unshift({
      start: startOfMonth(month).toISOString(),
      end: endOfMonth(month).toISOString(),
      label: format(month, "MMM yyyy"),
    })
  }

  // Fetch all opportunities created in the last 6 months
  const { data, error } = await supabase
    .from("opportunities")
    .select("value, created_at")
    .gte("created_at", months[0].start)
    .lte("created_at", months[months.length - 1].end)

  if (error) {
    console.error("Error fetching monthly pipeline value:", error)
    throw error
  }

  // Group by month and sum values
  const monthlyValues = months.map((month) => {
    const monthOpportunities = data.filter((opp) => {
      const createdAt = parseISO(opp.created_at)
      return createdAt >= parseISO(month.start) && createdAt <= parseISO(month.end)
    })

    const totalValue = monthOpportunities.reduce((sum, opp) => sum + (opp.value || 0), 0)

    return {
      month: month.label,
      value: totalValue,
    }
  })

  return monthlyValues
}

// Get sales velocity (average days to close)
export async function getSalesVelocity() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      created_at,
      updated_at,
      stage:pipeline_stages(name)
    `,
    )
    .eq("stage.name", "Closed Won")

  if (error) {
    console.error("Error fetching sales velocity:", error)
    throw error
  }

  // Calculate days to close for each won opportunity
  const daysToClose = data.map((opp) => {
    const createdAt = parseISO(opp.created_at)
    const closedAt = parseISO(opp.updated_at)
    const diffTime = Math.abs(closedAt.getTime() - createdAt.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  })

  // Calculate average
  const totalDays = daysToClose.reduce((sum, days) => sum + days, 0)
  return daysToClose.length > 0 ? totalDays / daysToClose.length : 0
}

// Get top performing industries
export async function getTopIndustries() {
  const { data, error } = await supabase
    .from("opportunities")
    .select(
      `
      value,
      client:clients(industry),
      stage:pipeline_stages(name)
    `,
    )
    .eq("stage.name", "Closed Won")
    .not("client.industry", "is", null)

  if (error) {
    console.error("Error fetching top industries:", error)
    throw error
  }

  // Group by industry and sum values
  const industryValues = data.reduce((acc: Record<string, number>, opp) => {
    const industry = opp.client?.industry || "Unknown"
    const value = opp.value || 0

    if (!acc[industry]) {
      acc[industry] = 0
    }

    acc[industry] += value
    return acc
  }, {})

  // Format and sort by value
  return Object.entries(industryValues)
    .map(([industry, value]) => ({ industry, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5) // Top 5
}
