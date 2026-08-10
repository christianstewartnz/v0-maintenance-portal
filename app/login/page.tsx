import { Suspense } from "react"
import { LoginPageClient } from "@/components/login-page-client"

export default function LoginPage() {
  return (
    <Suspense>
      <LoginPageClient />
    </Suspense>
  )
}
