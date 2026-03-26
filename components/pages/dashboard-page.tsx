"use client"

import { ClipboardList, AlertTriangle, MessageSquareText, Wrench } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardAction } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApp } from "@/lib/app-context"
import { format } from "date-fns"
import { Filter } from "lucide-react"

function getPriorityStyle(priority: string) {
  switch (priority) {
    case "Urgent":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "Normal":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "Low":
      return "bg-gray-100 text-gray-600 border-gray-200"
    default:
      return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

function getStatusStyle(status: string) {
  switch (status) {
    case "New":
      return "bg-gray-100 text-gray-600 border-gray-200"
    case "Assigned":
      return "bg-blue-50 text-blue-700 border-blue-200"
    case "In Progress":
      return "bg-yellow-50 text-yellow-700 border-yellow-200"
    case "Marked Complete – Needs Review":
      return "bg-orange-50 text-orange-700 border-orange-200"
    case "Completed":
      return "bg-green-50 text-green-700 border-green-200"
    case "Closed":
      return "bg-green-50 text-green-700 border-green-200"
    default:
      return "bg-gray-100 text-gray-600 border-gray-200"
  }
}

export function DashboardPage() {
  const { items, requests, navigateTo, projects, units, workOrders } = useApp()

  const openItems = items.filter((i) => !["Completed", "Closed"].includes(i.status))
  const highPriorityItems = openItems.filter((i) => i.priority === "Urgent")
  const requestsNeedingReview = requests.filter((r) => r.status === "needs_review")
  const activeWorkOrders = workOrders?.filter((wo) => wo.status === "open" || wo.status === "in_progress")?.length ?? 0

  const kpis = [
    {
      label: "Open Items",
      value: openItems.length,
      icon: ClipboardList,
    },
    {
      label: "High Priority Items",
      value: highPriorityItems.length,
      icon: AlertTriangle,
    },
    {
      label: "Requests Needing Review",
      value: requestsNeedingReview.length,
      icon: MessageSquareText,
    },
    {
      label: "Active Work Orders",
      value: activeWorkOrders,
      icon: Wrench,
    },
  ]

  return (
    <div className="min-h-full bg-muted/40">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of projects and outstanding items
          </p>
        </div>

        {/* KPI Summary Cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="bg-white transition-shadow hover:shadow-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <kpi.icon className="size-4" />
                  {kpi.label}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-2xl font-semibold text-foreground">{kpi.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Open Items Table Card */}
        <Card className="bg-white">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-foreground">Open Items</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="size-4" />
                Filter
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="space-y-4">
            {openItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No open items</p>
                <p className="text-xs text-muted-foreground">
                  All items have been completed or closed.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="px-4 py-2 text-xs font-medium">Project</TableHead>
                      <TableHead className="px-4 py-2 text-xs font-medium">Unit</TableHead>
                      <TableHead className="px-4 py-2 text-xs font-medium">Title</TableHead>
                      <TableHead className="px-4 py-2 text-xs font-medium">Trade</TableHead>
                      <TableHead className="px-4 py-2 text-xs font-medium">Priority</TableHead>
                      <TableHead className="px-4 py-2 text-xs font-medium">Status</TableHead>
                      <TableHead className="px-4 py-2 text-xs font-medium">Updated</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {openItems.map((item) => {
                      const project = projects.find((p) => p.id === item.projectId)
                      const unit = units.find((u) => u.id === item.unitId)
                      return (
                        <TableRow
                          key={item.id}
                          className="cursor-pointer hover:bg-muted/30"
                          onClick={() => navigateTo({ type: "unit-detail", unitId: item.unitId })}
                        >
                          <TableCell className="px-4 py-2 text-sm text-foreground">
                            {project?.name ?? "Unknown"}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm text-muted-foreground">
                            {unit ? `Unit ${unit.unitNumber}` : "--"}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm font-medium text-foreground max-w-[200px] truncate">
                            {item.title}
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm text-foreground">
                            {item.trade}
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <Badge variant="outline" className={getPriorityStyle(item.priority)}>
                              {item.priority}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2">
                            <Badge variant="outline" className={getStatusStyle(item.status)}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-2 text-sm text-muted-foreground whitespace-nowrap">
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
      </div>
    </div>
  )
}
