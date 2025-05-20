"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getWinRate, getAverageDealSize, getSalesVelocity } from "@/lib/crm-analytics"
import { Trophy, DollarSign, Clock } from "lucide-react"

export function MetricsCards() {
  const [winRate, setWinRate] = useState<number | null>(null)
  const [avgDealSize, setAvgDealSize] = useState<number | null>(null)
  const [salesVelocity, setSalesVelocity] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [winRateData, avgDealSizeData, salesVelocityData] = await Promise.all([
          getWinRate(),
          getAverageDealSize(),
          getSalesVelocity(),
        ])

        setWinRate(winRateData)
        setAvgDealSize(avgDealSizeData)
        setSalesVelocity(salesVelocityData)
      } catch (err) {
        console.error("Error fetching metrics data:", err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card className="bg-[#001428] border-[#4ecdc4]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center text-lg">
            <Trophy className="mr-2 h-5 w-5 text-[#F59E0B]" />
            Win Rate
          </CardTitle>
          <CardDescription className="text-gray-400">Percentage of opportunities won</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 rounded-full border-2 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
            </div>
          ) : (
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">{winRate !== null ? Math.round(winRate) : 0}%</p>
              <p className="ml-2 text-sm text-gray-400">of total opportunities</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#001428] border-[#4ecdc4]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center text-lg">
            <DollarSign className="mr-2 h-5 w-5 text-[#10B981]" />
            Average Deal Size
          </CardTitle>
          <CardDescription className="text-gray-400">Average value per opportunity</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 rounded-full border-2 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
            </div>
          ) : (
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">
                {avgDealSize !== null ? formatCurrency(avgDealSize) : "$0"}
              </p>
              <p className="ml-2 text-sm text-gray-400">per deal</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-[#001428] border-[#4ecdc4]/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-white flex items-center text-lg">
            <Clock className="mr-2 h-5 w-5 text-[#8B5CF6]" />
            Sales Velocity
          </CardTitle>
          <CardDescription className="text-gray-400">Average days to close a deal</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-2">
              <div className="w-5 h-5 rounded-full border-2 border-[#4ecdc4]/20 border-t-[#4ecdc4] animate-spin"></div>
            </div>
          ) : (
            <div className="flex items-baseline">
              <p className="text-3xl font-bold text-white">{salesVelocity !== null ? Math.round(salesVelocity) : 0}</p>
              <p className="ml-2 text-sm text-gray-400">days</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
