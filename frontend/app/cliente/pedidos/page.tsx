"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Check, ChevronRight, Clock3, ConciergeBell, MapPin, MessageSquareText, Truck, UtensilsCrossed } from "lucide-react"
import { ClientShell } from "@/components/client/client-shell"
import { Button } from "@/components/ui/button"
import { ApiError, api, type OrderRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

const progressSteps = [
  { key: "Pendiente", label: "Recibido", icon: Check },
  { key: "En Proceso", label: "Preparacion", icon: UtensilsCrossed },
  { key: "Entregado", label: "Entrega", icon: Truck },
]

export default function ClientePedidosPage() {
  return (
    <ClientShell backHref="/cliente">
      <ClientePedidosContent />
    </ClientShell>
  )
}

function ClientePedidosContent() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [selectedOrderId, setSelectedOrderId] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadOrders = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await api.getOrders("", "Todos")
      const sorted = [...response].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
      setOrders(sorted)
      setSelectedOrderId((current) => current || sorted[0]?.id || "")
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudieron cargar tus pedidos."
      setError(message)
      setOrders([])
      setSelectedOrderId("")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadOrders()
  }, [])

  const selectedOrder = useMemo(
    () => orders.find((order) => order.id === selectedOrderId) || orders[0] || null,
    [orders, selectedOrderId]
  )

  const statusIndex = selectedOrder ? getStatusIndex(selectedOrder.status) : 0
  const estimatedRange = selectedOrder ? getEstimatedWindow(selectedOrder.createdAt) : ""
  const statusCopy = selectedOrder ? getStatusCopy(selectedOrder.status) : getStatusCopy("Pendiente")

  return (
    <section className="space-y-8 lg:space-y-10">
      <div className="max-w-3xl">
        <p className="text-xs uppercase tracking-[0.28em] text-[#9d7740]">Estado actual</p>
        <h1 className="mt-3 font-serif text-5xl leading-[0.95] tracking-tight text-[#23160d] sm:text-6xl xl:text-7xl">
          {statusCopy?.headline || "Tus pedidos"}
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#6a5a49]">
          Sigue el progreso de cocina y revisa el resumen de cada orden desde una sola vista.
        </p>
      </div>

      {error ? (
        <div className="rounded-[24px] border border-[#f0d0c6] bg-[#fff3ef] px-4 py-4 text-sm text-[#a13c2a]">
          <p>{error}</p>
          <button type="button" onClick={() => void loadOrders()} className="mt-3 font-semibold text-[#8b5a0b]">
            Reintentar
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="rounded-[24px] border border-[#eadfce] bg-white px-4 py-4 text-sm text-[#786b5d]">
          Cargando pedidos...
        </div>
      ) : null}

      {!loading && orders.length === 0 ? (
        <div className="rounded-[28px] bg-white px-5 py-6 shadow-[0_20px_50px_rgba(80,53,24,0.05)]">
          <h2 className="font-serif text-3xl text-[#20140d]">Aun no hay pedidos activos</h2>
          <p className="mt-3 text-sm leading-6 text-[#6c5d4e]">
            Cuando realices una orden desde tu mesa o una experiencia delivery, la veras aqui en tiempo real.
          </p>
          <Button className="mt-5 h-11 rounded-2xl bg-[#8f630e] text-xs uppercase tracking-[0.22em] text-white hover:bg-[#7d560d]" asChild>
            <Link href="/cliente">Explorar menu</Link>
          </Button>
        </div>
      ) : null}

      {!loading && selectedOrder ? (
        <>
          <div className="flex flex-wrap gap-2">
            {orders.map((order) => {
              const isActive = order.id === selectedOrder.id

              return (
                <button
                  key={order.id + order.createdAt}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className={`shrink-0 rounded-full border px-4 py-2 text-xs uppercase tracking-[0.22em] transition ${
                    isActive
                      ? "border-[#8f630e] bg-[#f2e1c3] text-[#82570c]"
                      : "border-[#eadfce] bg-white text-[#7c705f]"
                  }`}
                >
                  {order.id}
                </button>
              )
            })}
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_360px]">
            <div className="space-y-6">
              <div className="rounded-[30px] bg-white px-5 py-6 shadow-[0_22px_50px_rgba(80,53,24,0.08)]">
                <div className="rounded-full bg-[#eef3f5] px-4 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-[#71828a]">
                  {statusCopy.headline}
                </div>
                <div className="mt-5 flex items-end justify-between gap-4">
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.24em] text-[#8b7a68]">Entrega estimada</p>
                    <h2 className="mt-2 font-serif text-5xl leading-none text-[#23160d] xl:text-6xl">{estimatedRange}</h2>
                  </div>
                  <span className="rounded-full bg-[#f6efe5] px-3 py-1 text-xs uppercase tracking-[0.18em] text-[#8d5f09]">
                    {selectedOrder.id}
                  </span>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-3">
                  {progressSteps.map((step, index) => {
                    const isReached = index <= statusIndex
                    const isCurrent = index === statusIndex

                    return (
                      <div key={step.label} className="text-center">
                        <div className="relative mx-auto flex h-14 w-14 items-center justify-center rounded-2xl">
                          <div
                            className={`absolute inset-x-0 top-1/2 hidden h-[2px] -translate-y-1/2 bg-[#b08a52] first:hidden md:block ${
                              index === progressSteps.length - 1 ? "hidden" : ""
                            }`}
                          />
                          <div
                            className={`relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl border ${
                              isReached
                                ? "border-[#8e630d] bg-[#9b6c0f] text-white"
                                : "border-[#e5d8c6] bg-[#f2ece6] text-[#a59a90]"
                            } ${isCurrent ? "shadow-[0_10px_24px_rgba(155,108,15,0.24)]" : ""}`}
                          >
                            <step.icon className="h-5 w-5" />
                          </div>
                        </div>
                        <p className="mt-3 text-[11px] uppercase tracking-[0.2em] text-[#7b6e60]">{step.label}</p>
                      </div>
                    )
                  })}
                </div>

                <p className="mt-8 text-base leading-8 text-[#3a2a20]">{statusCopy.detail}</p>
              </div>

              <div className="overflow-hidden rounded-[30px] bg-white shadow-[0_24px_60px_rgba(80,53,24,0.08)]">
            <div className="bg-[linear-gradient(180deg,#9e6f11_0%,#845908_100%)] px-5 py-5 text-white">
              <p className="text-[11px] uppercase tracking-[0.24em] text-[#f4dfb0]">Resumen del pedido</p>
              <h2 className="mt-2 font-serif text-4xl">{selectedOrder.id}</h2>
            </div>
            <div className="space-y-4 px-5 py-5">
              {selectedOrder.items.map((item) => (
                <div key={item.menuItemId + item.name} className="flex items-start justify-between gap-3 border-b border-[#efe5d9] pb-4">
                  <div className="flex gap-3">
                    <div className="relative h-14 w-14 overflow-hidden rounded-[16px]">
                      <Image src="/images/hero-dish.jpg" alt={item.name} fill className="object-cover" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-[#1f150d]">{item.name}</h3>
                      <p className="mt-1 text-sm text-[#6d5d4f]">x{item.quantity}</p>
                    </div>
                  </div>
                  <span className="text-lg font-medium text-[#8d5f09]">
                    {formatDopCurrency(item.unitPrice * item.quantity)}
                  </span>
                </div>
              ))}

              <div className="space-y-2 text-sm text-[#5f5144]">
                <div className="flex items-center justify-between">
                  <span>Subtotal</span>
                  <span>{formatDopCurrency(selectedOrder.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Modalidad</span>
                  <span className="capitalize">{selectedOrder.type || "salon"}</span>
                </div>
                <div className="flex items-center justify-between border-t border-[#efe5d9] pt-3 text-xl font-semibold text-[#21150d]">
                  <span>Total</span>
                  <span className="text-[#8d5f09]">{formatDopCurrency(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
              </div>
            </div>

            <div className="space-y-6 xl:sticky xl:top-28 xl:self-start">
              <div className="rounded-[28px] bg-[#f6efe8] px-5 py-5 shadow-[0_20px_50px_rgba(80,53,24,0.05)]">
                <div className="flex items-start gap-3">
                  <MapPin className="mt-1 h-5 w-5 text-[#8d5f09]" />
                  <div>
                    <h2 className="font-serif text-3xl text-[#21150d]">Lugar de entrega</h2>
                    <p className="mt-3 text-sm leading-6 text-[#5f5144]">
                      {selectedOrder.customerAddress || `Mesa ${selectedOrder.table} · Servicio en sala`}
                    </p>
                  </div>
                </div>
                <div className="relative mt-5 h-36 overflow-hidden rounded-[20px]">
                  <Image src="/images/restaurant-ambience.jpg" alt="Mapa decorativo" fill className="object-cover opacity-40" />
                </div>
              </div>

              <div className="rounded-[28px] bg-[#f8f0e7] px-5 py-5 shadow-[0_20px_50px_rgba(80,53,24,0.05)]">
                <div className="flex items-start gap-3">
                  <ConciergeBell className="mt-1 h-5 w-5 text-[#8d5f09]" />
                  <div>
                    <h2 className="font-serif text-3xl text-[#21150d]">¿Necesitas ayuda?</h2>
                    <p className="mt-3 text-sm leading-6 text-[#5f5144]">
                      Nuestro concierge puede apoyarte con cambios, observaciones o seguimiento adicional del servicio.
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="mt-5 h-12 w-full rounded-2xl border-[#eadfce] bg-white text-sm text-[#8d5f09] hover:bg-[#fffaf5]"
                  asChild
                >
                  <Link href="/cliente/chat">
                    <MessageSquareText className="mr-2 h-4 w-4" />
                    Contactar con KitchAI
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {orders.length > 1 ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-3xl text-[#23160d]">Historial reciente</h2>
                <button type="button" onClick={() => void loadOrders()} className="text-xs uppercase tracking-[0.22em] text-[#8e630d]">
                  Actualizar
                </button>
              </div>
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
              {orders.slice(0, 3).map((order) => (
                <button
                  key={order.id + order.createdAt}
                  type="button"
                  onClick={() => setSelectedOrderId(order.id)}
                  className="flex w-full items-center justify-between rounded-[22px] bg-white px-4 py-4 text-left shadow-[0_18px_40px_rgba(80,53,24,0.05)]"
                >
                  <div>
                    <p className="text-[11px] uppercase tracking-[0.22em] text-[#aa8859]">{order.status}</p>
                    <p className="mt-2 text-lg font-medium text-[#20140d]">{order.id}</p>
                    <p className="mt-1 text-sm text-[#6c5d4e]">{new Date(order.createdAt).toLocaleDateString("es-MX")}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-medium text-[#8d5f09]">{formatDopCurrency(order.total)}</p>
                    <p className="mt-2 inline-flex items-center text-xs uppercase tracking-[0.2em] text-[#8d5f09]">
                      Ver <ChevronRight className="ml-1 h-4 w-4" />
                    </p>
                  </div>
                </button>
              ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  )
}

function getStatusIndex(status: string) {
  if (status === "Entregado") return 2
  if (status === "En Proceso") return 1
  return 0
}

function getEstimatedWindow(createdAt: string) {
  const baseDate = new Date(createdAt)
  if (Number.isNaN(baseDate.getTime())) return "19:45 - 20:00"

  const start = new Date(baseDate.getTime() + 25 * 60 * 1000)
  const end = new Date(baseDate.getTime() + 40 * 60 * 1000)

  return `${formatTime(start)} - ${formatTime(end)}`
}

function formatTime(date: Date) {
  return date.toLocaleTimeString("es-MX", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  })
}

function getStatusCopy(status: string) {
  if (status === "Entregado") {
    return {
      headline: "Entregado",
      detail: "Tu experiencia ya fue servida. Puedes revisar el detalle del pedido o volver a pedir desde el menu.",
    }
  }

  if (status === "En Proceso") {
    return {
      headline: "En Preparacion",
      detail: "Nuestro chef esta cuidando cada detalle de tu seleccion mientras el equipo de sala coordina la entrega.",
    }
  }

  return {
    headline: "Recibido",
    detail: "La orden ya esta confirmada y el equipo esta preparando la siguiente etapa del servicio.",
  }
}
