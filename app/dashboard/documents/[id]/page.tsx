import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import { DocumentEditor } from "@/components/document-editor"

export default async function DocumentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: document } = await supabase
    .from("documents")
    .select("*, signers(*), signature_fields(*)")
    .eq("id", id)
    .single()

  if (!document) notFound()

  const { data: auditLogs } = await supabase
    .from("audit_logs")
    .select("*, signer:signers(name, email)")
    .eq("document_id", id)
    .order("created_at", { ascending: false })

  return <DocumentEditor document={document} auditLogs={auditLogs || []} />
}
