"use client"

import Link from "next/link"
import { useState } from "react"
import { Menu, X, User } from "lucide-react"
import { Button } from "@/components/ui/button"

export function NavbarPublic() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-[#1a1a1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1a1a]/85">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
        <Link href="/" className="flex items-center">
          <span className="text-xl font-serif font-bold text-white">
            Kitch<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="hidden items-center gap-10 md:flex">
          <Link
            href="#experiencia"
            className="text-xs font-medium uppercase tracking-[0.15em] text-white/70 transition-colors hover:text-white"
          >
            Experiencia
          </Link>
          <Link
            href="#menu"
            className="border-b border-primary pb-0.5 text-xs font-medium uppercase tracking-[0.15em] text-white transition-colors hover:text-white/70"
          >
            Menú
          </Link>
          <Link
            href="#reservar"
            className="text-xs font-medium uppercase tracking-[0.15em] text-white/70 transition-colors hover:text-white"
          >
            Reservaciones
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
          >
            <User className="h-4 w-4" />
            Acceder
          </Link>
          <Button
            asChild
            className="rounded-none bg-primary px-6 py-2 text-xs font-medium uppercase tracking-[0.1em] text-primary-foreground hover:bg-primary/90"
          >
            <Link href="#reservar">Reservar Ahora</Link>
          </Button>
        </div>

        <button
          type="button"
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      {isOpen && (
        <div className="border-t border-white/10 bg-[#1a1a1a] px-6 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link
              href="#experiencia"
              className="text-sm font-medium uppercase tracking-wider text-white/70"
              onClick={() => setIsOpen(false)}
            >
              Experiencia
            </Link>
            <Link
              href="#menu"
              className="text-sm font-medium uppercase tracking-wider text-white"
              onClick={() => setIsOpen(false)}
            >
              Menú
            </Link>
            <Link
              href="#reservar"
              className="text-sm font-medium uppercase tracking-wider text-white/70"
              onClick={() => setIsOpen(false)}
            >
              Reservaciones
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-sm font-medium text-white/80"
              onClick={() => setIsOpen(false)}
            >
              <User className="h-4 w-4" />
              Acceder
            </Link>
            <Button asChild className="mt-2 w-full rounded-none bg-primary text-primary-foreground">
              <Link href="#reservar">Reservar Ahora</Link>
            </Button>
          </div>
        </div>
      )}
    </header>
  )
}
