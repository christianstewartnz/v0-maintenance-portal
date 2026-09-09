export interface Project {
  id: string
  userId: string
  name: string
  address: string
  description: string
  developmentCompany: string | null
  createdAt: string
  archivedAt: string | null
}

export interface Unit {
  id: string
  projectId: string
  unitNumber: string
  address: string
  archivedAt: string | null
  ownerName: string | null
  ownerEmail: string | null
  ownerPhone: string | null
}

export type RequestStatus = "needs_review" | "processed" | "error" | "archived"

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
  fromPhone: string | null
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
  | "Marked Complete - Needs Review"
  | "Completed"
  | "Closed"

export interface Item {
  id: string
  projectId: string
  requestId: string | null
  unitId: string
  title: string
  description: string
  otherNotes: string | null
  trade: Trade
  priority: Priority
  status: ItemStatus
  createdAt: string
  updatedAt: string
  project?: Pick<Project, "id" | "name">
  unit?: Pick<Unit, "id" | "unitNumber" | "address">
  request?: Pick<
    MaintenanceRequest,
    "id" | "subject" | "fromName" | "fromEmail" | "fromPhone"
  > | null
  workOrderItems?: WorkOrderItem[]
  activities?: ItemActivity[]
}

export interface DraftItem {
  id: string
  title: string
  description: string
  otherNotes: string | null
  trade: Trade
  priority: Priority
}

export interface AIDraftResponse {
  detectedProjectId: string | null
  detectedUnitId: string | null
  items: {
    title: string
    description: string
    otherNotes: string | null
    trade: Trade
    priority: Priority
  }[]
}

export type WorkOrderStatus =
  | "Draft"
  | "Issued"
  | "In Progress"
  | "Completed"
  | "Closed"

export interface Contractor {
  id: string
  name: string
  contactName: string
  email: string
  phone: string | null
  trade: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface WorkOrder {
  id: string
  reference: string
  projectId: string
  contractorId: string
  status: WorkOrderStatus
  issuedAt: string | null
  completedAt: string | null
  closedAt: string | null
  accessNotes: string | null
  messageBody: string | null
  createdAt: string
  project?: Pick<Project, "id" | "name" | "developmentCompany">
  contractor?: Contractor
  items?: WorkOrderItem[]
  access?: WorkOrderAccess[]
}

export interface WorkOrderItem {
  id: string
  workOrderId: string
  itemId: string
  isCompletedByContractor: boolean
  completedAt: string | null
  completionNotes: string | null
  createdAt: string
  item?: Item
  workOrder?: Pick<WorkOrder, "id" | "reference" | "status">
}

export interface WorkOrderAccess {
  id: string
  workOrderId: string
  token: string
  isActive: boolean
  createdAt: string
}

export interface ItemActivity {
  id: string
  itemId: string
  message: string
  createdAt: string
}

/** Response shape for GET /api/dashboard */
export interface DashboardNeedsReviewRow {
  id: string
  projectName: string | null
  fromName: string
  fromEmail: string
  subject: string
  receivedAt: string
}

export interface DashboardOpenItemsByProject {
  projectId: string
  projectName: string
  openTotal: number
  newCount: number
  inProgressCount: number
}

export interface DashboardData {
  stats: {
    requestsNeedingReview: number
    activeWorkOrders: number
    openItems: number
  }
  needsReview: {
    total: number
    rows: DashboardNeedsReviewRow[]
  }
  openItemsByProject: DashboardOpenItemsByProject[]
}
