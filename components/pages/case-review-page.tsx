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
import { mockCases, mockUnits } from "@/lib/mock-data"
import type { DraftJob, Trade, Priority } from "@/lib/types"
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

export function CaseReviewPage() {
  const { currentProject, currentPage, navigateTo } = useApp()

  const caseId =
    currentPage.type === "case-review" ? currentPage.caseId : null
  const caseData = caseId
    ? mockCases.find((c) => c.id === caseId) ?? null
    : null

  const [selectedUnitId, setSelectedUnitId] = useState<string>("")
  const [unitOpen, setUnitOpen] = useState(false)
  const [draftJobs, setDraftJobs] = useState<DraftJob[]>([
    {
      id: "draft_1",
      title: "",
      description: "",
      trade: "General",
      priority: "Normal",
    },
  ])
  const [showUnitError, setShowUnitError] = useState(false)

  const units = useMemo(
    () =>
      currentProject
        ? mockUnits.filter((u) => u.projectId === currentProject.id)
        : [],
    [currentProject]
  )

  const selectedUnit = units.find((u) => u.id === selectedUnitId)

  function addDraftJob() {
    setDraftJobs((prev) => [
      ...prev,
      {
        id: `draft_${Date.now()}`,
        title: "",
        description: "",
        trade: "General",
        priority: "Normal",
      },
    ])
  }

  function removeDraftJob(id: string) {
    setDraftJobs((prev) => prev.filter((j) => j.id !== id))
  }

  function updateDraftJob(id: string, field: keyof DraftJob, value: string) {
    setDraftJobs((prev) =>
      prev.map((j) => (j.id === id ? { ...j, [field]: value } : j))
    )
  }

  function handleConfirm() {
    if (!selectedUnitId) {
      setShowUnitError(true)
      return
    }
    // Placeholder — would POST to API
    navigateTo({ type: "project-detail", tab: "inbox" })
  }

  if (!caseData || !currentProject) return null

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-3 border-b border-border px-6 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => navigateTo({ type: "project-detail", tab: "inbox" })}
        >
          <ArrowLeft className="size-4" />
          <span className="sr-only">Back to inbox</span>
        </Button>
        <div>
          <h1 className="text-base font-semibold text-foreground">
            Case Review
          </h1>
          <p className="text-xs text-muted-foreground">
            Review case and create maintenance jobs
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 p-6 lg:flex-row">
          {/* LEFT COLUMN: Case Details */}
          <div className="flex flex-col gap-4 lg:w-1/2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Case Details
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      caseData.status === "needs_review"
                        ? "border-warning/30 bg-warning/10 text-warning-foreground"
                        : "border-success/30 bg-success/10 text-success"
                    }
                  >
                    {caseData.status === "needs_review"
                      ? "Needs Review"
                      : "Processed"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      From
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {caseData.fromName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {caseData.fromEmail}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                      Received
                    </p>
                    <p className="text-sm text-foreground">
                      {format(
                        new Date(caseData.receivedAt),
                        "MMM d, yyyy h:mm a"
                      )}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                    Subject
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {caseData.subject}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="flex-1">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Email Body
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px]">
                  <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm leading-relaxed text-foreground">
                    {caseData.bodyRaw}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Attachments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 rounded-lg border border-dashed border-border p-4 text-muted-foreground">
                  <Paperclip className="size-4" />
                  <span className="text-sm">No attachments</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN: Review & Create Jobs */}
          <div className="flex flex-col gap-4 lg:w-1/2">
            <div className="flex items-start gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
              <p className="text-sm text-warning-foreground">
                Please confirm the correct unit before creating jobs.
              </p>
            </div>

            {/* Unit Selection */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold">
                  Unit Selection
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
                        showUnitError &&
                          !selectedUnitId &&
                          "border-destructive"
                      )}
                    >
                      {selectedUnit
                        ? `Unit ${selectedUnit.unitNumber} — ${selectedUnit.address}`
                        : "Select a unit..."}
                      <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" align="start">
                    <Command>
                      <CommandInput placeholder="Search by unit number or address..." />
                      <CommandList>
                        <CommandEmpty>No units found.</CommandEmpty>
                        <CommandGroup>
                          {units.map((unit) => (
                            <CommandItem
                              key={unit.id}
                              value={`${unit.unitNumber} ${unit.address}`}
                              onSelect={() => {
                                setSelectedUnitId(unit.id)
                                setUnitOpen(false)
                                setShowUnitError(false)
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 size-4",
                                  selectedUnitId === unit.id
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              Unit {unit.unitNumber} — {unit.address}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {showUnitError && !selectedUnitId && (
                  <p className="mt-2 text-xs text-destructive">
                    A unit must be selected before creating jobs.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Draft Jobs */}
            <Card className="flex-1">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Draft Jobs ({draftJobs.length})
                  </CardTitle>
                  <Button variant="outline" size="sm" onClick={addDraftJob}>
                    <Plus className="mr-1 size-3.5" />
                    Add Job
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {draftJobs.map((draft, index) => (
                  <div
                    key={draft.id}
                    className="rounded-lg border border-border p-4"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Job {index + 1}
                      </span>
                      {draftJobs.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-6 text-destructive"
                          onClick={() => removeDraftJob(draft.id)}
                        >
                          <Trash2 className="size-3.5" />
                          <span className="sr-only">Remove job</span>
                        </Button>
                      )}
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Title</Label>
                        <Input
                          value={draft.title}
                          onChange={(e) =>
                            updateDraftJob(draft.id, "title", e.target.value)
                          }
                          placeholder="Job title..."
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <Label className="text-xs">Description</Label>
                        <Textarea
                          value={draft.description}
                          onChange={(e) =>
                            updateDraftJob(
                              draft.id,
                              "description",
                              e.target.value
                            )
                          }
                          placeholder="Job description..."
                          rows={2}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Trade</Label>
                          <Select
                            value={draft.trade}
                            onValueChange={(v) =>
                              updateDraftJob(draft.id, "trade", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TRADES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <Label className="text-xs">Priority</Label>
                          <Select
                            value={draft.priority}
                            onValueChange={(v) =>
                              updateDraftJob(draft.id, "priority", v)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {PRIORITIES.map((p) => (
                                <SelectItem key={p} value={p}>
                                  {p}
                                </SelectItem>
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

            <Button onClick={handleConfirm} className="w-full">
              <Check className="mr-1.5 size-4" />
              Confirm & Create Jobs
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
