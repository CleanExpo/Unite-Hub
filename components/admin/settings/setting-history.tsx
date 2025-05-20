"use client"

import { useState, useEffect } from "react"
import { getSettingHistory } from "@/lib/settings"
import type { SettingHistory } from "@/types/settings"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { History } from "lucide-react"
import { format } from "date-fns"

interface SettingHistoryProps {
  settingKey: string
  settingLabel: string
}

export function SettingHistoryDialog({ settingKey, settingLabel }: SettingHistoryProps) {
  const [history, setHistory] = useState<SettingHistory[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadHistory = async () => {
    if (!open) return

    setIsLoading(true)
    try {
      const historyData = await getSettingHistory(settingKey)
      setHistory(historyData)
    } catch (error) {
      console.error("Error loading setting history:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadHistory()
  }, [open])

  const formatValue = (value: any) => {
    if (value === null || value === undefined) return "null"

    try {
      if (typeof value === "string" && (value.startsWith("{") || value.startsWith("["))) {
        return JSON.stringify(JSON.parse(value), null, 2)
      }
      return JSON.stringify(value, null, 2)
    } catch {
      return String(value)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>History for {settingLabel}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2">Loading history...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.length === 0 ? (
              <p className="text-center py-4">No history found for this setting.</p>
            ) : (
              history.map((item) => (
                <div key={item.id} className="border rounded-md p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">Changed by: {item.changed_by || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{format(new Date(item.changed_at), "PPpp")}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Previous Value:</p>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{formatValue(item.old_value)}</pre>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">New Value:</p>
                      <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">{formatValue(item.new_value)}</pre>
                    </div>
                  </div>

                  {(item.ip_address || item.user_agent) && (
                    <div className="mt-2 text-xs text-muted-foreground">
                      {item.ip_address && <p>IP: {item.ip_address}</p>}
                      {item.user_agent && <p>User Agent: {item.user_agent}</p>}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
