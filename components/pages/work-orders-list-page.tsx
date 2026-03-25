"use client"

import { useState, useEffect, useMemo } from "react"
import { FileText, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useApp } from "@/lib/app-context"
import type { WorkOrderStatus } from "@/lib/types"
import { format } from "date-fns"

const ALL_STATUSES: WorkOrderStatus[] = ["Draft", "Issued", "In Progress", "Completed", "Closed"]

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

export function WorkOrdersListPage() {
  const {
    workOrders,
    fetchWorkOrders,
    projects,
    contractors,
    selectedProjectId,
    navigateTo,
  } = useApp()

  const [statusFilter, setStatusFilter] = useState("all")
  const [contractorFilter, setContractorFilter] = useState("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    fetchWorkOrders(selectedProjectId, {
      status: statusFilter,
      contractorId: contractorFilter,
    })
  }, [selectedProjectId, statusFilter, contractorFilter, fetchWorkOrders])

  const filtered = useMemo(() => {
    if (!search) return workOrders
    const q = search.toLowerCase()
    return workOrders.filter(
      (wo) =>
        wo.reference.toLowerCase().includes(q) ||
        wo.contractor?.name.toLowerCase().includes(q) ||
        wo.project?.name?.toLowerCase().includes(q)
    )
  }, [workOrders, search])

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Work Orders</h1>
          <p className="text-sm text-muted-foreground">
            Manage contractor work orders and track completion
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={contractorFilter} onValueChange={setContractorFilter}>
            <SelectTrigger className="w-44 text-xs">
              <SelectValue placeholder="Contractor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Contractors</SelectItem>
              {contractors.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search work orders..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-8 text-xs"
            />
          </div>
        </div>

        <Card>
          <CardContent className="pt-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <FileText className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No work orders found</p>
                <p className="text-xs text-muted-foreground">
                  Select items and use "Issue Work Order" to create one.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-medium">Reference</TableHead>
                      <TableHead className="text-xs font-medium">Project</TableHead>
                      <TableHead className="text-xs font-medium">Contractor</TableHead>
                      <TableHead className="text-xs font-medium">Items</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="text-xs font-medium">Created</TableHead>
                      <TableHead className="text-xs font-medium">Issued</TableHead>
                      <TableHead className="text-xs font-medium">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((wo) => {
                      const completedCount = wo.items?.filter(
                        (i) => i.isCompletedByContractor
                      ).length ?? 0
                      const totalCount = wo.items?.length ?? 0

                      return (
                        <TableRow
                          key={wo.id}
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() =>
                            navigateTo({
                              type: "work-order-detail",
                              workOrderId: wo.id,
                            })
                          }
                        >
                          <TableCell className="text-sm font-medium text-foreground">
                            {wo.reference}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {wo.project?.name ?? "Unknown"}
                          </TableCell>
                          <TableCell className="text-sm text-foreground">
                            {wo.contractor?.name ?? "Unknown"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {completedCount}/{totalCount}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusStyle(wo.status)}
                            >
                              {wo.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {format(new Date(wo.createdAt), "MMM d")}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {wo.issuedAt
                              ? format(new Date(wo.issuedAt), "MMM d")
                              : "--"}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {wo.completedAt
                              ? format(new Date(wo.completedAt), "MMM d")
                              : "--"}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
