"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { useApp } from "@/lib/app-context"
import { DashboardPage } from "@/components/pages/dashboard-page"
import { ProjectsPage } from "@/components/pages/projects-page"
import { ProjectDetailPage } from "@/components/pages/project-detail-page"
import { UnitDetailPage } from "@/components/pages/unit-detail-page"
import { RequestsListPage } from "@/components/pages/requests-list-page"
import { RequestReviewPage } from "@/components/pages/request-review-page"
import { ItemsListPage } from "@/components/pages/items-list-page"
import { WorkOrdersListPage } from "@/components/pages/work-orders-list-page"
import { WorkOrderDetailPage } from "@/components/pages/work-order-detail-page"
import { ContractorsListPage } from "@/components/pages/contractors-list-page"

export function AppShell() {
  const { currentPage, loading } = useApp()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="size-8 animate-spin rounded-full border-4 border-muted border-t-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  function renderPage() {
    switch (currentPage.type) {
      case "dashboard":
        return <DashboardPage />
      case "projects":
        return <ProjectsPage />
      case "project-detail":
        return <ProjectDetailPage />
      case "unit-detail":
        return <UnitDetailPage />
      case "requests":
        return <RequestsListPage />
      case "request-review":
        return <RequestReviewPage />
      case "items":
        return <ItemsListPage />
      case "work-orders":
        return <WorkOrdersListPage />
      case "work-order-detail":
        return <WorkOrderDetailPage />
      case "contractors":
        return <ContractorsListPage />
      default:
        return <DashboardPage />
    }
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <AppHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          {renderPage()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
