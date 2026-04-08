"use client"

import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { type FormEvent, useEffect, useState } from "react"
import {
  ArrowRight,
  Boxes,
  CalendarDays,
  ChefHat,
  ClipboardList,
  Eye,
  EyeOff,
  ShieldCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getRoleLandingPath, hydrateSession, loginWithBackend } from "@/lib/auth"

const featureCards = [
  {
    icon: ClipboardList,
    title: "Pedidos",
    description: "Atiende ordenes activas y estados de cocina en tiempo real.",
  },
  {
    icon: CalendarDays,
    title: "Reservas",
    description: "Gestiona mesas y solicitudes de clientes desde un solo panel.",
  },
  {
    icon: Boxes,
    title: "Inventario",
    description: "Supervisa insumos, movimientos y alertas de stock.",
  },
]

export default function LoginPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [rememberMe, setRememberMe] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [authError, setAuthError] = useState("")

  useEffect(() => {
    const checkSession = async () => {
      const user = await hydrateSession()
      if (user) {
        router.replace(getRoleLandingPath(user.role))
      }
    }

    void checkSession()
  }, [router])

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setAuthError("")
    setIsLoading(true)

    try {
      const user = await loginWithBackend(email, password, rememberMe)
      router.push(getRoleLandingPath(user.role))
    } catch (error) {
      if (error instanceof Error) {
        setAuthError(error.message)
      } else {
        setAuthError("No se pudo iniciar sesion")
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,_#171210_0%,_#171210_42%,_#f5efe7_42%,_#f7f2ec_100%)]">
      <div className="mx-auto flex min-h-screen max-w-7xl items-center px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="grid w-full gap-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(420px,0.9fr)] lg:items-center">
          <section className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#140f0d] shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
            <div className="absolute inset-0">
              <Image
                src="/images/hero-dish.jpg"
                alt="Acceso interno de KitchAI"
                fill
                priority
                className="object-cover"
              />
            </div>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(32,18,10,0.38)_0%,rgba(28,16,10,0.48)_34%,rgba(12,8,6,0.86)_100%)]" />
            <div className="relative flex min-h-[520px] flex-col p-8 text-white sm:min-h-[620px] sm:p-10 lg:min-h-[760px] lg:p-12">
              <Link href="/" className="flex w-fit items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#d89d3e]/45 bg-black/20 text-[#d89d3e] backdrop-blur">
                  <ChefHat className="h-6 w-6" />
                </div>
                <span className="font-serif text-3xl font-semibold text-white">KitchAI</span>
              </Link>

              <div className="mt-auto max-w-xl">
                <span className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.35em] text-white/90 backdrop-blur">
                  Acceso Interno Del Equipo
                </span>
                <h1 className="mt-7 font-serif text-5xl leading-[0.92] text-white sm:text-6xl">
                  Una puerta de entrada mas clara para el personal.
                </h1>
                <p className="mt-6 max-w-lg text-lg leading-8 text-white/82">
                  Este acceso esta pensado para empleados y administracion. Los clientes reservan desde la landing, mientras el equipo entra aqui para operar pedidos, mesas y disponibilidad.
                </p>
              </div>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                {featureCards.map(({ icon: Icon, title, description }) => (
                  <article
                    key={title}
                    className="rounded-[22px] border border-white/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),rgba(255,255,255,0.05))] p-5 backdrop-blur-sm"
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d89d3e]/18 text-[#d89d3e]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h2 className="mt-5 font-serif text-3xl leading-none text-white">{title}</h2>
                    <p className="mt-4 text-sm leading-7 text-white/72">{description}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section className="rounded-[30px] border border-white/70 bg-[#f4f0eb] p-6 shadow-[0_26px_80px_rgba(64,40,18,0.15)] sm:p-8 lg:p-9">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.38em] text-[#9f9488]">
                Iniciar Sesion
              </p>
              <h2 className="mt-4 max-w-md font-serif text-4xl leading-[0.95] text-[#241914] sm:text-5xl">
                Accede al panel de empleados
              </h2>
              <p className="mt-5 max-w-md text-lg leading-8 text-[#8a7d70]">
                Usa tu correo corporativo para entrar al sistema. Si solo quieres reservar una mesa como cliente, vuelve al sitio principal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="mt-10 space-y-6">
              {authError ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {authError}
                </div>
              ) : null}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8e8174]">
                  Correo
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  autoComplete="email"
                  className="h-14 rounded-2xl border-[#ece1d6] bg-white px-4 text-sm text-[#281c16] placeholder:text-[#b0a496] shadow-none focus-visible:ring-1 focus-visible:ring-[#d89d3e]"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#8e8174]">
                  Contrasena
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="********"
                    autoComplete="current-password"
                    className="h-14 rounded-2xl border-[#ece1d6] bg-white px-4 pr-12 text-sm text-[#281c16] placeholder:text-[#b0a496] shadow-none focus-visible:ring-1 focus-visible:ring-[#d89d3e]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#9e907f] transition hover:text-[#3a2a21]"
                    aria-label={showPassword ? "Ocultar contrasena" : "Mostrar contrasena"}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-2 text-[#7c6d5e]">
                  <Checkbox
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    className="border-[#d8c8b5] data-[state=checked]:bg-[#d89d3e] data-[state=checked]:text-white"
                  />
                  <span>Recordarme</span>
                </label>

                <Link href="/" className="inline-flex items-center gap-1 font-medium text-[#d08b22] transition hover:text-[#ab6f16]">
                  Volver al sitio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="h-14 w-full rounded-full bg-[#d49534] text-base font-semibold text-white shadow-[0_14px_30px_rgba(212,149,52,0.28)] hover:bg-[#be8228]"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Entrando...
                  </span>
                ) : (
                  "Entrar al panel"
                )}
              </Button>
            </form>

            <div className="mt-7 rounded-[22px] border border-[#e8ddd2] bg-white/55 p-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-full bg-[#f7ecd9] text-[#d49534]">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-medium text-[#2d211b]">Acceso seguro para el equipo</h3>
                  <p className="mt-2 text-sm leading-7 text-[#8a7d70]">
                    Esta interfaz esta pensada para administracion y empleados. El acceso de clientes se mantiene separado para reservar y revisar el menu.
                  </p>
                </div>
              </div>
            </div>

            <p className="mt-7 text-sm text-[#8f8174]">
              No tienes cuenta?{" "}
              <Link href="/register" className="font-medium text-[#d08b22] transition hover:text-[#ab6f16]">
                Registrate
              </Link>
            </p>
          </section>
        </div>
      </div>
    </main>
  )
}
