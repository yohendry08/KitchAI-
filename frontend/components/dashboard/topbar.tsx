"use client"

import { type ReactNode } from "react"
import { Bell, History, Menu, Search } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TopbarProps {
  role: "admin" | "employee" | "client"
  title: string
  userName: string
  userRole: string
  onMenuClick?: () => void
  showSearch?: boolean
  searchPlaceholder?: string
  searchValue?: string
  onSearchChange?: (value: string) => void
}

export function Topbar({
  role,
  title,
  userName,
  userRole,
  onMenuClick,
  showSearch = true,
  searchPlaceholder = "Buscar...",
  searchValue,
  onSearchChange,
}: TopbarProps) {
  if (role !== "admin") {
    return (
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-card px-6 py-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-serif font-bold text-foreground md:text-2xl">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {showSearch && (
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-9 w-64 rounded-lg border-border bg-muted/50 pl-9 text-sm"
              />
            </div>
          )}

          <span className="hidden text-sm font-medium text-foreground lg:block">{userName}</span>
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
              {getInitials(userName)}
            </AvatarFallback>
          </Avatar>
          <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-destructive" />
          </Button>
        </div>
      </header>
    )
  }

  return (
    <header className="sticky top-0 z-30 border-b border-[#eadfce] bg-[#fbf7f1]/95 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-4 sm:px-7 lg:px-10">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            className="text-[#7d7064] hover:bg-[#f0e7dc] hover:text-[#2e2018] lg:hidden"
            onClick={onMenuClick}
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {showSearch && (
            <div className="relative w-full max-w-[720px]">
              <Search className="absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#9d9184]" />
              <Input
                type="search"
                placeholder={searchPlaceholder}
                value={searchValue}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="h-11 rounded-2xl border-[#ede1d4] bg-[#efe7de] pl-14 text-lg text-[#2d2118] placeholder:text-[#7d746b] focus-visible:ring-1 focus-visible:ring-[#a8740b]"
              />
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 text-[#8a7d70] sm:gap-5">
          <TopbarIconButton label="Notificaciones">
            <Bell className="h-5 w-5" />
          </TopbarIconButton>
          <TopbarIconButton label="Historial">
            <History className="h-5 w-5" />
          </TopbarIconButton>
          <button className="hidden text-[15px] font-medium transition hover:text-[#2f2119] sm:block">
            Ayuda
          </button>
          <div className="hidden h-10 w-px bg-[#e8dccd] sm:block" />
          <div className="flex items-center gap-3 rounded-2xl border border-transparent px-1.5 py-1">
            <div className="text-right hidden sm:block">
              <p className="text-[15px] font-semibold text-[#241914]">{userName}</p>
              <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f8174]">{userRole}</p>
            </div>
            <Avatar className="h-12 w-12 rounded-2xl border-2 border-[#9b6a0d] shadow-[0_8px_20px_rgba(155,106,13,0.2)]">
              <AvatarFallback className="rounded-2xl bg-[#17222b] text-sm font-semibold text-white">
                {getInitials(userName)}
              </AvatarFallback>
            </Avatar>
          </div>
        </div>
      </div>
    </header>
  )
}

function TopbarIconButton({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={cn(
        "rounded-xl p-2 text-[#a0958a] transition hover:bg-[#f1e8de] hover:text-[#2f2119]"
      )}
    >
      {children}
    </button>
  )
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
}
