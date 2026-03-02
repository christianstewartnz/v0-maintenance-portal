"use client"

import { useApp } from "@/lib/app-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { OverviewTab } from "@/components/tabs/overview-tab"
import { UnitsTab } from "@/components/tabs/units-tab"
import { InboxTab } from "@/components/tabs/inbox-tab"
import { JobsTab } from "@/components/tabs/jobs-tab"
import { ContractorsTab } from "@/components/tabs/contractors-tab"
import { SettingsTab } from "@/components/tabs/settings-tab"

export function ProjectDetailPage() {
  const { currentProject, currentPage, navigateTo } = useApp()
  const tab =
    currentPage.type === "project-detail" && currentPage.tab
      ? currentPage.tab
      : "overview"

  if (!currentProject) return null

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-border px-6 py-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink
                className="cursor-pointer text-muted-foreground hover:text-foreground"
                onClick={() => navigateTo({ type: "projects" })}
              >
                Projects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{currentProject.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <Tabs
        value={tab}
        onValueChange={(value) =>
          navigateTo({ type: "project-detail", tab: value })
        }
        className="flex flex-1 flex-col"
      >
        <div className="border-b border-border px-6">
          <TabsList className="h-10 bg-transparent p-0">
            <TabsTrigger
              value="overview"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="units"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Units
            </TabsTrigger>
            <TabsTrigger
              value="inbox"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Inbox
            </TabsTrigger>
            <TabsTrigger
              value="jobs"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Jobs
            </TabsTrigger>
            <TabsTrigger
              value="contractors"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Contractors
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              Settings
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="overview" className="mt-0 flex-1">
          <OverviewTab />
        </TabsContent>
        <TabsContent value="units" className="mt-0 flex-1">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="inbox" className="mt-0 flex-1">
          <InboxTab />
        </TabsContent>
        <TabsContent value="jobs" className="mt-0 flex-1">
          <JobsTab />
        </TabsContent>
        <TabsContent value="contractors" className="mt-0 flex-1">
          <ContractorsTab />
        </TabsContent>
        <TabsContent value="settings" className="mt-0 flex-1">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
