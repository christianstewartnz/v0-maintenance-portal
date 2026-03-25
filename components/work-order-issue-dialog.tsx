"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Plus } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { Item } from "@/lib/types"

interface WorkOrderIssueDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedItems: Item[]
  onComplete: () => void
}

export function WorkOrderIssueDialog({
  open,
  onOpenChange,
  selectedItems,
  onComplete,
}: WorkOrderIssueDialogProps) {
  const { contractors, createContractor, createWorkOrder, issueWorkOrder, projects } = useApp()

  const [selectedContractorId, setSelectedContractorId] = useState("")
  const [accessNotes, setAccessNotes] = useState("")
  const [messageBody, setMessageBody] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // New contractor form
  const [showNewContractor, setShowNewContractor] = useState(false)
  const [newContractorName, setNewContractorName] = useState("")
  const [newContractorContactName, setNewContractorContactName] = useState("")
  const [newContractorEmail, setNewContractorEmail] = useState("")
  const [newContractorPhone, setNewContractorPhone] = useState("")
  const [newContractorTrade, setNewContractorTrade] = useState("")
  const [creatingContractor, setCreatingContractor] = useState(false)

  const projectIds = useMemo(
    () => [...new Set(selectedItems.map((i) => i.projectId))],
    [selectedItems]
  )
  const isMultiProject = projectIds.length > 1

  const projectName = useMemo(() => {
    if (projectIds.length === 1) {
      const project = projects.find((p) => p.id === projectIds[0])
      return project?.name || "Unknown Project"
    }
    return ""
  }, [projectIds, projects])

  const itemsByUnit = useMemo(() => {
    const grouped: Record<string, { unitNumber: string; items: Item[] }> = {}
    for (const item of selectedItems) {
      const unitKey = item.unitId
      const unitNumber = item.unit?.unitNumber || "Unknown"
      if (!grouped[unitKey]) {
        grouped[unitKey] = { unitNumber, items: [] }
      }
      grouped[unitKey].items.push(item)
    }
    return Object.entries(grouped).sort(([, a], [, b]) =>
      a.unitNumber.localeCompare(b.unitNumber)
    )
  }, [selectedItems])

  const handleCreateContractor = async () => {
    if (!newContractorName || !newContractorContactName || !newContractorEmail) return
    setCreatingContractor(true)
    try {
      const created = await createContractor({
        name: newContractorName,
        contactName: newContractorContactName,
        email: newContractorEmail,
        phone: newContractorPhone || undefined,
        trade: newContractorTrade || undefined,
      })
      setSelectedContractorId(created.id)
      setShowNewContractor(false)
      setNewContractorName("")
      setNewContractorContactName("")
      setNewContractorEmail("")
      setNewContractorPhone("")
      setNewContractorTrade("")
    } catch (err: any) {
      setError(err.message)
    } finally {
      setCreatingContractor(false)
    }
  }

  const handleSubmit = async () => {
    if (!selectedContractorId) {
      setError("Please select a contractor")
      return
    }
    if (isMultiProject) {
      setError("All items must belong to the same project")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      const workOrder = await createWorkOrder({
        contractorId: selectedContractorId,
        itemIds: selectedItems.map((i) => i.id),
        accessNotes: accessNotes || undefined,
        messageBody: messageBody || undefined,
      })

      await issueWorkOrder(workOrder.id)
      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  const resetForm = () => {
    setSelectedContractorId("")
    setAccessNotes("")
    setMessageBody("")
    setError(null)
    setShowNewContractor(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) resetForm()
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Issue Work Order</DialogTitle>
          <DialogDescription>
            Create and send a work order for {selectedItems.length} selected item(s)
            {projectName && ` from ${projectName}`}.
          </DialogDescription>
        </DialogHeader>

        {isMultiProject && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-sm text-destructive">
              Selected items span multiple projects. A work order can only include items from a single project.
            </p>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          {/* Contractor selector */}
          <div className="space-y-2">
            <Label>Contractor</Label>
            {!showNewContractor ? (
              <div className="flex items-center gap-2">
                <Select value={selectedContractorId} onValueChange={setSelectedContractorId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select a contractor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {contractors.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} ({c.contactName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewContractor(true)}
                >
                  <Plus className="mr-1 size-3.5" />
                  New
                </Button>
              </div>
            ) : (
              <div className="space-y-3 rounded-lg border border-border p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs">Company Name *</Label>
                    <Input
                      value={newContractorName}
                      onChange={(e) => setNewContractorName(e.target.value)}
                      placeholder="ABC Plumbing"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Contact Name *</Label>
                    <Input
                      value={newContractorContactName}
                      onChange={(e) => setNewContractorContactName(e.target.value)}
                      placeholder="John Smith"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Email *</Label>
                    <Input
                      type="email"
                      value={newContractorEmail}
                      onChange={(e) => setNewContractorEmail(e.target.value)}
                      placeholder="john@abcplumbing.com"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input
                      value={newContractorPhone}
                      onChange={(e) => setNewContractorPhone(e.target.value)}
                      placeholder="(555) 123-4567"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Trade</Label>
                    <Input
                      value={newContractorTrade}
                      onChange={(e) => setNewContractorTrade(e.target.value)}
                      placeholder="Plumbing"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={handleCreateContractor}
                    disabled={!newContractorName || !newContractorContactName || !newContractorEmail || creatingContractor}
                  >
                    {creatingContractor ? "Creating..." : "Create Contractor"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowNewContractor(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Items preview grouped by unit */}
          <div className="space-y-2">
            <Label>Items ({selectedItems.length})</Label>
            <div className="space-y-3 rounded-lg border border-border p-4 max-h-60 overflow-y-auto">
              {itemsByUnit.map(([unitId, { unitNumber, items: unitItems }]) => (
                <div key={unitId}>
                  <p className="text-xs font-semibold text-muted-foreground mb-1">
                    Unit {unitNumber}
                  </p>
                  <div className="space-y-1 pl-3">
                    {unitItems.map((item) => (
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-sm">{item.title}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.trade}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Access notes */}
          <div className="space-y-2">
            <Label htmlFor="accessNotes">Access Notes</Label>
            <Textarea
              id="accessNotes"
              value={accessNotes}
              onChange={(e) => setAccessNotes(e.target.value)}
              placeholder="Entry instructions, key location, access hours..."
              rows={2}
            />
          </div>

          {/* Message body */}
          <div className="space-y-2">
            <Label htmlFor="messageBody">Message to Contractor</Label>
            <Textarea
              id="messageBody"
              value={messageBody}
              onChange={(e) => setMessageBody(e.target.value)}
              placeholder="Additional instructions or notes..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting || isMultiProject || !selectedContractorId}>
            {submitting ? "Sending..." : "Send Work Order"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
