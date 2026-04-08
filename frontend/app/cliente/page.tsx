"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { CalendarDays, ChevronRight, MessageSquareText, Sparkles } from "lucide-react"
import { ClientShell, useClientSession } from "@/components/client/client-shell"
import { Button } from "@/components/ui/button"
import { ApiError, api, type ClientDashboardResponse, type MenuItemRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

export default function ClienteMenuPage() {
  return (
    <ClientShell>
      <ClienteMenuContent />
    </ClientShell>
  )
}

function ClienteMenuContent() {
  const user = useClientSession()
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([])
  const [dashboard, setDashboard] = useState<ClientDashboardResponse | null>(null)
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadExperience = async () => {
    setLoading(true)
    setError(null)

    try {
      const [menuResponse, dashboardResponse] = await Promise.all([
        api.getMenuItems(),
        api.getClientDashboard(),
      ])

      setMenuItems(menuResponse.filter((item) => item.available))
      setDashboard(dashboardResponse)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cargar la experiencia del menu."
      setError(message)
      setMenuItems([])
      setDashboard(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadExperience()
  }, [])

  const categories = useMemo(() => {
    const uniqueCategories = [...new Set(menuItems.map((item) => item.category).filter(Boolean))]
    return ["Todos", ...uniqueCategories]
  }, [menuItems])

  useEffect(() => {
    if (!categories.includes(activeCategory)) {
      setActiveCategory("Todos")
    }
  }, [activeCategory, categories])

  const visibleItems = useMemo(() => {
    if (activeCategory === "Todos") return menuItems
    return menuItems.filter((item) => item.category === activeCategory)
  }, [activeCategory, menuItems])

  const featuredItem = visibleItems[0] || menuItems[0]
  const spotlightItems = visibleItems.slice(1, 4)
  const categoryTitle = activeCategory === "Todos" ? "Seleccion del chef" : activeCategory

  if (!user) {
    return null
  }

  return (
    <section className="space-y-8 lg:space-y-10">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:items-end">
        <div>
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d7740]">Experiencia culinaria</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight text-[#20140d] sm:text-6xl xl:text-7xl">
          El Arte de la
          <br />
          Mesa Moderna
        </h1>
        <p className="mt-4 max-w-[28rem] text-sm leading-6 text-[#6b5d4f]">
          Bienvenido, {user.firstName}. Tu cuenta ya vive dentro de una experiencia pensada para explorar platos,
          reservar mesa y seguir cada pedido sin friccion.
        </p>
          <div className="mt-6 grid grid-cols-2 gap-3 lg:max-w-md">
            <Button className="h-12 rounded-2xl bg-[#8f630e] text-xs uppercase tracking-[0.22em] text-white hover:bg-[#7d560d]" asChild>
              <Link href="#seleccion">Ver recomendados</Link>
            </Button>
            <Button
              variant="outline"
              className="h-12 rounded-2xl border-[#e6d7c5] bg-transparent text-xs uppercase tracking-[0.18em] text-[#7b5a2d]"
              asChild
            >
              <Link href="/cliente/reservaciones">Nuestra cava</Link>
            </Button>
          </div>
        </div>

        {featuredItem ? (
          <div className="relative overflow-hidden rounded-[30px] bg-[#22160e] shadow-[0_30px_70px_rgba(50,32,16,0.22)]">
          <div className="relative h-[320px] w-full">
            <Image
              src={resolveImage(featuredItem.image, "/images/hero-dish.jpg")}
              alt={featuredItem.name}
              fill
              className="object-cover opacity-90"
              priority
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,13,9,0.05)_0%,rgba(21,13,9,0.62)_100%)]" />
          </div>
          <div className="absolute bottom-6 left-4 max-w-[210px] rounded-[22px] bg-[#f3e9dd]/95 px-4 py-3 shadow-[0_12px_24px_rgba(34,22,14,0.16)]">
            <p className="font-serif text-lg italic leading-6 text-[#6c4821]">
              "La cocina es lenguaje y cada visita se puede expresar a tu manera."
            </p>
          </div>
          </div>
        ) : null}
      </div>

      <div className="grid grid-cols-3 gap-3 lg:grid-cols-3 xl:max-w-3xl">
        <StatChip label="Reservas" value={String(dashboard?.reservations.length ?? 0)} icon={<CalendarDays className="h-4 w-4" />} />
        <StatChip label="Pedidos" value={String(dashboard?.recentOrders.length ?? 0)} icon={<Sparkles className="h-4 w-4" />} />
        <StatChip label="Chat" value={String(dashboard?.messageCount ?? 0)} icon={<MessageSquareText className="h-4 w-4" />} />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((category) => {
          const isActive = category === activeCategory

          return (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
                isActive
                  ? "border-[#93650e] bg-[#f2e1c3] text-[#84570b]"
                  : "border-[#e8dccd] bg-white text-[#7a6c5f]"
              }`}
            >
              {category}
            </button>
          )
        })}
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#f0d0c6] bg-[#fff3ef] px-4 py-4 text-sm text-[#a13c2a]">
          <p>{error}</p>
          <button type="button" onClick={() => void loadExperience()} className="mt-3 font-semibold text-[#8b5a0b]">
            Reintentar
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[24px] border border-[#eadfce] bg-white px-4 py-4 text-sm text-[#786b5d]">
          Cargando carta curada...
        </div>
      ) : null}

      {!loading && !error && featuredItem ? (
        <div id="seleccion" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-serif text-[2.15rem] leading-none text-[#20140d]">{categoryTitle}</h2>
            <span className="h-[2px] w-14 rounded-full bg-[#c9aa72]" />
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]">
            <article className="overflow-hidden rounded-[28px] bg-white shadow-[0_24px_60px_rgba(80,53,24,0.08)]">
              <div className="relative h-60 w-full lg:h-72 xl:h-[460px]">
                <Image
                  src={resolveImage(featuredItem.image, "/images/grilled-salmon.jpg")}
                  alt={featuredItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="space-y-4 p-5 lg:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#af8b57]">{featuredItem.category}</p>
                    <h3 className="mt-2 font-serif text-3xl leading-tight text-[#20140d] lg:text-4xl">{featuredItem.name}</h3>
                  </div>
                  <span className="text-xl font-medium text-[#8e5f0c]">{formatDopCurrency(featuredItem.price)}</span>
                </div>
                <p className="text-sm leading-6 text-[#6e5f51]">{featuredItem.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] uppercase tracking-[0.22em] text-[#8e5f0c]">Recomendado</span>
                  <Button
                    variant="ghost"
                    className="h-auto p-0 text-xs uppercase tracking-[0.22em] text-[#8e5f0c] hover:bg-transparent hover:text-[#6d4706]"
                    asChild
                  >
                    <Link href="/cliente/reservaciones">
                      Anadir a la experiencia <ChevronRight className="ml-1 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </article>

            <div className="space-y-4">
              {spotlightItems.map((item) => (
                <article
                  key={item.id}
                  className="grid grid-cols-[92px_1fr] gap-4 rounded-[24px] bg-[#fffaf5] p-4 shadow-[0_16px_40px_rgba(80,53,24,0.05)]"
                >
                  <div className="relative h-24 overflow-hidden rounded-[18px]">
                    <Image
                      src={resolveImage(item.image, "/images/caprese-salad.jpg")}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="font-serif text-2xl leading-tight text-[#1f150d]">{item.name}</h3>
                      <span className="shrink-0 text-sm font-medium text-[#8e5f0c]">{formatDopCurrency(item.price)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-5 text-[#6b5d4f]">{item.description}</p>
                    <p className="mt-3 text-[11px] uppercase tracking-[0.22em] text-[#af8b57]">{item.category}</p>
                  </div>
                </article>
              ))}

              <div className="relative overflow-hidden rounded-[26px] bg-[#382315] px-5 py-6 text-white shadow-[0_24px_60px_rgba(56,35,21,0.18)]">
                <Image
                  src="/images/restaurant-ambience.jpg"
                  alt="Maridaje sugerido"
                  fill
                  className="object-cover opacity-28"
                />
                <div className="relative">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-[#f2ce8a]">Maridaje sugerido</p>
                  <h3 className="mt-3 font-serif text-4xl leading-none">Reserva de la Familia</h3>
                  <p className="mt-3 max-w-[16rem] text-sm leading-6 text-[#f5e5cf]">
                    Un Cabernet elegante pensado para cenas largas y una mesa que merece ceremonia.
                  </p>
                  <Button
                    variant="outline"
                    className="mt-5 h-11 rounded-2xl border-[#d5b77c] bg-transparent text-xs uppercase tracking-[0.22em] text-[#f6dab1] hover:bg-white/10 hover:text-white"
                    asChild
                  >
                    <Link href="/cliente/reservaciones">Explorar cava</Link>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}

function StatChip({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-[22px] bg-white px-3 py-3 text-[#332317] shadow-[0_16px_36px_rgba(80,53,24,0.05)]">
      <div className="flex items-center gap-2 text-[#a97c29]">{icon}</div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#7d7064]">{label}</p>
    </div>
  )
}

function resolveImage(src: string | undefined, fallback: string) {
  if (!src) return fallback
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src
  return fallback
}
