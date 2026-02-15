"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import {
  FileSignature, Loader2, CheckCircle2, XCircle, PenLine,
  ChevronLeft, ChevronRight, AlertCircle
} from "lucide-react"
import { toast } from "sonner"
import type { SignatureField, FieldType } from "@/lib/types"

interface SignerData {
  id: string
  name: string
  email: string
  status: string
  document_id: string
}

interface DocumentData {
  id: string
  title: string
  file_url: string
  status: string
  signature_fields: SignatureField[]
}

export default function SigningPage() {
  const params = useParams()
  const token = params.token as string
  const [loading, setLoading] = useState(true)
  const [signer, setSigner] = useState<SignerData | null>(null)
  const [document, setDocument] = useState<DocumentData | null>(null)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [signing, setSigning] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [alreadySigned, setAlreadySigned] = useState(false)
  const [signatureDialogOpen, setSignatureDialogOpen] = useState(false)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [pdfImages, setPdfImages] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })
  const [pdfError, setPdfError] = useState<string | null>(null)
  const [declining, setDeclining] = useState(false)
  const [declined, setDeclined] = useState(false)
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false)
  const [declineReason, setDeclineReason] = useState("")

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch(`/api/sign?token=${token}`)
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        setSigner(data.signer)
        setDocument(data.document)
        if (data.signer.status === "signed") setAlreadySigned(true)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [token])

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (!document?.file_url) return
    let isCancelled = false

    async function renderPage() {
      try {
        setLoading(true)
        // We only fetch the PDF document once, but we could optimize to not re-parse it
        // However, pdfjsLib.getDocument is reasonably cached usually. 
        // Better: store the `pdf` object in a ref so we don't re-parse on every page turn.
      } catch { }
    }
  }, [document?.file_url, currentPage])
  /* eslint-enable react-hooks/exhaustive-deps */

  // Better approach: Load PDF output once, then render pages on demand
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageLoading, setPageLoading] = useState(false)

  useEffect(() => {
    if (!document?.file_url) return
    async function loadPdfDoc() {
      try {
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`
        const pdf = await pdfjsLib.getDocument(document!.file_url).promise
        setPdfDoc(pdf)
        setNumPages(pdf.numPages)
      } catch (err) {
        console.error("Error loading PDF document:", err)
      }
    }
    loadPdfDoc()
  }, [document?.file_url])

  useEffect(() => {
    if (!pdfDoc) return
    let isCancelled = false

    async function renderCurrentPage() {
      setPageLoading(true)
      try {
        const page = await pdfDoc.getPage(currentPage)
        const viewport = page.getViewport({ scale: 1.5 })
        const canvas = window.document.createElement("canvas")
        const context = canvas.getContext("2d")!
        canvas.height = viewport.height
        canvas.width = viewport.width
        await page.render({ canvasContext: context, viewport }).promise

        if (!isCancelled) {
          // We only store the current page image to save memory
          const imgData = canvas.toDataURL()
          setPdfImages((prev) => {
            const newImages = [...prev]
            newImages[currentPage - 1] = imgData
            return newImages
          })
        }
      } catch (err) {
        console.error("Error rendering page:", err)
      } finally {
        if (!isCancelled) setPageLoading(false)
      }
    }

    renderCurrentPage()
    return () => { isCancelled = true }
  }, [pdfDoc, currentPage])

  const myFields = document?.signature_fields?.filter((f) => f.signer_id === signer?.id) || []
  const pageFields = myFields.filter((f) => f.page_number === currentPage)

  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
    ctx.beginPath()
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top)
    setIsDrawing(true)
  }, [])

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")!
    const rect = canvas.getBoundingClientRect()
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top)
    ctx.strokeStyle = "#1a1a1a"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.stroke()
  }, [isDrawing])

  const stopDrawing = useCallback(() => setIsDrawing(false), [])

  function saveSignature() {
    if (!canvasRef.current || !activeFieldId) return
    const dataUrl = canvasRef.current.toDataURL()
    setFieldValues((prev) => ({ ...prev, [activeFieldId]: dataUrl }))
    setSignatureDialogOpen(false)
    setActiveFieldId(null)
  }

  function clearCanvas() {
    if (!canvasRef.current) return
    const ctx = canvasRef.current.getContext("2d")!
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
  }

  function openSignaturePad(fieldId: string) {
    setActiveFieldId(fieldId)
    setSignatureDialogOpen(true)
    setTimeout(() => {
      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext("2d")!
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }, 100)
  }

  async function handleSign() {
    const requiredFields = myFields.filter((f) => f.required)
    const missingFields = requiredFields.filter((f) => !fieldValues[f.id])
    if (missingFields.length > 0) {
      toast.error(`Please fill in all required fields (${missingFields.length} remaining)`)
      return
    }

    setSigning(true)
    try {
      const res = await fetch("/api/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          fields: myFields.map((f) => ({ id: f.id, value: fieldValues[f.id] || "" })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setCompleted(true)
      toast.success("Document signed successfully!")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setSigning(false)
    }
  }

  async function handleDecline() {
    setDeclining(true)
    try {
      const res = await fetch("/api/sign/decline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, reason: declineReason.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setDeclined(true)
      setDeclineDialogOpen(false)
      toast.success("Document declined")
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setDeclining(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading document...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
            <h2 className="mt-4 text-lg font-semibold text-foreground">Invalid Signing Link</h2>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (alreadySigned || completed || declined) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
        <Card className="w-full max-w-md text-center">
          <CardContent className="py-12">
            {declined ? (
              <>
                <XCircle className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">Document Declined</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  You have declined to sign this document. You can close this page.
                </p>
              </>
            ) : (
              <>
                <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
                <h2 className="mt-4 text-lg font-semibold text-foreground">
                  {completed ? "Thank you!" : "Already signed"}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {completed
                    ? "Your signature has been recorded. You can close this page."
                    : "You have already signed this document."}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="sticky top-0 z-50 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <FileSignature className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">SignFlow</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              Signing as {signer?.name}
            </span>
            <Button variant="outline" size="sm" onClick={() => setDeclineDialogOpen(true)} className="gap-2 text-destructive hover:bg-destructive/10 hover:text-destructive">
              <XCircle className="h-4 w-4" />
              Decline
            </Button>
            <Button onClick={handleSign} disabled={signing} className="gap-2">
              {signing ? <Loader2 className="h-4 w-4 animate-spin" /> : <PenLine className="h-4 w-4" />}
              Complete Signing
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{document?.title}</h1>
            <p className="text-sm text-muted-foreground">
              {myFields.length} field(s) to complete
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Page {currentPage} of {numPages}</span>
            <Button variant="ghost" size="sm" onClick={() => setCurrentPage(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="relative mx-auto overflow-auto rounded-lg border border-border bg-background shadow-sm">
          {pageLoading && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
          {pdfError && (
            <div className="flex h-[300px] flex-col items-center justify-center gap-4 p-8 text-center">
              <AlertCircle className="h-10 w-10 text-destructive" />
              <p className="text-destructive">{pdfError}</p>
              <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
            </div>
          )}
          {!pdfError && pdfImages[currentPage - 1] && (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={pdfImages[currentPage - 1]}
                alt={`Page ${currentPage}`}
                className="w-full"
                onLoad={(e) => {
                  const img = e.currentTarget
                  setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
                }}
              />

              {pageFields.map((field) => {
                // Convert pixel sizes to percentages of the image
                const wPct = imgNatural.w > 0 ? Math.max((field.width / imgNatural.w) * 100, 15) : 15
                const hPct = imgNatural.h > 0 ? Math.max((field.height / imgNatural.h) * 100, 3) : 4

                return (
                  <div
                    key={field.id}
                    className="absolute z-10 flex items-center justify-center p-1"
                    style={{
                      left: `${field.x_position}%`,
                      top: `${field.y_position}%`,
                      width: `${wPct}%`,
                      height: `${hPct}%`,
                    }}
                  >
                    {field.field_type === "signature" || field.field_type === "initials" ? (
                      <div
                        className={`flex h-full w-full cursor-pointer items-center justify-center rounded border-2 bg-white/50 transition-all hover:bg-primary/10 ${fieldValues[field.id] ? "border-transparent" : "border-dashed border-primary"
                          }`}
                        onClick={() => openSignaturePad(field.id)}
                      >
                        {fieldValues[field.id] ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={fieldValues[field.id]} alt="Signature" className="h-full w-full object-contain" />
                        ) : (
                          <div className="whitespace-nowrap px-2 text-xs font-medium text-primary">
                            Tap to {field.field_type === "signature" ? "Sign" : "Initial"}
                          </div>
                        )}
                      </div>
                    ) : field.field_type === "text" ? (
                      <input
                        type="text"
                        className="h-full w-full min-w-[120px] rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Type here..."
                        value={fieldValues[field.id] || ""}
                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      />
                    ) : field.field_type === "date" ? (
                      <input
                        type="date"
                        className="h-full w-full min-w-[120px] rounded border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        value={fieldValues[field.id] || ""}
                        onChange={(e) => setFieldValues((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      />
                    ) : field.field_type === "checkbox" ? (
                      <div className="flex h-full w-full items-center justify-center rounded hover:bg-black/5">
                        <Checkbox
                          checked={fieldValues[field.id] === "true"}
                          onCheckedChange={(checked) =>
                            setFieldValues((prev) => ({ ...prev, [field.id]: String(checked) }))
                          }
                          className="h-5 w-5 border-2 border-primary bg-white data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                        />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      <Dialog open={signatureDialogOpen} onOpenChange={setSignatureDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Draw Your Signature</DialogTitle>
            <DialogDescription>Use your mouse or finger to draw your signature below.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="overflow-hidden rounded-lg border border-border">
              <canvas
                ref={canvasRef}
                width={460}
                height={160}
                className="w-full cursor-crosshair bg-background"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={clearCanvas}>Clear</Button>
              <Button className="flex-1" onClick={saveSignature}>Apply Signature</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Decline Confirmation Dialog */}
      <Dialog open={declineDialogOpen} onOpenChange={setDeclineDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="h-5 w-5 text-destructive" />
              Decline to Sign
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to decline signing this document? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder="Reason for declining (optional)"
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setDeclineDialogOpen(false)} disabled={declining}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDecline} disabled={declining} className="gap-2">
              {declining ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
              Decline Document
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
