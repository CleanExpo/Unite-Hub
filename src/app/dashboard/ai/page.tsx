'use client'

import { Suspense } from 'react'
import { AIDashboard } from '@/components/ai/Dashboard'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'

export default function AIDashboardPage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">AI Monitoring Dashboard</h1>
      
      <Suspense 
        fallback={
          <div className="flex items-center justify-center h-[600px]">
            <Card className="w-full max-w-md">
              <CardContent className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin mr-2" />
                <span className="text-lg">Loading AI dashboard...</span>
              </CardContent>
            </Card>
          </div>
        }
      >
        <AIDashboard />
      </Suspense>
    </div>
  )
}
