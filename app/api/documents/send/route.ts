import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { documentId } = await request.json()

    const { data: doc } = await supabase
      .from("documents")
      .select("*, signers(*)")
      .eq("id", documentId)
      .eq("user_id", user.id)
      .single()

    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 })
    if (doc.status !== "draft") return NextResponse.json({ error: "Document already sent" }, { status: 400 })

    const signers = doc.signers || []
    if (signers.length === 0) return NextResponse.json({ error: "No signers added" }, { status: 400 })

    // Update document status to sent
    await supabase.from("documents").update({ status: "sent", updated_at: new Date().toISOString() }).eq("id", documentId)

    // Update all signers to sent
    await supabase.from("signers").update({ status: "sent" }).eq("document_id", documentId)

    // Build signing links for each signer
    const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/$/, "") || "http://localhost:3000"
    const signingLinks = signers.map((signer: any) => ({
      name: signer.name,
      email: signer.email,
      url: `${origin}/sign/${signer.token}`,
    }))

    // Audit log
    await supabase.from("audit_logs").insert({
      document_id: documentId,
      action: "Document sent for signing",
      details: `Sent to ${signers.length} signer(s): ${signers.map((s: any) => s.email).join(", ")}`,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ success: true, signingLinks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
