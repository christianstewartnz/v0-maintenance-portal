import type {
  Project,
  Unit,
  Case,
  Job,
  Contractor,
} from "./types"

export const mockProjects: Project[] = [
  {
    id: "proj_01",
    name: "Riverside Apartments",
    description: "120-unit residential complex on River Road",
    createdAt: "2025-09-15T10:30:00Z",
  },
  {
    id: "proj_02",
    name: "Oakwood Towers",
    description: "Commercial and residential mixed-use building",
    createdAt: "2025-11-01T08:00:00Z",
  },
  {
    id: "proj_03",
    name: "Cedar Park Condos",
    description: "Luxury condominiums in the Cedar Park district",
    createdAt: "2026-01-10T14:00:00Z",
  },
]

export const mockUnits: Unit[] = [
  { id: "unit_01", projectId: "proj_01", unitNumber: "101", address: "100 River Road, Apt 101" },
  { id: "unit_02", projectId: "proj_01", unitNumber: "102", address: "100 River Road, Apt 102" },
  { id: "unit_03", projectId: "proj_01", unitNumber: "201", address: "100 River Road, Apt 201" },
  { id: "unit_04", projectId: "proj_01", unitNumber: "202", address: "100 River Road, Apt 202" },
  { id: "unit_05", projectId: "proj_01", unitNumber: "301", address: "100 River Road, Apt 301" },
  { id: "unit_06", projectId: "proj_01", unitNumber: "302", address: "100 River Road, Apt 302" },
  { id: "unit_07", projectId: "proj_01", unitNumber: "401", address: "100 River Road, Apt 401" },
  { id: "unit_08", projectId: "proj_01", unitNumber: "402", address: "100 River Road, Apt 402" },
]

export const mockCases: Case[] = [
  {
    id: "case_01",
    projectId: "proj_01",
    fromName: "Sarah Mitchell",
    fromEmail: "sarah.m@email.com",
    subject: "Kitchen sink leaking badly",
    bodyRaw:
      "Hi,\n\nI've been dealing with a persistent leak under my kitchen sink for the past two days. The leak seems to be coming from the pipe joint under the basin. I've placed a bucket underneath but it fills up within a few hours. The water appears to be clean (not sewage) but it's getting worse.\n\nI've attached a photo of the leak. Could someone please come take a look as soon as possible? I'm worried about water damage to the cabinet.\n\nThank you,\nSarah Mitchell\nUnit 101",
    receivedAt: "2026-02-28T09:15:00Z",
    status: "needs_review",
  },
  {
    id: "case_02",
    projectId: "proj_01",
    fromName: "James Rodriguez",
    fromEmail: "j.rodriguez@email.com",
    subject: "Electrical outlet sparking in bedroom",
    bodyRaw:
      "Hello,\n\nI noticed that the electrical outlet on the east wall of my bedroom has been sparking when I plug in devices. This started yesterday evening. I've stopped using that outlet but I'm concerned it could be a fire hazard.\n\nPlease send an electrician as soon as possible.\n\nRegards,\nJames Rodriguez\nUnit 202",
    receivedAt: "2026-02-27T14:30:00Z",
    status: "needs_review",
  },
  {
    id: "case_03",
    projectId: "proj_01",
    fromName: "Emily Chen",
    fromEmail: "e.chen@email.com",
    subject: "Bathroom door won't close properly",
    bodyRaw:
      "Hello maintenance team,\n\nMy bathroom door has been sticking and won't close properly. It seems like the frame has shifted or the hinges are loose. It's been getting progressively worse over the past week.\n\nCould you send someone to fix it when you get a chance?\n\nThanks,\nEmily Chen\nUnit 301",
    receivedAt: "2026-02-26T11:00:00Z",
    status: "processed",
  },
  {
    id: "case_04",
    projectId: "proj_01",
    fromName: "Michael Park",
    fromEmail: "m.park@email.com",
    subject: "Dishwasher not draining",
    bodyRaw:
      "Hi there,\n\nOur dishwasher stopped draining at the end of its cycle. There's standing water at the bottom after every wash. We've tried running it a couple more times but the problem persists.\n\nThe dishwasher is a Bosch model that came with the unit. It was working fine until about three days ago.\n\nPlease advise or send someone to look at it.\n\nThanks,\nMichael Park\nUnit 402",
    receivedAt: "2026-02-25T16:45:00Z",
    status: "needs_review",
  },
]

export const mockJobs: Job[] = [
  {
    id: "job_01",
    projectId: "proj_01",
    caseId: "case_03",
    unitId: "unit_05",
    title: "Fix bathroom door alignment",
    description: "Bathroom door sticking and won't close. Likely hinge or frame issue.",
    trade: "Carpentry",
    priority: "Normal",
    status: "Assigned",
    assignedContractorId: "cont_02",
    updatedAt: "2026-02-27T10:00:00Z",
  },
  {
    id: "job_02",
    projectId: "proj_01",
    caseId: "case_01",
    unitId: "unit_01",
    title: "Repair kitchen sink pipe leak",
    description: "Persistent leak under kitchen sink at pipe joint. Clean water leak.",
    trade: "Plumbing",
    priority: "Urgent",
    status: "New",
    updatedAt: "2026-02-28T09:30:00Z",
  },
  {
    id: "job_03",
    projectId: "proj_01",
    caseId: "case_02",
    unitId: "unit_04",
    title: "Inspect sparking outlet",
    description: "Bedroom outlet sparking when plugging in devices. Potential fire hazard.",
    trade: "Electrical",
    priority: "Urgent",
    status: "New",
    updatedAt: "2026-02-28T08:00:00Z",
  },
  {
    id: "job_04",
    projectId: "proj_01",
    caseId: "case_03",
    unitId: "unit_05",
    title: "Repaint bathroom door frame",
    description: "Touch up paint on bathroom door frame after realignment repair.",
    trade: "Painting",
    priority: "Low",
    status: "New",
    updatedAt: "2026-02-27T10:15:00Z",
  },
  {
    id: "job_05",
    projectId: "proj_01",
    caseId: "case_04",
    unitId: "unit_08",
    title: "Diagnose dishwasher drainage issue",
    description: "Bosch dishwasher not draining. Standing water after cycle.",
    trade: "Appliance",
    priority: "Normal",
    status: "In Progress",
    assignedContractorId: "cont_03",
    updatedAt: "2026-02-26T14:00:00Z",
  },
]

export const mockContractors: Contractor[] = [
  {
    id: "cont_01",
    projectId: "proj_01",
    name: "FastFix Plumbing",
    email: "dispatch@fastfix.com",
    trades: ["Plumbing"],
  },
  {
    id: "cont_02",
    projectId: "proj_01",
    name: "WoodWorks Pro",
    email: "jobs@woodworkspro.com",
    trades: ["Carpentry", "Painting"],
  },
  {
    id: "cont_03",
    projectId: "proj_01",
    name: "AllStar Appliances",
    email: "service@allstarappliances.com",
    trades: ["Appliance", "General"],
  },
  {
    id: "cont_04",
    projectId: "proj_01",
    name: "BrightSpark Electric",
    email: "support@brightspark.com",
    trades: ["Electrical"],
  },
]

export function getProjectStats(projectId: string) {
  const units = mockUnits.filter((u) => u.projectId === projectId)
  const jobs = mockJobs.filter(
    (j) => j.projectId === projectId && !["Completed", "Closed"].includes(j.status)
  )
  const casesNeedingReview = mockCases.filter(
    (c) => c.projectId === projectId && c.status === "needs_review"
  )
  return {
    unitsCount: units.length,
    openJobsCount: jobs.length,
    casesNeedingReview: casesNeedingReview.length,
  }
}
