"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Clock, FileText } from "lucide-react"
import type { AuditLog } from "@/lib/types"

interface Props {
  logs: (AuditLog & { signer?: { name: string; email: string } | null })[]
}

export function AuditTrail({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8">
        <Clock className="h-8 w-8 text-muted-foreground/50" />
        <p className="mt-3 text-sm text-muted-foreground">No activity yet</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-3 rounded-md border border-border px-3 py-2.5">
          <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <FileText className="h-3 w-3 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-foreground">
              <span className="font-medium">{log.action}</span>
              {log.signer && (
                <span className="text-muted-foreground"> by {log.signer.name}</span>
              )}
            </p>
            {log.details && <p className="text-xs text-muted-foreground">{log.details}</p>}
            <p className="mt-0.5 text-xs text-muted-foreground">
              {new Date(log.created_at).toLocaleString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
