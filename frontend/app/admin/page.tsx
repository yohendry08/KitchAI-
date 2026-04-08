"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { AlertTriangle, CalendarDays, DollarSign, RefreshCcw, UtensilsCrossed } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { ApiError, api, type AdminDashboardResponse } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

interface DashboardState {
  dashboard: AdminDashboardResponse | null
  kpis: {
    sales: number
    reservationsToday: number
    activeOrders: number
    lowStock: number
  } | null
}

export default function AdminDashboard() {
  const [state, setState] = useState<DashboardState>({ dashboard: null, kpis: null })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadDashboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const [dashboard, kpis] = await Promise.all([api.getAdminDashboard(), api.getReportKpis()])
      setState({ dashboard, kpis })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No fue posible cargar el dashboard de administracion."
      setError(message)
      setState({ dashboard: null, kpis: null })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  const weeklySales = useMemo(() => {
    const data = state.dashboard?.weeklyData ?? []
    const max = Math.max(...data.map((entry) => entry.sales), 1)
    return data.map((entry) => ({
      day: entry.day,
      value: Math.max(8, Math.round((entry.sales / max) * 100)),
      sales: entry.sales,
    }))
  }, [state.dashboard])

  return (
    <DashboardLayout
      role="admin"
      userName="Alexander Ross"
      userRole="Chef Ejecutivo"
      title="Dashboard"
      searchPlaceholder="Buscar pedidos, ingredientes o personal..."
    >
      <div className="space-y-8">
        <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#21150f] md:text-5xl">Resumen de rendimiento</h1>
            <p className="mt-2 text-base text-[#74685d]">Vista en vivo desde backend para pedidos, ventas y stock.</p>
          </div>
          <Button variant="outline" className="gap-2" onClick={() => void loadDashboard()} disabled={loading}>
            <RefreshCcw className="h-4 w-4" />
            Actualizar
          </Button>
        </section>

        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando datos operativos...</div>}

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6">
            <p className="font-semibold text-destructive">No se pudo cargar el dashboard.</p>
            <p className="mt-1 text-sm text-destructive/90">{error}</p>
            <p className="mt-2 text-xs text-destructive/80">Modo fail-closed activo: no se muestran datos locales de respaldo.</p>
            <Button variant="outline" className="mt-4" onClick={() => void loadDashboard()}>
              Reintentar carga
            </Button>
          </div>
        )}

        {!loading && !error && state.dashboard && state.kpis && (
          <>
            <section className="grid gap-5 lg:grid-cols-2 2xl:grid-cols-4">
              <article className="rounded-2xl border p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  Ventas del dia
                </div>
                <p className="mt-2 text-3xl font-semibold text-foreground">{formatDopCurrency(state.kpis.sales)}</p>
              </article>
              <article className="rounded-2xl border p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CalendarDays className="h-4 w-4" />
                  Reservaciones hoy
                </div>
                <p className="mt-2 text-3xl font-semibold text-foreground">{state.kpis.reservationsToday}</p>
              </article>
              <article className="rounded-2xl border p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <UtensilsCrossed className="h-4 w-4" />
                  Pedidos activos
                </div>
                <p className="mt-2 text-3xl font-semibold text-foreground">{state.kpis.activeOrders}</p>
              </article>
              <article className="rounded-2xl border p-6">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <AlertTriangle className="h-4 w-4" />
                  Alertas de stock
                </div>
                <p className="mt-2 text-3xl font-semibold text-foreground">{state.kpis.lowStock}</p>
              </article>
            </section>

            <section className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_360px]">
              <article className="rounded-2xl border bg-card">
                <div className="flex items-center justify-between border-b p-6">
                  <h2 className="font-serif text-2xl text-foreground">Pedidos recientes</h2>
                  <Link href="/admin" className="text-sm font-semibold text-primary">
                    Ver todos
                  </Link>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px]">
                    <thead>
                      <tr className="border-b">
                        <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Orden</th>
                        <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Mesa</th>
                        <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Estado</th>
                        <th className="px-6 py-3 text-left text-xs uppercase tracking-wider text-muted-foreground">Monto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {state.dashboard.recentOrders.slice(0, 8).map((order) => (
                        <tr key={order.id} className="border-b last:border-0">
                          <td className="px-6 py-4 text-sm font-medium">{order.id}</td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">{order.table}</td>
                          <td className="px-6 py-4 text-sm">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-6 py-4 text-sm font-medium">{formatDopCurrency(order.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </article>

              <article className="rounded-2xl border bg-card p-6">
                <h2 className="font-serif text-2xl text-foreground">Ventas semanales</h2>
                <div className="mt-6 flex h-64 items-end gap-2">
                  {weeklySales.map((entry) => (
                    <div key={entry.day} className="flex flex-1 flex-col items-center gap-2">
                      <div className="w-full rounded-t bg-primary/80" style={{ height: `${entry.value}%` }} />
                      <span className="text-xs uppercase tracking-wider text-muted-foreground">{entry.day}</span>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
