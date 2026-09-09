"use client"

import React, { createContext, useContext, useState, useCallback, useEffect } from "react"
import type { Project, Unit, MaintenanceRequest, Item, DraftItem, AIDraftResponse, ItemStatus, ImportEmailResponse, Contractor, WorkOrder, WorkOrderStatus } from "./types"

export type Page =
  | { type: "dashboard" }
  | { type: "projects" }
  | { type: "project-detail"; projectId: string }
  | { type: "unit-detail"; unitId: string }
  | { type: "requests" }
  | { type: "request-review"; requestId: string }
  | { type: "items"; filterUnitId?: string }
  | { type: "item-detail"; itemId: string }
  | { type: "work-orders" }
  | { type: "work-order-detail"; workOrderId: string }
  | { type: "contractors" }

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
  developmentCompany?: string
}

export interface UpdateProjectPayload {
  id: string
  name?: string
  address?: string
  description?: string
  developmentCompany?: string
}

export interface CreateUnitPayload {
  projectId: string
  unitNumber: string
  address: string
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
}

export interface UpdateUnitPayload {
  id: string
  unitNumber?: string
  address?: string
  ownerName?: string
  ownerEmail?: string
  ownerPhone?: string
}

export interface ItemFilters {
  status?: string
  trade?: string
  unitId?: string
  requestId?: string
}

export interface CreateContractorPayload {
  name: string
  contactName: string
  email: string
  phone?: string
  trade?: string
}

export interface UpdateContractorPayload {
  id: string
  name: string
  contactName: string
  email: string
  phone?: string
  trade?: string
}

export interface CreateItemPayload {
  unitId: string
  title: string
  description?: string
  trade: string
  priority: string
  otherNotes?: string
}

export interface CreateWorkOrderPayload {
  contractorId: string
  itemIds: string[]
  accessNotes?: string
  messageBody?: string
}

export interface WorkOrderFilters {
  status?: string
  contractorId?: string
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
  updateProject: (payload: UpdateProjectPayload) => Promise<Project>
  createUnit: (payload: CreateUnitPayload) => Promise<void>
  uploadUnitsCSV: (file: File, projectId?: string) => Promise<{ created: number; error?: string; rows?: { row: number; message: string }[] }>
  createRequest: (payload: CreateRequestPayload) => Promise<void>
  importEmails: (files: File[]) => Promise<ImportEmailResponse>
  processRequest: (requestId: string, unitId: string, drafts: DraftItem[]) => void
  draftRequest: (requestId: string) => Promise<AIDraftResponse>
  archiveRequest: (requestId: string, archive: boolean) => Promise<void>
  archiveProject: (projectId: string, archive: boolean) => Promise<void>
  archiveUnit: (unitId: string, archive: boolean) => Promise<void>
  updateUnit: (payload: UpdateUnitPayload) => Promise<Unit>
  createItem: (payload: CreateItemPayload) => Promise<Item>
  updateItemStatus: (itemId: string, status: ItemStatus) => Promise<void>
  updateItemNotes: (itemId: string, notes: string | null) => Promise<void>
  contractors: Contractor[]
  workOrders: WorkOrder[]
  fetchContractors: (activeOnly?: boolean) => Promise<void>
  createContractor: (payload: CreateContractorPayload) => Promise<Contractor>
  updateContractor: (payload: UpdateContractorPayload) => Promise<Contractor>
  archiveContractor: (id: string, archive: boolean) => Promise<void>
  fetchWorkOrders: (projectId?: string | null, filters?: WorkOrderFilters) => Promise<void>
  createWorkOrder: (payload: CreateWorkOrderPayload) => Promise<WorkOrder>
  issueWorkOrder: (workOrderId: string) => Promise<{ workOrder: WorkOrder; accessUrl: string }>
  closeWorkOrder: (workOrderId: string) => Promise<void>
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
  const [contractors, setContractors] = useState<Contractor[]>([])
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])

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

  const fetchContractors = useCallback(async (activeOnly?: boolean) => {
    try {
      const params = new URLSearchParams()
      if (activeOnly === false) params.set("activeOnly", "false")
      const res = await fetch(`/api/contractors?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: Contractor[] = await res.json()
      setContractors(data)
    } catch (err) {
      console.error("Failed to fetch contractors:", err)
    }
  }, [])

  useEffect(() => {
    async function fetchAll() {
      try {
        const [projectsData] = await Promise.all([fetchProjects(), fetchUnits(), fetchRequests(), fetchContractors()])

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
  }, [fetchProjects, fetchUnits, fetchRequests, fetchItems, fetchContractors])

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

  const updateProject = useCallback(
    async (payload: UpdateProjectPayload): Promise<Project> => {
      const { id, ...data } = payload
      const res = await fetch(`/api/projects/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update project")
      }
      const updated: Project = await res.json()
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)))
      return updated
    },
    [],
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
      const draftPayload = drafts.map(({ title, description, otherNotes, trade, priority }) => ({
        title,
        description,
        otherNotes: otherNotes ?? null,
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
      const projectId = data.request?.projectId
      if (projectId) {
        setSelectedProjectId(projectId)
        await fetchItems(projectId)
      }
    },
    [fetchItems]
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

  const updateUnit = useCallback(
    async (payload: UpdateUnitPayload): Promise<Unit> => {
      const { id, ...data } = payload
      const res = await fetch(`/api/units/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update unit")
      }
      const updated: Unit = await res.json()
      setUnits((prev) =>
        prev.map((u) => (u.id === id ? updated : u))
      )
      return updated
    },
    [],
  )

  const createItem = useCallback(
    async (payload: CreateItemPayload): Promise<Item> => {
      const res = await fetch("/api/items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create item")
      }
      const created: Item = await res.json()
      setItems((prev) => [created, ...prev])
      return created
    },
    [],
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

  const updateItemNotes = useCallback(
    async (itemId: string, notes: string | null) => {
      const res = await fetch(`/api/items/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ otherNotes: notes }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update item notes")
      }
      const updated: Item = await res.json()
      setItems((prev) =>
        prev.map((i) => (i.id === itemId ? updated : i))
      )
    },
    []
  )

  const createContractor = useCallback(
    async (payload: CreateContractorPayload): Promise<Contractor> => {
      const res = await fetch("/api/contractors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create contractor")
      }
      const created: Contractor = await res.json()
      await fetchContractors()
      return created
    },
    [fetchContractors],
  )

  const updateContractor = useCallback(
    async (payload: UpdateContractorPayload): Promise<Contractor> => {
      const { id, ...data } = payload
      const res = await fetch(`/api/contractors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to update contractor")
      }
      const updated: Contractor = await res.json()
      setContractors((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      )
      return updated
    },
    [],
  )

  const archiveContractor = useCallback(
    async (id: string, archive: boolean) => {
      const res = await fetch(`/api/contractors/${id}/archive`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ archive }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to archive contractor")
      }
      const updated: Contractor = await res.json()
      setContractors((prev) =>
        prev.map((c) => (c.id === id ? updated : c))
      )
    },
    [],
  )

  const fetchWorkOrders = useCallback(async (projectId?: string | null, filters?: WorkOrderFilters) => {
    try {
      const params = new URLSearchParams()
      if (projectId) params.set("projectId", projectId)
      if (filters?.status && filters.status !== "all") params.set("status", filters.status)
      if (filters?.contractorId && filters.contractorId !== "all") params.set("contractorId", filters.contractorId)
      const res = await fetch(`/api/work-orders?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      setWorkOrders(data)
    } catch (err) {
      console.error("Failed to fetch work orders:", err)
    }
  }, [])

  const createWorkOrder = useCallback(
    async (payload: CreateWorkOrderPayload): Promise<WorkOrder> => {
      const res = await fetch("/api/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to create work order")
      }
      const created: WorkOrder = await res.json()
      return created
    },
    [],
  )

  const issueWorkOrder = useCallback(
    async (workOrderId: string): Promise<{ workOrder: WorkOrder; accessUrl: string }> => {
      const res = await fetch(`/api/work-orders/${workOrderId}/issue`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to issue work order")
      }
      const data = await res.json()
      if (selectedProjectId) {
        await fetchItems(selectedProjectId)
      }
      return data
    },
    [fetchItems, selectedProjectId],
  )

  const closeWorkOrder = useCallback(
    async (workOrderId: string) => {
      const res = await fetch(`/api/work-orders/${workOrderId}/close`, {
        method: "POST",
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || "Failed to close work order")
      }
    },
    [],
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
        updateProject,
        createUnit,
        uploadUnitsCSV,
        createRequest,
        importEmails,
        draftRequest,
        processRequest,
        archiveRequest,
        archiveProject,
        archiveUnit,
        updateUnit,
        createItem,
        updateItemStatus,
        updateItemNotes,
        contractors,
        workOrders,
        fetchContractors,
        createContractor,
        updateContractor,
        archiveContractor,
        fetchWorkOrders,
        createWorkOrder,
        issueWorkOrder,
        closeWorkOrder,
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
