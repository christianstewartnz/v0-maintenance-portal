"use client"

import { useState, useEffect, useCallback } from "react"
import { format } from "date-fns"
import {
  ArrowLeft,
  ClipboardList,
  Loader2,
  Save,
  StickyNote,
  XCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useApp } from "@/lib/app-context"
import type { Item } from "@/lib/types"

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-destructive/10 text-destructive border-destructive/20"
    case "Normal":
      return "bg-primary/10 text-primary border-primary/20"
    case "Low":
      return "bg-muted text-muted-foreground border-border"
    default:
      return ""
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "New":
      return "bg-primary/10 text-primary border-primary/20"
    case "Assigned":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20"
    case "In Progress":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    case "Marked Complete - Needs Review":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    case "Completed":
      return "bg-success/10 text-success border-success/20"
    case "Closed":
      return "bg-muted text-muted-foreground border-border"
    default:
      return ""
  }
}

export function ItemDetailPage() {
  const { currentPage, items, navigateTo, units, projects, updateItemStatus, updateItemNotes } = useApp()

  const itemId = currentPage.type === "item-detail" ? currentPage.itemId : null
  const item = itemId ? items.find((i) => i.id === itemId) : null
  const unit = item ? units.find((u) => u.id === item.unitId) : null
  const project = item ? projects.find((p) => p.id === item.projectId) : null

  const [notes, setNotes] = useState<string>(item?.otherNotes ?? "")
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSuccessMessage] = useState(false)

  useEffect(() => {
    setNotes(item?.otherNotes ?? "")
    setIsDirty(false)
    setSaveError(null)
    setSuccessMessage(false)
  }, [item?.id, item?.otherNotes])

  const handleNotesChange = useCallback((value: string) => {
    setNotes(value)
    setIsDirty(true)
    setSaveError(null)
    setSuccessMessage(false)
  }, [])

  const handleSaveNotes = useCallback(async () => {
    if (!item) return
    setIsSaving(true)
    setSaveError(null)
    try {
      await updateItemNotes(item.id, notes.trim() || null)
      setIsDirty(false)
      setSuccessMessage(true)
      setTimeout(() => setSuccessMessage(false), 2500)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save notes")
    } finally {
      setIsSaving(false)
    }
  }, [item, notes, updateItemNotes])

  if (!item || !unit || !project) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center py-16">
        <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">Item not found.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      {/* Breadcrumb header */}
      <div className="border-b border-border px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo({ type: "projects" })}
              >
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo({ type: "project-detail", projectId: project.id })}
              >
                {project.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo({ type: "unit-detail", unitId: unit.id })}
              >
                Unit {unit.unitNumber}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[260px] truncate">{item.title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 space-y-6 p-6">
        {/* Back button + title */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 gap-1.5 text-xs text-muted-foreground"
            onClick={() => navigateTo({ type: "items" })}
          >
            <ArrowLeft className="size-3.5" />
            All Items
          </Button>
        </div>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">{item.title}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {project.name} &middot; Unit {unit.unitNumber}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className={getPriorityStyle(item.priority)}>
              {item.priority}
            </Badge>
            <Badge variant="outline" className={getStatusStyle(item.status)}>
              {item.status}
            </Badge>
            <Badge variant="outline" className="text-muted-foreground">
              {item.trade}
            </Badge>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="space-y-6 lg:col-span-2">
            {/* Description */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Description</CardTitle>
              </CardHeader>
              <CardContent>
                {item.description ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground/50 italic">No description provided.</p>
                )}
              </CardContent>
            </Card>

            {/* Other Notes — always visible, inline editable */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-semibold text-foreground">Other Notes</CardTitle>
                </div>
                <p className="text-xs text-muted-foreground">
                  Access instructions, tenant contacts, preferred times, or any other relevant context for this item.
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="other-notes" className="sr-only">
                    Other Notes
                  </Label>
                  <Textarea
                    id="other-notes"
                    placeholder="e.g. Contact tenant Sarah on 021 123 456 before attending. Do not attend before 9am."
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    className="min-h-[100px] resize-y text-sm"
                    disabled={isSaving}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveNotes}
                    disabled={!isDirty || isSaving}
                    className="h-8 gap-1.5 text-xs"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="size-3 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>
                        <Save className="size-3" />
                        Save Notes
                      </>
                    )}
                  </Button>
                  {isDirty && !isSaving && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setNotes(item.otherNotes ?? "")
                        setIsDirty(false)
                        setSaveError(null)
                      }}
                      className="h-8 text-xs text-muted-foreground"
                    >
                      Discard
                    </Button>
                  )}
                  {saveSuccess && (
                    <p className="text-xs text-green-600 dark:text-green-400">Notes saved.</p>
                  )}
                  {saveError && (
                    <p className="text-xs text-destructive">{saveError}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details card */}
            <Card className="border-border/80">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-foreground">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Project</span>
                  <span className="text-right font-medium text-foreground">{project.name}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Unit</span>
                  <span
                    className="cursor-pointer text-right font-medium text-primary hover:underline"
                    onClick={() => navigateTo({ type: "unit-detail", unitId: unit.id })}
                  >
                    Unit {unit.unitNumber}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Trade</span>
                  <span className="text-right font-medium text-foreground">{item.trade}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Priority</span>
                  <Badge variant="outline" className={getPriorityStyle(item.priority)}>
                    {item.priority}
                  </Badge>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant="outline" className={getStatusStyle(item.status)}>
                    {item.status}
                  </Badge>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-right text-foreground">
                    {format(new Date(item.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground">Updated</span>
                  <span className="text-right text-foreground">
                    {format(new Date(item.updatedAt), "MMM d, yyyy")}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Close action */}
            {item.status !== "Closed" && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full gap-1.5 text-xs text-muted-foreground"
                  >
                    <XCircle className="size-3.5" />
                    Close Item
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close this item?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will set the item status to Closed, removing it from active views.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={() => updateItemStatus(item.id, "Closed")}>
                      Close Item
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
