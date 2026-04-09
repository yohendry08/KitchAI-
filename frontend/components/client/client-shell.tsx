"use client"

import { createContext, type ReactNode, useContext, useEffect, useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CalendarDays,
  ClipboardList,
  LogOut,
  Menu,
  MessageSquareText,
  UserRound,
  UtensilsCrossed,
  X,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getRoleLandingPath, hydrateSession, signOut, type SessionUser } from "@/lib/auth"

interface ClientShellProps {
  children: ReactNode
  backHref?: string
}

const ClientSessionContext = createContext<SessionUser | null>(null)

const navItems = [
  { href: "/cliente", label: "Menu", icon: UtensilsCrossed },
  { href: "/cliente/reservaciones", label: "Reservas", icon: CalendarDays },
  { href: "/cliente/pedidos", label: "Pedidos", icon: ClipboardList },
  { href: "/cliente/perfil", label: "Perfil", icon: UserRound },
]

const drawerItems = [
  ...navItems,
  { href: "/cliente/chat", label: "Asistencia", icon: MessageSquareText },
]

export function ClientShell({ children, backHref }: ClientShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [authStatus, setAuthStatus] = useState<"checking" | "ready">("checking")
  const [resolvedUser, setResolvedUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    let active = true

    const syncSession = async () => {
      try {
        const sessionUser = await hydrateSession()
        if (!active) return

        if (!sessionUser) {
          router.replace("/")
          return
        }

        if (sessionUser.role !== "client") {
          router.replace(getRoleLandingPath(sessionUser.role))
          return
        }

        setResolvedUser(sessionUser)
        setAuthStatus("ready")
      } catch {
        if (!active) return
        router.replace("/")
      }
    }

    setAuthStatus("checking")
    void syncSession()

    return () => {
      active = false
    }
  }, [pathname, router])

  useEffect(() => {
    setDrawerOpen(false)
  }, [pathname])

  if (authStatus !== "ready" || !resolvedUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f6efe6] px-4">
        <div className="rounded-[28px] border border-[#eadfce] bg-[#fffaf5] px-6 py-4 text-sm text-[#725f4c] shadow-[0_20px_60px_rgba(84,53,22,0.08)]">
          Validando sesion...
        </div>
      </div>
    )
  }

  return (
    <ClientSessionContext.Provider value={resolvedUser}>
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(208,174,119,0.18),_transparent_38%),linear-gradient(180deg,_#f7f1e8_0%,_#f4ede5_100%)] text-[#23160d]">
        <ClientDrawer open={drawerOpen} user={resolvedUser} onClose={() => setDrawerOpen(false)} />

        <div className="min-h-screen bg-[#fbf6f0]/75">
          <header className="sticky top-0 z-30 border-b border-[#ecdfcf] bg-[#fbf6f0]/95 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-10">
              <button
                type="button"
                onClick={() => (backHref ? router.push(backHref) : setDrawerOpen(true))}
                className="rounded-full border border-[#eadfce] bg-[#fffaf4] p-2.5 text-[#805410] transition hover:bg-[#f4ebdf] lg:hidden"
                aria-label={backHref ? "Volver" : "Abrir menu"}
              >
                {backHref ? <ArrowLeft className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>

              <div className="flex min-w-0 items-center gap-4">
                {backHref ? (
                  <button
                    type="button"
                    onClick={() => router.push(backHref)}
                    className="hidden rounded-full border border-[#eadfce] bg-[#fffaf4] p-2.5 text-[#805410] transition hover:bg-[#f4ebdf] lg:inline-flex"
                    aria-label="Volver"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                ) : null}
                <Link href="/cliente" className="font-serif text-[1.7rem] font-semibold tracking-tight text-[#7d4f08] sm:text-[1.95rem]">
                  KitchAI
                </Link>
              </div>

              <nav className="hidden items-center gap-2 lg:flex">
                {navItems.map((item) => {
                  const isActive = pathname === item.href

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] transition xl:px-5",
                        isActive
                          ? "bg-[#f2e2c7] text-[#8b5a0b]"
                          : "text-[#74685d] hover:bg-[#f4ece3] hover:text-[#3d2a1b]"
                      )}
                    >
                      {item.label}
                    </Link>
                  )
                })}
                <Link
                  href="/cliente/chat"
                  className="rounded-full px-4 py-2 text-xs uppercase tracking-[0.22em] text-[#74685d] transition hover:bg-[#f4ece3] hover:text-[#3d2a1b]"
                >
                  Asistencia
                </Link>
              </nav>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={signOut}
                  className="inline-flex items-center justify-center rounded-full border border-[#eadfce] bg-[#fffaf4] p-2.5 text-[#805410] transition hover:bg-[#f4ebdf] lg:px-4"
                  aria-label="Cerrar sesion"
                  title="Cerrar sesion"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden text-xs font-medium uppercase tracking-[0.18em] lg:ml-2 lg:inline">
                    Salir
                  </span>
                </button>

                <Link href="/cliente/perfil" className="rounded-full">
                  <Avatar className="h-10 w-10 rounded-2xl border-2 border-[#b7882d]/80 shadow-[0_8px_18px_rgba(119,75,15,0.22)]">
                    <AvatarFallback className="rounded-2xl bg-[linear-gradient(180deg,#2d3a43_0%,#10171c_100%)] text-[11px] font-semibold text-[#f8efe1]">
                      {getInitials(resolvedUser.firstName, resolvedUser.lastName)}
                    </AvatarFallback>
                  </Avatar>
                </Link>
              </div>
            </div>
          </header>

          <main className="mx-auto max-w-7xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
            {children}
          </main>
        </div>

        <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#eadfce] bg-[#fcf7f2]/96 px-3 pb-[calc(env(safe-area-inset-bottom)+0.9rem)] pt-3 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-md grid-cols-4 gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 rounded-2xl px-2 py-2.5 text-[11px] uppercase tracking-[0.18em] transition",
                    isActive
                      ? "bg-[#f2e2c7] text-[#8b5a0b]"
                      : "text-[#84796d] hover:bg-[#f4ece3] hover:text-[#3d2a1b]"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </div>
    </ClientSessionContext.Provider>
  )
}

export function useClientSession() {
  return useContext(ClientSessionContext)
}

function ClientDrawer({
  open,
  user,
  onClose,
}: {
  open: boolean
  user: SessionUser
  onClose: () => void
}) {
  return (
    <>
      {open ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#1d130b]/35 backdrop-blur-[2px]"
          onClick={onClose}
          aria-label="Cerrar menu"
        />
      ) : null}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-full w-full transition",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
      >
        <div
          className={cn(
            "h-full w-[82%] max-w-[320px] bg-[#fffaf4] px-5 py-6 shadow-[0_24px_60px_rgba(56,35,17,0.18)] transition-transform",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#b2843f]">KitchAI</p>
              <h2 className="mt-3 font-serif text-2xl text-[#281910]">
                {user.firstName} {user.lastName}
              </h2>
              <p className="mt-2 text-sm text-[#6e5f51]">{user.email}</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-[#eadfce] p-2 text-[#805410]"
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-8 space-y-2">
            {drawerItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-[#4d3b2f] transition hover:bg-[#f5ede3]"
              >
                <item.icon className="h-4 w-4 text-[#9c6f17]" />
                <span>{item.label}</span>
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={signOut}
            className="mt-8 flex w-full items-center gap-3 rounded-2xl border border-[#eadfce] px-4 py-3 text-sm text-[#7a2f22] transition hover:bg-[#f9efea]"
          >
            <LogOut className="h-4 w-4" />
            <span>Cerrar sesion</span>
          </button>
        </div>
      </aside>
    </>
  )
}

function getInitials(firstName: string, lastName: string) {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "KA"
}
