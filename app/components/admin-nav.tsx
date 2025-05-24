import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Database, FileText, Server } from "lucide-react"

export function AdminNav() {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/setup-database">
          <Database className="mr-2 h-4 w-4" />
          Setup Database
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/test-database">
          <Server className="mr-2 h-4 w-4" />
          Test Database
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href="/admin/test-pdf-export">
          <FileText className="mr-2 h-4 w-4" />
          Test PDF Export
        </Link>
      </Button>
    </div>
  )
}
