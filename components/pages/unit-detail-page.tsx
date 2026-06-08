"use client"

import { useState } from "react"
import { ClipboardList, AlertTriangle, Eye, XCircle, Pencil, Plus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/app-context"
import { format } from "date-fns"

const ALL_TRADES = ["Plumbing", "Electrical", "Carpentry", "Painting", "Appliance", "General", "Other"] as const
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

export function UnitDetailPage() {
  const { currentPage, items, requests, navigateTo, projects, units, updateItemStatus, updateUnit, createItem, fetchItems } = useApp()

  const unitId = currentPage.type === "unit-detail" ? currentPage.unitId : null
  const unit = unitId ? units.find((u) => u.id === unitId) : null
  const project = unit ? projects.find((p) => p.id === unit.projectId) : null

  const [editOwnerOpen, setEditOwnerOpen] = useState(false)
  const [ownerName, setOwnerName] = useState("")
  const [ownerEmail, setOwnerEmail] = useState("")
  const [ownerPhone, setOwnerPhone] = useState("")
  const [saving, setSaving] = useState(false)

  const [addItemOpen, setAddItemOpen] = useState(false)
  const [itemTitle, setItemTitle] = useState("")
  const [itemDescription, setItemDescription] = useState("")
  const [itemTrade, setItemTrade] = useState("")
  const [itemPriority, setItemPriority] = useState("Normal")
  const [itemOtherNotes, setItemOtherNotes] = useState("")
  const [submittingItem, setSubmittingItem] = useState(false)
  const [itemError, setItemError] = useState<string | null>(null)

  if (!unit || !project) return null

  function openEditOwner() {
    setOwnerName(unit!.ownerName ?? "")
    setOwnerEmail(unit!.ownerEmail ?? "")
    setOwnerPhone(unit!.ownerPhone ?? "")
    setEditOwnerOpen(true)
  }

  async function handleSaveOwner() {
    setSaving(true)
    try {
      await updateUnit({ id: unit!.id, ownerName, ownerEmail, ownerPhone })
      setEditOwnerOpen(false)
    } finally {
      setSaving(false)
    }
  }

  async function handleAddItem() {
    if (!itemTitle.trim() || !itemTrade || !itemPriority) return
    setSubmittingItem(true)
    setItemError(null)
    try {
      await createItem({
        unitId: unit!.id,
        title: itemTitle.trim(),
        description: itemDescription,
        trade: itemTrade,
        priority: itemPriority,
        otherNotes: itemOtherNotes || undefined,
      })
      await fetchItems(unit!.projectId)
      setAddItemOpen(false)
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

  const unitItems = items.filter((i) => i.unitId === unit.id)
  const openItems = unitItems.filter((i) => !["Completed", "Closed"].includes(i.status))
  const highPriority = openItems.filter((i) => i.priority === "Urgent")
  const relatedRequests = requests.filter((r) =>
    r.detectedUnitId === unit.id ||
    items.some((i) => i.unitId === unit.id && i.requestId === r.id)
  )

  function renderItemTable(itemList: typeof unitItems) {
    if (itemList.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
          <p className="text-sm font-medium text-muted-foreground">No items</p>
        </div>
      )
    }
    return (
      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-medium">Title</TableHead>
              <TableHead className="text-xs font-medium">Trade</TableHead>
              <TableHead className="text-xs font-medium">Priority</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="text-xs font-medium">Created</TableHead>
              <TableHead className="text-xs font-medium">Updated</TableHead>
              <TableHead className="text-xs font-medium w-[1%]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {itemList.map((item) => (
              <TableRow
                key={item.id}
                className="cursor-pointer hover:bg-accent/50"
                onClick={() => navigateTo({ type: "item-detail", itemId: item.id })}
              >
                <TableCell className="text-sm font-medium text-foreground">{item.title}</TableCell>
                <TableCell className="text-sm text-foreground">{item.trade}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={getPriorityStyle(item.priority)}>{item.priority}</Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getStatusStyle(item.status)}>{item.status}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(item.createdAt), "MMM d")}
                </TableCell>
                <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                  {format(new Date(item.updatedAt), "MMM d")}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  {item.status !== "Closed" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 text-xs">
                          <XCircle className="mr-1 size-3.5" />
                          Close
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Close this item?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will set the item status to Closed, removing it from active views.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => updateItemStatus(item.id, "Closed")}>
                            Close Item
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-6 py-4">
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
              <BreadcrumbLink
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo({ type: "project-detail", projectId: unit.projectId })}
              >
                {project.name}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>Unit {unit.unitNumber}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-foreground">Unit {unit.unitNumber}</h2>
              <div className="flex items-center gap-2">
                <Badge variant="default" className="text-xs">{openItems.length} Open</Badge>
                {highPriority.length > 0 && (
                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-xs">
                    <AlertTriangle className="mr-1 size-3" />
                    {highPriority.length} High Priority
                  </Badge>
                )}
              </div>
            </div>
            <p className="text-sm text-muted-foreground">{unit.address}</p>
            <p className="text-xs text-muted-foreground">{project.name}</p>
          </div>

          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Owner Contact Details</CardTitle>
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-xs" onClick={openEditOwner}>
                  <Pencil className="size-3" />
                  Edit
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Name</dt>
                  <dd className="text-sm text-foreground">{unit.ownerName ?? "Not provided"}</dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Email</dt>
                  <dd className="text-sm text-foreground">
                    {unit.ownerEmail
                      ? <a href={`mailto:${unit.ownerEmail}`} className="hover:underline">{unit.ownerEmail}</a>
                      : "Not provided"}
                  </dd>
                </div>
                <div className="flex flex-col gap-0.5">
                  <dt className="text-xs text-muted-foreground">Phone</dt>
                  <dd className="text-sm text-foreground">
                    {unit.ownerPhone
                      ? <a href={`tel:${unit.ownerPhone}`} className="hover:underline">{unit.ownerPhone}</a>
                      : "Not provided"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Dialog open={editOwnerOpen} onOpenChange={setEditOwnerOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Edit Owner Contact Details</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="owner-name">Name</Label>
                  <Input
                    id="owner-name"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="Owner name"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="owner-email">Email</Label>
                  <Input
                    id="owner-email"
                    type="email"
                    value={ownerEmail}
                    onChange={(e) => setOwnerEmail(e.target.value)}
                    placeholder="owner@example.com"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="owner-phone">Phone</Label>
                  <Input
                    id="owner-phone"
                    type="tel"
                    value={ownerPhone}
                    onChange={(e) => setOwnerPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditOwnerOpen(false)}>Cancel</Button>
                <Button onClick={handleSaveOwner} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="open" className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <TabsList className="w-fit">
              <TabsTrigger value="open">Open Items ({openItems.length})</TabsTrigger>
              <TabsTrigger value="all">All Items ({unitItems.length})</TabsTrigger>
              <TabsTrigger value="requests">Requests ({relatedRequests.length})</TabsTrigger>
            </TabsList>
            <Button size="sm" onClick={() => { setAddItemOpen(true); setItemError(null) }}>
              <Plus className="mr-1.5 size-4" />
              Add Item
            </Button>
          </div>

          <Dialog open={addItemOpen} onOpenChange={(open) => { setAddItemOpen(open); if (!open) setItemError(null) }}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Item</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-title">Title <span className="text-destructive">*</span></Label>
                  <Input
                    id="item-title"
                    value={itemTitle}
                    onChange={(e) => setItemTitle(e.target.value)}
                    placeholder="e.g. Leaking tap in bathroom"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-description">Description</Label>
                  <Textarea
                    id="item-description"
                    value={itemDescription}
                    onChange={(e) => setItemDescription(e.target.value)}
                    placeholder="Describe the issue..."
                    rows={3}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="item-trade">Trade <span className="text-destructive">*</span></Label>
                  <Select value={itemTrade} onValueChange={setItemTrade}>
                    <SelectTrigger id="item-trade">
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
                  <Label htmlFor="item-priority">Priority <span className="text-destructive">*</span></Label>
                  <Select value={itemPriority} onValueChange={setItemPriority}>
                    <SelectTrigger id="item-priority">
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
                  <Label htmlFor="item-other-notes">Access notes / other context</Label>
                  <Textarea
                    id="item-other-notes"
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
                  disabled={!itemTitle.trim() || !itemTrade || submittingItem}
                >
                  {submittingItem ? "Creating…" : "Create Item"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <TabsContent value="open" className="mt-0">
            <Card>
              <CardContent className="pt-6">{renderItemTable(openItems)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="mt-0">
            <Card>
              <CardContent className="pt-6">{renderItemTable(unitItems)}</CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="requests" className="mt-0">
            <Card>
              <CardContent className="pt-6">
                {relatedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <ClipboardList className="mb-3 size-10 text-muted-foreground/40" />
                    <p className="text-sm font-medium text-muted-foreground">No related requests</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {relatedRequests.map((req) => (
                      <div key={req.id} className="flex items-start justify-between rounded-lg border border-border p-4">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-foreground">{req.subject}</p>
                          <p className="text-xs text-muted-foreground">
                            {req.fromName} &middot; {format(new Date(req.receivedAt), "MMM d, h:mm a")}
                          </p>
                        </div>
                        <div className="ml-4 flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={
                              req.status === "needs_review"
                                ? "border-warning/30 bg-warning/10 text-warning-foreground"
                                : ""
                            }
                          >
                            {req.status === "needs_review" ? "Needs Review" : "Processed"}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigateTo({ type: "request-review", requestId: req.id })}
                          >
                            <Eye className="mr-1 size-3.5" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
