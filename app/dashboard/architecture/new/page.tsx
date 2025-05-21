"use client"

import { ArchitectureCaptureForm } from "@/components/ArchitectureCaptureForm"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function NewArchitecturePage() {
  return (
    <div className="container py-8">
      <div className="flex items-center gap-2 mb-8">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard/architecture">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">New Architecture Blueprint</h1>
      </div>

      <ArchitectureCaptureForm />
    </div>
  )
}
