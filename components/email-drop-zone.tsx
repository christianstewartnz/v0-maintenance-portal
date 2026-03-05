"use client"

import { useState, useRef, useCallback } from "react"
import { Upload, FileText, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import type { ImportFileResult } from "@/lib/types"

const ACCEPTED_EXTENSIONS = [".eml", ".msg", ".mbox", ".pdf", ".txt", ".zip"]

interface FileStatus {
  file: File
  state: "pending" | "uploading" | "success" | "error"
  result?: ImportFileResult
}

interface EmailDropZoneProps {
  onImport: (files: File[]) => Promise<{ results: ImportFileResult[] }>
  onComplete?: () => void
}

export function EmailDropZone({ onImport, onComplete }: EmailDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [fileStatuses, setFileStatuses] = useState<FileStatus[]>([])
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const dragCounter = useRef(0)

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0 || uploading) return

      const statuses: FileStatus[] = files.map((file) => ({
        file,
        state: "uploading" as const,
      }))
      setFileStatuses(statuses)
      setUploading(true)
      setProgress(10)

      try {
        setProgress(30)
        const response = await onImport(files)
        setProgress(90)

        setFileStatuses((prev) =>
          prev.map((fs) => {
            const result = response.results.find(
              (r) => r.filename === fs.file.name,
            )
            return {
              ...fs,
              state: result?.status === "success" ? "success" : "error",
              result,
            }
          }),
        )
        setProgress(100)
        onComplete?.()
      } catch {
        setFileStatuses((prev) =>
          prev.map((fs) => ({
            ...fs,
            state: "error" as const,
            result: {
              filename: fs.file.name,
              status: "error" as const,
              requestIds: [],
              error: "Upload failed",
            },
          })),
        )
      } finally {
        setUploading(false)
      }
    },
    [onImport, onComplete, uploading],
  )

  function handleDragEnter(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current++
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current--
    if (dragCounter.current === 0) setIsDragging(false)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    dragCounter.current = 0
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    handleFiles(droppedFiles)
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files ? Array.from(e.target.files) : []
    handleFiles(selected)
    if (inputRef.current) inputRef.current.value = ""
  }

  const successCount = fileStatuses.filter((f) => f.state === "success").length
  const errorCount = fileStatuses.filter((f) => f.state === "error").length
  const totalRequests = fileStatuses.reduce(
    (sum, f) => sum + (f.result?.requestIds.length ?? 0),
    0,
  )

  return (
    <div className="flex flex-col gap-4">
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50 hover:bg-muted/50",
          uploading && "pointer-events-none opacity-60",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED_EXTENSIONS.join(",")}
          onChange={handleInputChange}
          className="hidden"
        />

        {uploading ? (
          <Loader2 className="mb-3 size-10 animate-spin text-primary" />
        ) : (
          <Upload className="mb-3 size-10 text-muted-foreground/50" />
        )}

        <p className="text-sm font-medium text-foreground">
          {uploading
            ? "Importing emails..."
            : "Drag & drop email files here, or click to browse"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Accepts: {ACCEPTED_EXTENSIONS.join(" ")}
        </p>
      </div>

      {uploading && (
        <Progress value={progress} className="h-2" />
      )}

      {fileStatuses.length > 0 && !uploading && (
        <div className="flex flex-col gap-2">
          {successCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-800 dark:bg-emerald-950/30">
              <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm text-emerald-700 dark:text-emerald-300">
                {successCount} file{successCount !== 1 ? "s" : ""} imported
                successfully ({totalRequests} request
                {totalRequests !== 1 ? "s" : ""} created)
              </span>
            </div>
          )}

          {fileStatuses
            .filter((f) => f.state === "error")
            .map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3"
              >
                <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">
                    {f.file.name}
                  </p>
                  <p className="text-xs text-destructive/80">
                    {f.result?.error || "Failed to import"}
                  </p>
                </div>
              </div>
            ))}

          {errorCount === 0 && (
            <div className="space-y-1">
              {fileStatuses.map((f, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <FileText className="size-3.5 text-muted-foreground" />
                  <span className="flex-1 truncate text-foreground">
                    {f.file.name}
                  </span>
                  <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
