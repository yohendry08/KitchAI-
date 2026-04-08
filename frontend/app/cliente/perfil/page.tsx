"use client"

import { type ReactNode, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ChevronRight, LifeBuoy, Mail, MapPin, Settings, Sparkles, Star } from "lucide-react"
import { ClientShell, useClientSession } from "@/components/client/client-shell"
import { Button } from "@/components/ui/button"
import { ApiError, api, type MenuItemRecord, type OrderRecord, type ReservationRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

const preferenceTags = ["Mesa tranquila", "Cena degustacion", "Servicio fluido"]
const celebrationTags = ["Aniversarios", "Cena privada"]

export default function ClientePerfilPage() {
  return (
    <ClientShell>
      <ClientePerfilContent />
    </ClientShell>
  )
}

function ClientePerfilContent() {
  const user = useClientSession()
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [reservations, setReservations] = useState<ReservationRecord[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      setError(null)

      try {
        const [ordersResponse, reservationsResponse, menuResponse] = await Promise.all([
          api.getOrders(),
          api.getReservations(),
          api.getMenuItems(),
        ])

        setOrders(ordersResponse)
        setReservations(reservationsResponse)
        setMenuItems(menuResponse)
      } catch (err) {
        const message = err instanceof ApiError ? err.message : "No se pudo cargar tu perfil."
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [])

  const favoriteDish = useMemo(() => {
    const counts = new Map<string, number>()

    for (const order of orders) {
      for (const item of order.items) {
        counts.set(item.name, (counts.get(item.name) || 0) + item.quantity)
      }
    }

    const [name = "Risotto del Chef", count = 0] =
      [...counts.entries()].sort((a, b) => b[1] - a[1])[0] || []

    const matchingMenuItem = menuItems.find((item) => item.name === name)

    return {
      name,
      count,
      image: resolveImage(matchingMenuItem?.image, "/images/hero-dish.jpg"),
      description: matchingMenuItem?.description || "Seleccion favorita segun tu historial reciente.",
    }
  }, [menuItems, orders])

  const totalSpent = orders.reduce((sum, order) => sum + order.total, 0)
  const points = Math.max(8250, Math.round(totalSpent * 7 + reservations.length * 220))
  const target = 15000
  const progress = Math.min((points / target) * 100, 100)
  const memberSince = [...orders.map((order) => order.createdAt), ...reservations.map((reservation) => reservation.createdAt)]
    .map((createdAt) => new Date(createdAt).getFullYear())
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b)[0] || new Date().getFullYear()

  if (!user) {
    return null
  }

  return (
    <section className="space-y-6 lg:space-y-8">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.75fr)]">
        <div className="rounded-[30px] bg-white px-5 py-7 shadow-[0_22px_50px_rgba(80,53,24,0.08)] lg:px-7">
          <div className="flex items-start justify-between">
            <div className="rounded-full bg-[#f1eadf] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#97712c]">
              Socio Gold
            </div>
            <div className="rounded-full border border-[#eadfce] bg-[#fffaf5] p-1.5">
              <Image
                src="/images/restaurant-ambience.jpg"
                alt="Avatar decorativo"
                width={44}
                height={44}
                className="h-11 w-11 rounded-full object-cover"
              />
            </div>
          </div>

          <div className="mt-6 text-center">
            <h1 className="font-serif text-5xl leading-[0.95] tracking-tight text-[#23160d] sm:text-6xl">
              {user.firstName}
              <br />
              {user.lastName}
            </h1>
            <p className="mt-3 text-lg italic text-[#6a5a49]">Gourmet Explorer desde {memberSince}</p>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 rounded-2xl bg-[#f6efe7] px-4 py-3 text-sm text-[#322117]">
              <MapPin className="h-4 w-4 text-[#9a6f17]" />
              <span>Santo Domingo, DO</span>
            </div>
            <div className="flex items-center gap-3 rounded-2xl bg-[#f6efe7] px-4 py-3 text-sm text-[#322117]">
              <Mail className="h-4 w-4 text-[#9a6f17]" />
              <span>{user.email}</span>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-[linear-gradient(180deg,#ad7a12_0%,#926307_100%)] px-5 py-6 text-white shadow-[0_26px_60px_rgba(145,97,7,0.28)] lg:px-7">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-[#f5e4ba]">Loyalty Balance</p>
          <div className="mt-5 flex items-end gap-2">
            <span className="font-serif text-6xl leading-none">{points.toLocaleString("es-DO")}</span>
            <span className="mb-2 text-2xl text-[#f5e4ba]">PTS</span>
          </div>
          <div className="mt-6 h-1.5 rounded-full bg-white/25">
            <div className="h-full rounded-full bg-white" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#f5e4ba]">
            Faltan {(target - Math.min(points, target)).toLocaleString("es-DO")} pts para Platinum
          </p>
          <Button className="mt-6 h-12 w-full rounded-2xl bg-white text-sm uppercase tracking-[0.22em] text-[#8d5f09] hover:bg-[#fbf3e5]">
            Canjear recompensas
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-[28px] bg-[#f6efe8] p-5 shadow-[0_20px_50px_rgba(80,53,24,0.05)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-serif text-3xl leading-tight text-[#24170f]">Platos Favoritos</h2>
              <p className="mt-2 text-sm text-[#6a5a49]">Tus elecciones mas repetidas en KitchAI.</p>
            </div>
            <Link href="/cliente/pedidos" className="pt-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8d5f09]">
              Ver historial
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-[24px] bg-white">
            <div className="relative h-48 w-full">
              <Image src={favoriteDish.image} alt={favoriteDish.name} fill className="object-cover" />
            </div>
            <div className="p-5">
              <h3 className="text-3xl font-semibold tracking-tight text-[#1d140e]">{favoriteDish.name}</h3>
              <p className="mt-2 text-sm text-[#6c5d4e]">{favoriteDish.description}</p>
              <p className="mt-4 flex items-center gap-2 text-sm font-medium text-[#8b5a0b]">
                <Star className="h-4 w-4 fill-current" />
                Pedido {favoriteDish.count || 1} veces
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_50px_rgba(80,53,24,0.05)]">
          <div className="border-l-4 border-[#2b6d68] pl-4">
            <h2 className="font-serif text-3xl text-[#21150d]">Preferencias</h2>
            <p className="mt-2 text-sm text-[#6f6052]">Personaliza tu servicio y acelera futuras reservas.</p>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            {preferenceTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#d7eeec] px-3 py-1.5 text-sm font-medium text-[#194e49]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.24em] text-[#867564]">Experiencias guardadas</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {celebrationTags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-[#f9e1dc] px-3 py-1.5 text-sm font-medium text-[#9b3e2d]"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <ActionCard
          href="/cliente/pedidos"
          icon={<Sparkles className="h-5 w-5 text-[#9a6f17]" />}
          title="Actividad de cuenta"
          description={`${orders.length} pedidos y ${reservations.length} reservas registradas`}
          highlight={formatDopCurrency(totalSpent)}
        />

        <ActionCard
          href="/cliente/chat"
          icon={<LifeBuoy className="h-5 w-5 text-[#5d7f82]" />}
          title="Centro de soporte"
          description="Chat 24/7 para reservas, cambios y recomendaciones."
        />

        <ActionCard
          href="/cliente"
          icon={<Settings className="h-5 w-5 text-[#9a6f17]" />}
          title="Explorar menu"
          description="Vuelve a la carta y descubre nuevas recomendaciones."
        />
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#eecdc5] bg-[#fff3ef] px-4 py-4 text-sm text-[#a13c2a]">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[24px] border border-[#eadfce] bg-white px-4 py-4 text-sm text-[#786b5d]">
          Cargando historial personalizado...
        </div>
      ) : null}
    </section>
  )
}

function ActionCard({
  href,
  icon,
  title,
  description,
  highlight,
}: {
  href: string
  icon: ReactNode
  title: string
  description: string
  highlight?: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-[22px] bg-white px-5 py-5 shadow-[0_20px_45px_rgba(80,53,24,0.05)] transition hover:-translate-y-0.5 xl:min-h-[132px]"
    >
      <div className="flex items-center gap-4">
        <div className="rounded-2xl bg-[#f6e1b8] p-3">{icon}</div>
        <div>
          <h3 className="text-lg font-semibold text-[#20150f]">{title}</h3>
          <p className="text-sm text-[#6f6052]">{description}</p>
          {highlight ? <p className="mt-1 text-sm font-semibold text-[#8d5f09]">{highlight}</p> : null}
        </div>
      </div>
      <ChevronRight className="h-5 w-5 text-[#7f705f]" />
    </Link>
  )
}

function resolveImage(src: string | undefined, fallback: string) {
  if (!src) return fallback
  if (src.startsWith("http://") || src.startsWith("https://") || src.startsWith("/")) return src
  return fallback
}
