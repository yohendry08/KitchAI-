import Link from "next/link"
import { Facebook, Instagram, Youtube, Twitter } from "lucide-react"

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Menú", href: "#menu" },
  { label: "Reservar", href: "#reservar" },
  { label: "Contacto", href: "#contacto" },
]

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Youtube, href: "#", label: "YouTube" },
]

export function Footer() {
  return (
    <footer className="bg-foreground py-10">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          {/* Logo */}
          <Link href="/" className="font-serif text-xl font-bold text-card">
            Kitch<span className="text-primary">AI</span>
          </Link>

          {/* Nav Links */}
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-sm text-card/70 transition-colors hover:text-card"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Social Icons */}
          <div className="flex items-center gap-4">
            {socialLinks.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-card/10 text-card/80 transition-colors hover:bg-card/20 hover:text-card"
                aria-label={social.label}
              >
                <social.icon className="h-4 w-4" />
              </Link>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 h-px bg-card/10" />

        {/* Copyright */}
        <p className="mt-6 text-center text-sm text-card/60">
          &copy; 2026 KitchAI. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  )
}
