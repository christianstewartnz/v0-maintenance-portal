"use client"

import { useState, useRef, useCallback } from "react"
import { Search, DoorOpen, Archive, ArchiveRestore, Plus, Upload, Download } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { useApp } from "@/lib/app-context"
import { format } from "date-fns"

export function UnitsListPage() {
  const { items, navigateTo, projects, units, archiveUnit, fetchUnits, createUnit, uploadUnitsCSV } = useApp()
  const [projectFilter, setProjectFilter] = useState("all")
  const [search, setSearch] = useState("")
  const [showArchived, setShowArchived] = useState(false)

  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [newProjectId, setNewProjectId] = useState("")
  const [newUnitNumber, setNewUnitNumber] = useState("")
  const [newAddress, setNewAddress] = useState("")
  const [creatingUnit, setCreatingUnit] = useState(false)

  const [csvDialogOpen, setCsvDialogOpen] = useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<{ created: number; errors?: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleToggleArchived = (checked: boolean) => {
    setShowArchived(checked)
    fetchUnits(checked)
  }

  const handleDownloadTemplate = useCallback(() => {
    const header = "project,unitNumber,address"
    const rows = projects
      .filter((p) => !p.archivedAt)
      .map((p) => `${p.name},,`)
    const csv = [header, ...rows].join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "units-template.csv"
    a.click()
    URL.revokeObjectURL(url)
  }, [projects])

  const handleCreateUnit = async () => {
    if (!newProjectId || !newUnitNumber.trim() || !newAddress.trim()) return
    setCreatingUnit(true)
    try {
      await createUnit({ projectId: newProjectId, unitNumber: newUnitNumber, address: newAddress })
      setAddDialogOpen(false)
      setNewProjectId("")
      setNewUnitNumber("")
      setNewAddress("")
    } catch (err) {
      console.error("Failed to create unit:", err)
    } finally {
      setCreatingUnit(false)
    }
  }

  const handleUploadCSV = async () => {
    if (!csvFile) return
    setUploading(true)
    setUploadResult(null)
    try {
      const result = await uploadUnitsCSV(csvFile)
      setUploadResult(result)
      setCsvFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ""
    } catch (err) {
      console.error("Failed to upload CSV:", err)
      setUploadResult({ created: 0, errors: [err instanceof Error ? err.message : "Upload failed"] })
    } finally {
      setUploading(false)
    }
  }

  const filtered = units.filter((u) => {
    if (projectFilter !== "all" && u.projectId !== projectFilter) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !u.unitNumber.toLowerCase().includes(q) &&
        !u.address.toLowerCase().includes(q)
      )
        return false
    }
    return true
  })

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Units</h1>
          <p className="text-sm text-muted-foreground">Browse all units across projects</p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={csvDialogOpen} onOpenChange={(open) => { setCsvDialogOpen(open); if (!open) { setUploadResult(null); setCsvFile(null); } }}>
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
                  Upload a CSV with columns: <code className="text-xs bg-muted px-1 py-0.5 rounded">project</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">unitNumber</code>, <code className="text-xs bg-muted px-1 py-0.5 rounded">address</code>. Download the template to get started.
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
                    {uploadResult.errors?.map((e, i) => <p key={i}>{e}</p>)}
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

          <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
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
                  Add a new unit to a project.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label>Project</Label>
                  <Select value={newProjectId} onValueChange={setNewProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateUnit}
                  disabled={!newProjectId || !newUnitNumber.trim() || !newAddress.trim() || creatingUnit}
                >
                  {creatingUnit ? "Creating..." : "Create Unit"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-semibold">All Units ({filtered.length})</CardTitle>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={showArchived}
                    onCheckedChange={(checked) => handleToggleArchived(checked === true)}
                  />
                  Show archived
                </label>
                <Select value={projectFilter} onValueChange={setProjectFilter}>
                  <SelectTrigger className="w-48 text-xs">
                    <SelectValue placeholder="Filter by project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search unit number or address..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-64 pl-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <DoorOpen className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No units found</p>
                <p className="text-xs text-muted-foreground">Try adjusting your filters.</p>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-medium">Project</TableHead>
                      <TableHead className="text-xs font-medium">Unit Number</TableHead>
                      <TableHead className="text-xs font-medium">Address</TableHead>
                      <TableHead className="text-xs font-medium">Open Items</TableHead>
                      <TableHead className="text-xs font-medium">Last Activity</TableHead>
                      <TableHead className="text-xs font-medium w-[1%]" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((unit) => {
                      const project = projects.find((p) => p.id === unit.projectId)
                      const isArchived = !!unit.archivedAt
                      const openItems = items.filter(
                        (i) => i.unitId === unit.id && !["Completed", "Closed"].includes(i.status)
                      )
                      const allUnitItems = items.filter((i) => i.unitId === unit.id)
                      const lastActivity = allUnitItems.length > 0
                        ? allUnitItems.reduce((latest, i) =>
                            new Date(i.updatedAt) > new Date(latest.updatedAt) ? i : latest
                          ).updatedAt
                        : null
                      return (
                        <TableRow
                          key={unit.id}
                          className={`cursor-pointer hover:bg-accent/50 ${isArchived ? "opacity-60" : ""}`}
                          onClick={() => navigateTo({ type: "unit-detail", unitId: unit.id })}
                        >
                          <TableCell className="text-sm text-foreground">{project?.name ?? "Unknown"}</TableCell>
                          <TableCell className="text-sm font-medium text-foreground">
                            <span className="flex items-center gap-2">
                              Unit {unit.unitNumber}
                              {isArchived && <Badge variant="secondary" className="text-[10px]">Archived</Badge>}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{unit.address}</TableCell>
                          <TableCell>
                            <Badge variant={openItems.length > 0 ? "default" : "secondary"} className="text-xs">
                              {openItems.length}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                            {lastActivity ? format(new Date(lastActivity), "MMM d") : "--"}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7">
                                  {isArchived ? <ArchiveRestore className="size-3.5" /> : <Archive className="size-3.5" />}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    {isArchived ? "Unarchive" : "Archive"} Unit {unit.unitNumber}?
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {isArchived
                                      ? "This will restore the unit to active views."
                                      : "This will hide the unit from default views. Items will be preserved."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => archiveUnit(unit.id, !isArchived)}>
                                    {isArchived ? "Unarchive" : "Archive"}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
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
