"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { use } from "react"
import { format } from "date-fns"
import { CheckCircle2, Circle, Wrench, Loader2 } from "lucide-react"
import type { WorkOrder, WorkOrderItem } from "@/lib/types"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"

export default function ContractorAccessPage({
  params,
}: {
  params: Promise<{ token: string }>
}) {
  const { token } = use(params)

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [isActive, setIsActive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [completingItemId, setCompletingItemId] = useState<string | null>(null)
  const [completingAll, setCompletingAll] = useState(false)
  const [confirming, setConfirming] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/work-orders/access/${token}`)
      if (!res.ok) {
        if (res.status === 404) throw new Error("This link is invalid or has expired.")
        throw new Error("Failed to load work order.")
      }
      const data = await res.json()
      setWorkOrder(data.workOrder)
      setIsActive(data.isActive)
    } catch (err: any) {
      setError(err.message)
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
  const allComplete = totalCount > 0 && completedCount === totalCount

  const itemsByUnit = useMemo(() => {
    if (!workOrder?.items) return []
    const grouped: Record<
      string,
      { unitNumber: string; unitAddress: string; items: WorkOrderItem[] }
    > = {}
    for (const woItem of workOrder.items) {
      const unit = woItem.item?.unit
      const unitKey = unit?.id ?? "unknown"
      const unitNumber = unit?.unitNumber ?? "Unknown"
      const unitAddress = unit?.address ?? ""
      if (!grouped[unitKey]) {
        grouped[unitKey] = { unitNumber, unitAddress, items: [] }
      }
      grouped[unitKey].items.push(woItem)
    }

    return Object.entries(grouped)
      .map(([unitKey, g]) => {
        const seen = new Set<string>()
        const ownerContacts: {
          fromName: string
          fromEmail: string
          fromPhone: string | null
        }[] = []
        for (const wo of g.items) {
          const r = wo.item?.request
          if (!r) continue
          const emailKey = r.fromEmail.trim().toLowerCase()
          const dedupeKey =
            emailKey || `${r.fromName.trim()}\0${(r.fromPhone ?? "").trim()}`
          if (seen.has(dedupeKey)) continue
          seen.add(dedupeKey)
          ownerContacts.push({
            fromName: r.fromName,
            fromEmail: r.fromEmail,
            fromPhone: r.fromPhone ?? null,
          })
        }
        return [unitKey, { ...g, ownerContacts }] as const
      })
      .sort(([, a], [, b]) => a.unitNumber.localeCompare(b.unitNumber))
  }, [workOrder?.items])

  const handleMarkComplete = async (workOrderItemId: string) => {
    setCompletingItemId(workOrderItemId)
    try {
      const res = await fetch(`/api/work-orders/access/${token}/complete-item`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workOrderItemId }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update item completion")
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCompletingItemId(null)
    }
  }

  const handleMarkAllComplete = async () => {
    setCompletingAll(true)
    try {
      const res = await fetch(`/api/work-orders/access/${token}/complete-all`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to mark all items complete")
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCompletingAll(false)
    }
  }

  const handleConfirmComplete = async () => {
    setConfirming(true)
    try {
      const res = await fetch(`/api/work-orders/access/${token}/confirm`, {
        method: "POST",
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to confirm completion")
      }
      await fetchData()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setConfirming(false)
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

  if (error && !workOrder) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="mx-auto w-full max-w-md px-4">
          <div className="rounded-xl border border-border bg-card p-8 text-center shadow-sm">
            <Wrench className="mx-auto mb-4 size-10 text-muted-foreground/40" />
            <h1 className="text-lg font-semibold text-foreground">Unable to load work order</h1>
            <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  if (!workOrder) return null

  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {/* Header */}
        <div className="mb-2 flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-foreground">Maintenance Portal</span>
        </div>

        <Card className="mb-8 gap-0 border-border/80 py-0 shadow-sm">
          <CardHeader className="gap-2 px-6 py-6">
            <div className="flex flex-col gap-1">
              <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
                Work Order {workOrder.reference}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {workOrder.project?.name} &middot; {workOrder.contractor?.name}
              </p>
              {workOrder.project?.developmentCompany && (
                <p className="text-xs text-muted-foreground">{workOrder.project.developmentCompany}</p>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4 px-6 pb-6">
            {/* Progress */}
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
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{workOrder.accessNotes}</p>
              </div>
            )}

            {workOrder.messageBody && (
              <div className="rounded-lg bg-muted/50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Message
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{workOrder.messageBody}</p>
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
                  This work order has already been submitted as complete.
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

        {/* Error banner */}
        {error && workOrder && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-4 dark:border-red-900 dark:bg-red-950/30">
            <p className="text-sm text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* Items by unit */}
        <div className="space-y-6">
          {itemsByUnit.map(
            ([unitId, { unitNumber, unitAddress, ownerContacts, items: woItems }]) => (
            <Card key={unitId} className="gap-0 border-border/80 py-0 shadow-sm">
              <CardHeader className="gap-3 px-5 py-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-foreground">
                    Unit {unitNumber}
                  </h3>
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    {woItems.length} item{woItems.length === 1 ? "" : "s"}
                  </Badge>
                </div>
                <div className="space-y-2 text-sm">
                  {ownerContacts.length > 0 && (
                    <div className="space-y-2">
                      {ownerContacts.map((c, idx) => (
                        <div key={idx} className="rounded-md bg-muted/35 px-3 py-2">
                          <p className="font-medium text-foreground">{c.fromName}</p>
                          <p className="text-muted-foreground">{c.fromEmail}</p>
                          {c.fromPhone?.trim() ? (
                            <p className="text-muted-foreground">{c.fromPhone}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  )}
                  {unitAddress.trim() ? (
                    <p className="rounded-md bg-muted/35 px-3 py-2 text-muted-foreground">{unitAddress}</p>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 px-5 pb-5">
                {woItems.map((woItem) => {
                  const isCompleted = woItem.isCompletedByContractor
                  const isCompletingThis = completingItemId === woItem.id

                  return (
                    <div
                      key={woItem.id}
                      className={`rounded-xl border p-4 shadow-xs transition-colors ${
                        isCompleted
                          ? "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20"
                          : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => handleMarkComplete(woItem.id)}
                          disabled={isReadOnly || isCompletingThis || completingAll || confirming}
                          aria-label={isCompleted ? "Mark item incomplete" : "Mark item complete"}
                          className="mt-0.5 shrink-0 rounded-full text-left transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isCompletingThis ? (
                            <Loader2 className="size-5 animate-spin text-primary" />
                          ) : isCompleted ? (
                            <CheckCircle2 className="size-5 text-green-600 dark:text-green-400" />
                          ) : (
                            <Circle className="size-5 text-muted-foreground/40" />
                          )}
                        </button>
                        <div className="min-w-0 flex-1 space-y-1">
                          <p
                            className={`text-base font-semibold leading-snug ${
                              isCompleted
                                ? "text-muted-foreground line-through"
                                : "text-foreground"
                            }`}
                          >
                            {woItem.item?.title}
                          </p>
                          {woItem.item?.description && (
                            <p className="text-sm leading-relaxed text-muted-foreground">
                              {woItem.item.description}
                            </p>
                          )}
                          {isCompleted && (
                            <div className="pt-1">
                              <Badge
                                variant="outline"
                                className="border-green-300 bg-green-100/70 text-green-800 dark:border-green-800 dark:bg-green-950/60 dark:text-green-300"
                              >
                                Completed
                              </Badge>
                            </div>
                          )}
                          {isCompleted && woItem.completedAt && (
                            <p className="text-xs text-green-700 dark:text-green-400">
                              Completed {format(new Date(woItem.completedAt), "MMM d, yyyy")}
                            </p>
                          )}
                        </div>
                        {!isReadOnly && (
                          <div className="shrink-0 pt-0.5 text-xs text-muted-foreground">
                            {isCompleted ? "Checked" : "Tap circle"}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
          )}
        </div>

        {/* Actions */}
        {!isReadOnly && (
          <Card className="mt-10 gap-0 border-border/80 py-0 shadow-sm">
            <CardContent className="space-y-3 px-5 py-5">
            {!allComplete && (
              <Button
                onClick={handleMarkAllComplete}
                disabled={completingAll || completedCount === totalCount}
                variant="outline"
                className="h-11 w-full"
              >
                {completingAll ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Marking all complete...
                  </span>
                ) : (
                  "Mark All as Complete"
                )}
              </Button>
            )}

            {allComplete && (
              <Button
                onClick={handleConfirmComplete}
                disabled={confirming}
                className="h-11 w-full text-sm font-semibold"
              >
                {confirming ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="size-4 animate-spin" />
                    Confirming...
                  </span>
                ) : (
                  "Confirm Work Order Complete"
                )}
              </Button>
            )}
            </CardContent>
          </Card>
        )}

        <div className="mt-12 border-t border-border pt-6 text-center">
          <p className="text-xs text-muted-foreground">
            Maintenance Portal &middot; {workOrder.reference}
          </p>
        </div>
      </div>
    </div>
  )
}
