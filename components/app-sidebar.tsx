"use client"

import {
  Building2,
  Inbox,
  Wrench,
  HardHat,
  Settings,
  ChevronDown,
} from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useApp } from "@/lib/app-context"
import { mockProjects } from "@/lib/mock-data"

const navItems = [
  { label: "Projects", icon: Building2, page: "projects" as const },
  { label: "Inbox", icon: Inbox, page: "project-detail" as const, tab: "inbox" },
  { label: "Jobs", icon: Wrench, page: "project-detail" as const, tab: "jobs" },
  { label: "Contractors", icon: HardHat, page: "project-detail" as const, tab: "contractors" },
  { label: "Settings", icon: Settings, page: "project-detail" as const, tab: "settings" },
]

export function AppSidebar() {
  const { currentProject, setCurrentProject, currentPage, navigateTo } = useApp()

  return (
    <Sidebar>
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary">
            <Wrench className="size-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold text-sidebar-foreground">
            Maintenance Portal
          </span>
        </div>
      </SidebarHeader>
      <SidebarSeparator />
      {currentProject && (
        <SidebarGroup className="px-3 pt-3 pb-0">
          <SidebarGroupLabel className="mb-1 px-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            Project
          </SidebarGroupLabel>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center justify-between rounded-md border border-border bg-card px-3 py-2 text-left text-sm font-medium text-card-foreground transition-colors hover:bg-accent">
                <span className="truncate">{currentProject.name}</span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              {mockProjects.map((project) => (
                <DropdownMenuItem
                  key={project.id}
                  onClick={() => setCurrentProject(project)}
                  className={project.id === currentProject.id ? "bg-accent" : ""}
                >
                  {project.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarGroup>
      )}
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive =
                  item.page === "projects"
                    ? currentPage.type === "projects"
                    : currentPage.type === "project-detail" &&
                      "tab" in currentPage &&
                      currentPage.tab === item.tab

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        if (item.page === "projects") {
                          navigateTo({ type: "projects" })
                        } else {
                          navigateTo({
                            type: "project-detail",
                            tab: item.tab,
                          })
                        }
                      }}
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="px-4 py-3">
        <div className="text-xs text-muted-foreground">
          v1.0.0
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
