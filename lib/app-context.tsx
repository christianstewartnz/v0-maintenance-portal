"use client"

import React, { createContext, useContext, useState, useCallback } from "react"
import type { Project } from "./types"
import { mockProjects } from "./mock-data"

type Page =
  | { type: "projects" }
  | { type: "project-detail"; tab?: string }
  | { type: "case-review"; caseId: string }

interface AppContextValue {
  currentProject: Project | null
  setCurrentProject: (project: Project | null) => void
  currentPage: Page
  navigateTo: (page: Page) => void
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProject] = useState<Project | null>(
    mockProjects[0]
  )
  const [currentPage, setCurrentPage] = useState<Page>({ type: "projects" })

  const navigateTo = useCallback((page: Page) => {
    setCurrentPage(page)
  }, [])

  return (
    <AppContext.Provider
      value={{
        currentProject,
        setCurrentProject,
        currentPage,
        navigateTo,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useApp must be used within AppProvider")
  return context
}
