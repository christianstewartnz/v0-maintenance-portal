"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Eye, MessageSquareText, Plus, Upload, Paperclip, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { Checkbox } from "@/components/ui/checkbox"
import { useApp } from "@/lib/app-context"
import { EmailDropZone } from "@/components/email-drop-zone"
import type { RequestStatus } from "@/lib/types"
import { format } from "date-fns"

export function RequestsListPage() {
  const {
    requests,
    navigateTo,
    units,
    projects,
    fetchRequests,
    createRequest,
    importEmails,
  } = useApp()

  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [assignmentFilter, setAssignmentFilter] = useState<"all" | "assigned" | "unassigned">("all")
  const [attachmentsOnly, setAttachmentsOnly] = useState(false)
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [creating, setCreating] = useState(false)

  const reloadRequests = useCallback(
    (status: string) => {
      fetchRequests(null, status === "all" ? undefined : status)
    },
    [fetchRequests],
  )

  useEffect(() => {
    reloadRequests(statusFilter)
  }, [statusFilter, reloadRequests])

  function handleStatusChange(value: string) {
    setStatusFilter(value as "all" | RequestStatus)
  }

  const filteredRequests = useMemo(() => {
    let result = requests

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (r) =>
          r.subject.toLowerCase().includes(q) ||
          r.fromName.toLowerCase().includes(q) ||
          r.fromEmail.toLowerCase().includes(q),
      )
    }

    if (assignmentFilter === "assigned") {
      result = result.filter((r) => r.projectId != null)
    } else if (assignmentFilter === "unassigned") {
      result = result.filter((r) => r.projectId == null)
    }

    if (attachmentsOnly) {
      result = result.filter((r) => r.attachments && r.attachments.length > 0)
    }

    result = [...result].sort((a, b) => {
      const aUnassigned = a.projectId == null ? 0 : 1
      const bUnassigned = b.projectId == null ? 0 : 1
      if (aUnassigned !== bUnassigned) return aUnassigned - bUnassigned
      return new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    })

    return result
  }, [requests, searchQuery, assignmentFilter, attachmentsOnly])

  async function handleCreateRequest() {
    if (!subject.trim() || !body.trim()) return
    setCreating(true)
    try {
      await createRequest({
        subject,
        bodyRaw: body,
        fromName: fromName || undefined,
        fromEmail: fromEmail || undefined,
      })
      setPasteDialogOpen(false)
      setFromName("")
      setFromEmail("")
      setSubject("")
      setBody("")
      reloadRequests(statusFilter)
    } catch (err) {
      console.error("Failed to create request:", err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Requests</h1>
          <p className="text-sm text-muted-foreground">
            Central inbox for all maintenance requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-1.5 size-4" />
                Import Emails
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Import Emails</DialogTitle>
                <DialogDescription>
                  Drag & drop email files to create maintenance requests automatically.
                </DialogDescription>
              </DialogHeader>
              <div className="py-2">
                <EmailDropZone
                  onImport={importEmails}
                  onComplete={() => {
                    setStatusFilter("all")
                    reloadRequests("all")
                  }}
                />
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline">
                <Plus className="mr-1.5 size-4" />
                Paste Email
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Paste Email</DialogTitle>
                <DialogDescription>
                  Paste email content to create a new request. The project and unit will be detected by AI during review.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="from-name">From Name</Label>
                    <Input
                      id="from-name"
                      value={fromName}
                      onChange={(e) => setFromName(e.target.value)}
                      placeholder="John Doe"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="from-email">From Email</Label>
                    <Input
                      id="from-email"
                      value={fromEmail}
                      onChange={(e) => setFromEmail(e.target.value)}
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Maintenance request subject..."
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="email-body">Email Content</Label>
                  <Textarea
                    id="email-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Paste email content here..."
                    rows={8}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPasteDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreateRequest}
                  disabled={!subject.trim() || !body.trim() || creating}
                >
                  {creating ? "Creating..." : "Create Request"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">
                  Requests ({filteredRequests.length})
                </CardTitle>
                <Tabs value={statusFilter} onValueChange={handleStatusChange}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="needs_review">Needs Review</TabsTrigger>
                    <TabsTrigger value="processed">Processed</TabsTrigger>
                    <TabsTrigger value="error">Error</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search subject, sender..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-64 pl-8 text-xs"
                  />
                </div>
                <Select value={assignmentFilter} onValueChange={(v) => setAssignmentFilter(v as "all" | "assigned" | "unassigned")}>
                  <SelectTrigger className="w-40 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Requests</SelectItem>
                    <SelectItem value="assigned">Assigned to Project</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                  </SelectContent>
                </Select>
                <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox
                    checked={attachmentsOnly}
                    onCheckedChange={(checked) => setAttachmentsOnly(checked === true)}
                  />
                  Has attachments
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredRequests.length === 0 ? (
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
                      <TableHead className="text-xs font-medium">Project</TableHead>
                      <TableHead className="text-xs font-medium">Detected Unit</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="w-20 text-right text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((req) => {
                      const detectedUnit = req.detectedUnitId
                        ? units.find((u) => u.id === req.detectedUnitId)
                        : null
                      const project = req.projectId
                        ? projects.find((p) => p.id === req.projectId)
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
                            {project ? project.name : (
                              <span className="italic text-muted-foreground/60">Unassigned</span>
                            )}
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
                                    : ""
                              }
                            >
                              {req.status === "needs_review"
                                ? "Needs Review"
                                : req.status === "error"
                                  ? "Error"
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
      </div>
    </div>
  )
}
