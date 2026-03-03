"use client"

import { useState } from "react"
import { Search, DoorOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
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
import { useApp } from "@/lib/app-context"
import { format } from "date-fns"

export function UnitsListPage() {
  const { items, navigateTo, projects, units } = useApp()
  const [projectFilter, setProjectFilter] = useState("all")
  const [search, setSearch] = useState("")

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
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Units</h1>
        <p className="text-sm text-muted-foreground">Browse all units across projects</p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle className="text-sm font-semibold">All Units ({filtered.length})</CardTitle>
              <div className="flex items-center gap-2">
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
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((unit) => {
                      const project = projects.find((p) => p.id === unit.projectId)
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
                          className="cursor-pointer hover:bg-accent/50"
                          onClick={() => navigateTo({ type: "unit-detail", unitId: unit.id })}
                        >
                          <TableCell className="text-sm text-foreground">{project?.name ?? "Unknown"}</TableCell>
                          <TableCell className="text-sm font-medium text-foreground">
                            Unit {unit.unitNumber}
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
