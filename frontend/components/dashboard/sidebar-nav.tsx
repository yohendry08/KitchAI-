"use client"

import { type ComponentType, type ReactNode } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  CalendarDays,
  CircleHelp,
  ClipboardList,
  ChefHat,
  Home,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Package,
  Plus,
  Settings,
  Users,
  X,
} from "lucide-react"
import { signOut } from "@/lib/auth"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
}

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Menu", href: "/admin/menu", icon: ChefHat },
  { label: "Inventario", href: "/admin/inventario", icon: Package },
  { label: "Reservaciones", href: "/admin/reservaciones", icon: CalendarDays },
  { label: "Empleados", href: "/admin/empleados", icon: Users },
  { label: "Analítica", href: "/admin/reportes", icon: BarChart3 },
  { label: "Configuración", href: "/admin/configuracion", icon: Settings },
]

const employeeNavItems: NavItem[] = [
  { label: "Dashboard", href: "/empleado", icon: Home },
  { label: "Pedidos", href: "/empleado/pedidos", icon: ClipboardList },
  { label: "Reservaciones", href: "/empleado/reservaciones", icon: CalendarDays },
  { label: "Inventario", href: "/empleado/inventario", icon: Package },
  { label: "Chat de Asistencia", href: "/empleado/chat", icon: MessageSquare },
]

const clientNavItems: NavItem[] = [
  { label: "Dashboard", href: "/cliente", icon: LayoutDashboard },
  { label: "Pedidos", href: "/cliente/pedidos", icon: ClipboardList },
  { label: "Reservaciones", href: "/cliente/reservaciones", icon: CalendarDays },
  { label: "Chat de Asistencia", href: "/cliente/chat", icon: MessageSquare },
]

interface SidebarNavProps {
  role: "admin" | "employee" | "client"
  userName: string
  userRole: string
  userEmail?: string
  isOpen?: boolean
  onClose?: () => void
}

export function SidebarNav({ role, isOpen, onClose }: SidebarNavProps) {
  const pathname = usePathname()
  const isAdmin = role === "admin"
  const navItems = isAdmin ? adminNavItems : role === "employee" ? employeeNavItems : clientNavItems

  const handleSignOut = () => {
    onClose?.()
    signOut()
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#20140d]/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          onKeyDown={(e) => e.key === "Escape" && onClose?.()}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col transition-transform lg:translate-x-0 lg:static lg:z-auto",
          isAdmin
            ? "w-[282px] border-r border-[#ebdfd0] bg-[#f8efe5]"
            : "w-60 border-r border-border bg-card",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div
          className={cn(
            "flex items-start justify-between",
            isAdmin ? "px-8 pb-8 pt-10" : "border-b border-border px-5 py-5"
          )}
        >
          <Link href="/" className="space-y-2">
            <div className={cn(isAdmin ? "font-serif text-[42px] leading-none text-[#8c5a06]" : "flex items-center gap-2")}>
              {isAdmin ? (
                "KitchAI"
              ) : (
                <>
                  <ChefHat className="h-6 w-6 text-primary" />
                  <span className="text-lg font-serif font-bold text-foreground">KitchAI</span>
                </>
              )}
            </div>
            {isAdmin && (
              <p className="text-xs uppercase tracking-[0.34em] text-[#7b7067]">
                The Culinary Curator
              </p>
            )}
          </Link>

          <button
            type="button"
            onClick={onClose}
            className={cn(
              "lg:hidden",
              isAdmin ? "text-[#8b7f72] hover:text-[#2e2017]" : "text-muted-foreground hover:text-foreground"
            )}
            aria-label="Cerrar menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className={cn("flex-1 overflow-y-auto", isAdmin ? "px-4 pb-8" : "px-3 py-4")}>
          <div className="flex flex-col gap-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "group relative flex items-center gap-4 transition-all",
                    isAdmin
                      ? "rounded-l-2xl px-6 py-4 text-[15px] font-medium"
                      : "rounded-lg px-3 py-2.5 text-sm font-medium",
                    isActive
                      ? isAdmin
                        ? "bg-[#f4eadf] text-[#8a5d10]"
                        : "bg-primary/10 text-primary"
                      : isAdmin
                        ? "text-[#6f655d] hover:bg-[#f3e8dc] hover:text-[#2d2118]"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5 shrink-0", isActive && isAdmin && "text-[#8a5d10]")} />
                  <span>{item.label}</span>
                  {isActive && isAdmin && (
                    <span className="absolute right-0 top-3 h-[calc(100%-24px)] w-1 rounded-l-full bg-[#946102]" />
                  )}
                </Link>
              )
            })}
          </div>
        </nav>

        {isAdmin ? (
          <div className="border-t border-[#ebdfd0] px-6 pb-8 pt-6">
            <ButtonLink href="/orders/new" className="mb-8">
              <Plus className="h-5 w-5" />
              Nueva Orden
            </ButtonLink>

            <div className="space-y-2">
              <SidebarFooterLink href="/admin/configuracion">
                <CircleHelp className="h-4 w-4" />
                Soporte
              </SidebarFooterLink>
              <SidebarFooterButton onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
                Cerrar Sesión
              </SidebarFooterButton>
            </div>
          </div>
        ) : (
          <div className="border-t border-border p-3">
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </div>
        )}
      </aside>
    </>
  )
}

function ButtonLink({
  href,
  className,
  children,
}: {
  href: string
  className?: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className={cn(
        "flex h-16 items-center justify-center gap-3 rounded-2xl bg-[#a8740b] px-5 py-4 text-lg font-semibold text-white shadow-[0_18px_36px_rgba(168,116,11,0.22)] transition hover:bg-[#926406]",
        className
      )}
    >
      {children}
    </Link>
  )
}

function SidebarFooterLink({
  href,
  children,
}: {
  href: string
  children: ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2 text-[15px] text-[#756b61] transition hover:bg-[#f3e8dc] hover:text-[#2f2119]"
    >
      {children}
    </Link>
  )
}

function SidebarFooterButton({
  onClick,
  children,
}: {
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[15px] text-[#756b61] transition hover:bg-[#f3e8dc] hover:text-[#2f2119]"
    >
      {children}
    </button>
  )
}
