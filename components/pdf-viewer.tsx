"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Trash2, PenLine, Type, Calendar, FileText, CheckSquare } from "lucide-react"
import type { SignatureField, Signer, FieldType } from "@/lib/types"

const SIGNER_COLORS = [
  "rgb(59,130,246)",
  "rgb(249,115,22)",
  "rgb(34,197,94)",
  "rgb(168,85,247)",
  "rgb(236,72,153)",
  "rgb(20,184,166)",
]

const fieldTypeIcons: Record<FieldType, string> = {
  signature: "Sig",
  text: "Txt",
  date: "Date",
  initials: "Init",
  checkbox: "Chk",
}

interface Props {
  fileUrl: string
  fields: SignatureField[]
  signers: Signer[]
  selectedSigner: string | null
  addingField: FieldType | null
  currentPage: number
  onPageChange: (page: number) => void
  onClickPage?: (page: number, x: number, y: number) => void
  onRemoveField?: (id: string) => void
}

export function PdfViewer({
  fileUrl,
  fields,
  signers,
  selectedSigner,
  addingField,
  currentPage,
  onPageChange,
  onClickPage,
  onRemoveField,
}: Props) {
  const [numPages, setNumPages] = useState(1)
  const [scale, setScale] = useState(1)
  const [pdfImages, setPdfImages] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [imgNatural, setImgNatural] = useState({ w: 0, h: 0 })

  useEffect(() => {
    if (!fileUrl) return
    // Use pdf.js to render pages as images
    async function loadPdf() {
      setLoading(true)
      try {
        const pdfjsLib = await import("pdfjs-dist")
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        const pdf = await pdfjsLib.getDocument(fileUrl).promise
        setNumPages(pdf.numPages)

        const images: string[] = []
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i)
          const viewport = page.getViewport({ scale: 1.5 })
          const canvas = window.document.createElement("canvas")
          const context = canvas.getContext("2d")!
          canvas.height = viewport.height
          canvas.width = viewport.width
          await page.render({ canvasContext: context, viewport }).promise
          images.push(canvas.toDataURL())
        }
        setPdfImages(images)
      } catch (err) {
        console.error("Failed to load PDF:", err)
      } finally {
        setLoading(false)
      }
    }
    loadPdf()
  }, [fileUrl])

  const getSignerColor = (signerId: string | null) => {
    if (!signerId) return SIGNER_COLORS[0]
    const idx = signers.findIndex((s) => s.id === signerId)
    return SIGNER_COLORS[idx % SIGNER_COLORS.length]
  }

  const handlePageClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!onClickPage || !addingField) return
      const rect = e.currentTarget.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      onClickPage(currentPage, x, y)
    },
    [onClickPage, addingField, currentPage]
  )

  const pageFields = fields.filter((f) => f.page_number === currentPage)

  if (loading) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading PDF...</p>
        </div>
      </div>
    )
  }

  if (!pdfImages.length) {
    return (
      <div className="flex h-[600px] items-center justify-center rounded-lg border border-border bg-muted/20">
        <p className="text-sm text-muted-foreground">No PDF to display</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => onPageChange(Math.max(1, currentPage - 1))} disabled={currentPage <= 1}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-foreground">
            Page {currentPage} of {numPages}
          </span>
          <Button variant="ghost" size="sm" onClick={() => onPageChange(Math.min(numPages, currentPage + 1))} disabled={currentPage >= numPages}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setScale(Math.max(0.5, scale - 0.1))}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">{Math.round(scale * 100)}%</span>
          <Button variant="ghost" size="sm" onClick={() => setScale(Math.min(2, scale + 0.1))}>
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div ref={containerRef} className="overflow-auto rounded-lg border border-border bg-muted/20 p-4">
        <div
          className="relative mx-auto shadow-lg"
          style={{ transform: `scale(${scale})`, transformOrigin: "top center", cursor: addingField ? "crosshair" : "default" }}
          onClick={handlePageClick}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={pdfImages[currentPage - 1]}
            alt={`Page ${currentPage}`}
            className="w-full"
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget
              setImgNatural({ w: img.naturalWidth, h: img.naturalHeight })
            }}
          />

          {pageFields.map((field) => {
            const color = getSignerColor(field.signer_id)
            const wPct = imgNatural.w > 0 ? Math.max((field.width / imgNatural.w) * 100, 15) : 15
            const hPct = imgNatural.h > 0 ? Math.max((field.height / imgNatural.h) * 100, 3) : 4
            return (
              <div
                key={field.id}
                className="group absolute flex items-center justify-center rounded border-2 text-xs font-medium"
                style={{
                  left: `${field.x_position}%`,
                  top: `${field.y_position}%`,
                  width: `${wPct}%`,
                  height: `${hPct}%`,
                  minWidth: "60px",
                  minHeight: "24px",
                  borderColor: color,
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {field.value && (field.field_type === "signature" || field.field_type === "initials") ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={field.value} alt={field.field_type} className="h-full w-full object-contain" />
                ) : (
                  <span className="pointer-events-none select-none capitalize">
                    {field.value || fieldTypeIcons[field.field_type]}
                  </span>
                )}
                {onRemoveField && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      onRemoveField(field.id)
                    }}
                    className="absolute -right-2 -top-2 hidden h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground group-hover:flex"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
