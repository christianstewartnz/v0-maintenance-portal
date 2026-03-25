"use client"

import { useState, useEffect, useMemo } from "react"
import { Users, Search, Plus, MoreHorizontal, Pencil, Archive, ArchiveRestore } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApp } from "@/lib/app-context"
import { ContractorDialog } from "@/components/contractor-dialog"
import type { Contractor } from "@/lib/types"

export function ContractorsListPage() {
  const { contractors, fetchContractors, archiveContractor } = useApp()

  const [search, setSearch] = useState("")
  const [tradeFilter, setTradeFilter] = useState("all")
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingContractor, setEditingContractor] = useState<Contractor | null>(null)

  useEffect(() => {
    fetchContractors(showArchived ? false : undefined)
  }, [showArchived, fetchContractors])

  const trades = useMemo(() => {
    const set = new Set<string>()
    for (const c of contractors) {
      if (c.trade) set.add(c.trade)
    }
    return [...set].sort()
  }, [contractors])

  const filtered = useMemo(() => {
    let list = contractors

    if (!showArchived) {
      list = list.filter((c) => c.isActive)
    }

    if (tradeFilter !== "all") {
      list = list.filter((c) => c.trade === tradeFilter)
    }

    if (search) {
      const q = search.toLowerCase()
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.contactName.toLowerCase().includes(q),
      )
    }

    return list
  }, [contractors, search, tradeFilter, showArchived])

  const handleArchive = async (id: string, archive: boolean) => {
    try {
      await archiveContractor(id, archive)
    } catch (err) {
      console.error("Failed to archive/restore contractor:", err)
    }
  }

  const handleEdit = (contractor: Contractor) => {
    setEditingContractor(contractor)
    setDialogOpen(true)
  }

  const handleAdd = () => {
    setEditingContractor(null)
    setDialogOpen(true)
  }

  const handleDialogComplete = () => {
    setDialogOpen(false)
    setEditingContractor(null)
    fetchContractors(showArchived ? false : undefined)
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Contractors</h1>
          <p className="text-sm text-muted-foreground">
            Manage your contractor directory
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-1.5 size-4" />
          Add Contractor
        </Button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-56 pl-8 text-xs"
            />
          </div>

          <Select value={tradeFilter} onValueChange={setTradeFilter}>
            <SelectTrigger className="w-40 text-xs">
              <SelectValue placeholder="Trade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Trades</SelectItem>
              {trades.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            className="text-xs"
            onClick={() => setShowArchived(!showArchived)}
          >
            {showArchived ? "Showing All" : "Active Only"}
          </Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Users className="mb-3 size-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-muted-foreground">No contractors found</p>
                <p className="text-xs text-muted-foreground">
                  Add a contractor to get started.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-border">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="text-xs font-medium">Company Name</TableHead>
                      <TableHead className="text-xs font-medium">Contact Name</TableHead>
                      <TableHead className="text-xs font-medium">Email</TableHead>
                      <TableHead className="text-xs font-medium">Phone</TableHead>
                      <TableHead className="text-xs font-medium">Trade</TableHead>
                      <TableHead className="text-xs font-medium">Status</TableHead>
                      <TableHead className="w-12 text-xs font-medium">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="text-sm font-medium text-foreground">
                          {c.name}
                        </TableCell>
                        <TableCell className="text-sm text-foreground">
                          {c.contactName}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.email}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.phone || "—"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {c.trade || "—"}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              c.isActive
                                ? "bg-success/10 text-success border-success/20"
                                : "bg-muted text-muted-foreground border-border"
                            }
                          >
                            {c.isActive ? "Active" : "Archived"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="size-8">
                                <MoreHorizontal className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleEdit(c)}>
                                <Pencil className="mr-2 size-3.5" />
                                Edit
                              </DropdownMenuItem>
                              {c.isActive ? (
                                <DropdownMenuItem onClick={() => handleArchive(c.id, true)}>
                                  <Archive className="mr-2 size-3.5" />
                                  Archive
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem onClick={() => handleArchive(c.id, false)}>
                                  <ArchiveRestore className="mr-2 size-3.5" />
                                  Restore
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <ContractorDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          if (!v) setEditingContractor(null)
          setDialogOpen(v)
        }}
        contractor={editingContractor}
        onComplete={handleDialogComplete}
      />
    </div>
  )
}
