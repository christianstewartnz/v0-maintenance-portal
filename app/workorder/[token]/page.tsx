"use client"

import { useState, useEffect, useCallback } from "react"
import { use } from "react"
import { format } from "date-fns"
import { CheckCircle2, Circle, Wrench, Loader2 } from "lucide-react"
import type { WorkOrder, WorkOrderItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export default function ContractorWorkOrderPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Which WorkOrderItem is showing the notes/confirm form
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  // Notes keyed by WorkOrderItem id
  const [notesMap, setNotesMap] = useState<Record<string, string>>({})
  // Which item is currently being submitted
  const [completingItemId, setCompletingItemId] = useState<string | null>(null)
  // Per-item error messages
  const [itemErrors, setItemErrors] = useState<Record<string, string>>({})

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/work-orders/access/${token}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error("This link is invalid or has expired.")
        throw new Error("Failed to load work order.")
      }
      const data = await res.json()
      if (!data.isActive) throw new Error("This access link is no longer active.")
      setWorkOrder(data.workOrder)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An error occurred.")
    } finally {
      setLoading(false)
    }
  }, [token])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isReadOnly = workOrder?.status === "Completed" || workOrder?.status === "Closed"
  const completedCount = workOrder?.items?.filter((i) => i.isCompletedByContractor).length ?? 0
  const totalCount = workOrder?.items?.length ?? 0
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const handleExpandItem = (itemId: string) => {
    setExpandedItemId((prev) => (prev === itemId ? null : itemId))
    setItemErrors((prev) => ({ ...prev, [itemId]: "" }))
  }

  const handleMarkComplete = async (woItem: WorkOrderItem) => {
    const woItemId = woItem.id
    setCompletingItemId(woItemId)
    setItemErrors((prev) => ({ ...prev, [woItemId]: "" }))

    try {
      const completionNotes = notesMap[woItemId]?.trim() || undefined
      const res = await fetch(`/api/work-orders/access/${token}/complete-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderItemId: woItemId, completionNotes }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Failed to update item.")
      }

      setExpandedItemId(null)
      setNotesMap((prev) => ({ ...prev, [woItemId]: "" }))
      await fetchData()
    } catch (err: unknown) {
      setItemErrors((prev) => ({
        ...prev,
        [woItemId]: err instanceof Error ? err.message : "Failed to update item.",
      }))
    } finally {
      setCompletingItemId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading work order...</p>
        </div>
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <Wrench className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <h1 className="text-lg font-semibold text-foreground">Unable to load work order</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error ?? "Work order not found."}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Maintenance Portal</span>
        </div>

        {/* Work order summary */}
        <Card className="mb-8 gap-0 border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 px-6 py-6">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Work Order {workOrder.reference}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {workOrder.project?.name} &middot; {workOrder.contractor?.name}
              </p>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="mb-2 flex items-end justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {completedCount} of {totalCount} items completed
                </p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{progressPct}%</p>
              </div>
              <Progress value={progressPct} className="h-3 rounded-full" />
            </div>

            {workOrder.accessNotes && (
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Access Notes
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {workOrder.accessNotes}
                </p>
              </div>
            )}

            {workOrder.messageBody && (
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">
                  {workOrder.messageBody}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Read-only banner */}
        {isReadOnly && (
          <div className="mb-6 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-900 dark:bg-green-950/30">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  This work order has been submitted as complete.
                </p>
                {workOrder.completedAt && (
                  <p className="mt-0.5 text-xs text-green-600 dark:text-green-400">
                    Completed on {format(new Date(workOrder.completedAt), "MMMM d, yyyy")}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items list */}
        <div className="space-y-3">
          {workOrder.items?.map((woItem) => (
            <WorkOrderItemCard
              key={woItem.id}
              woItem={woItem}
              isReadOnly={isReadOnly}
              isExpanded={expandedItemId === woItem.id}
              isCompleting={completingItemId === woItem.id}
              anyCompleting={completingItemId !== null}
              notes={notesMap[woItem.id] ?? ""}
              itemError={itemErrors[woItem.id] ?? ""}
              onExpand={() => handleExpandItem(woItem.id)}
              onCancel={() => {
                setExpandedItemId(null)
                setItemErrors((prev) => ({ ...prev, [woItem.id]: "" }))
              }}
              onNotesChange={(value) =>
                setNotesMap((prev) => ({ ...prev, [woItem.id]: value }))
              }
              onConfirm={() => handleMarkComplete(woItem)}
            />
          ))}
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Maintenance Portal &middot; {workOrder.reference}
          </p>
        </div>
      </div>
    </div>
  )
}

interface WorkOrderItemCardProps {
  woItem: WorkOrderItem
  isReadOnly: boolean
  isExpanded: boolean
  isCompleting: boolean
  anyCompleting: boolean
  notes: string
  itemError: string
  onExpand: () => void
  onCancel: () => void
  onNotesChange: (value: string) => void
  onConfirm: () => void
}

function WorkOrderItemCard({
  woItem,
  isReadOnly,
  isExpanded,
  isCompleting,
  anyCompleting,
  notes,
  itemError,
  onExpand,
  onCancel,
  onNotesChange,
  onConfirm,
}: WorkOrderItemCardProps) {
  const isCompleted = woItem.isCompletedByContractor

  return (
    <Card
      className={`gap-0 border-border/80 py-0 shadow-sm transition-colors ${
        isCompleted
          ? "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20"
          : "bg-card"
      }`}
    >
      <CardContent className="px-5 py-4">
        <div className="flex items-start gap-3">
          {/* Status icon */}
          <div className="mt-0.5 shrink-0">
            {isCompleting ? (
              <Loader2 className="size-5 animate-spin text-primary" />
            ) : isCompleted ? (
              <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
            ) : (
              <Circle className="size-5 text-muted-foreground/40" />
            )}
          </div>

          {/* Body */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <p
                className={`text-base font-semibold leading-snug ${
                  isCompleted ? "text-muted-foreground line-through" : "text-foreground"
                }`}
              >
                {woItem.item?.title}
              </p>
              {woItem.item?.trade && (
                <Badge variant="outline" className="shrink-0 text-xs text-muted-foreground">
                  {woItem.item.trade}
                </Badge>
              )}
            </div>

            {woItem.item?.description && (
              <p className="text-sm leading-relaxed text-muted-foreground">
                {woItem.item.description}
              </p>
            )}

            {/* Completed state details */}
            {isCompleted && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1">
                <Badge
                  variant="outline"
                  className="border-green-300 bg-green-100/70 text-green-800 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300"
                >
                  Completed
                </Badge>
                {woItem.completedAt && (
                  <p className="text-xs text-green-700 dark:text-green-400">
                    {format(new Date(woItem.completedAt), "MMM d, yyyy")}
                  </p>
                )}
                {woItem.completionNotes && (
                  <p className="w-full text-xs text-muted-foreground">
                    Note: {woItem.completionNotes}
                  </p>
                )}
              </div>
            )}

            {/* Mark complete flow */}
            {!isCompleted && !isReadOnly && (
              <div className="pt-2">
                {isExpanded ? (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Add completion notes (optional)"
                      value={notes}
                      onChange={(e) => onNotesChange(e.target.value)}
                      className="min-h-[80px] resize-none text-sm"
                      disabled={isCompleting}
                    />
                    {itemError && (
                      <p className="text-xs text-red-600 dark:text-red-400">{itemError}</p>
                    )}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={onConfirm}
                        disabled={isCompleting}
                        className="h-8 flex-1 text-xs font-medium"
                      >
                        {isCompleting ? (
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="size-3 animate-spin" />
                            Saving...
                          </span>
                        ) : (
                          "Confirm Complete"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={onCancel}
                        disabled={isCompleting}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onExpand}
                    disabled={anyCompleting}
                    className="h-8 text-xs font-medium"
                  >
                    Mark Complete
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
