import { type NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import {
  architectureSchema,
  POINTS_MAP,
  HOURS_PER_POINT,
  QA_PERCENTAGE,
  CONTINGENCY_PERCENTAGE,
  BLUEPRINT_FEE,
  EXTRA_CONSULTATION_FEE,
} from "@/lib/architecture-schema"

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate the request body
    const body = await req.json()
    const validatedData = architectureSchema.parse(body)

    // Calculate story points for MVP features
    const mvpPoints = validatedData.mvpFeatures.reduce((total, feature) => {
      const complexity = feature.complexity as keyof typeof POINTS_MAP
      return total + (POINTS_MAP[complexity] || 0)
    }, 0)

    // Calculate story points for future features
    const futurePoints = validatedData.futureFeatures.reduce((total, feature) => {
      const complexity = feature.complexity as keyof typeof POINTS_MAP
      return total + (POINTS_MAP[complexity] || 0)
    }, 0)

    // Calculate hours
    const mvpHours = mvpPoints * HOURS_PER_POINT
    const qaHours = mvpHours * QA_PERCENTAGE
    const contingencyHours = mvpHours * CONTINGENCY_PERCENTAGE
    const totalMvpHours = mvpHours + qaHours + contingencyHours

    const futureHours = futurePoints * HOURS_PER_POINT * (1 + QA_PERCENTAGE + CONTINGENCY_PERCENTAGE)

    // Calculate costs (using a rough hourly rate of $150 AUD)
    const hourlyRate = 150
    const mvpCost = totalMvpHours * hourlyRate
    const futureCost = futureHours * hourlyRate

    // Create roadmap buckets
    const roadmap = {
      projectId: `ARCH-${Date.now().toString(36)}`,
      totalPoints: mvpPoints + futurePoints,
      totalHours: totalMvpHours + futureHours,
      mvp: {
        points: mvpPoints,
        hours: totalMvpHours,
        estimatedCost: mvpCost,
        features: validatedData.mvpFeatures.map((feature) => ({
          ...feature,
          points: POINTS_MAP[feature.complexity as keyof typeof POINTS_MAP] || 0,
          hours: (POINTS_MAP[feature.complexity as keyof typeof POINTS_MAP] || 0) * HOURS_PER_POINT,
        })),
      },
      future: {
        points: futurePoints,
        hours: futureHours,
        estimatedCost: futureCost,
        features: validatedData.futureFeatures.map((feature) => ({
          ...feature,
          points: POINTS_MAP[feature.complexity as keyof typeof POINTS_MAP] || 0,
          hours: (POINTS_MAP[feature.complexity as keyof typeof POINTS_MAP] || 0) * HOURS_PER_POINT,
        })),
      },
      integrations: validatedData.integrations,
    }

    // Blueprint pricing
    const blueprintPricing = {
      blueprintFee: BLUEPRINT_FEE,
      extraConsultationFee: EXTRA_CONSULTATION_FEE,
    }

    // Reality check
    let realityCheck = null
    if (validatedData.budget > 0 && mvpCost > validatedData.budget) {
      const overage = ((mvpCost - validatedData.budget) / validatedData.budget) * 100

      if (overage > 50) {
        realityCheck = `Your MVP scope exceeds your budget by more than ${Math.round(overage)}%. Consider reducing scope or increasing budget.`
      } else if (overage > 20) {
        realityCheck = `Your MVP scope exceeds your budget by about ${Math.round(overage)}%. Some adjustments may be needed.`
      } else {
        realityCheck = `Your MVP scope slightly exceeds your budget by about ${Math.round(overage)}%. Minor adjustments may be needed.`
      }
    }

    // In a real application, you would save this to your database
    // associate
    return NextResponse.json({ roadmap, blueprintPricing, realityCheck }, { status: 200 })
  } catch (error) {
    console.error("Error processing architecture request:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
