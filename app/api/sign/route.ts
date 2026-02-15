import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

  const supabase = await createClient()
  const { data: signer } = await supabase
    .from("signers")
    .select("*, documents(*, signature_fields(*))")
    .eq("token", token)
    .single()

  if (!signer) return NextResponse.json({ error: "Invalid token" }, { status: 404 })

  // Log document viewed
  if (signer.status === "sent") {
    await supabase.from("signers").update({ status: "viewed" }).eq("id", signer.id)
    await supabase.from("audit_logs").insert({
      document_id: signer.document_id,
      signer_id: signer.id,
      action: "Document viewed",
      details: `${signer.name} (${signer.email}) viewed the document`,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })
  }

  return NextResponse.json({ signer, document: signer.documents })
}

export async function POST(request: NextRequest) {
  try {
    const { token, fields } = await request.json()
    if (!token) return NextResponse.json({ error: "Token required" }, { status: 400 })

    const supabase = await createClient()
    const { data: signer } = await supabase
      .from("signers")
      .select("*")
      .eq("token", token)
      .single()

    if (!signer) return NextResponse.json({ error: "Invalid token" }, { status: 404 })
    if (signer.status === "signed") return NextResponse.json({ error: "Already signed" }, { status: 400 })

    // Update field values
    for (const field of fields || []) {
      await supabase.from("signature_fields").update({ value: field.value }).eq("id", field.id)
    }

    // Mark signer as signed
    await supabase.from("signers").update({
      status: "signed",
      signed_at: new Date().toISOString(),
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    }).eq("id", signer.id)

    // Audit log
    await supabase.from("audit_logs").insert({
      document_id: signer.document_id,
      signer_id: signer.id,
      action: "Document signed",
      details: `${signer.name} (${signer.email}) signed the document`,
      ip_address: request.headers.get("x-forwarded-for") || "unknown",
      user_agent: request.headers.get("user-agent") || "unknown",
    })

    // Check if all signers have signed
    const { count, error: countError } = await supabase
      .from("signers")
      .select("*", { count: "exact", head: true })
      .eq("document_id", signer.document_id)
      .neq("status", "signed")

    if (countError) {
      console.error("Error checking signer status:", countError)
    } else {
      console.log(`Document ${signer.document_id}: ${count} signers remaining`)
    }

    if (count === 0) {
      console.log(`Document ${signer.document_id} completed. Updating status...`)

      // Use service role client to bypass RLS for status update
      if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
        console.error("CRITICAL ERROR: SUPABASE_SERVICE_ROLE_KEY is missing in environment variables. Cannot update document status to 'completed'.")
        return NextResponse.json({ success: true, completed: true, warning: "Status update failed due to missing server key" })
      }

      const { createClient: createSupabaseClient } = await import("@supabase/supabase-js")
      const supabaseAdmin = createSupabaseClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      )

      const { data: completedDoc, error: updateError } = await supabaseAdmin
        .from("documents")
        .update({ status: "completed", updated_at: new Date().toISOString() })
        .eq("id", signer.document_id)
        .select()
        .single()

      if (updateError) {
        console.error("Failed to update document status to completed:", updateError)
      } else {
        console.log("Document status updated to completed")
      }

      await supabase.from("audit_logs").insert({
        document_id: signer.document_id,
        action: "Document completed",
        details: "All signers have signed the document",
      })

    }

    return NextResponse.json({ success: true, completed: count === 0 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
