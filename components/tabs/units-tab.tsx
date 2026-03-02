"use client"

import { useState } from "react"
import { Upload, Download, Search, Pencil, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useApp } from "@/lib/app-context"
import { mockUnits } from "@/lib/mock-data"

export function UnitsTab() {
  const { currentProject } = useApp()
  const [search, setSearch] = useState("")

  if (!currentProject) return null

  const units = mockUnits.filter((u) => u.projectId === currentProject.id)
  const filtered = units.filter(
    (u) =>
      u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
      u.address.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="flex flex-col gap-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-semibold">Upload Unit Directory</CardTitle>
          <CardDescription>
            Import units from a CSV file. Required columns: unitNumber, address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-8 text-center">
            <div className="flex size-12 items-center justify-center rounded-full bg-muted">
              <Upload className="size-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                Drag and drop your CSV file here
              </p>
              <p className="text-xs text-muted-foreground">or click to browse</p>
            </div>
            <Button variant="outline" size="sm">
              Select File
            </Button>
          </div>
          <div className="mt-3">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              <Download className="mr-1.5 size-3.5" />
              Download CSV Template
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold">
              Units ({filtered.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by unit number or address..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="text-xs font-medium">Unit Number</TableHead>
                  <TableHead className="text-xs font-medium">Address</TableHead>
                  <TableHead className="w-24 text-right text-xs font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="py-8 text-center text-sm text-muted-foreground">
                      No units found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filtered.map((unit) => (
                    <TableRow key={unit.id}>
                      <TableCell className="text-sm font-medium">
                        {unit.unitNumber}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {unit.address}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" className="size-7">
                            <Pencil className="size-3.5" />
                            <span className="sr-only">Edit unit</span>
                          </Button>
                          <Button variant="ghost" size="icon" className="size-7 text-destructive">
                            <Trash2 className="size-3.5" />
                            <span className="sr-only">Delete unit</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
