"use client"

import { useState } from "react"
import { Building2, MapPin, Home, ClipboardList, MessageSquareText, ArrowRight, Archive, ArchiveRestore, Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

export function ProjectsPage() {
  const { items, requests, navigateTo, projects, units, archiveProject, fetchProjects, createProject } = useApp()
  const [showArchived, setShowArchived] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newAddress, setNewAddress] = useState("")
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
      const created = await createProject({ name: newName, address: newAddress, description: newDescription })
      setDialogOpen(false)
      setNewName("")
      setNewAddress("")
      setNewDescription("")
      navigateTo({ type: "project-detail", projectId: created.id })
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
                  <Label htmlFor="project-address">Address</Label>
                  <Input
                    id="project-address"
                    value={newAddress}
                    onChange={(e) => setNewAddress(e.target.value)}
                    placeholder="e.g. 123 Main St, Suite 100"
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
        <div className="flex flex-col gap-3">
          {projects.map((project) => {
            const isArchived = !!project.archivedAt
            const unitCount = units.filter((u) => u.projectId === project.id).length
            const requestCount = requests.filter((r) => r.projectId === project.id).length
            const openItems = items.filter(
              (i) => i.projectId === project.id && !["Completed", "Closed"].includes(i.status)
            ).length

            return (
              <Card key={project.id} className={`transition-shadow hover:shadow-md ${isArchived ? "opacity-60" : ""}`}>
                <CardContent className="flex items-center gap-6 py-4">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="size-5 text-primary" />
                  </div>

                  <div className="flex min-w-0 flex-1 items-center gap-6">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-semibold text-foreground">{project.name}</h3>
                        {isArchived && (
                          <Badge variant="secondary" className="shrink-0 text-[10px]">Archived</Badge>
                        )}
                      </div>
                      {project.address && (
                        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                          <MapPin className="size-3 shrink-0" />
                          {project.address}
                        </p>
                      )}
                    </div>

                    <div className="hidden items-center gap-5 text-xs text-muted-foreground sm:flex">
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <Home className="size-3.5" />
                        {unitCount} {unitCount === 1 ? "Unit" : "Units"}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <MessageSquareText className="size-3.5" />
                        {requestCount} {requestCount === 1 ? "Request" : "Requests"}
                      </span>
                      <span className="flex items-center gap-1.5 whitespace-nowrap">
                        <ClipboardList className="size-3.5" />
                        {openItems} Open
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
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
