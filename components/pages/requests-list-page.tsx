"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import { Eye, MessageSquareText, Plus, Upload, Paperclip, Archive, ArchiveRestore } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useApp } from "@/lib/app-context"
import { EmailDropZone } from "@/components/email-drop-zone"
import { format } from "date-fns"
import type { RequestStatus } from "@/lib/types"

export function RequestsListPage() {
  const {
    requests,
    navigateTo,
    units,
    projects,
    fetchRequests,
    createRequest,
    importEmails,
    archiveRequest,
  } = useApp()

  const [projectFilter, setProjectFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all")
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [creating, setCreating] = useState(false)

  const reloadRequests = useCallback(() => {
    fetchRequests(
      projectFilter === "all" ? null : projectFilter,
      statusFilter === "all" ? undefined : statusFilter,
    )
  }, [fetchRequests, projectFilter, statusFilter])

  useEffect(() => {
    reloadRequests()
  }, [reloadRequests])

  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) =>
      new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
    )
  }, [requests])

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
      reloadRequests()
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
                    setProjectFilter("all")
                    reloadRequests()
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
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Requests ({sortedRequests.length})
              </CardTitle>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-48 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Requests</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as "all" | RequestStatus)}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="needs_review">Needs Review</TabsTrigger>
                <TabsTrigger value="processed">Processed</TabsTrigger>
                <TabsTrigger value="archived">Archived</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {sortedRequests.length === 0 ? (
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
                      <TableHead className="text-right text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedRequests.map((req) => {
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
                            <div className="flex items-center justify-end gap-1">
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
                              {(req.status === "needs_review" || req.status === "error") && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-muted-foreground"
                                  onClick={async () => {
                                    await archiveRequest(req.id, true)
                                    reloadRequests()
                                  }}
                                >
                                  <Archive className="mr-1 size-3.5" />
                                  Archive
                                </Button>
                              )}
                              {req.status === "archived" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs text-muted-foreground"
                                  onClick={async () => {
                                    await archiveRequest(req.id, false)
                                    reloadRequests()
                                  }}
                                >
                                  <ArchiveRestore className="mr-1 size-3.5" />
                                  Unarchive
                                </Button>
                              )}
                            </div>
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
