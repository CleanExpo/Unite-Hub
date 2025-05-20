import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({ message: "Services endpoint" })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      name,
      description,
      price,
      imageUrl,
      mouldType,
      centreType,
      colourPalette,
      organisationName,
      customiseOptions,
      optimisePerformance,
      programmeSchedule,
      fibreMaterial,
    } = body

    // Perform validation (example)
    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    // Simulate saving to a database (replace with actual database logic)
    const service = {
      name,
      description,
      price,
      imageUrl,
      mouldType,
      centreType,
      colourPalette,
      organisationName,
      customiseOptions,
      optimisePerformance,
      programmeSchedule,
      fibreMaterial,
    }

    console.log("Service created:", service)

    return NextResponse.json(service)
  } catch (error) {
    console.error("Error creating service:", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}
