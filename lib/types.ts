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

export type CaseStatus = "needs_review" | "processed"

export interface Case {
  id: string
  projectId: string
  fromName: string
  fromEmail: string
  subject: string
  bodyRaw: string
  receivedAt: string
  status: CaseStatus
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

export type JobStatus =
  | "New"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Closed"

export interface Job {
  id: string
  projectId: string
  caseId: string
  unitId: string
  title: string
  description: string
  trade: Trade
  priority: Priority
  status: JobStatus
  assignedContractorId?: string
  updatedAt: string
}

export interface Contractor {
  id: string
  projectId: string
  name: string
  email: string
  trades: Trade[]
}

export interface DraftJob {
  id: string
  title: string
  description: string
  trade: Trade
  priority: Priority
}
