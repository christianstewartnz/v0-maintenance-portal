"use client"

import { useEffect, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useApp } from "@/lib/app-context"
import type { DashboardData } from "@/lib/types"

export function DashboardPage() {
  const { navigateTo } = useApp()
  const [data, setData] = useState<DashboardData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setLoadError(null)
      try {
        const res = await fetch("/api/dashboard")
        if (!res.ok) {
          throw new Error(res.status === 401 ? "Unauthorized" : "Failed to load")
        }
        const json: DashboardData = await res.json()
        if (!cancelled) setData(json)
      } catch (e) {
        console.error(e)
        if (!cancelled) setLoadError("Could not load dashboard.")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const stats = data?.stats
  const needsReview = data?.needsReview
  const openByProject = data?.openItemsByProject ?? []

  return (
    <div className="min-h-full bg-muted/40">
      <div className="mx-auto max-w-7xl px-6 py-6 space-y-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Your morning briefing</p>
        </div>

        {loadError && (
          <p className="text-sm text-destructive" role="alert">
            {loadError}
          </p>
        )}

        {/* Section 1 — Stat cards */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          <button
            type="button"
            onClick={() => navigateTo({ type: "requests" })}
            className="text-left rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-xs font-medium text-muted-foreground">
              Requests Needing Review
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {loading ? "—" : (stats?.requestsNeedingReview ?? 0)}
            </p>
          </button>
          <button
            type="button"
            onClick={() => navigateTo({ type: "work-orders" })}
            className="text-left rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-xs font-medium text-muted-foreground">
              Active Work Orders
            </p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {loading ? "—" : (stats?.activeWorkOrders ?? 0)}
            </p>
          </button>
          <button
            type="button"
            onClick={() => navigateTo({ type: "items" })}
            className="text-left rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="text-xs font-medium text-muted-foreground">Open Items</p>
            <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
              {loading ? "—" : (stats?.openItems ?? 0)}
            </p>
          </button>
        </div>

        {/* Section 2 — Needs attention */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Needs attention</h2>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-medium">
                Requests needing review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 pt-0">
              {loading ? (
                <p className="text-sm text-muted-foreground py-4">Loading…</p>
              ) : (needsReview?.total ?? 0) === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">
                  You&apos;re all caught up
                </p>
              ) : (
                <>
                  <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                    {needsReview?.rows.map((row) => (
                      <li key={row.id}>
                        <button
                          type="button"
                          onClick={() =>
                            navigateTo({
                              type: "request-review",
                              requestId: row.id,
                            })
                          }
                          className="flex w-full flex-col gap-1 px-3 py-3 text-left text-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                        >
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <span className="font-medium text-foreground">
                              {row.projectName ?? "Unassigned"}
                            </span>
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {formatDistanceToNow(new Date(row.receivedAt), {
                                addSuffix: true,
                              })}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {row.fromName} · {row.fromEmail}
                          </span>
                          <span className="text-foreground line-clamp-2">
                            {row.subject}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  {(needsReview?.total ?? 0) > 5 && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm"
                      onClick={() => navigateTo({ type: "requests" })}
                    >
                      View all
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Section 3 — Open items by project */}
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Open items by project
          </h2>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : openByProject.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4">
              No open items across any projects
            </p>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {openByProject.map((p) => (
                <Card key={p.projectId} className="bg-card border-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-medium leading-snug">
                      {p.projectName}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 pt-0">
                    <p className="text-2xl font-semibold tabular-nums text-foreground">
                      {p.openTotal}{" "}
                      <span className="text-sm font-normal text-muted-foreground">
                        open
                      </span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Badge
                        variant="outline"
                        className="bg-muted/50 text-foreground border-border"
                      >
                        New · {p.newCount}
                      </Badge>
                      <Badge
                        variant="outline"
                        className="bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-200 dark:border-yellow-800"
                      >
                        In Progress · {p.inProgressCount}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
