"use client"

import { type ReactNode, useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { getRoleLandingPath, hydrateSession } from "@/lib/auth"
import { SidebarNav } from "./sidebar-nav"
import { Topbar } from "./topbar"

interface DashboardLayoutProps {
  children: ReactNode
  role: "admin" | "employee" | "client"
  userName?: string
  userRole?: string
  userEmail?: string
  title: string
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
  showSearch?: boolean
}

export function DashboardLayout({
  children,
  role,
  userName,
  userRole,
  userEmail,
  title,
  searchPlaceholder,
  searchValue,
  onSearchChange,
  showSearch = true,
}: DashboardLayoutProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isAdmin = role === "admin"
  const [authStatus, setAuthStatus] = useState<"checking" | "ready">("checking")
  const [resolvedUser, setResolvedUser] = useState({
    name: userName || "Usuario",
    roleLabel: userRole || getDefaultRoleLabel(role),
    email: userEmail,
  })

  useEffect(() => {
    let active = true

    const syncSession = async () => {
      const sessionUser = await hydrateSession()
      if (!active) return

      if (!sessionUser) {
        router.replace("/")
        return
      }

      if (sessionUser.role !== role) {
        router.replace(getRoleLandingPath(sessionUser.role))
        return
      }

      setResolvedUser({
        name: `${sessionUser.firstName} ${sessionUser.lastName}`.trim() || userName || "Usuario",
        roleLabel: userRole || getDefaultRoleLabel(sessionUser.role),
        email: sessionUser.email || userEmail,
      })
      setAuthStatus("ready")
    }

    setAuthStatus("checking")
    void syncSession()

    return () => {
      active = false
    }
  }, [pathname, role, router, userEmail, userName, userRole])

  if (authStatus !== "ready") {
    return (
      <div className={cn("flex min-h-screen items-center justify-center", isAdmin ? "bg-[#fbf6ef]" : "bg-background")}>
        <div className="rounded-2xl border bg-card px-6 py-4 text-sm text-muted-foreground">
          Validando sesión...
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-screen", isAdmin ? "bg-[#fbf6ef]" : "bg-background")}>
      <SidebarNav
        role={role}
        userName={resolvedUser.name}
        userRole={resolvedUser.roleLabel}
        userEmail={resolvedUser.email}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex min-h-screen flex-1 flex-col">
        <Topbar
          role={role}
          title={title}
          userName={resolvedUser.name}
          userRole={resolvedUser.roleLabel}
          onMenuClick={() => setSidebarOpen(true)}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          searchValue={searchValue}
          onSearchChange={onSearchChange}
        />

        <main
          className={cn(
            "flex-1 overflow-y-auto",
            isAdmin ? "px-4 pb-8 pt-6 sm:px-7 lg:px-10 lg:pt-10" : "p-6"
          )}
        >
          {children}
        </main>
      </div>
    </div>
  )
}

function getDefaultRoleLabel(role: DashboardLayoutProps["role"]) {
  if (role === "admin") return "Administrador"
  if (role === "employee") return "Empleado"
  return "Cliente"
}
