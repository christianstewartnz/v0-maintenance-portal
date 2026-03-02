"use client"

import { ClipboardList, AlertTriangle, MessageSquareText, Building2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApp } from "@/lib/app-context"
import { mockProjects, mockUnits } from "@/lib/mock-data"
import { format } from "date-fns"

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

export function DashboardPage() {
  const { items, requests, navigateTo } = useApp()

  const openItems = items.filter((i) => !["Completed", "Closed"].includes(i.status))
  const highPriorityItems = openItems.filter((i) => i.priority === "Urgent")
  const requestsNeedingReview = requests.filter((r) => r.status === "needs_review")
  const projectsWithOpenItems = new Set(openItems.map((i) => i.projectId)).size

  const kpis = [
    {
      label: "Open Items",
      value: openItems.length,
      icon: ClipboardList,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "High Priority Items",
      value: highPriorityItems.length,
      icon: AlertTriangle,
      color: "text-destructive",
      bg: "bg-destructive/10",
    },
    {
      label: "Requests Needing Review",
      value: requestsNeedingReview.length,
      icon: MessageSquareText,
      color: "text-warning-foreground",
      bg: "bg-warning/10",
    },
    {
      label: "Projects With Open Items",
      value: projectsWithOpenItems,
      icon: Building2,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Portfolio overview across all projects</p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-4 p-4">
                <div className={`flex size-10 items-center justify-center rounded-lg ${kpi.bg}`}>
                  <kpi.icon className={`size-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Open Items</CardTitle>
          </CardHeader>
          <CardContent>
            {openItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No open items</p>
                <p className="text-xs text-muted-foreground">All items have been completed or closed.</p>
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
                    {openItems.map((item) => {
                      const project = mockProjects.find((p) => p.id === item.projectId)
                      const unit = mockUnits.find((u) => u.id === item.unitId)
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
      </div>
    </div>
  )
}
