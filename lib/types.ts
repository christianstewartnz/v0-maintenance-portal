export interface Project {
  id: string
  name: string
  description: string
  createdAt: string
}

export interface Unit {
  id: string
  projectId: string
  unitNumber: string
  address: string
}

export type RequestStatus = "needs_review" | "processed"

export interface MaintenanceRequest {
  id: string
  projectId: string
  fromName: string
  fromEmail: string
  subject: string
  bodyRaw: string
  receivedAt: string
  status: RequestStatus
  detectedUnitId?: string
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
}

export interface DraftItem {
  id: string
  title: string
  description: string
  trade: Trade
  priority: Priority
}
