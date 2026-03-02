"use client"

import {
  LayoutDashboard,
  Building2,
  DoorOpen,
  MessageSquareText,
  ClipboardList,
  Wrench,
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
import { useApp } from "@/lib/app-context"
import type { Page } from "@/lib/app-context"

const navItems: { label: string; icon: typeof LayoutDashboard; pageType: Page["type"] }[] = [
  { label: "Dashboard", icon: LayoutDashboard, pageType: "dashboard" },
  { label: "Projects", icon: Building2, pageType: "projects" },
  { label: "Units", icon: DoorOpen, pageType: "units" },
  { label: "Requests", icon: MessageSquareText, pageType: "requests" },
  { label: "Items", icon: ClipboardList, pageType: "items" },
]

export function AppSidebar() {
  const { currentPage, navigateTo } = useApp()

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
      <SidebarContent className="pt-2">
        <SidebarGroup>
          <SidebarGroupLabel className="px-1 text-[11px] uppercase tracking-wider">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = currentPage.type === item.pageType

                return (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => {
                        navigateTo({ type: item.pageType } as Page)
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
        <div className="text-xs text-muted-foreground">v2.0.0</div>
      </SidebarFooter>
    </Sidebar>
  )
}
