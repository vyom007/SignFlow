import { createClient } from "@/lib/supabase/server"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import Link from "next/link"
import { DashboardDocumentList } from "@/components/dashboard-document-list"

export default async function DocumentsPage() {
  const supabase = await createClient()
  const { data: documents } = await supabase
    .from("documents")
    .select(`
      id,
      title,
      status, 
      created_at, 
      updated_at, 
      is_template, 
      signers (
        id, 
        email, 
        status, 
        sign_order
      )
    `)
    .eq("is_template", false)
    .order("created_at", { ascending: false })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Documents</h1>
          <p className="text-sm text-muted-foreground">All your documents in one place</p>
        </div>
        <Link href="/dashboard/documents/new">
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            New Document
          </Button>
        </Link>
      </div>
      <DashboardDocumentList documents={documents || []} />
    </div>
  )
}
