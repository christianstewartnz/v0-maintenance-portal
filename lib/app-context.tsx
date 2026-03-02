"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { MaintenanceRequest, Item } from "./types"
import { mockRequests as initialRequests, mockItems as initialItems } from "./mock-data"

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
  currentPage: Page
  navigateTo: (page: Page) => void
  requests: MaintenanceRequest[]
  items: Item[]
  processRequest: (requestId: string, newItems: Item[]) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentPage, setCurrentPage] = useState<Page>({ type: "dashboard" })
  const [requests, setRequests] = useState<MaintenanceRequest[]>(initialRequests)
  const [items, setItems] = useState<Item[]>(initialItems)

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page)
  }, [])

  const processRequest = useCallback(
    (requestId: string, newItems: Item[]) => {
      setRequests((prev) =>
        prev.map((r) =>
          r.id === requestId ? { ...r, status: "processed" as const } : r
        )
      )
      setItems((prev) => [...prev, ...newItems])
    },
    []
  )

  return (
    <AppContext.Provider
      value={{
        currentPage,
        navigateTo,
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
