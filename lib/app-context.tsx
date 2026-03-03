"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Project, Unit, MaintenanceRequest, Item } from "./types"

export type Page =
  | { type: "dashboard" }
  | { type: "projects" }
  | { type: "project-detail"; projectId: string }
  | { type: "units" }
  | { type: "unit-detail"; unitId: string }
  | { type: "requests" }
  | { type: "request-review"; requestId: string }
  | { type: "items"; filterUnitId?: string }

interface AppContextValue {
  loading: boolean
  currentPage: Page
  navigateTo: (page: Page) => void
  projects: Project[]
  units: Unit[]
  requests: MaintenanceRequest[]
  items: Item[]
  processRequest: (requestId: string, newItems: Item[]) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>({ type: "dashboard" })
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [items, setItems] = useState<Item[]>([])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [projectsRes, unitsRes, requestsRes, itemsRes] = await Promise.all([
          fetch("/api/projects"),
          fetch("/api/units"),
          fetch("/api/requests"),
          fetch("/api/items"),
        ])
        const [projectsData, unitsData, requestsData, itemsData] = await Promise.all([
          projectsRes.json(),
          unitsRes.json(),
          requestsRes.json(),
          itemsRes.json(),
        ])
        setProjects(projectsData)
        setUnits(unitsData)
        setRequests(requestsData)
        setItems(itemsData)
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page)
  }, [])

  const processRequest = useCallback(
    async (requestId: string, newItems: Item[]) => {
      try {
        const res = await fetch(`/api/requests/${requestId}/process`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ items: newItems }),
        })
        const data = await res.json()
        setRequests((prev) =>
          prev.map((r) => (r.id === requestId ? data.request : r))
        )
        setItems(data.items)
      } catch (err) {
        console.error("Failed to process request:", err)
      }
    },
    []
  )

  return (
    <AppContext.Provider
      value={{
        loading,
        currentPage,
        navigateTo,
        projects,
        units,
        requests,
        items,
        processRequest,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
