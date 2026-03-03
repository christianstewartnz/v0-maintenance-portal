"use client"

import { useState, useMemo } from "react"
import {
  ClipboardList,
  AlertTriangle,
  MessageSquareText,
  DoorOpen,
  Search,
  Archive,
  ArchiveRestore,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
import { useApp } from "@/lib/app-context"
import type { ItemStatus, Trade } from "@/lib/types"
import { format } from "date-fns"

const ALL_STATUSES: ItemStatus[] = ["New", "Assigned", "In Progress", "Completed", "Closed"]
const ALL_TRADES: Trade[] = ["Plumbing", "Electrical", "Carpentry", "Painting", "Appliance", "General", "Other"]

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

export function ProjectDetailPage() {
  const { currentPage, items, requests, navigateTo, projects, units, archiveProject, archiveUnit, fetchUnits } = useApp()

  const projectId = currentPage.type === "project-detail" ? currentPage.projectId : null
  const project = projectId ? projects.find((p) => p.id === projectId) : null

  const [statusFilter, setStatusFilter] = useState("all")
  const [tradeFilter, setTradeFilter] = useState("all")
  const [unitSearch, setUnitSearch] = useState("")
  const [showArchivedUnits, setShowArchivedUnits] = useState(false)

  const projectUnits = useMemo(() => {
    if (!projectId) return []
    const all = units.filter((u) => u.projectId === projectId)
    return showArchivedUnits ? all : all.filter((u) => !u.archivedAt)
  }, [projectId, units, showArchivedUnits])

  const handleToggleArchivedUnits = (checked: boolean) => {
    setShowArchivedUnits(checked)
    fetchUnits(checked)
  }

  if (!project || !projectId) return null

  const isArchived = !!project.archivedAt

  const projectItems = items.filter((i) => i.projectId === projectId)
  const openItems = projectItems.filter((i) => !["Completed", "Closed"].includes(i.status))
  const highPriority = openItems.filter((i) => i.priority === "Urgent")
  const reviewCount = requests.filter(
    (r) => r.projectId === projectId && r.status === "needs_review"
  ).length
  const unitsWithOpenItems = new Set(openItems.map((i) => i.unitId)).size

  const filteredItems = openItems.filter((i) => {
    if (statusFilter !== "all" && i.status !== statusFilter) return false
    if (tradeFilter !== "all" && i.trade !== tradeFilter) return false
    if (unitSearch) {
      const unit = units.find((u) => u.id === i.unitId)
      if (!unit) return false
      const q = unitSearch.toLowerCase()
      if (!unit.unitNumber.toLowerCase().includes(q) && !unit.address.toLowerCase().includes(q)) return false
    }
    return true
  })

  const kpis = [
    { label: "Open Items", value: openItems.length, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10" },
    { label: "High Priority Items", value: highPriority.length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Requests Needing Review", value: reviewCount, icon: MessageSquareText, color: "text-warning-foreground", bg: "bg-warning/10" },
    { label: "Units With Open Items", value: unitsWithOpenItems, icon: DoorOpen, color: "text-chart-2", bg: "bg-chart-2/10" },
  ]

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink
                  className="cursor-pointer text-muted-foreground hover:text-foreground"
                  onClick={() => navigateTo({ type: "projects" })}
                >
                  Projects
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{project.name}</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          {isArchived && (
            <Badge variant="secondary" className="text-xs">Archived</Badge>
          )}
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              {isArchived ? (
                <><ArchiveRestore className="mr-1.5 size-3.5" /> Unarchive</>
              ) : (
                <><Archive className="mr-1.5 size-3.5" /> Archive</>
              )}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {isArchived ? "Unarchive" : "Archive"} &ldquo;{project.name}&rdquo;?
              </AlertDialogTitle>
              <AlertDialogDescription>
                {isArchived
                  ? "This will restore the project to active views."
                  : "This will hide the project from default views. Units, requests, and items will be preserved."}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => archiveProject(project.id, !isArchived)}>
                {isArchived ? "Unarchive" : "Archive"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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

        <Tabs defaultValue="items" className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="items">Open Items</TabsTrigger>
            <TabsTrigger value="units">Units Overview</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Open Items ({filteredItems.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-36 text-xs">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        {ALL_STATUSES.filter((s) => s !== "Completed" && s !== "Closed").map((s) => (
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
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search unit..."
                        value={unitSearch}
                        onChange={(e) => setUnitSearch(e.target.value)}
                        className="w-40 pl-8 text-xs"
                      />
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No items match filters</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-medium">Unit</TableHead>
                          <TableHead className="text-xs font-medium">Title</TableHead>
                          <TableHead className="text-xs font-medium">Trade</TableHead>
                          <TableHead className="text-xs font-medium">Priority</TableHead>
                          <TableHead className="text-xs font-medium">Status</TableHead>
                          <TableHead className="text-xs font-medium">Updated</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredItems.map((item) => {
                          const unit = units.find((u) => u.id === item.unitId)
                          return (
                            <TableRow
                              key={item.id}
                              className="cursor-pointer hover:bg-accent/50"
                              onClick={() => navigateTo({ type: "unit-detail", unitId: item.unitId })}
                            >
                              <TableCell className="text-sm text-muted-foreground">
                                {unit ? `Unit ${unit.unitNumber}` : "--"}
                              </TableCell>
                              <TableCell className="text-sm font-medium text-foreground">{item.title}</TableCell>
                              <TableCell className="text-sm text-foreground">{item.trade}</TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getPriorityStyle(item.priority)}>{item.priority}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className={getStatusStyle(item.status)}>{item.status}</Badge>
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
          </TabsContent>

          <TabsContent value="units" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Units Overview ({projectUnits.length})
                  </CardTitle>
                  <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                    <Checkbox
                      checked={showArchivedUnits}
                      onCheckedChange={(checked) => handleToggleArchivedUnits(checked === true)}
                    />
                    Show archived
                  </label>
                </div>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="text-xs font-medium">Unit</TableHead>
                        <TableHead className="text-xs font-medium">Address</TableHead>
                        <TableHead className="text-xs font-medium">Open Items</TableHead>
                        <TableHead className="text-xs font-medium">High Priority</TableHead>
                        <TableHead className="text-xs font-medium">Last Activity</TableHead>
                        <TableHead className="text-xs font-medium w-[1%]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {projectUnits.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                            No units in this project.
                          </TableCell>
                        </TableRow>
                      ) : (
                        projectUnits.map((unit) => {
                          const isUnitArchived = !!unit.archivedAt
                          const unitItems = openItems.filter((i) => i.unitId === unit.id)
                          const unitHighPriority = unitItems.filter((i) => i.priority === "Urgent")
                          const allUnitItems = items.filter((i) => i.unitId === unit.id)
                          const lastActivity = allUnitItems.length > 0
                            ? allUnitItems.reduce((latest, i) =>
                                new Date(i.updatedAt) > new Date(latest.updatedAt) ? i : latest
                              ).updatedAt
                            : null
                          return (
                            <TableRow
                              key={unit.id}
                              className={`cursor-pointer hover:bg-accent/50 ${isUnitArchived ? "opacity-60" : ""}`}
                              onClick={() => navigateTo({ type: "unit-detail", unitId: unit.id })}
                            >
                              <TableCell className="text-sm font-medium text-foreground">
                                <span className="flex items-center gap-2">
                                  Unit {unit.unitNumber}
                                  {isUnitArchived && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                                </span>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">{unit.address}</TableCell>
                              <TableCell>
                                <Badge variant={unitItems.length > 0 ? "default" : "secondary"} className="text-xs">
                                  {unitItems.length}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {unitHighPriority.length > 0 ? (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                                    {unitHighPriority.length}
                                  </Badge>
                                ) : (
                                  <span className="text-sm text-muted-foreground">0</span>
                                )}
                              </TableCell>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {lastActivity ? format(new Date(lastActivity), "MMM d") : "--"}
                              </TableCell>
                              <TableCell onClick={(e) => e.stopPropagation()}>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="size-7">
                                      {isUnitArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>
                                        {isUnitArchived ? "Unarchive" : "Archive"} Unit {unit.unitNumber}?
                                      </AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {isUnitArchived
                                          ? "This will restore the unit to active views."
                                          : "This will hide the unit from default views. Items will be preserved."}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => archiveUnit(unit.id, !isUnitArchived)}>
                                        {isUnitArchived ? "Unarchive" : "Archive"}
                                      </AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  )
}
