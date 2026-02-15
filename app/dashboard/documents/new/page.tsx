"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, FileText, X } from "lucide-react"
import { toast } from "sonner"

export default function NewDocumentPage() {
  const [title, setTitle] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const router = useRouter()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile?.type === "application/pdf") {
      setFile(droppedFile)
      if (!title) setTitle(droppedFile.name.replace(".pdf", ""))
    } else {
      toast.error("Please upload a PDF file")
    }
  }, [title])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (selected?.type === "application/pdf") {
      setFile(selected)
      if (!title) setTitle(selected.name.replace(".pdf", ""))
    } else {
      toast.error("Please upload a PDF file")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file || !title.trim()) {
      toast.error("Please provide a title and upload a PDF")
      return
    }

    setUploading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Convert PDF to base64 data URL (stored directly in DB, no Storage needed)
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(reader.result as string)
        reader.onerror = () => reject(new Error("Failed to read file"))
        reader.readAsDataURL(file)
      })

      const { data: doc, error: docError } = await supabase
        .from("documents")
        .insert({ user_id: user.id, title: title.trim(), file_url: fileDataUrl, file_name: file.name })
        .select()
        .single()
      if (docError) throw docError

      toast.success("Document created!")
      router.push("/dashboard")
    } catch (err: any) {
      toast.error(err.message || "Failed to create document")
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-foreground">New Document</h1>
      <Card>
        <CardHeader>
          <CardTitle>Upload PDF</CardTitle>
          <CardDescription>Upload a PDF document to start adding signers and fields</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Document Title</Label>
              <Input id="title" placeholder="Contract Agreement" value={title} onChange={(e) => setTitle(e.target.value)} required />
            </div>

            <div
              className={`relative flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors ${dragOver ? "border-primary bg-primary/5" : file ? "border-emerald-500 bg-emerald-50" : "border-border"
                }`}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-emerald-600" />
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setFile(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-muted-foreground" />
                  <p className="mt-3 text-sm font-medium text-foreground">Drag and drop your PDF here</p>
                  <p className="mt-1 text-sm text-muted-foreground">or click to browse</p>
                  <input type="file" accept=".pdf,application/pdf" onChange={handleFileSelect} className="absolute inset-0 cursor-pointer opacity-0" />
                </>
              )}
            </div>

            <Button type="submit" disabled={uploading || !file || !title.trim()}>
              {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {uploading ? "Uploading..." : "Create Document"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
