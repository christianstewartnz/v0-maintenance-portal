"use client"

import { useState, useEffect } from "react"
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
import { AlertCircle } from "lucide-react"
import { useApp } from "@/lib/app-context"
import type { Contractor } from "@/lib/types"

interface ContractorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contractor?: Contractor | null
  onComplete: () => void
}

export function ContractorDialog({
  open,
  onOpenChange,
  contractor,
  onComplete,
}: ContractorDialogProps) {
  const { createContractor, updateContractor } = useApp()
  const isEdit = !!contractor

  const [name, setName] = useState("")
  const [contactName, setContactName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [trade, setTrade] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      setName(contractor?.name ?? "")
      setContactName(contractor?.contactName ?? "")
      setEmail(contractor?.email ?? "")
      setPhone(contractor?.phone ?? "")
      setTrade(contractor?.trade ?? "")
      setError(null)
    }
  }, [open, contractor])

  const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)

  const handleSubmit = async () => {
    if (!name.trim() || !contactName.trim() || !email.trim()) {
      setError("Company Name, Contact Name, and Email are required")
      return
    }
    if (!isValidEmail(email.trim())) {
      setError("Please enter a valid email address")
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      if (isEdit) {
        await updateContractor({
          id: contractor.id,
          name: name.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          trade: trade.trim() || undefined,
        })
      } else {
        await createContractor({
          name: name.trim(),
          contactName: contactName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          trade: trade.trim() || undefined,
        })
      }
      onComplete()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Contractor" : "Add Contractor"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update the contractor's information."
              : "Add a new contractor to the system."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            <AlertCircle className="size-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="contractor-name">Company Name *</Label>
            <Input
              id="contractor-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ABC Plumbing"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractor-contact">Contact Name *</Label>
            <Input
              id="contractor-contact"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="John Smith"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="contractor-email">Email *</Label>
            <Input
              id="contractor-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@abcplumbing.com"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contractor-phone">Phone</Label>
              <Input
                id="contractor-phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contractor-trade">Trade</Label>
              <Input
                id="contractor-trade"
                value={trade}
                onChange={(e) => setTrade(e.target.value)}
                placeholder="Plumbing"
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? "Saving..." : isEdit ? "Save Changes" : "Add Contractor"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
