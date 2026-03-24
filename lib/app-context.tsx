"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Project, Unit, MaintenanceRequest, Item, DraftItem, AIDraftResponse, ItemStatus, ImportEmailResponse } from "./types"

export type Page =
  | { type: "dashboard" }
  | { type: "projects" }
  | { type: "project-detail"; projectId: string }
  | { type: "unit-detail"; unitId: string }
  | { type: "requests" }
  | { type: "request-review"; requestId: string }
  | { type: "items"; filterUnitId?: string }

export interface CreateRequestPayload {
  projectId?: string
  subject: string
  bodyRaw: string
  fromName?: string
  fromEmail?: string
}

export interface CreateProjectPayload {
  name: string
  address?: string
  description?: string
}

export interface CreateUnitPayload {
  projectId: string
  unitNumber: string
  address: string
}

export interface ItemFilters {
  status?: string
  trade?: string
  unitId?: string
  requestId?: string
}

interface AppContextValue {
  loading: boolean
  currentPage: Page
  navigateTo: (page: Page) => void
  projects: Project[]
  units: Unit[]
  requests: MaintenanceRequest[]
  items: Item[]
  selectedProjectId: string | null
  setSelectedProjectId: (id: string) => void
  fetchProjects: (includeArchived?: boolean) => Promise<Project[]>
  fetchUnits: (includeArchived?: boolean) => Promise<Unit[]>
  fetchRequests: (projectId?: string | null, status?: string) => Promise<void>
  fetchItems: (projectId: string, filters?: ItemFilters) => Promise<void>
  createProject: (payload: CreateProjectPayload) => Promise<Project>
  createUnit: (payload: CreateUnitPayload) => Promise<void>
  uploadUnitsCSV: (file: File, projectId?: string) => Promise<{ created: number; error?: string; rows?: { row: number; message: string }[] }>
  createRequest: (payload: CreateRequestPayload) => Promise<void>
  importEmails: (files: File[]) => Promise<ImportEmailResponse>
  processRequest: (requestId: string, unitId: string, drafts: DraftItem[]) => void
  draftRequest: (requestId: string) => Promise<AIDraftResponse>
  archiveRequest: (requestId: string, archive: boolean) => Promise<void>
  archiveProject: (projectId: string, archive: boolean) => Promise<void>
  archiveUnit: (unitId: string, archive: boolean) => Promise<void>
  updateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState<Page>({ type: "dashboard" })
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [requests, setRequests] = useState<MaintenanceRequest[]>([])
  const [items, setItems] = useState<Item[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  const fetchProjects = useCallback(async (includeArchived?: boolean): Promise<Project[]> => {
    try {
      const params = new URLSearchParams()
      if (includeArchived) params.set("includeArchived", "true")
      const res = await fetch(`/api/projects?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Project[] = await res.json()
      setProjects(data)
      return data
    } catch (err) {
      console.error("Failed to fetch projects:", err)
      return []
    }
  }, [])

  const fetchUnits = useCallback(async (includeArchived?: boolean): Promise<Unit[]> => {
    try {
      const params = new URLSearchParams()
      if (includeArchived) params.set("includeArchived", "true")
      const res = await fetch(`/api/units?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Unit[] = await res.json()
      setUnits(data)
      return data
    } catch (err) {
      console.error("Failed to fetch units:", err)
      return []
    }
  }, [])

  const fetchRequests = useCallback(async (projectId?: string | null, status?: string) => {
    try {
      const params = new URLSearchParams()
      if (projectId) {
        params.set("projectId", projectId)
      }
      if (status && status !== "all") params.set("status", status)
      const res = await fetch(`/api/requests?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setRequests(data)
    } catch (err) {
      console.error("Failed to fetch requests:", err)
    }
  }, [])

  const fetchItems = useCallback(async (projectId: string, filters?: ItemFilters) => {
    try {
      const params = new URLSearchParams({ projectId })
      if (filters?.status && filters.status !== "all") params.set("status", filters.status)
      if (filters?.trade && filters.trade !== "all") params.set("trade", filters.trade)
      if (filters?.unitId && filters.unitId !== "all") params.set("unitId", filters.unitId)
      if (filters?.requestId && filters.requestId !== "all") params.set("requestId", filters.requestId)
      const res = await fetch(`/api/items?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setItems(data)
    } catch (err) {
      console.error("Failed to fetch items:", err)
    }
  }, [])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [projectsData] = await Promise.all([fetchProjects(), fetchUnits(), fetchRequests()])

        if (projectsData.length > 0) {
          const firstId = projectsData[0].id
          setSelectedProjectId(firstId)
          await fetchItems(firstId)
        }
      } catch (err) {
        console.error("Failed to fetch data:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [fetchProjects, fetchUnits, fetchRequests, fetchItems])

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page)
  }, [])

  const createProject = useCallback(
    async (payload: CreateProjectPayload): Promise<Project> => {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create project")
      }
      const created: Project = await res.json()
      await fetchProjects()
      return created
    },
    [fetchProjects],
  )

  const createUnit = useCallback(
    async (payload: CreateUnitPayload) => {
      const res = await fetch("/api/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create unit")
      }
      await fetchUnits()
    },
    [fetchUnits],
  )

  const uploadUnitsCSV = useCallback(
    async (file: File, projectId?: string): Promise<{ created: number; error?: string; rows?: { row: number; message: string }[] }> => {
      const formData = new FormData()
      formData.append("file", file)
      const params = new URLSearchParams()
      if (projectId) params.set("projectId", projectId)
      const res = await fetch(`/api/units/upload?${params}`, {
        method: "POST",
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) {
        return { created: 0, error: data.error, rows: data.rows }
      }
      await fetchUnits()
      return data
    },
    [fetchUnits],
  )

  const createRequest = useCallback(
    async (payload: CreateRequestPayload) => {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create request")
      }
      await fetchRequests(payload.projectId ?? null)
    },
    [fetchRequests],
  )

  const importEmails = useCallback(
    async (files: File[]): Promise<ImportEmailResponse> => {
      const formData = new FormData()
      for (const file of files) {
        formData.append("files", file)
      }
      const res = await fetch("/api/maintenance/import-email", {
        method: "POST",
        body: formData,
      })
      const data: ImportEmailResponse = await res.json()
      if (!res.ok) {
        throw new Error("Failed to import emails")
      }
      return data
    },
    [],
  )

  const draftRequest = useCallback(
    async (requestId: string): Promise<AIDraftResponse> => {
      const res = await fetch(`/api/requests/${requestId}/draft`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to generate AI draft")
      }
      const data: AIDraftResponse = await res.json()

      setRequests((prev) =>
        prev.map((r) => {
          if (r.id !== requestId) return r
          const updates: Partial<MaintenanceRequest> = {}
          if (data.detectedUnitId) updates.detectedUnitId = data.detectedUnitId
          if (data.detectedProjectId) updates.projectId = data.detectedProjectId
          return { ...r, ...updates }
        })
      )

      return data
    },
    []
  )

  const processRequest = useCallback(
    async (requestId: string, unitId: string, drafts: DraftItem[]) => {
      const draftPayload = drafts.map(({ title, description, trade, priority }) => ({
        title,
        description,
        trade,
        priority,
      }))
      const res = await fetch(`/api/requests/${requestId}/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ unitId, items: draftPayload }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to process request")
      }
      const data = await res.json()
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? data.request : r))
      )
      if (selectedProjectId) {
        await fetchItems(selectedProjectId)
      }
    },
    [fetchItems, selectedProjectId]
  )

  const archiveRequest = useCallback(
    async (requestId: string, archive: boolean) => {
      const res = await fetch(`/api/requests/${requestId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to archive request")
      }
      const updated: MaintenanceRequest = await res.json()
      setRequests((prev) =>
        prev.map((r) => (r.id === requestId ? updated : r))
      )
    },
    []
  )

  const archiveProject = useCallback(
    async (projectId: string, archive: boolean) => {
      const res = await fetch(`/api/projects/${projectId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to archive project")
      }
      const updated: Project = await res.json()
      setProjects((prev) =>
        prev.map((p) => (p.id === projectId ? updated : p))
      )
    },
    []
  )

  const archiveUnit = useCallback(
    async (unitId: string, archive: boolean) => {
      const res = await fetch(`/api/units/${unitId}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to archive unit")
      }
      const updated: Unit = await res.json()
      setUnits((prev) =>
        prev.map((u) => (u.id === unitId ? updated : u))
      )
    },
    []
  )

  const updateItemStatus = useCallback(
    async (itemId: string, status: ItemStatus) => {
      const res = await fetch(`/api/items/${itemId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update item status")
      }
      const updated: Item = await res.json()
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? updated : i))
      )
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
        selectedProjectId,
        setSelectedProjectId,
        fetchProjects,
        fetchUnits,
        fetchRequests,
        fetchItems,
        createProject,
        createUnit,
        uploadUnitsCSV,
        createRequest,
        importEmails,
        draftRequest,
        processRequest,
        archiveRequest,
        archiveProject,
        archiveUnit,
        updateItemStatus,
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
