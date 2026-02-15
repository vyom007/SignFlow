"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select"
import { toast } from "sonner"
import {
  Send, Plus, Trash2, Users, FileText, GripVertical,
  Loader2, Type, Calendar, PenLine, CheckSquare, History, ArrowLeft, Link2, Copy, AlertTriangle
} from "lucide-react"
import Link from "next/link"
import type { Document, Signer, SignatureField, AuditLog, FieldType } from "@/lib/types"
import { PdfViewer } from "@/components/pdf-viewer"
import { AuditTrail } from "@/components/audit-trail"

const statusStyles: Record<string, string> = {
  draft: "bg-secondary text-secondary-foreground",
  sent: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
  expired: "bg-muted text-muted-foreground",
}

const signerStatusStyles: Record<string, string> = {
  pending: "bg-secondary text-secondary-foreground",
  sent: "bg-amber-100 text-amber-800",
  viewed: "bg-blue-100 text-blue-800",
  signed: "bg-emerald-100 text-emerald-800",
  declined: "bg-red-100 text-red-800",
}

const fieldTypeIcons: Record<FieldType, typeof PenLine> = {
  signature: PenLine,
  text: Type,
  date: Calendar,
  initials: FileText,
  checkbox: CheckSquare,
}

interface Props {
  document: Document & { signers: Signer[]; signature_fields: SignatureField[] }
  auditLogs: (AuditLog & { signer?: { name: string; email: string } | null })[]
}

export function DocumentEditor({ document: doc, auditLogs }: Props) {
  const router = useRouter()
  const [signers, setSigners] = useState<Signer[]>(doc.signers || [])
  const [fields, setFields] = useState<SignatureField[]>(doc.signature_fields || [])
  const [addingField, setAddingField] = useState<FieldType | null>(null)
  const [selectedSigner, setSelectedSigner] = useState<string | null>(signers[0]?.id || null)
  const [sending, setSending] = useState(false)
  const [signerDialogOpen, setSignerDialogOpen] = useState(false)
  const [newSignerName, setNewSignerName] = useState("")
  const [newSignerEmail, setNewSignerEmail] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [signingLinksDialogOpen, setSigningLinksDialogOpen] = useState(false)
  const [signingLinks, setSigningLinks] = useState<{ name: string; email: string; url: string }[]>([])

  const isDraft = doc.status === "draft"

  async function addSigner() {
    if (!newSignerName.trim() || !newSignerEmail.trim()) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("signers")
      .insert({
        document_id: doc.id,
        name: newSignerName.trim(),
        email: newSignerEmail.trim(),
        sign_order: signers.length + 1,
      })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    setSigners([...signers, data])
    if (!selectedSigner) setSelectedSigner(data.id)
    setNewSignerName("")
    setNewSignerEmail("")
    setSignerDialogOpen(false)
    toast.success("Signer added")
  }

  async function removeSigner(id: string) {
    const supabase = createClient()
    await supabase.from("signers").delete().eq("id", id)
    const updated = signers.filter((s) => s.id !== id)
    setSigners(updated)
    setFields(fields.filter((f) => f.signer_id !== id))
    if (selectedSigner === id) setSelectedSigner(updated[0]?.id || null)
    toast.success("Signer removed")
  }

  async function addField(pageNumber: number, x: number, y: number) {
    if (!addingField || !selectedSigner) return
    const supabase = createClient()
    const { data, error } = await supabase
      .from("signature_fields")
      .insert({
        document_id: doc.id,
        signer_id: selectedSigner,
        field_type: addingField,
        page_number: pageNumber,
        x_position: x,
        y_position: y,
        width: addingField === "checkbox" ? 30 : 200,
        height: addingField === "checkbox" ? 30 : addingField === "signature" ? 60 : 35,
      })
      .select()
      .single()
    if (error) {
      toast.error(error.message)
      return
    }
    setFields([...fields, data])
    toast.success(`${addingField} field added`)
  }

  async function removeField(id: string) {
    const supabase = createClient()
    await supabase.from("signature_fields").delete().eq("id", id)
    setFields(fields.filter((f) => f.id !== id))
  }

  async function handleSend() {
    if (signers.length === 0) {
      toast.error("Add at least one signer")
      return
    }
    if (fields.length === 0) {
      toast.error("Add at least one field")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/documents/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentId: doc.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to send")
      toast.success("Document sent for signing!")
      // Show signing links popup
      if (data.signingLinks) {
        setSigningLinks(data.signingLinks)
        setSigningLinksDialogOpen(true)
      }
      router.refresh()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{doc.title}</h1>
              <Badge className={statusStyles[doc.status]}>{doc.status}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{doc.file_name}</p>
          </div>
        </div>
        {isDraft && (
          <Button onClick={handleSend} disabled={sending} className="gap-2">
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            Send for Signing
          </Button>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
        <div className="flex flex-col gap-4">
          {isDraft && (
            <Card>
              <CardContent className="flex items-center gap-2 py-3">
                <span className="mr-2 text-sm font-medium text-muted-foreground">Add field:</span>
                {(["signature", "text", "date", "initials", "checkbox"] as FieldType[]).map((type) => {
                  const Icon = fieldTypeIcons[type]
                  return (
                    <Button
                      key={type}
                      variant={addingField === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setAddingField(addingField === type ? null : type)}
                      className="gap-1.5 capitalize"
                      disabled={!selectedSigner}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {type}
                    </Button>
                  )
                })}
              </CardContent>
            </Card>
          )}

          <PdfViewer
            fileUrl={doc.file_url || ""}
            fields={fields}
            signers={signers}
            selectedSigner={selectedSigner}
            addingField={addingField}
            currentPage={currentPage}
            onPageChange={setCurrentPage}
            onClickPage={isDraft ? addField : undefined}
            onRemoveField={isDraft ? removeField : undefined}
          />
        </div>

        <div className="flex flex-col gap-4">
          <Tabs defaultValue="signers">
            <TabsList className="w-full">
              <TabsTrigger value="signers" className="flex-1 gap-1.5">
                <Users className="h-4 w-4" /> Signers
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex-1 gap-1.5">
                <History className="h-4 w-4" /> Audit
              </TabsTrigger>
            </TabsList>
            <TabsContent value="signers" className="mt-4">
              <div className="flex flex-col gap-3">
                {signers.map((signer) => (
                  <Card
                    key={signer.id}
                    className={`cursor-pointer transition-all ${selectedSigner === signer.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setSelectedSigner(signer.id)}
                  >
                    <CardContent className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {signer.sign_order}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{signer.name}</p>
                          <p className="text-xs text-muted-foreground">{signer.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className={signerStatusStyles[signer.status]}>
                          {signer.status}
                        </Badge>
                        {!isDraft && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              const url = `${window.location.origin}/sign/${signer.token}`
                              navigator.clipboard.writeText(url)
                              toast.success("Signing link copied!")
                            }}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        )}
                        {isDraft && (
                          <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); removeSigner(signer.id) }}>
                            <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {isDraft && (
                  <Dialog open={signerDialogOpen} onOpenChange={setSignerDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Plus className="h-4 w-4" /> Add Signer
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Signer</DialogTitle>
                        <DialogDescription>Add a recipient who needs to sign this document.</DialogDescription>
                      </DialogHeader>
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="signer-name">Name</Label>
                          <Input id="signer-name" placeholder="John Doe" value={newSignerName} onChange={(e) => setNewSignerName(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="signer-email">Email</Label>
                          <Input id="signer-email" type="email" placeholder="john@example.com" value={newSignerEmail} onChange={(e) => setNewSignerEmail(e.target.value)} />
                        </div>
                        <Button onClick={addSigner} disabled={!newSignerName.trim() || !newSignerEmail.trim()}>
                          Add Signer
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}

                {fields.length > 0 && (
                  <div className="mt-2">
                    <h3 className="mb-2 text-sm font-medium text-muted-foreground">Placed Fields</h3>
                    <div className="flex flex-col gap-1.5">
                      {fields.map((field) => {
                        const signer = signers.find((s) => s.id === field.signer_id)
                        const Icon = fieldTypeIcons[field.field_type]
                        return (
                          <div key={field.id} className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-sm">
                            <div className="flex items-center gap-2">
                              <Icon className="h-3.5 w-3.5 text-primary" />
                              <span className="capitalize text-foreground">{field.field_type}</span>
                              <span className="text-muted-foreground">- p{field.page_number}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{signer?.name || "Unassigned"}</span>
                              {isDraft && (
                                <button onClick={() => removeField(field.id)} className="text-muted-foreground hover:text-destructive">
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="audit" className="mt-4">
              <AuditTrail logs={auditLogs} />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Signing Links Popup */}
      <Dialog open={signingLinksDialogOpen} onOpenChange={setSigningLinksDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl">
              📋 Share Signing Links
            </DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 dark:border-amber-900/50 dark:bg-amber-950/20">
            <p className="text-base font-semibold text-amber-800 dark:text-amber-300">
              🚦 Quick heads-up!
            </p>
            <p className="mt-2 text-sm leading-relaxed text-amber-700 dark:text-amber-400">
              The free plan&apos;s monthly email quota has been fully used by other users—clearly everyone loves sending documents here.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-amber-700 dark:text-amber-400">
              Automatic emails are taking a short vacation 🏖️<br />
              In the meantime, copy the secure signing link below and share it directly with your signer.
            </p>
            <p className="mt-3 text-sm text-amber-700 dark:text-amber-400">
              Apologies for the hiccup, and thank you for being part of the journey 💼
            </p>
          </div>
          <div className="flex flex-col gap-4 pt-2">
            {signingLinks.map((link, idx) => (
              <div key={idx} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">{link.name}</p>
                      <p className="text-sm text-muted-foreground">{link.email}</p>
                    </div>
                  </div>
                  <Button
                    size="default"
                    className="gap-2"
                    onClick={() => {
                      navigator.clipboard.writeText(link.url)
                      toast.success(`✅ Link copied for ${link.name}!`)
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <code className="block break-all rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">{link.url}</code>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
