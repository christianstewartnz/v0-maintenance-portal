"use client"

import { useState } from "react"
import { LayoutGrid, List, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useApp } from "@/lib/app-context"
import { mockJobs, mockUnits, mockContractors } from "@/lib/mock-data"
import type { JobStatus, Trade } from "@/lib/types"
import { format } from "date-fns"

const ALL_STATUSES: JobStatus[] = ["New", "Assigned", "In Progress", "Completed", "Closed"]
const ALL_TRADES: Trade[] = [
  "Plumbing",
  "Electrical",
  "Carpentry",
  "Painting",
  "Appliance",
  "General",
  "Other",
]

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
    case "Completed":
      return "bg-success/10 text-success border-success/20"
    case "Closed":
      return "bg-muted text-muted-foreground border-border"
    default:
      return ""
  }
}

export function JobsTab() {
  const { currentProject } = useApp()
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [tradeFilter, setTradeFilter] = useState<string>("all")
  const [unitSearch, setUnitSearch] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "board">("table")

  if (!currentProject) return null

  const jobs = mockJobs.filter((j) => j.projectId === currentProject.id)
  const filtered = jobs.filter((j) => {
    if (statusFilter !== "all" && j.status !== statusFilter) return false
    if (tradeFilter !== "all" && j.trade !== tradeFilter) return false
    if (unitSearch) {
      const unit = mockUnits.find((u) => u.id === j.unitId)
      if (!unit) return false
      const q = unitSearch.toLowerCase()
      if (
        !unit.unitNumber.toLowerCase().includes(q) &&
        !unit.address.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Jobs</h2>
          <p className="text-sm text-muted-foreground">
            Track and manage maintenance work orders
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === "table" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setViewMode("table")}
          >
            <List className="size-4" />
            <span className="sr-only">Table view</span>
          </Button>
          <Button
            variant={viewMode === "board" ? "secondary" : "ghost"}
            size="icon"
            className="size-8"
            onClick={() => setViewMode("board")}
          >
            <LayoutGrid className="size-4" />
            <span className="sr-only">Board view</span>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
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

        <Select value={tradeFilter} onValueChange={setTradeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Trade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Trades</SelectItem>
            {ALL_TRADES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="Search by unit..."
          value={unitSearch}
          onChange={(e) => setUnitSearch(e.target.value)}
          className="w-48"
        />
      </div>

      {viewMode === "table" ? (
        <div className="rounded-lg border border-border">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="text-xs font-medium">Job Title</TableHead>
                <TableHead className="text-xs font-medium">Unit</TableHead>
                <TableHead className="text-xs font-medium">Trade</TableHead>
                <TableHead className="text-xs font-medium">Priority</TableHead>
                <TableHead className="text-xs font-medium">Status</TableHead>
                <TableHead className="text-xs font-medium">Contractor</TableHead>
                <TableHead className="text-xs font-medium">Updated</TableHead>
                <TableHead className="w-16 text-right text-xs font-medium">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="py-8 text-center text-sm text-muted-foreground"
                  >
                    No jobs match the current filters.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((job) => {
                  const unit = mockUnits.find((u) => u.id === job.unitId)
                  const contractor = job.assignedContractorId
                    ? mockContractors.find(
                        (c) => c.id === job.assignedContractorId
                      )
                    : null

                  return (
                    <TableRow key={job.id}>
                      <TableCell className="text-sm font-medium text-foreground">
                        {job.title}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {unit
                          ? `Unit ${unit.unitNumber} — ${unit.address}`
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-foreground">
                        {job.trade}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getPriorityStyle(job.priority)}
                        >
                          {job.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={getStatusStyle(job.status)}
                        >
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {contractor ? contractor.name : "Unassigned"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                        {format(new Date(job.updatedAt), "MMM d")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7">
                          <Eye className="size-3.5" />
                          <span className="sr-only">View job</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {ALL_STATUSES.map((status) => {
            const columnJobs = filtered.filter((j) => j.status === status)
            return (
              <div key={status} className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {status}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {columnJobs.length}
                  </Badge>
                </div>
                <div className="flex flex-col gap-2">
                  {columnJobs.map((job) => {
                    const unit = mockUnits.find((u) => u.id === job.unitId)
                    return (
                      <Card key={job.id} className="shadow-sm">
                        <CardHeader className="p-3 pb-1">
                          <CardTitle className="text-xs font-semibold leading-snug">
                            {job.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-2 p-3 pt-1">
                          <p className="text-[11px] text-muted-foreground">
                            {unit
                              ? `Unit ${unit.unitNumber}`
                              : "No unit"}
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Badge
                              variant="outline"
                              className={`text-[10px] ${getPriorityStyle(job.priority)}`}
                            >
                              {job.priority}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground">
                              {job.trade}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                  {columnJobs.length === 0 && (
                    <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No jobs
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
