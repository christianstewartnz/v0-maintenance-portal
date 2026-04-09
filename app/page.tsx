"use client"

import { useEffect, useState } from "react"
import type { Session } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabaseClient"
import { AppProvider } from "@/lib/app-context"
import { AppShell } from "@/components/app-shell"
import { Login } from "@/components/Login"

export default function Page() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    )
  }

  if (!session) {
    return <Login />
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}
