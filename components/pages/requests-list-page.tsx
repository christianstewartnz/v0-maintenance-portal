"use client"

import { useState } from "react"
import { Eye, MessageSquareText, Plus } from "lucide-react"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApp } from "@/lib/app-context"
import type { RequestStatus } from "@/lib/types"
import { format } from "date-fns"

export function RequestsListPage() {
  const { requests, navigateTo, units } = useApp()
  const [statusFilter, setStatusFilter] = useState<"all" | RequestStatus>("all")
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  const filtered =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter)

  function handleCreateRequest() {
    setPasteDialogOpen(false)
    setFromName("")
    setFromEmail("")
    setSubject("")
    setBody("")
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Requests</h1>
          <p className="text-sm text-muted-foreground">
            Review incoming maintenance requests
          </p>
        </div>
        <Dialog open={pasteDialogOpen} onOpenChange={setPasteDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-4" />
              Paste Email
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Paste Email</DialogTitle>
              <DialogDescription>
                Paste email content to create a new request.
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
              <Button onClick={handleCreateRequest} disabled={!subject.trim()}>
                Create Request
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold">
                Requests ({filtered.length})
              </CardTitle>
              <Tabs
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
              >
                <TabsList>
                  <TabsTrigger value="all">All ({requests.length})</TabsTrigger>
                  <TabsTrigger value="needs_review">
                    Needs Review ({requests.filter((r) => r.status === "needs_review").length})
                  </TabsTrigger>
                  <TabsTrigger value="processed">
                    Processed ({requests.filter((r) => r.status === "processed").length})
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
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
                    {filtered.map((req) => {
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
                          <TableCell className="max-w-[200px] truncate text-sm text-foreground">
                            {req.subject}
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
                                  : ""
                              }
                            >
                              {req.status === "needs_review" ? "Needs Review" : "Processed"}
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
