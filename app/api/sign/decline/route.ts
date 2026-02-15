import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { token, reason } = await request.json()
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

    const supabase = await createClient()
    const { data: signer } = await supabase
      .from("signers")
      .select("*")
      .eq("token", token)
      .single()

    if (!signer) return NextResponse.json({ error: "Invalid token" }, { status: 404 })

    // Mark signer as declined
    await supabase.from("signers").update({ status: "declined" }).eq("id", signer.id)

    // Mark document as declined
    await supabase.from("documents").update({
      status: "declined",
      updated_at: new Date().toISOString(),
    }).eq("id", signer.document_id)

    // Audit log
    await supabase.from("audit_logs").insert({
      document_id: signer.document_id,
      signer_id: signer.id,
      action: "Document declined",
      details: `${signer.name} (${signer.email}) declined to sign${reason ? `: ${reason}` : ""}`,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
