"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useApp } from "@/lib/app-context"

export function SettingsTab() {
  const { currentProject } = useApp()
  if (!currentProject) return null

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">Settings</h2>
        <p className="text-sm text-muted-foreground">
          Manage project configuration
        </p>
      </div>
      <div className="flex max-w-2xl flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">General</CardTitle>
            <CardDescription>
              Update your project name and description.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-name">Project Name</Label>
              <Input
                id="settings-name"
                defaultValue={currentProject.name}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="settings-desc">Description</Label>
              <Textarea
                id="settings-desc"
                defaultValue={currentProject.description}
                rows={3}
              />
            </div>
            <div>
              <Button size="sm">Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-sm font-semibold text-destructive">
              Danger Zone
            </CardTitle>
            <CardDescription>
              Permanently delete this project and all associated data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" size="sm">
              Delete Project
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
