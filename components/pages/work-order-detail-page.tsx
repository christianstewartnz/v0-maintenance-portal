"use client"

import { useState, useEffect, useMemo } from "react"
import { format } from "date-fns"
import {
  FileText,
  Send,
  XCircle,
  CheckCircle2,
  Clock,
  Copy,
  Check,
  ExternalLink,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
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
import { Separator } from "@/components/ui/separator"
import { useApp } from "@/lib/app-context"
import type { WorkOrder, WorkOrderItem } from "@/lib/types"

function getStatusStyle(status: string) {
  switch (status) {
    case "Draft":
      return "bg-muted text-muted-foreground border-border"
    case "Issued":
      return "bg-primary/10 text-primary border-primary/20"
    case "In Progress":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    case "Completed":
      return "bg-success/10 text-success border-success/20"
    case "Closed":
      return "bg-muted text-muted-foreground border-border"
    default:
      return ""
  }
}

function getItemStatusStyle(status: string) {
  switch (status) {
    case "New":
      return "bg-primary/10 text-primary border-primary/20"
    case "Assigned":
      return "bg-chart-2/10 text-chart-2 border-chart-2/20"
    case "In Progress":
      return "bg-warning/10 text-warning-foreground border-warning/20"
    case "Marked Complete - Needs Review":
      return "bg-amber-500/10 text-amber-600 border-amber-500/20"
    case "Completed (Legacy)":
      return "bg-success/10 text-success border-success/20"
    case "Closed":
      return "bg-muted text-muted-foreground border-border"
    default:
      return ""
  }
}

export function WorkOrderDetailPage() {
  const { currentPage, navigateTo, issueWorkOrder, closeWorkOrder, fetchWorkOrders, selectedProjectId } = useApp()

  const workOrderId = currentPage.type === "work-order-detail" ? currentPage.workOrderId : null

  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [issuing, setIssuing] = useState(false)
  const [closing, setClosing] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [accessUrl, setAccessUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!workOrderId) return
    setLoading(true)
    fetch(`/api/work-orders/${workOrderId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to load work order")
        const data = await res.json()
        setWorkOrder(data)
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [workOrderId])

  const activeToken = workOrder?.access?.find((a) => a.isActive)?.token
  const computedAccessUrl = activeToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/work-orders/access/${activeToken}`
    : null

  const itemsByUnit = useMemo(() => {
    if (!workOrder?.items) return []
    const grouped: Record<string, { unitNumber: string; address: string; items: WorkOrderItem[] }> = {}
    for (const woItem of workOrder.items) {
      const unit = woItem.item?.unit
      const unitKey = unit?.id ?? "unknown"
      const unitNumber = unit?.unitNumber ?? "Unknown"
      const address = unit?.address ?? ""
      if (!grouped[unitKey]) {
        grouped[unitKey] = { unitNumber, address, items: [] }
      }
      grouped[unitKey].items.push(woItem)
    }
    return Object.entries(grouped).sort(([, a], [, b]) =>
      a.unitNumber.localeCompare(b.unitNumber)
    )
  }, [workOrder?.items])

  const allActivities = useMemo(() => {
    if (!workOrder?.items) return []
    const activities: { id: string; itemTitle: string; message: string; createdAt: string }[] = []
    for (const woItem of workOrder.items) {
      for (const activity of woItem.item?.activities ?? []) {
        activities.push({
          id: activity.id,
          itemTitle: woItem.item?.title ?? "Unknown Item",
          message: activity.message,
          createdAt: activity.createdAt,
        })
      }
    }
    return activities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [workOrder?.items])

  const completedCount = workOrder?.items?.filter((i) => i.isCompletedByContractor).length ?? 0
  const totalCount = workOrder?.items?.length ?? 0

  const handleIssue = async () => {
    if (!workOrderId) return
    setIssuing(true)
    try {
      const result = await issueWorkOrder(workOrderId)
      setWorkOrder(result.workOrder)
      setAccessUrl(result.accessUrl)
      await fetchWorkOrders(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIssuing(false)
    }
  }

  const handleClose = async () => {
    if (!workOrderId) return
    setClosing(true)
    try {
      await closeWorkOrder(workOrderId)
      const res = await fetch(`/api/work-orders/${workOrderId}`)
      if (res.ok) setWorkOrder(await res.json())
      await fetchWorkOrders(selectedProjectId)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setClosing(false)
    }
  }

  const copyAccessUrl = () => {
    const url = accessUrl ?? computedAccessUrl
    if (!url) return
    navigator.clipboard.writeText(url)
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading work order...</p>
        </div>
      </div>
    )
  }

  if (error || !workOrder) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <FileText className="size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">{error ?? "Work order not found"}</p>
          <Button variant="outline" size="sm" onClick={() => navigateTo({ type: "work-orders" })}>
            Back to Work Orders
          </Button>
        </div>
      </div>
    )
  }

  const displayAccessUrl = accessUrl ?? computedAccessUrl

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo({ type: "work-orders" })}
              >
                Work Orders
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{workOrder.reference}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex items-start justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">{workOrder.reference}</h2>
              <Badge variant="outline" className={getStatusStyle(workOrder.status)}>
                {workOrder.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {workOrder.project?.name} &middot; {completedCount}/{totalCount} items completed
            </p>
          </div>

          <div className="flex items-center gap-2">
            {workOrder.status === "Draft" && (
              <Button onClick={handleIssue} disabled={issuing} size="sm">
                <Send className="mr-1.5 size-3.5" />
                {issuing ? "Issuing..." : "Issue Work Order"}
              </Button>
            )}
            {(workOrder.status === "Completed" || workOrder.status === "In Progress") && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" disabled={closing}>
                    <XCircle className="mr-1.5 size-3.5" />
                    Close Work Order
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Close this work order?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will mark the work order as Closed. This action signals internal sign-off.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleClose}>Close Work Order</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 flex flex-col gap-6">
            {/* Contractor Access Link */}
            {displayAccessUrl && workOrder.status !== "Draft" && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Contractor Access Link</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 truncate rounded bg-muted px-3 py-2 text-xs text-foreground">
                      {displayAccessUrl}
                    </code>
                    <Button variant="outline" size="sm" onClick={copyAccessUrl}>
                      {copiedUrl ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={displayAccessUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="size-3.5" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Items grouped by unit */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Items</CardTitle>
              </CardHeader>
              <CardContent>
                {itemsByUnit.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No items assigned.</p>
                ) : (
                  <div className="space-y-6">
                    {itemsByUnit.map(([unitId, { unitNumber, items: woItems }]) => (
                      <div key={unitId}>
                        <h4 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                          Unit {unitNumber}
                        </h4>
                        <div className="rounded-lg border border-border">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/50">
                                <TableHead className="w-8 text-xs font-medium" />
                                <TableHead className="text-xs font-medium">Title</TableHead>
                                <TableHead className="text-xs font-medium">Trade</TableHead>
                                <TableHead className="text-xs font-medium">Status</TableHead>
                                <TableHead className="text-xs font-medium">Contractor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {woItems.map((woItem) => (
                                <TableRow key={woItem.id}>
                                  <TableCell>
                                    {woItem.isCompletedByContractor ? (
                                      <CheckCircle2 className="size-4 text-green-600" />
                                    ) : (
                                      <Clock className="size-4 text-muted-foreground" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div>
                                      <p className="text-sm font-medium text-foreground">{woItem.item?.title}</p>
                                      {woItem.item?.description && (
                                        <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                                          {woItem.item.description}
                                        </p>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-sm text-foreground">
                                    {woItem.item?.trade}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className={getItemStatusStyle(woItem.item?.status ?? "")}>
                                      {woItem.item?.status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell>
                                    {woItem.isCompletedByContractor ? (
                                      <span className="text-xs text-green-600">
                                        Completed {woItem.completedAt ? format(new Date(woItem.completedAt), "MMM d") : ""}
                                      </span>
                                    ) : (
                                      <span className="text-xs text-muted-foreground">Pending</span>
                                    )}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Activity Timeline */}
            {allActivities.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {allActivities.map((activity) => (
                      <div key={activity.id} className="flex items-start gap-3">
                        <div className="mt-1 size-2 shrink-0 rounded-full bg-muted-foreground/30" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-foreground">{activity.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.itemTitle} &middot; {format(new Date(activity.createdAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar details */}
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Project</p>
                  <p
                    className="cursor-pointer text-sm text-foreground hover:underline"
                    onClick={() => {
                      if (workOrder.project?.id) {
                        navigateTo({ type: "project-detail", projectId: workOrder.project.id })
                      }
                    }}
                  >
                    {workOrder.project?.name ?? "Unknown"}
                  </p>
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Contractor</p>
                  <p className="text-sm font-medium text-foreground">{workOrder.contractor?.name}</p>
                  <p className="text-xs text-muted-foreground">{workOrder.contractor?.contactName}</p>
                  <p className="text-xs text-muted-foreground">{workOrder.contractor?.email}</p>
                  {workOrder.contractor?.phone && (
                    <p className="text-xs text-muted-foreground">{workOrder.contractor.phone}</p>
                  )}
                </div>

                <Separator />

                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">{format(new Date(workOrder.createdAt), "MMM d, yyyy h:mm a")}</p>
                </div>

                {workOrder.issuedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Issued</p>
                    <p className="text-sm text-foreground">{format(new Date(workOrder.issuedAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}

                {workOrder.completedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Completed</p>
                    <p className="text-sm text-foreground">{format(new Date(workOrder.completedAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}

                {workOrder.closedAt && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Closed</p>
                    <p className="text-sm text-foreground">{format(new Date(workOrder.closedAt), "MMM d, yyyy h:mm a")}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {(workOrder.accessNotes || workOrder.messageBody) && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Notes</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {workOrder.accessNotes && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Access Notes</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{workOrder.accessNotes}</p>
                    </div>
                  )}
                  {workOrder.messageBody && (
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Message to Contractor</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{workOrder.messageBody}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
