"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CalendarDays, ChevronRight, ClipboardList, Search } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { KpiCard } from "@/components/dashboard/kpi-card"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError, api, type EmployeeDashboardResponse, type OrderRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

const filterOptions = ["Todos", "Pendiente", "En Proceso", "Entregado"]

export default function EmpleadoDashboard() {
  const [activeFilter, setActiveFilter] = useState("Todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [dashboard, setDashboard] = useState<EmployeeDashboardResponse | null>(null)
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadInitial = async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextDashboard, nextOrders] = await Promise.all([
        api.getEmployeeDashboard(),
        api.getOrders("", "Todos"),
      ])
      setDashboard(nextDashboard)
      setOrders(nextOrders)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cargar el panel de empleado."
      setError(message)
      setDashboard(null)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInitial()
  }, [])

  useEffect(() => {
    if (loading) return
    const timer = setTimeout(() => {
      const loadOrders = async () => {
        setLoadingOrders(true)
        setError(null)
        try {
          const nextOrders = await api.getOrders(searchQuery, activeFilter)
          setOrders(nextOrders)
        } catch (err) {
          const message = err instanceof ApiError ? err.message : "No se pudieron cargar los pedidos."
          setError(message)
          setOrders([])
        } finally {
          setLoadingOrders(false)
        }
      }

      void loadOrders()
    }, 250)

    return () => clearTimeout(timer)
  }, [activeFilter, searchQuery, loading])

  return (
    <DashboardLayout
      role="employee"
      userName="Maria Gomez"
      userRole="Mesero, Turno Tarde"
      userEmail="maria.gomez@kitchai.com"
      title="Dashboard"
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          title="Pedidos"
          value={String(orders.filter((order) => order.status !== "Entregado").length)}
          subtitle="Pedidos activos"
          icon={ClipboardList}
          trend="up"
          color="green"
        />
        <KpiCard
          title="Reservas para Hoy"
          value={String(dashboard?.reservationsToday ?? 0)}
          subtitle="Reservas confirmadas"
          icon={CalendarDays}
          trend="up"
          color="blue"
        />
        <KpiCard
          title="Nivel de Inventario"
          value={String(dashboard?.lowStockItems.length ?? 0)}
          subtitle="Items bajo stock"
          icon={AlertTriangle}
          trend="down"
          color="orange"
        />
      </div>

      {loading && <div className="mt-6 rounded-xl border p-6 text-sm text-muted-foreground">Cargando panel...</div>}
      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-sm text-destructive">
          <p>{error}</p>
          <p className="mt-2 text-xs text-destructive/80">Modo fail-closed activo: no se muestran fixtures locales.</p>
          <Button variant="outline" className="mt-4" onClick={() => void loadInitial()}>
            Reintentar carga
          </Button>
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="mt-8 rounded-xl border border-border bg-card">
            <div className="p-6">
              <h2 className="font-serif text-xl font-bold text-foreground">Pedidos Activos</h2>
              <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar por pedido o mesa..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    className="h-9 rounded-lg border-border bg-background pl-9 text-sm"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {filterOptions.map((filter) => (
                    <button
                      key={filter}
                      type="button"
                      onClick={() => setActiveFilter(filter)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                        activeFilter === filter
                          ? "bg-foreground text-background"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-t border-border bg-muted/30">
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mesa</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{order.id}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{order.table}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{formatDopCurrency(order.total)}</td>
                    </tr>
                  ))}
                  {!loadingOrders && orders.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No se encontraron pedidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card">
              <div className="p-6">
                <h2 className="font-serif text-xl font-bold text-foreground">Alertas de Inventario</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-t border-border bg-muted/30">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Producto</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cantidad</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {(dashboard?.lowStockItems ?? []).map((item) => (
                      <tr key={item.id} className="hover:bg-muted/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-foreground">{item.name}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                      </tr>
                    ))}
                    {(dashboard?.lowStockItems.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={3} className="px-6 py-8 text-center text-sm text-muted-foreground">
                          No hay alertas de inventario.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-6 font-serif text-xl font-bold text-foreground">Acciones Rapidas</h2>
              <div className="flex flex-col gap-3">
                <Button variant="outline" className="h-12 justify-between rounded-lg border-border bg-transparent" asChild>
                  <Link href="/empleado/pedidos">
                    Ver todos los pedidos <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="h-12 justify-between rounded-lg border-border bg-transparent" asChild>
                  <Link href="/empleado/inventario">
                    Registrar movimiento de inventario <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" className="h-12 justify-between rounded-lg border-border bg-transparent" asChild>
                  <Link href="/empleado/chat">
                    Chat de asistencia <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  )
}
