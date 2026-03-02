"use client"

import { HardHat, Mail } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useApp } from "@/lib/app-context"
import { mockContractors } from "@/lib/mock-data"

export function ContractorsTab() {
  const { currentProject } = useApp()
  if (!currentProject) return null

  const contractors = mockContractors.filter(
    (c) => c.projectId === currentProject.id
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Contractors</h2>
        <p className="text-sm text-muted-foreground">
          Manage contractors assigned to this project
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {contractors.map((contractor) => (
          <Card key={contractor.id}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                  <HardHat className="size-5 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-sm font-semibold">
                    {contractor.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="size-3" />
                    {contractor.email}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1.5">
                {contractor.trades.map((trade) => (
                  <Badge key={trade} variant="secondary" className="text-xs">
                    {trade}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
