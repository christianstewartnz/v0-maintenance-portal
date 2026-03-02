"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { useApp } from "@/lib/app-context"
import { DashboardPage } from "@/components/pages/dashboard-page"
import { ProjectsPage } from "@/components/pages/projects-page"
import { ProjectDetailPage } from "@/components/pages/project-detail-page"
import { UnitsListPage } from "@/components/pages/units-list-page"
import { UnitDetailPage } from "@/components/pages/unit-detail-page"
import { RequestsListPage } from "@/components/pages/requests-list-page"
import { RequestReviewPage } from "@/components/pages/request-review-page"
import { ItemsListPage } from "@/components/pages/items-list-page"

export function AppShell() {
  const { currentPage } = useApp()

  function renderPage() {
    switch (currentPage.type) {
      case "dashboard":
        return <DashboardPage />
      case "projects":
        return <ProjectsPage />
      case "project-detail":
        return <ProjectDetailPage />
      case "units":
        return <UnitsListPage />
      case "unit-detail":
        return <UnitDetailPage />
      case "requests":
        return <RequestsListPage />
      case "request-review":
        return <RequestReviewPage />
      case "items":
        return <ItemsListPage />
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
