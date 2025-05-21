"use client"

import { useEffect, useState } from "react"
import { useSearchParams } from "next/navigation"
import { Check, Calendar, FileText, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const [sessionDetails, setSessionDetails] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSessionDetails() {
      if (!sessionId) {
        setError("No session ID provided")
        setLoading(false)
        return
      }

      try {
        const response = await fetch(`/api/payment/session?id=${sessionId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch session details")
        }
        const data = await response.json()
        setSessionDetails(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchSessionDetails()
  }, [sessionId])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-4 text-lg">Processing your payment...</p>
        </div>
      </div>
    )
  }

  if (error || !sessionDetails) {
    return (
      <div className="container max-w-3xl py-12">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Something went wrong</CardTitle>
            <CardDescription>We couldn't verify your payment</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500">
              {error ||
                "We couldn't find details for your session. Please contact support if you believe this is an error."}
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/">Return to Home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    )
  }

  return (
    <div className="container max-w-3xl py-12">
      <Card className="border-green-100 bg-green-50/50">
        <CardHeader className="border-b border-green-100 bg-green-50">
          <div className="flex items-center space-x-2">
            <div className="rounded-full bg-green-100 p-2">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <CardTitle className="text-2xl">Payment Successful!</CardTitle>
              <CardDescription>Your architecture blueprint has been confirmed</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          <div>
            <h3 className="font-medium text-lg mb-2">What happens next?</h3>
            <ol className="space-y-4">
              <li className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <Calendar className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Consultation Meeting</p>
                  <p className="text-sm text-gray-500">
                    We've scheduled a consultation meeting for you. Check your email for the details and Google Calendar
                    invitation.
                  </p>
                </div>
              </li>
              <li className="flex items-start space-x-3">
                <div className="rounded-full bg-green-100 p-1 mt-0.5">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Blueprint Development</p>
                  <p className="text-sm text-gray-500">
                    After our consultation, we'll develop your detailed architecture blueprint within 5 business days.
                  </p>
                </div>
              </li>
            </ol>
          </div>

          <div className="rounded-md bg-green-100 p-4">
            <p className="text-sm text-green-800">
              <span className="font-medium">Order Reference:</span>{" "}
              {sessionDetails.projectId || sessionId.substring(0, 8)}
            </p>
            <p className="text-sm text-green-800">
              <span className="font-medium">Amount Paid:</span> AU $550.00
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button asChild>
            <Link href="/dashboard/architecture">
              View Your Projects
              <ArrowRight className="ml-2 h-4 w-4" />
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
