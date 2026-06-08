"use client"

import { useState, useMemo, useRef, useCallback } from "react"
import {
  ClipboardList,
  AlertTriangle,
  MessageSquareText,
  DoorOpen,
  Search,
  Archive,
  ArchiveRestore,
  Plus,
  Upload,
  Download,
  Eye,
  Paperclip,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/app-context"
import type { ItemStatus, Trade, RequestStatus } from "@/lib/types"
import { format } from "date-fns"

const ALL_STATUSES: ItemStatus[] = ["New", "Assigned", "In Progress", "Completed", "Closed"]
const ALL_TRADES: Trade[] = ["Plumbing", "Electrical", "Carpentry", "Painting", "Appliance", "General", "Other"]
const ALL_PRIORITIES = ["Low", "Normal", "Urgent"] as const

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
  const { currentPage, items, requests, navigateTo, projects, units, archiveProject, archiveUnit, fetchUnits, createUnit, uploadUnitsCSV, createItem, fetchItems } = useApp()

  const projectId = currentPage.type === "project-detail" ? currentPage.projectId : null
  const project = projectId ? projects.find((p) => p.id === projectId) : null

  const [activeTab, setActiveTab] = useState("items")
  const [statusFilter, setStatusFilter] = useState("all")
  const [tradeFilter, setTradeFilter] = useState("all")
  const [unitSearch, setUnitSearch] = useState("")
  const [showArchivedUnits, setShowArchivedUnits] = useState(false)
  const [unitTableSearch, setUnitTableSearch] = useState("")
  const [requestStatusFilter, setRequestStatusFilter] = useState<"all" | RequestStatus>("all")

  const [addUnitOpen, setAddUnitOpen] = useState(false)
  const [newUnitNumber, setNewUnitNumber] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [newOwnerName, setNewOwnerName] = useState("")
  const [newOwnerEmail, setNewOwnerEmail] = useState("")
  const [newOwnerPhone, setNewOwnerPhone] = useState("")
  const [creatingUnit, setCreatingUnit] = useState(false)

  const [addItemOpen, setAddItemOpen] = useState(false)
  const [itemUnitId, setItemUnitId] = useState("")
  const [itemTitle, setItemTitle] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [itemTrade, setItemTrade] = useState("")
  const [itemPriority, setItemPriority] = useState("Normal")
  const [itemOtherNotes, setItemOtherNotes] = useState("")
  const [submittingItem, setSubmittingItem] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)

  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ created: number; error?: string; rows?: { row: number; message: string }[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const projectUnits = useMemo(() => {
    if (!projectId) return []
    let all = units.filter((u) => u.projectId === projectId)
    if (!showArchivedUnits) all = all.filter((u) => !u.archivedAt)
    if (unitTableSearch) {
      const q = unitTableSearch.toLowerCase()
      all = all.filter(
        (u) => u.unitNumber.toLowerCase().includes(q) || u.address.toLowerCase().includes(q),
      )
    }
    return all
  }, [projectId, units, showArchivedUnits, unitTableSearch])

  const handleToggleArchivedUnits = (checked: boolean) => {
    setShowArchivedUnits(checked)
    fetchUnits(checked)
  }

  const handleCreateUnit = async () => {
    if (!projectId || !newUnitNumber.trim() || !newAddress.trim()) return
    setCreatingUnit(true)
    try {
      await createUnit({
        projectId,
        unitNumber: newUnitNumber,
        address: newAddress,
        ownerName: newOwnerName.trim() || undefined,
        ownerEmail: newOwnerEmail.trim() || undefined,
        ownerPhone: newOwnerPhone.trim() || undefined,
      })
      setAddUnitOpen(false)
      setNewUnitNumber("")
      setNewAddress("")
      setNewOwnerName("")
      setNewOwnerEmail("")
      setNewOwnerPhone("")
    } catch (err) {
      console.error("Failed to create unit:", err)
    } finally {
      setCreatingUnit(false)
    }
  }

  const handleDownloadTemplate = useCallback(() => {
    const header = "project,unitNumber,address,ownerName,ownerEmail,ownerPhone"
    const sampleRow = project
      ? `${project.name},101,1 Example St,John Smith,john@email.com,021 123 456`
      : ",101,1 Example St,John Smith,john@email.com,021 123 456"
    const csv = [header, sampleRow].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "units-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [project])

  const handleUploadCSV = async () => {
    if (!csvFile || !projectId) return
    setUploading(true)
    setUploadResult(null)
    try {
      const result = await uploadUnitsCSV(csvFile)
      setUploadResult(result)
      setCsvFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      console.error("Failed to upload CSV:", err)
      setUploadResult({ created: 0, error: err instanceof Error ? err.message : "Upload failed" })
    } finally {
      setUploading(false)
    }
  }

  const activeUnits = useMemo(
    () => units.filter((u) => u.projectId === projectId && !u.archivedAt),
    [units, projectId],
  )

  async function handleAddItem() {
    if (!itemUnitId || !itemTitle.trim() || !itemTrade || !itemPriority) return
    setSubmittingItem(true)
    setItemError(null)
    try {
      await createItem({
        unitId: itemUnitId,
        title: itemTitle.trim(),
        description: itemDescription,
        trade: itemTrade,
        priority: itemPriority,
        otherNotes: itemOtherNotes || undefined,
      })
      if (projectId) await fetchItems(projectId)
      setAddItemOpen(false)
      setItemUnitId("")
      setItemTitle("")
      setItemDescription("")
      setItemTrade("")
      setItemPriority("Normal")
      setItemOtherNotes("")
    } catch (err) {
      setItemError(err instanceof Error ? err.message : "Failed to create item")
    } finally {
      setSubmittingItem(false)
    }
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

  const projectRequests = requests.filter((r) => r.projectId === projectId)
  const filteredProjectRequests = requestStatusFilter === "all"
    ? projectRequests.filter((r) => r.status !== "archived")
    : projectRequests.filter((r) => r.status === requestStatusFilter)

  const kpis = [
    { label: "Open Items", value: openItems.length, icon: ClipboardList, color: "text-primary", bg: "bg-primary/10", tab: "items" as const },
    { label: "High Priority Items", value: highPriority.length, icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10", tab: "items" as const },
    { label: "Requests Needing Review", value: reviewCount, icon: MessageSquareText, color: "text-warning-foreground", bg: "bg-warning/10", tab: "requests" as const },
    { label: "Units With Open Items", value: unitsWithOpenItems, icon: DoorOpen, color: "text-chart-2", bg: "bg-chart-2/10", tab: "units" as const },
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
            <Card
              key={kpi.label}
              className="cursor-pointer transition-colors hover:bg-accent/50"
              onClick={() => setActiveTab(kpi.tab)}
            >
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

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col gap-4">
          <TabsList className="w-fit">
            <TabsTrigger value="items">Open Items</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="units">Units</TabsTrigger>
          </TabsList>

          <TabsContent value="items" className="mt-0">
            <Dialog open={addItemOpen} onOpenChange={(open) => { setAddItemOpen(open); if (!open) setItemError(null) }}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Item</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4 py-2">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="proj-item-unit">Unit <span className="text-destructive">*</span></Label>
                    <Select value={itemUnitId} onValueChange={setItemUnitId}>
                      <SelectTrigger id="proj-item-unit">
                        <SelectValue placeholder="Select unit" />
                      </SelectTrigger>
                      <SelectContent>
                        {activeUnits.map((u) => (
                          <SelectItem key={u.id} value={u.id}>Unit {u.unitNumber} — {u.address}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="proj-item-title">Title <span className="text-destructive">*</span></Label>
                    <Input
                      id="proj-item-title"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                      placeholder="e.g. Leaking tap in bathroom"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="proj-item-description">Description</Label>
                    <Textarea
                      id="proj-item-description"
                      value={itemDescription}
                      onChange={(e) => setItemDescription(e.target.value)}
                      placeholder="Describe the issue..."
                      rows={3}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="proj-item-trade">Trade <span className="text-destructive">*</span></Label>
                    <Select value={itemTrade} onValueChange={setItemTrade}>
                      <SelectTrigger id="proj-item-trade">
                        <SelectValue placeholder="Select trade" />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_TRADES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="proj-item-priority">Priority <span className="text-destructive">*</span></Label>
                    <Select value={itemPriority} onValueChange={setItemPriority}>
                      <SelectTrigger id="proj-item-priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALL_PRIORITIES.map((p) => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="proj-item-other-notes">Access notes / other context</Label>
                    <Textarea
                      id="proj-item-other-notes"
                      value={itemOtherNotes}
                      onChange={(e) => setItemOtherNotes(e.target.value)}
                      placeholder="Any access instructions or additional context..."
                      rows={2}
                    />
                  </div>
                  {itemError && (
                    <p className="text-sm text-destructive">{itemError}</p>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setAddItemOpen(false)}>Cancel</Button>
                  <Button
                    onClick={handleAddItem}
                    disabled={!itemUnitId || !itemTitle.trim() || !itemTrade || submittingItem}
                  >
                    {submittingItem ? "Creating…" : "Create Item"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Open Items ({filteredItems.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button size="sm" onClick={() => { setAddItemOpen(true); setItemError(null) }}>
                      <Plus className="mr-1.5 size-4" />
                      Add Item
                    </Button>
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

          <TabsContent value="requests" className="mt-0">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Requests ({filteredProjectRequests.length})
                  </CardTitle>
                  <Tabs value={requestStatusFilter} onValueChange={(v) => setRequestStatusFilter(v as "all" | RequestStatus)}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="needs_review">Needs Review</TabsTrigger>
                      <TabsTrigger value="processed">Processed</TabsTrigger>
                      <TabsTrigger value="archived">Archived</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </CardHeader>
              <CardContent>
                {filteredProjectRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquareText className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No requests found</p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-border">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="text-xs font-medium">Received</TableHead>
                          <TableHead className="text-xs font-medium">From</TableHead>
                          <TableHead className="text-xs font-medium">Subject</TableHead>
                          <TableHead className="text-xs font-medium">Detected Unit</TableHead>
                          <TableHead className="text-xs font-medium">Status</TableHead>
                          <TableHead className="w-20 text-right text-xs font-medium">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredProjectRequests.map((req) => {
                          const detectedUnit = req.detectedUnitId
                            ? units.find((u) => u.id === req.detectedUnitId)
                            : null
                          return (
                            <TableRow key={req.id}>
                              <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                                {format(new Date(req.receivedAt), "MMM d, h:mm a")}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <p className="text-sm font-medium text-foreground">{req.fromName}</p>
                                  <p className="text-xs text-muted-foreground">{req.fromEmail}</p>
                                </div>
                              </TableCell>
                              <TableCell className="max-w-[200px] text-sm text-foreground">
                                <div className="flex items-center gap-1.5">
                                  <span className="truncate">{req.subject}</span>
                                  {req.attachments && req.attachments.length > 0 && (
                                    <Paperclip className="size-3 shrink-0 text-muted-foreground" />
                                  )}
                                </div>
                              </TableCell>
                              <TableCell className="text-sm text-muted-foreground">
                                {detectedUnit ? `Unit ${detectedUnit.unitNumber}` : "--"}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  variant={req.status === "needs_review" ? "outline" : "secondary"}
                                  className={
                                    req.status === "needs_review"
                                      ? "border-warning/30 bg-warning/10 text-warning-foreground"
                                      : req.status === "error"
                                        ? "border-destructive/30 bg-destructive/10 text-destructive"
                                        : req.status === "archived"
                                          ? "border-muted-foreground/30 bg-muted text-muted-foreground"
                                          : ""
                                  }
                                >
                                  {req.status === "needs_review"
                                    ? "Needs Review"
                                    : req.status === "error"
                                      ? "Error"
                                      : req.status === "archived"
                                        ? "Archived"
                                        : "Processed"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() =>
                                    navigateTo({ type: "request-review", requestId: req.id })
                                  }
                                >
                                  <Eye className="mr-1 size-3.5" />
                                  Review
                                </Button>
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
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <CardTitle className="text-sm font-semibold">
                    Units ({projectUnits.length})
                  </CardTitle>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                      <Checkbox
                        checked={showArchivedUnits}
                        onCheckedChange={(checked) => handleToggleArchivedUnits(checked === true)}
                      />
                      Show archived
                    </label>
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Search units..."
                        value={unitTableSearch}
                        onChange={(e) => setUnitTableSearch(e.target.value)}
                        className="w-48 pl-8 text-xs"
                      />
                    </div>

                    <Dialog open={csvDialogOpen} onOpenChange={(open) => { setCsvDialogOpen(open); if (!open) { setUploadResult(null); setCsvFile(null) } }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Upload className="mr-1.5 size-4" />
                          Upload CSV
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Upload Units CSV</DialogTitle>
                          <DialogDescription>
                            Upload a CSV with required columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">project</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">unitNumber</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">address</code>. Optional columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">ownerName</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">ownerEmail</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">ownerPhone</code>. Download the template to get started.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-2">
                          <Button variant="outline" size="sm" className="self-start" onClick={handleDownloadTemplate}>
                            <Download className="mr-1.5 size-4" />
                            Download Template
                          </Button>
                          <div className="flex flex-col gap-2">
                            <Label>CSV File</Label>
                            <Input
                              ref={fileInputRef}
                              type="file"
                              accept=".csv"
                              onChange={(e) => setCsvFile(e.target.files?.[0] ?? null)}
                            />
                          </div>
                          {uploadResult && (
                            <div className={`rounded-lg border p-3 text-sm ${uploadResult.created > 0 ? "border-green-200 bg-green-50 text-green-800 dark:border-green-800 dark:bg-green-950 dark:text-green-200" : "border-red-200 bg-red-50 text-red-800 dark:border-red-800 dark:bg-red-950 dark:text-red-200"}`}>
                              {uploadResult.created > 0 && <p>{uploadResult.created} unit(s) created successfully.</p>}
                              {uploadResult.error && <p className="font-medium">{uploadResult.error}</p>}
                              {uploadResult.rows && uploadResult.rows.length > 0 && (
                                <ul className="mt-1 list-inside list-disc space-y-0.5">
                                  {uploadResult.rows.map((r, i) => (
                                    <li key={i}>Row {r.row}: {r.message}</li>
                                  ))}
                                </ul>
                              )}
                            </div>
                          )}
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setCsvDialogOpen(false)}>
                            {uploadResult && uploadResult.created > 0 ? "Done" : "Cancel"}
                          </Button>
                          <Button onClick={handleUploadCSV} disabled={!csvFile || uploading}>
                            {uploading ? "Uploading..." : "Upload"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={addUnitOpen} onOpenChange={(open) => {
                      setAddUnitOpen(open)
                      if (!open) {
                        setNewUnitNumber("")
                        setNewAddress("")
                        setNewOwnerName("")
                        setNewOwnerEmail("")
                        setNewOwnerPhone("")
                      }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm">
                          <Plus className="mr-1.5 size-4" />
                          Add Unit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Unit</DialogTitle>
                          <DialogDescription>
                            Add a new unit to <strong>{project.name}</strong>.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-2">
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="unit-number">Unit Number</Label>
                            <Input
                              id="unit-number"
                              value={newUnitNumber}
                              onChange={(e) => setNewUnitNumber(e.target.value)}
                              placeholder="e.g. 101"
                            />
                          </div>
                          <div className="flex flex-col gap-2">
                            <Label htmlFor="unit-address">Address</Label>
                            <Input
                              id="unit-address"
                              value={newAddress}
                              onChange={(e) => setNewAddress(e.target.value)}
                              placeholder="e.g. 100 River Road, Apt 101"
                            />
                          </div>
                          <div className="flex flex-col gap-3 pt-1">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Owner Contact Details</p>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="owner-name">Owner Name <span className="text-muted-foreground font-normal">(optional)</span></Label>
                              <Input
                                id="owner-name"
                                value={newOwnerName}
                                onChange={(e) => setNewOwnerName(e.target.value)}
                                placeholder="e.g. John Smith"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="owner-email">Owner Email <span className="text-muted-foreground font-normal">(optional)</span></Label>
                              <Input
                                id="owner-email"
                                type="email"
                                value={newOwnerEmail}
                                onChange={(e) => setNewOwnerEmail(e.target.value)}
                                placeholder="e.g. john@email.com"
                              />
                            </div>
                            <div className="flex flex-col gap-2">
                              <Label htmlFor="owner-phone">Owner Phone <span className="text-muted-foreground font-normal">(optional)</span></Label>
                              <Input
                                id="owner-phone"
                                type="tel"
                                value={newOwnerPhone}
                                onChange={(e) => setNewOwnerPhone(e.target.value)}
                                placeholder="e.g. 021 123 456"
                              />
                            </div>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setAddUnitOpen(false)}>
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateUnit}
                            disabled={!newUnitNumber.trim() || !newAddress.trim() || creatingUnit}
                          >
                            {creatingUnit ? "Creating..." : "Create Unit"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
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
                          <TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">
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
