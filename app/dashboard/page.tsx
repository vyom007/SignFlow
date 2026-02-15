import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, Clock, CheckCircle2, XCircle, Plus } from "lucide-react"
import Link from "next/link"
import { DashboardDocumentList } from "@/components/dashboard-document-list"

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, status, created_at, updated_at, is_template, signers(id, name, email, status, sign_order)")
    .eq("is_template", false)
    .order("created_at", { ascending: false })

  const docs = (documents || []).map((d: any) => {
    const signers = d.signers || []
    const signedCount = signers.filter((s: any) => s.status === "signed").length
    // Compute effective status: if all signers signed but DB says 'sent', treat as completed
    const effectiveStatus = d.status === "sent" && signers.length > 0 && signedCount === signers.length
      ? "completed"
      : d.status
    return { ...d, effectiveStatus }
  })
  const draft = docs.filter((d: any) => d.effectiveStatus === "draft").length
  const sent = docs.filter((d: any) => d.effectiveStatus === "sent").length
  const completed = docs.filter((d: any) => d.effectiveStatus === "completed").length
  const declined = docs.filter((d: any) => d.effectiveStatus === "declined").length

  const stats = [
    { label: "Draft", value: draft, icon: FileText, color: "text-muted-foreground" },
    { label: "Awaiting", value: sent, icon: Clock, color: "text-amber-600" },
    { label: "Completed", value: completed, icon: CheckCircle2, color: "text-emerald-600" },
    { label: "Declined", value: declined, icon: XCircle, color: "text-destructive" },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your documents and track signatures</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
              <stat.icon className={cn("h-4 w-4", stat.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">All Documents</h2>
        <DashboardDocumentList documents={docs} />
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ")
}
