import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { after } from "next/server"

// Set a longer timeout for this route since ML prediction can take time
export const maxDuration = 60 // 60 seconds

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const historyDays = Number.parseInt(searchParams.get("historyDays") || "90", 10)
    const forecastDays = Number.parseInt(searchParams.get("forecastDays") || "30", 10)

    // Validate parameters
    if (isNaN(historyDays) || historyDays < 14 || historyDays > 365) {
      return NextResponse.json({ error: "historyDays must be between 14 and 365" }, { status: 400 })
    }

    if (isNaN(forecastDays) || forecastDays < 7 || forecastDays > 90) {
      return NextResponse.json({ error: "forecastDays must be between 7 and 90" }, { status: 400 })
    }

    const supabase = createClient()

    // Get historical data for training
    const { data: historicalData, error: historicalError } = await supabase.rpc("get_daily_error_counts", {
      start_date: new Date(Date.now() - historyDays * 86400000).toISOString(),
      end_date: new Date().toISOString(),
    })

    if (historicalError) {
      console.error("Error fetching historical data:", historicalError)
      return NextResponse.json({ error: "Failed to fetch historical data" }, { status: 500 })
    }

    // Check if we have enough data
    if (!historicalData || historicalData.length < 14) {
      return NextResponse.json(
        { error: "Insufficient historical data for prediction (need at least 14 data points)" },
        { status: 400 },
      )
    }

    // Use a simple forecasting algorithm for predictions
    // In a real implementation, you would call the ML model here
    const predictions = generateSimpleForecast(historicalData, forecastDays)

    // Calculate metadata
    const totalPredicted = predictions.reduce((sum, item) => sum + item.predicted, 0)
    const avgDaily = totalPredicted / forecastDays
    const peakDay = predictions.reduce((max, item) => (item.predicted > max.predicted ? item : max), predictions[0])

    // Store the prediction in the database for future reference
    after(async () => {
      try {
        await supabase.from("error_predictions").insert({
          prediction_date: new Date().toISOString(),
          history_days: historyDays,
          forecast_days: forecastDays,
          predictions: predictions,
          metadata: {
            totalPredicted,
            avgDaily,
            peakDay,
          },
        })
      } catch (error) {
        console.error("Failed to store prediction:", error)
      }
    })

    return NextResponse.json({
      predictions,
      metadata: {
        historyDays,
        forecastDays,
        totalPredicted,
        avgDaily,
        peakDay,
      },
    })
  } catch (error) {
    console.error("Error in error prediction:", error)
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}

/**
 * Generates a simple forecast based on historical data
 * This is a placeholder for the actual ML model
 */
function generateSimpleForecast(historicalData: any[], forecastDays: number) {
  // Calculate average daily errors and standard deviation
  const dailyCounts = historicalData.map((item) => item.total_count)
  const avgErrors = dailyCounts.reduce((sum, count) => sum + count, 0) / dailyCounts.length

  // Calculate standard deviation
  const variance = dailyCounts.reduce((sum, count) => sum + Math.pow(count - avgErrors, 2), 0) / dailyCounts.length
  const stdDev = Math.sqrt(variance)

  // Find weekly pattern (if any)
  const dayOfWeekAverages = Array(7).fill(0)
  const dayOfWeekCounts = Array(7).fill(0)

  historicalData.forEach((item) => {
    const date = new Date(item.date)
    const dayOfWeek = date.getDay() // 0 = Sunday, 6 = Saturday
    dayOfWeekAverages[dayOfWeek] += item.total_count
    dayOfWeekCounts[dayOfWeek]++
  })

  // Calculate average for each day of week
  for (let i = 0; i < 7; i++) {
    dayOfWeekAverages[i] = dayOfWeekAverages[i] / (dayOfWeekCounts[i] || 1)
  }

  // Generate predictions
  const predictions = []
  const today = new Date()

  for (let i = 1; i <= forecastDays; i++) {
    const predictionDate = new Date(today)
    predictionDate.setDate(today.getDate() + i)

    const dayOfWeek = predictionDate.getDay()

    // Base prediction on day of week average with some randomness
    const dayAverage = dayOfWeekAverages[dayOfWeek]
    const randomFactor = 0.8 + Math.random() * 0.4 // Random between 0.8 and 1.2

    const predicted = Math.max(0, Math.round(dayAverage * randomFactor))
    const lowerBound = Math.max(0, Math.round(predicted - stdDev / 2))
    const upperBound = Math.round(predicted + stdDev / 2)

    predictions.push({
      date: predictionDate.toISOString().split("T")[0],
      predicted,
      lowerBound,
      upperBound,
    })
  }

  return predictions
}
