"use client"

import { useState } from "react"
import { Building2, ClipboardList, MessageSquareText, ArrowRight, Clock, Archive, ArchiveRestore, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useApp } from "@/lib/app-context"
import { format } from "date-fns"

export function ProjectsPage() {
  const { items, requests, navigateTo, projects, units, archiveProject, fetchProjects, createProject } = useApp()
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDescription, setNewDescription] = useState("")
  const [creating, setCreating] = useState(false)

  const handleToggleArchived = (checked: boolean) => {
    setShowArchived(checked)
    fetchProjects(checked)
  }

  const handleArchive = async (projectId: string, archive: boolean) => {
    await archiveProject(projectId, archive)
    if (!archive && !showArchived) {
      await fetchProjects(false)
    }
  }

  const handleCreateProject = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      await createProject({ name: newName, description: newDescription })
      setDialogOpen(false)
      setNewName("")
      setNewDescription("")
    } catch (err) {
      console.error("Failed to create project:", err)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Projects</h1>
          <p className="text-sm text-muted-foreground">Manage your maintenance projects</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
            <Checkbox
              checked={showArchived}
              onCheckedChange={(checked) => handleToggleArchived(checked === true)}
            />
            Show archived
          </label>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-1.5 size-4" />
                Add Project
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Project</DialogTitle>
                <DialogDescription>
                  Create a new maintenance project.
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="project-name">Name</Label>
                  <Input
                    id="project-name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Riverside Apartments"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="project-description">Description</Label>
                  <Textarea
                    id="project-description"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Optional project description..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateProject} disabled={!newName.trim() || creating}>
                  {creating ? "Creating..." : "Create Project"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => {
            const isArchived = !!project.archivedAt
            const unitCount = units.filter((u) => u.projectId === project.id).length
            const openItems = items.filter(
              (i) => i.projectId === project.id && !["Completed", "Closed"].includes(i.status)
            ).length
            const reviewCount = requests.filter(
              (r) => r.projectId === project.id && r.status === "needs_review"
            ).length

            const projectItems = items.filter((i) => i.projectId === project.id)
            const latestUpdate = projectItems.length > 0
              ? projectItems.reduce((latest, i) =>
                  new Date(i.updatedAt) > new Date(latest.updatedAt) ? i : latest
                ).updatedAt
              : project.createdAt

            return (
              <Card key={project.id} className={`group transition-shadow hover:shadow-md ${isArchived ? "opacity-60" : ""}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                      <Building2 className="size-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">{project.name}</CardTitle>
                        {isArchived && (
                          <Badge variant="secondary" className="text-[10px]">Archived</Badge>
                        )}
                      </div>
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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => navigateTo({ type: "project-detail", projectId: project.id })}
                    >
                      Open Project
                      <ArrowRight className="ml-1.5 size-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="shrink-0">
                          {isArchived ? (
                            <ArchiveRestore className="size-3.5" />
                          ) : (
                            <Archive className="size-3.5" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            {isArchived ? "Unarchive" : "Archive"} &ldquo;{project.name}&rdquo;?
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            {isArchived
                              ? "This will restore the project to active views."
                              : "This will hide the project from default views. Units, requests, and items will be preserved."}
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleArchive(project.id, !isArchived)}>
                            {isArchived ? "Unarchive" : "Archive"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
