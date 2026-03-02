"use client"

import { Building2, Wrench, Inbox, HardHat } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useApp } from "@/lib/app-context"
import { getProjectStats, mockContractors, mockCases, mockJobs } from "@/lib/mock-data"
import { format } from "date-fns"

export function OverviewTab() {
  const { currentProject } = useApp()
  if (!currentProject) return null

  const stats = getProjectStats(currentProject.id)
  const recentCases = mockCases
    .filter((c) => c.projectId === currentProject.id)
    .slice(0, 3)
  const contractors = mockContractors.filter(
    (c) => c.projectId === currentProject.id
  )

  const statCards = [
    {
      label: "Units",
      value: stats.unitsCount,
      icon: Building2,
      color: "text-primary",
      bg: "bg-primary/10",
    },
    {
      label: "Open Jobs",
      value: stats.openJobsCount,
      icon: Wrench,
      color: "text-chart-2",
      bg: "bg-chart-2/10",
    },
    {
      label: "Cases to Review",
      value: stats.casesNeedingReview,
      icon: Inbox,
      color: "text-warning",
      bg: "bg-warning/10",
    },
    {
      label: "Contractors",
      value: contractors.length,
      icon: HardHat,
      color: "text-muted-foreground",
      bg: "bg-muted",
    },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-foreground">
          {currentProject.name}
        </h2>
        {currentProject.description && (
          <p className="mt-1 text-sm text-muted-foreground">
            {currentProject.description}
          </p>
        )}
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex items-center gap-4 p-4">
              <div
                className={`flex size-10 items-center justify-center rounded-lg ${stat.bg}`}
              >
                <stat.icon className={`size-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Recent Cases</CardTitle>
          </CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent cases.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {recentCases.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-start justify-between rounded-lg border border-border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {c.subject}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {c.fromName} &middot;{" "}
                        {format(new Date(c.receivedAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <span
                      className={`ml-2 shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        c.status === "needs_review"
                          ? "bg-warning/15 text-warning-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.status === "needs_review" ? "Needs Review" : "Processed"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold">Active Jobs</CardTitle>
          </CardHeader>
          <CardContent>
            {mockJobs.filter(
              (j) =>
                j.projectId === currentProject.id &&
                !["Completed", "Closed"].includes(j.status)
            ).length === 0 ? (
              <p className="text-sm text-muted-foreground">No active jobs.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {mockJobs
                  .filter(
                    (j) =>
                      j.projectId === currentProject.id &&
                      !["Completed", "Closed"].includes(j.status)
                  )
                  .slice(0, 3)
                  .map((j) => (
                    <div
                      key={j.id}
                      className="flex items-start justify-between rounded-lg border border-border p-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          {j.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {j.trade} &middot; {j.priority}
                        </p>
                      </div>
                      <span className="ml-2 shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                        {j.status}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
