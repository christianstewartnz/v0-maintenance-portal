"use client"

import { useState } from "react"
import { Plus, Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApp } from "@/lib/app-context"
import { mockCases } from "@/lib/mock-data"
import type { CaseStatus } from "@/lib/types"
import { format } from "date-fns"

export function InboxTab() {
  const { currentProject, navigateTo } = useApp()
  const [statusFilter, setStatusFilter] = useState<"all" | CaseStatus>("all")
  const [pasteDialogOpen, setPasteDialogOpen] = useState(false)
  const [fromName, setFromName] = useState("")
  const [fromEmail, setFromEmail] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  if (!currentProject) return null

  const cases = mockCases.filter((c) => c.projectId === currentProject.id)
  const filtered =
    statusFilter === "all"
      ? cases
      : cases.filter((c) => c.status === statusFilter)

  function handleCreateCase() {
    // Placeholder — would POST to API
    setPasteDialogOpen(false)
    setFromName("")
    setFromEmail("")
    setSubject("")
    setBody("")
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Inbox</h2>
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
                Paste email content to create a new case.
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
              <div className="rounded-lg border-2 border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                Attachments (drag & drop — UI placeholder)
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setPasteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateCase} disabled={!subject.trim()}>
                Create Case
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs
        value={statusFilter}
        onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}
      >
        <TabsList>
          <TabsTrigger value="all">
            All ({cases.length})
          </TabsTrigger>
          <TabsTrigger value="needs_review">
            Needs Review ({cases.filter((c) => c.status === "needs_review").length})
          </TabsTrigger>
          <TabsTrigger value="processed">
            Processed ({cases.filter((c) => c.status === "processed").length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="rounded-lg border border-border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="text-xs font-medium">Received</TableHead>
              <TableHead className="text-xs font-medium">From</TableHead>
              <TableHead className="text-xs font-medium">Subject</TableHead>
              <TableHead className="text-xs font-medium">Status</TableHead>
              <TableHead className="w-20 text-right text-xs font-medium">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="py-8 text-center text-sm text-muted-foreground"
                >
                  No cases found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                    {format(new Date(c.receivedAt), "MMM d, h:mm a")}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {c.fromName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.fromEmail}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm text-foreground">
                    {c.subject}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        c.status === "needs_review" ? "outline" : "secondary"
                      }
                      className={
                        c.status === "needs_review"
                          ? "border-warning/30 bg-warning/10 text-warning-foreground"
                          : ""
                      }
                    >
                      {c.status === "needs_review"
                        ? "Needs Review"
                        : "Processed"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={() =>
                        navigateTo({
                          type: "case-review",
                          caseId: c.id,
                        })
                      }
                    >
                      <Eye className="mr-1 size-3.5" />
                      Review
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
