export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
  archivedAt: string | null
}

export interface Unit {
  id: string
  projectId: string
  unitNumber: string
  address: string
  archivedAt: string | null
}

export type RequestStatus = "needs_review" | "processed" | "error"

export interface MaintenanceAttachment {
  id: string
  requestId: string
  fileName: string
  mimeType: string
  storagePath: string
  createdAt: string
}

export interface MaintenanceRequest {
  id: string
  projectId: string | null
  fromName: string
  fromEmail: string
  subject: string
  bodyRaw: string
  receivedAt: string
  status: RequestStatus
  detectedUnitId?: string
  attachments?: MaintenanceAttachment[]
}

export interface ImportFileResult {
  filename: string
  status: "success" | "error"
  requestIds: string[]
  error?: string
}

export interface ImportEmailResponse {
  results: ImportFileResult[]
}

export type Trade =
  | "Plumbing"
  | "Electrical"
  | "Carpentry"
  | "Painting"
  | "Appliance"
  | "General"
  | "Other"

export type Priority = "Low" | "Normal" | "Urgent"

export type ItemStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Closed"

export interface Item {
  id: string
  projectId: string
  requestId: string
  unitId: string
  title: string
  description: string
  trade: Trade
  priority: Priority
  status: ItemStatus
  createdAt: string
  updatedAt: string
  project?: Pick<Project, "id" | "name">
  unit?: Pick<Unit, "id" | "unitNumber" | "address">
  request?: Pick<MaintenanceRequest, "id" | "subject">
}

export interface DraftItem {
  id: string
  title: string
  description: string
  trade: Trade
  priority: Priority
}

export interface AIDraftResponse {
  detectedProjectId: string | null
  detectedUnitId: string | null
  items: {
    title: string
    description: string
    trade: Trade
    priority: Priority
  }[]
}
