"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft,
  AlertTriangle,
  Plus,
  Trash2,
  Check,
  ChevronsUpDown,
  Paperclip,
  Save,
  Sparkles,
  Loader2,
  Building2,
  Download,
  FileText,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useApp } from "@/lib/app-context"
import type { DraftItem, Trade, Priority } from "@/lib/types"
import { format } from "date-fns"
import { cn } from "@/lib/utils"

const TRADES: Trade[] = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Appliance",
  "General",
  "Other",
]
const PRIORITIES: Priority[] = ["Low", "Normal", "Urgent"]

export function RequestReviewPage() {
  const { currentPage, requests, navigateTo, processRequest, draftRequest, archiveRequest, projects, units } = useApp()

  const requestId = currentPage.type === "request-review" ? currentPage.requestId : null
  const requestData = requestId ? requests.find((r) => r.id === requestId) ?? null : null

  const [selectedUnitId, setSelectedUnitId] = useState<string>(
    requestData?.detectedUnitId ?? ""
  )
  const [unitOpen, setUnitOpen] = useState(false)
  const [draftItems, setDraftItems] = useState<DraftItem[]>([
    {
      id: "draft_1",
      title: "",
      description: "",
      otherNotes: null,
      trade: "General",
      priority: "Normal",
    },
  ])
  const [showUnitError, setShowUnitError] = useState(false)
  const [drafting, setDrafting] = useState(false)
  const [draftError, setDraftError] = useState<string | null>(null)

  const allUnits = units

  const selectedUnit = allUnits.find((u) => u.id === selectedUnitId)
  const inferredProject = selectedUnit
    ? projects.find((p) => p.id === selectedUnit.projectId)
    : null
  const detectedProject = requestData?.projectId
    ? projects.find((p) => p.id === requestData.projectId)
    : null
  const displayProject = inferredProject ?? detectedProject

  const canConfirm = useMemo(() => {
    if (!selectedUnitId) return false
    return draftItems.some((d) => d.title.trim() && d.trade && d.priority)
  }, [selectedUnitId, draftItems])

  function addDraftItem() {
    setDraftItems((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        title: "",
        description: "",
        otherNotes: null,
        trade: "General",
        priority: "Normal",
      },
    ])
  }

  function removeDraftItem(id: string) {
    setDraftItems((prev) => prev.filter((d) => d.id !== id))
  }

  function updateDraftItem(id: string, field: keyof DraftItem, value: string | null) {
    setDraftItems((prev) =>
      prev.map((d) => (d.id === id ? { ...d, [field]: value } : d))
    )
  }

  async function handleAIDraft() {
    if (!requestData) return
    setDrafting(true)
    setDraftError(null)
    try {
      const result = await draftRequest(requestData.id)
      if (result.detectedUnitId) {
        setSelectedUnitId(result.detectedUnitId)
        setShowUnitError(false)
      }
      if (result.items.length > 0) {
        setDraftItems(
          result.items.map((item, i) => ({
            id: `draft_ai_${Date.now()}_${i}`,
            title: item.title,
            description: item.description,
            otherNotes: item.otherNotes ?? null,
            trade: item.trade,
            priority: item.priority,
          }))
        )
      }
    } catch (err) {
      setDraftError(err instanceof Error ? err.message : "Failed to generate AI draft")
    } finally {
      setDrafting(false)
    }
  }

  async function handleConfirm() {
    if (!selectedUnitId) {
      setShowUnitError(true)
      return
    }
    if (!requestData) return

    const validDrafts = draftItems.filter((d) => d.title.trim() && d.trade && d.priority)
    await processRequest(requestData.id, selectedUnitId, validDrafts)
    navigateTo({ type: "items" })
  }

  if (!requestData) return null

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigateTo({ type: "requests" })}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back to requests</span>
        </Button>
        <div>
          <h1 className="text-base font-semibold text-foreground">Request Review</h1>
          <p className="text-xs text-muted-foreground">
            Review request and create maintenance items
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 lg:flex-row">
          {/* LEFT: Request details */}
          <div className="flex flex-col gap-4 lg:w-1/2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">Request Details</CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      requestData.status === "needs_review"
                        ? "border-warning/30 bg-warning/10 text-warning-foreground"
                        : requestData.status === "archived"
                          ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                          : requestData.status === "error"
                            ? "border-destructive/30 bg-destructive/10 text-destructive"
                            : "border-success/30 bg-success/10 text-success"
                    }
                  >
                    {requestData.status === "needs_review"
                      ? "Needs Review"
                      : requestData.status === "archived"
                        ? "Archived"
                        : requestData.status === "error"
                          ? "Error"
                          : "Processed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">From</p>
                    <p className="text-sm font-medium text-foreground">{requestData.fromName}</p>
                    <p className="text-xs text-muted-foreground">{requestData.fromEmail}</p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Received</p>
                    <p className="text-sm text-foreground">
                      {format(new Date(requestData.receivedAt), "MMM d, yyyy h:mm a")}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Subject</p>
                  <p className="text-sm font-medium text-foreground">{requestData.subject}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Email Body</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-relaxed text-foreground">
                    {requestData.bodyRaw}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Attachments
                  {requestData.attachments && requestData.attachments.length > 0 && (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({requestData.attachments.length})
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {requestData.attachments && requestData.attachments.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {requestData.attachments.map((att) => (
                      <div
                        key={att.id}
                        className="flex items-center justify-between rounded-lg border border-border p-3"
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="size-4 shrink-0 text-muted-foreground" />
                          <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-foreground">
                              {att.fileName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {att.mimeType}
                            </p>
                          </div>
                        </div>
                        <a
                          href={`/api/maintenance/attachments/${att.id}`}
                          download={att.fileName}
                          className="ml-2 shrink-0"
                        >
                          <Button variant="ghost" size="icon" className="size-7">
                            <Download className="size-3.5" />
                            <span className="sr-only">Download</span>
                          </Button>
                        </a>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-muted-foreground">
                    <Paperclip className="size-4" />
                    <span className="text-sm">No attachments</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT: Review & Create Items */}
          <div className="flex flex-col gap-4 lg:w-1/2">
            {requestData.status === "needs_review" && (
              <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
                <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                <p className="text-sm text-warning-foreground">
                  Please confirm the correct project and unit before creating items.
                </p>
              </div>
            )}

            {/* Detected Project */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Project
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className={cn(
                  "flex items-center gap-2 rounded-lg border p-3",
                  displayProject
                    ? "border-border bg-muted/50"
                    : "border-dashed border-border"
                )}>
                  <Building2 className="size-4 shrink-0 text-muted-foreground" />
                  {displayProject ? (
                    <span className="text-sm font-medium text-foreground">
                      {displayProject.name}
                    </span>
                  ) : (
                    <span className="text-sm italic text-muted-foreground">
                      Not detected yet — click AI Draft to auto-detect
                    </span>
                  )}
                </div>
                {displayProject && inferredProject && inferredProject.id !== detectedProject?.id && detectedProject && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    Project inferred from selected unit (originally detected: {detectedProject.name})
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Unit Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Confirm Unit
                  <span className="ml-1 text-destructive">*</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Popover open={unitOpen} onOpenChange={setUnitOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={unitOpen}
                      className={cn(
                        "w-full justify-between font-normal",
                        !selectedUnitId && "text-muted-foreground",
                        showUnitError && !selectedUnitId && "border-destructive"
                      )}
                    >
                      {selectedUnit
                        ? `Unit ${selectedUnit.unitNumber} - ${selectedUnit.address}${inferredProject ? ` (${inferredProject.name})` : ""}`
                        : "Select a unit..."}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[440px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by unit number, address, or project..." />
                      <CommandList>
                        <CommandEmpty>No units found.</CommandEmpty>
                        <CommandGroup>
                          {allUnits.map((unit) => {
                            const proj = projects.find((p) => p.id === unit.projectId)
                            return (
                              <CommandItem
                                key={unit.id}
                                value={`${unit.unitNumber} ${unit.address} ${proj?.name ?? ""}`}
                                onSelect={() => {
                                  setSelectedUnitId(unit.id)
                                  setUnitOpen(false)
                                  setShowUnitError(false)
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 size-4",
                                    selectedUnitId === unit.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                <span>
                                  Unit {unit.unitNumber} - {unit.address}
                                  <span className="ml-2 text-xs text-muted-foreground">
                                    ({proj?.name})
                                  </span>
                                </span>
                              </CommandItem>
                            )
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {showUnitError && !selectedUnitId && (
                  <p className="mt-2 text-xs text-destructive">
                    A unit must be selected before creating items.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Draft Items */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Draft Items ({draftItems.length})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAIDraft}
                      disabled={drafting || requestData.status === "processed" || requestData.status === "archived"}
                    >
                      {drafting ? (
                        <Loader2 className="mr-1 size-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="mr-1 size-3.5" />
                      )}
                      {drafting ? "Analyzing..." : "AI Draft"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={addDraftItem}>
                      <Plus className="mr-1 size-3.5" />
                      Add Item
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {draftError && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
                    <p className="text-sm text-destructive">{draftError}</p>
                  </div>
                )}
                {draftItems.map((draft, index) => (
                  <div key={draft.id} className="rounded-lg border border-border p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {draftItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-destructive"
                          onClick={() => removeDraftItem(draft.id)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Remove item</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={draft.title}
                          onChange={(e) => updateDraftItem(draft.id, "title", e.target.value)}
                          placeholder="Item title..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={draft.description}
                          onChange={(e) => updateDraftItem(draft.id, "description", e.target.value)}
                          placeholder="Item description..."
                          rows={2}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Other Notes</Label>
                        <Textarea
                          value={draft.otherNotes ?? ""}
                          onChange={(e) =>
                            updateDraftItem(draft.id, "otherNotes", e.target.value)
                          }
                          placeholder="Access instructions, tenant contacts, preferred times, etc."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Trade</Label>
                          <Select
                            value={draft.trade}
                            onValueChange={(v) => updateDraftItem(draft.id, "trade", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRADES.map((t) => (
                                <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Priority</Label>
                          <Select
                            value={draft.priority}
                            onValueChange={(v) => updateDraftItem(draft.id, "priority", v)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>{p}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex items-center gap-3">
              {requestData.status === "archived" ? (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={async () => {
                    await archiveRequest(requestData.id, false)
                  }}
                >
                  <ArchiveRestore className="mr-1.5 size-4" />
                  Unarchive
                </Button>
              ) : (
                <>
                  {(requestData.status === "needs_review" || requestData.status === "error") && (
                    <Button
                      variant="outline"
                      className="flex-1 text-muted-foreground"
                      onClick={async () => {
                        await archiveRequest(requestData.id, true)
                        navigateTo({ type: "requests" })
                      }}
                    >
                      <Archive className="mr-1.5 size-4" />
                      Archive
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1" onClick={() => navigateTo({ type: "requests" })}>
                    <Save className="mr-1.5 size-4" />
                    Save Draft
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleConfirm}
                    disabled={!canConfirm || requestData.status === "processed"}
                  >
                    <Check className="mr-1.5 size-4" />
                    Confirm & Create Items
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
