"use client"

import { useState } from "react"
import { Plus, Building2, Wrench, Inbox as InboxIcon, ArrowRight } from "lucide-react"
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
import { useApp } from "@/lib/app-context"
import { mockProjects, getProjectStats } from "@/lib/mock-data"
import { format } from "date-fns"

export function ProjectsPage() {
  const { setCurrentProject, navigateTo } = useApp()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")

  function handleCreate() {
    // Placeholder — would POST to API
    setDialogOpen(false)
    setNewName("")
    setNewDesc("")
  }

  function handleOpenProject(project: (typeof mockProjects)[0]) {
    setCurrentProject(project)
    navigateTo({ type: "project-detail", tab: "overview" })
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your maintenance projects
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-1.5 size-4" />
              Create Project
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Project</DialogTitle>
              <DialogDescription>
                Add a new property or building to manage.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 py-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-name">Project Name</Label>
                <Input
                  id="project-name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Riverside Apartments"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="project-desc">Description (optional)</Label>
                <Textarea
                  id="project-desc"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Brief description of the property..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreate} disabled={!newName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex-1 p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {mockProjects.map((project) => {
            const stats = getProjectStats(project.id)
            return (
              <Card
                key={project.id}
                className="group transition-shadow hover:shadow-md"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <Building2 className="size-4 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-semibold">
                          {project.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                          Created {format(new Date(project.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
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
                      <Building2 className="size-3.5" />
                      {stats.unitsCount} Units
                    </span>
                    <span className="flex items-center gap-1">
                      <Wrench className="size-3.5" />
                      {stats.openJobsCount} Open
                    </span>
                    <span className="flex items-center gap-1">
                      <InboxIcon className="size-3.5" />
                      {stats.casesNeedingReview} Review
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={() => handleOpenProject(project)}
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
