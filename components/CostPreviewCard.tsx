"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, DollarSign, Clock } from "lucide-react"
import { POINTS_MAP, HOURS_PER_POINT, QA_PERCENTAGE, CONTINGENCY_PERCENTAGE } from "@/lib/architecture-schema"

interface Feature {
  name: string
  complexity: string
  priority: string
}

interface CostPreviewCardProps {
  features: Feature[]
  budget: number
}

export function CostPreviewCard({ features, budget }: CostPreviewCardProps) {
  // Calculate total points
  const totalPoints = features.reduce((sum, feature) => {
    const complexity = feature.complexity as keyof typeof POINTS_MAP
    return sum + (POINTS_MAP[complexity] || 0)
  }, 0)

  // Calculate hours
  const devHours = totalPoints * HOURS_PER_POINT
  const qaHours = devHours * QA_PERCENTAGE
  const contingencyHours = devHours * CONTINGENCY_PERCENTAGE
  const totalHours = devHours + qaHours + contingencyHours

  // Calculate cost (using a rough hourly rate of $150 AUD)
  const hourlyRate = 150
  const developmentCost = devHours * hourlyRate
  const qaCost = qaHours * hourlyRate
  const contingencyCost = contingencyHours * hourlyRate
  const totalCost = developmentCost + qaCost + contingencyCost

  // Determine if over budget
  const isOverBudget = budget > 0 && totalCost > budget
  const budgetDifference = budget > 0 ? budget - totalCost : 0
  const budgetPercentage = budget > 0 ? (totalCost / budget) * 100 : 0

  return (
    <Card className={isOverBudget ? "border-red-200" : "border-green-200"}>
      <CardHeader className={`pb-2 ${isOverBudget ? "bg-red-50" : "bg-green-50"}`}>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Cost Preview</CardTitle>
            <CardDescription>Estimated development costs</CardDescription>
          </div>
          {budget > 0 && (
            <Badge variant={isOverBudget ? "destructive" : "outline"} className="ml-2">
              {isOverBudget ? "Over Budget" : "Within Budget"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="text-sm text-gray-500">Story Points</div>
              <div className="text-2xl font-bold">{totalPoints}</div>
            </div>
            <div className="space-y-1">
              <div className="text-sm text-gray-500 flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Total Hours
              </div>
              <div className="text-2xl font-bold">{Math.round(totalHours)}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Development ({devHours.toFixed(1)} hrs)</span>
              <span>${developmentCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>
                QA ({qaHours.toFixed(1)} hrs @ {(QA_PERCENTAGE * 100).toFixed(0)}%)
              </span>
              <span>${qaCost.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>
                Contingency ({contingencyHours.toFixed(1)} hrs @ {(CONTINGENCY_PERCENTAGE * 100).toFixed(0)}%)
              </span>
              <span>${contingencyCost.toLocaleString()}</span>
            </div>
            <div className="h-px bg-gray-200 my-2"></div>
            <div className="flex justify-between font-medium">
              <span>Total Estimated Cost</span>
              <span className="flex items-center">
                <DollarSign className="h-4 w-4" />
                {totalCost.toLocaleString()}
              </span>
            </div>
          </div>

          {budget > 0 && (
            <div
              className={`p-3 rounded-md text-sm ${
                isOverBudget ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
              }`}
            >
              <div className="flex items-start gap-2">
                {isOverBudget && <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />}
                <div>
                  <p className="font-medium">
                    {isOverBudget
                      ? `Over budget by $${Math.abs(budgetDifference).toLocaleString()} (${Math.round(
                          budgetPercentage - 100,
                        )}%)`
                      : `Under budget by $${budgetDifference.toLocaleString()} (${Math.round(
                          100 - budgetPercentage,
                        )}%)`}
                  </p>
                  {isOverBudget && (
                    <p className="mt-1">
                      Consider reducing scope or adjusting complexity to align with your budget constraints.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
