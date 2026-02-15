"use client"

import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Eye, Users } from "lucide-react"
import type { Document } from "@/lib/types"

const statusStyles: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  sent: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-muted text-muted-foreground",
}

function getEffectiveStatus(doc: Document & { signers?: { id: string; status: string }[] }): string {
  const signers = doc.signers || []
  const signedCount = signers.filter((s) => s.status === "signed").length
  // If all signers signed but DB status is still 'sent', treat as completed
  if (doc.status === "sent" && signers.length > 0 && signedCount === signers.length) {
    return "completed"
  }
  return doc.status
}

export function DashboardDocumentList({ documents }: { documents: (Document & { signers?: { id: string; status: string }[] })[] }) {
  if (documents.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <FileText className="h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-medium text-foreground">No documents yet</h3>
          <p className="mt-1 text-sm text-muted-foreground">Upload your first PDF to get started.</p>
          <Link href="/dashboard/documents/new" className="mt-4">
            <Button>Create Document</Button>
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {documents.map((doc) => {
        const signedCount = doc.signers?.filter((s) => s.status === "signed").length || 0
        const totalSigners = doc.signers?.length || 0
        return (
          <Link key={doc.id} href={`/dashboard/documents/${doc.id}`}>
            <Card className="transition-colors hover:bg-accent/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium text-foreground">{doc.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(doc.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {totalSigners > 0 && (
                    <div className="hidden items-center gap-1 text-sm text-muted-foreground sm:flex">
                      <Users className="h-4 w-4" />
                      <span>{signedCount}/{totalSigners} signed</span>
                    </div>
                  )}
                  <Badge variant="secondary" className={statusStyles[getEffectiveStatus(doc)] || ""}>
                    {getEffectiveStatus(doc)}
                  </Badge>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div >
  )
}
