"use client"

import { useState, useMemo } from "react"
import { LayoutGrid, List, ClipboardList, Search } from "lucide-react"
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
import type { ItemStatus, Trade } from "@/lib/types"
import { format } from "date-fns"

const ALL_STATUSES: ItemStatus[] = ["New", "Assigned", "In Progress", "Completed", "Closed"]
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

export function ItemsListPage() {
  const { currentPage, items, navigateTo, projects, units } = useApp()

  const initialUnitFilter = currentPage.type === "items" && currentPage.filterUnitId
    ? currentPage.filterUnitId
    : "all"

  const [projectFilter, setProjectFilter] = useState("all")
  const [unitFilter, setUnitFilter] = useState(initialUnitFilter)
  const [statusFilter, setStatusFilter] = useState("all")
  const [tradeFilter, setTradeFilter] = useState("all")
  const [priorityFilter, setPriorityFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [viewMode, setViewMode] = useState<"table" | "board">("table")

  const filtered = useMemo(() => {
    return items.filter((item) => {
      if (projectFilter !== "all" && item.projectId !== projectFilter) return false
      if (unitFilter !== "all" && item.unitId !== unitFilter) return false
      if (statusFilter !== "all" && item.status !== statusFilter) return false
      if (tradeFilter !== "all" && item.trade !== tradeFilter) return false
      if (priorityFilter !== "all" && item.priority !== priorityFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const unit = units.find((u) => u.id === item.unitId)
        if (
          !item.title.toLowerCase().includes(q) &&
          !(unit?.unitNumber.toLowerCase().includes(q)) &&
          !(unit?.address.toLowerCase().includes(q))
        ) return false
      }
      return true
    })
  }, [items, projectFilter, unitFilter, statusFilter, tradeFilter, priorityFilter, search, units])

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Items</h1>
          <p className="text-sm text-muted-foreground">Track and manage maintenance work items</p>
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

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-44 text-xs">
              <SelectValue placeholder="Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              {ALL_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {ALL_TRADES.map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={priorityFilter} onValueChange={setPriorityFilter}>
            <SelectTrigger className="w-36 text-xs">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="Low">Low</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Urgent">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {unitFilter !== "all" && (
            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => setUnitFilter("all")}
            >
              Clear Unit Filter
            </Button>
          )}

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search items or units..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-48 pl-8 text-xs"
            />
          </div>
        </div>

        {viewMode === "table" ? (
          <Card>
            <CardContent className="pt-6">
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-muted-foreground">No items match filters</p>
                  <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
                </div>
              ) : (
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-medium">Project</TableHead>
                        <TableHead className="text-xs font-medium">Unit</TableHead>
                        <TableHead className="text-xs font-medium">Title</TableHead>
                        <TableHead className="text-xs font-medium">Trade</TableHead>
                        <TableHead className="text-xs font-medium">Priority</TableHead>
                        <TableHead className="text-xs font-medium">Status</TableHead>
                        <TableHead className="text-xs font-medium">Created</TableHead>
                        <TableHead className="text-xs font-medium">Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((item) => {
                        const project = projects.find((p) => p.id === item.projectId)
                        const unit = units.find((u) => u.id === item.unitId)
                        return (
                          <TableRow
                            key={item.id}
                            className="cursor-pointer hover:bg-accent/50"
                            onClick={() => navigateTo({ type: "unit-detail", unitId: item.unitId })}
                          >
                            <TableCell className="text-sm text-foreground">
                              {project?.name ?? "Unknown"}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {unit ? `Unit ${unit.unitNumber}` : "--"}
                            </TableCell>
                            <TableCell className="text-sm font-medium text-foreground">
                              {item.title}
                            </TableCell>
                            <TableCell className="text-sm text-foreground">{item.trade}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getPriorityStyle(item.priority)}>
                                {item.priority}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={getStatusStyle(item.status)}>
                                {item.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {format(new Date(item.createdAt), "MMM d")}
                            </TableCell>
                            <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                              {format(new Date(item.updatedAt), "MMM d")}
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
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
            {ALL_STATUSES.map((status) => {
              const columnItems = filtered.filter((i) => i.status === status)
              return (
                <div key={status} className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-foreground">{status}</h3>
                    <Badge variant="secondary" className="text-xs">{columnItems.length}</Badge>
                  </div>
                  <div className="flex flex-col gap-2">
                    {columnItems.map((item) => {
                      const unit = units.find((u) => u.id === item.unitId)
                      const project = projects.find((p) => p.id === item.projectId)
                      return (
                        <Card
                          key={item.id}
                          className="cursor-pointer shadow-sm transition-shadow hover:shadow-md"
                          onClick={() => navigateTo({ type: "unit-detail", unitId: item.unitId })}
                        >
                          <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-semibold leading-snug">
                              {item.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="flex flex-col gap-2 p-3 pt-1">
                            <p className="text-[11px] text-muted-foreground">
                              {unit ? `Unit ${unit.unitNumber}` : "No unit"}
                              {project ? ` - ${project.name}` : ""}
                            </p>
                            <div className="flex items-center gap-1.5">
                              <Badge
                                variant="outline"
                                className={`text-[10px] ${getPriorityStyle(item.priority)}`}
                              >
                                {item.priority}
                              </Badge>
                              <span className="text-[10px] text-muted-foreground">{item.trade}</span>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                    {columnItems.length === 0 && (
                      <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                        No items
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
