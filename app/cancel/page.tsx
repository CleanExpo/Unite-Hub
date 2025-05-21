"use client"

import { useSearchParams } from "next/navigation"
import { AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function CancelPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("project_id")

  return (
    <div className="container max-w-3xl py-12">
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-amber-100 p-2">
              <AlertCircle className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
              <CardDescription>Your architecture blueprint payment was not completed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="mb-4">
            You've cancelled the payment process for your architecture blueprint. Don't worry - your project information
            is still saved and you can complete the payment whenever you're ready.
          </p>
          <div className="rounded-md bg-amber-50 p-4 border border-amber-100">
            <h3 className="font-medium text-amber-800 mb-2">Why get an architecture blueprint?</h3>
            <ul className="space-y-2 text-sm text-amber-800">
              <li>• Detailed technical roadmap for your project</li>
              <li>• Clear cost and timeline estimates</li>
              <li>• Identification of potential risks and challenges</li>
              <li>• Expert consultation on technology choices</li>
              <li>• Prioritized feature development plan</li>
            </ul>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href={projectId ? `/checkout/resume?project_id=${projectId}` : "/architecture"}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Resume Payment
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Return to Home</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
