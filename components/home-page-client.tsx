"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { Analytics } from "@vercel/analytics/react"
import { supabase } from "@/lib/supabaseClient"
import { AppProvider, useApp } from "@/lib/app-context"
import { AppShell } from "@/components/app-shell"
import { Login } from "@/components/Login"

function DashboardDocumentTitle() {
  const { currentPage } = useApp()

  useEffect(() => {
    document.title =
      currentPage.type === "dashboard"
        ? "Dashboard · Maintenance Portal"
        : "Maintenance Portal"
  }, [currentPage.type])

  return null
}

export function HomePageClient() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  return (
    <>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-muted-foreground text-sm">Loading…</div>
        </div>
      ) : !session ? (
        <Login />
      ) : (
        <AppProvider>
          <DashboardDocumentTitle />
          <AppShell />
        </AppProvider>
      )}
      <Analytics />
    </>
  )
}
