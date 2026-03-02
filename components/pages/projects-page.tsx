"use client"

import { Building2, ClipboardList, MessageSquareText, ArrowRight, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import { mockProjects, mockUnits } from "@/lib/mock-data"
import { format } from "date-fns"

export function ProjectsPage() {
  const { items, requests, navigateTo } = useApp()

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-6 py-4">
        <h1 className="text-xl font-semibold text-foreground">Projects</h1>
        <p className="text-sm text-muted-foreground">Manage your maintenance projects</p>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => {
            const unitCount = mockUnits.filter((u) => u.projectId === project.id).length
            const openItems = items.filter(
              (i) => i.projectId === project.id && !["Completed", "Closed"].includes(i.status)
            ).length
            const reviewCount = requests.filter(
              (r) => r.projectId === project.id && r.status === "needs_review"
            ).length

            // Find most recent item or request activity
            const projectItems = items.filter((i) => i.projectId === project.id)
            const latestUpdate = projectItems.length > 0
              ? projectItems.reduce((latest, i) =>
                  new Date(i.updatedAt) > new Date(latest.updatedAt) ? i : latest
                ).updatedAt
              : project.createdAt

            return (
              <Card key={project.id} className="group transition-shadow hover:shadow-md">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{project.name}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {unitCount} Units
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  {project.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {project.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <ClipboardList className="size-3.5" />
                      {openItems} Open
                    </span>
                    <span className="flex items-center gap-1">
                      <MessageSquareText className="size-3.5" />
                      {reviewCount} Review
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {format(new Date(latestUpdate), "MMM d")}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => navigateTo({ type: "project-detail", projectId: project.id })}
                  >
                    Open Project
                    <ArrowRight className="ml-1.5 size-3.5" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
