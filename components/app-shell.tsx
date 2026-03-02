"use client"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { useApp } from "@/lib/app-context"
import { ProjectsPage } from "@/components/pages/projects-page"
import { ProjectDetailPage } from "@/components/pages/project-detail-page"
import { CaseReviewPage } from "@/components/pages/case-review-page"

export function AppShell() {
  const { currentPage } = useApp()

  function renderPage() {
    switch (currentPage.type) {
      case "projects":
        return <ProjectsPage />
      case "project-detail":
        return <ProjectDetailPage />
      case "case-review":
        return <CaseReviewPage />
      default:
        return <ProjectsPage />
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
