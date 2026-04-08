"use client"

import { type ReactNode, useEffect, useMemo, useRef, useState } from "react"
import { AlertTriangle, ArrowRight, CalendarDays, PackageSearch, Send, Sparkles, Users, Wallet } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  ApiError,
  api,
  type AdminDashboardResponse,
  type InventoryItemRecord,
  type MenuItemRecord,
  type OrderRecord,
  type ReportKpisResponse,
} from "@/lib/api"
import { cn, formatDopCurrency } from "@/lib/utils"

const assistantActions = [
  {
    label: "Analiza inventario",
    prompt: "Analiza el impacto en inventario de los platos y resalta los insumos críticos.",
  },
  {
    label: "Proyecta demanda",
    prompt: "Proyecta la demanda de la próxima semana a partir de ventas, pedidos y reservas.",
  },
  {
    label: "Resumen operativo",
    prompt: "Dame un resumen operativo con ventas, pedidos activos, inventario bajo y actividad reciente.",
  },
]

type ChatMessage = {
  id: string
  role: "assistant" | "user"
  text: string
}

type AnalyticsState = {
  kpis: ReportKpisResponse | null
  weeklySales: Array<{ day: string; sales: number }>
  dashboard: AdminDashboardResponse | null
  orders: OrderRecord[]
  menuItems: MenuItemRecord[]
  inventoryItems: InventoryItemRecord[]
}

const createMessage = (role: ChatMessage["role"], text: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  text,
})

export default function ReportesPage() {
  const [query, setQuery] = useState("")
  const [search, setSearch] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [chatError, setChatError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [state, setState] = useState<AnalyticsState>({
    kpis: null,
    weeklySales: [],
    dashboard: null,
    orders: [],
    menuItems: [],
    inventoryItems: [],
  })
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    void loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const [kpis, weeklySales, dashboard, orders, menuItems, inventoryItems] = await Promise.all([
        api.getReportKpis(),
        api.getWeeklySales(),
        api.getAdminDashboard(),
        api.getOrders(),
        api.getMenuItems(),
        api.getInventoryItems(),
      ])

      setState({
        kpis,
        weeklySales,
        dashboard,
        orders,
        menuItems,
        inventoryItems,
      })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cargar la analítica real."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const categoryData = useMemo(() => {
    const categoryTotals = new Map<string, number>()
    const menuById = new Map(state.menuItems.map((item) => [item.id, item]))

    for (const order of state.orders) {
      for (const item of order.items) {
        const category = menuById.get(item.menuItemId)?.category || "Otros"
        categoryTotals.set(category, (categoryTotals.get(category) || 0) + item.quantity * item.unitPrice)
      }
    }

    if (categoryTotals.size === 0) {
      for (const item of state.menuItems) {
        categoryTotals.set(item.category, (categoryTotals.get(item.category) || 0) + 1)
      }
    }

    const total = Array.from(categoryTotals.values()).reduce((sum, value) => sum + value, 0) || 1

    return Array.from(categoryTotals.entries())
      .map(([category, value]) => ({
        category,
        share: Number(((value / total) * 100).toFixed(1)),
        total: value,
      }))
      .sort((a, b) => b.total - a.total)
  }, [state.menuItems, state.orders])

  const lowStockItems = useMemo(
    () => state.inventoryItems.filter((item) => item.status !== "Normal").slice(0, 4),
    [state.inventoryItems],
  )

  const recentActivity = state.dashboard?.recentActivity.slice(0, 4) || []
  const kpis = state.kpis

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    const prompt = query.trim()
    if (!prompt || isLoading) return
    void sendPrompt(prompt)
  }

  const sendPrompt = async (prompt: string) => {
    setQuery("")
    setChatError(null)
    setMessages((current) => [...current, createMessage("user", prompt)])
    setIsLoading(true)

    try {
      const response = await api.askChat(prompt, "admin")
      setMessages((current) => [...current, createMessage("assistant", response.answer)])
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo consultar el asistente analítico."
      setChatError(message)
      setMessages((current) => [...current, createMessage("assistant", message)])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Analítica"
      searchPlaceholder="Buscar analítica, tendencias o stock..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_420px]">
        <div className="space-y-6">
          <section className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="font-serif text-5xl leading-none text-[#21150f] md:text-6xl">Analítica real</h1>
              <p className="mt-4 text-lg leading-8 text-[#74685d]">
                Todas las métricas, pedidos, menú e inventario se leen desde la base de datos activa.
              </p>
            </div>

            <Button variant="outline" className="gap-2" onClick={() => void loadAnalytics()} disabled={loading}>
              <CalendarDays className="h-4 w-4" />
              Actualizar datos
            </Button>
          </section>

          {loading && <div className="rounded-3xl border bg-white p-6 text-sm text-muted-foreground">Cargando analítica desde la DB...</div>}

          {error && (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
              <p className="font-semibold">No se pudo cargar la analítica.</p>
              <p className="mt-2">{error}</p>
            </div>
          )}

          {!loading && !error && kpis && (
            <>
              <section className="grid gap-5 xl:grid-cols-2 2xl:grid-cols-4">
                <MetricCard
                  title="Ventas acumuladas"
                  value={formatDopCurrency(kpis.sales)}
                  detail={`${state.orders.length} pedidos registrados`}
                  icon={<Wallet className="h-5 w-5" />}
                />
                <MetricCard
                  title="Valor inventario"
                  value={formatDopCurrency(kpis.inventoryValue)}
                  detail={`${state.inventoryItems.length} insumos activos`}
                  icon={<PackageSearch className="h-5 w-5" />}
                />
                <MetricCard
                  title="Cuentas activas"
                  value={String(kpis.totalAccounts)}
                  detail={`${kpis.totalEmployees} empleados en nómina`}
                  icon={<Users className="h-5 w-5" />}
                />
                <MetricCard
                  title="Pedidos activos"
                  value={String(kpis.activeOrders)}
                  detail={`${kpis.lowStock} alertas de stock`}
                  icon={<AlertTriangle className="h-5 w-5" />}
                />
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-[30px] border border-[#eee2d5] bg-white p-8 shadow-[0_24px_55px_rgba(112,78,37,0.06)]">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-[34px] leading-none text-[#21150f]">Ventas por categoría</h2>
                      <p className="mt-2 text-sm text-[#7f7368]">Participación calculada sobre pedidos reales.</p>
                    </div>
                  </div>

                  <div className="mt-8 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={categoryData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efe3d6" />
                        <XAxis dataKey="category" axisLine={false} tickLine={false} tick={{ fill: "#978b80", fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip
                          cursor={{ fill: "rgba(240,228,214,0.5)" }}
                          contentStyle={{
                            backgroundColor: "#fffaf4",
                            border: "1px solid #eadfce",
                            borderRadius: "16px",
                            color: "#2a1d14",
                          }}
                          formatter={(value: number, _name, payload) => [
                            `${value}% | ${formatDopCurrency(Number(payload?.payload?.total || 0))}`,
                            "Participación",
                          ]}
                        />
                        <Bar dataKey="share" fill="#a8740b" radius={[16, 16, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </article>

                <article className="rounded-[30px] border border-[#eee2d5] bg-white p-8 shadow-[0_24px_55px_rgba(112,78,37,0.06)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="font-serif text-[34px] leading-none text-[#21150f]">Ventas semanales</h2>
                      <p className="mt-2 text-sm text-[#7f7368]">Serie derivada de los pedidos almacenados en DB.</p>
                    </div>
                  </div>

                  <div className="mt-8 h-[320px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={state.weeklySales}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#efe3d6" />
                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#978b80", fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "#fffaf4",
                            border: "1px solid #eadfce",
                            borderRadius: "16px",
                            color: "#2a1d14",
                          }}
                          formatter={(value: number) => [formatDopCurrency(value), "Ventas"]}
                        />
                        <Line type="monotone" dataKey="sales" stroke="#9d6f10" strokeWidth={3} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </article>
              </section>

              <section className="grid gap-6 xl:grid-cols-2">
                <article className="rounded-[30px] border border-[#eee2d5] bg-white p-8 shadow-[0_24px_55px_rgba(112,78,37,0.06)]">
                  <h2 className="font-serif text-[34px] leading-none text-[#21150f]">Stock crítico</h2>
                  <div className="mt-6 space-y-4">
                    {lowStockItems.length === 0 ? (
                      <p className="text-sm text-[#7f7368]">No hay alertas de inventario en este momento.</p>
                    ) : (
                      lowStockItems.map((item) => (
                        <div key={item.id} className="rounded-2xl border border-[#eee2d5] bg-[#fffaf4] p-4">
                          <div className="flex items-center justify-between gap-4">
                            <div>
                              <p className="font-medium text-[#241914]">{item.name}</p>
                              <p className="mt-1 text-sm text-[#7f7368]">
                                {item.quantity} {item.unit} disponibles, mínimo {item.minStock}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#8d5c07]">{item.status}</p>
                              <p className="mt-1 text-xs text-[#7f7368]">{formatDopCurrency(item.cost)} por unidad</p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </article>

                <article className="rounded-[30px] border border-[#eee2d5] bg-white p-8 shadow-[0_24px_55px_rgba(112,78,37,0.06)]">
                  <h2 className="font-serif text-[34px] leading-none text-[#21150f]">Actividad reciente</h2>
                  <div className="mt-6 space-y-4">
                    {recentActivity.length === 0 ? (
                      <p className="text-sm text-[#7f7368]">No hay actividad registrada todavía.</p>
                    ) : (
                      recentActivity.map((activity) => (
                        <div key={activity.id} className="rounded-2xl border border-[#eee2d5] bg-[#fffaf4] p-4">
                          <p className="font-medium text-[#241914]">{activity.user}</p>
                          <p className="mt-1 text-sm text-[#7f7368]">
                            {activity.action} {activity.detail}
                          </p>
                          <p className="mt-2 text-xs uppercase tracking-[0.14em] text-[#8d5c07]">{activity.time}</p>
                        </div>
                      ))
                    )}
                  </div>
                </article>
              </section>
            </>
          )}
        </div>

        <aside className="rounded-[32px] border border-[#ede1d4] bg-[#efe7de] p-7 shadow-[0_24px_55px_rgba(112,78,37,0.08)] 2xl:sticky 2xl:top-28 2xl:h-[calc(100vh-9rem)]">
          <div className="flex h-full flex-col">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[#a8740b] text-white">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <h2 className="font-serif text-4xl leading-none text-[#21150f]">Asistente</h2>
                <p className="mt-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#3d6a6a]">
                  Datos reales activos
                </p>
              </div>
            </div>

            <div className="mt-8 min-h-0 flex-1 overflow-hidden">
              <div className="h-full space-y-6 overflow-y-auto pr-2">
                {chatError && (
                  <div className="rounded-[24px] border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {chatError}
                  </div>
                )}

                {messages.length === 0 ? (
                  <>
                    <div className="rounded-[28px] bg-white p-6 text-[#241914] shadow-[0_18px_40px_rgba(89,63,35,0.08)]">
                      <p className="text-[19px] leading-9">
                        Puedo analizar ventas, menú, inventario, pedidos y reservas usando únicamente lo que existe en la base de datos.
                      </p>
                    </div>

                    <div className="space-y-3">
                      {assistantActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => void sendPrompt(action.prompt)}
                          className="flex w-full items-center justify-between rounded-[20px] bg-white px-5 py-4 text-left text-[17px] text-[#8d5c07] shadow-[0_14px_30px_rgba(89,63,35,0.06)] transition hover:bg-[#fff8ef]"
                        >
                          <span>{action.label}</span>
                          <ArrowRight className="h-4 w-4" />
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => {
                      const isUser = message.role === "user"

                      return (
                        <div key={message.id} className={cn("flex", isUser ? "justify-end" : "justify-start")}>
                          <div
                            className={cn(
                              "max-w-[92%] rounded-[26px] px-5 py-4 text-[17px] leading-8 shadow-[0_14px_30px_rgba(89,63,35,0.06)]",
                              isUser ? "bg-[#a8740b] text-white" : "bg-white text-[#241914]",
                            )}
                          >
                            {!isUser && (
                              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8d5c07]">
                                <Sparkles className="h-3.5 w-3.5" />
                                Asistente IA
                              </div>
                            )}
                            <div
                              className={cn(
                                "text-sm whitespace-pre-wrap",
                                message.role === "assistant" &&
                                  "prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0",
                              )}
                            >
                              {message.text}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="rounded-[24px] bg-white px-5 py-4 text-[#6b5f54] shadow-[0_14px_30px_rgba(89,63,35,0.06)]">
                          Analizando datos...
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 flex items-center gap-3">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pregunta sobre tus datos..."
                className="h-16 rounded-[22px] border-[#e6d7c8] bg-white px-5 text-lg placeholder:text-[#8f8174] focus-visible:ring-1 focus-visible:ring-[#a8740b]"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !query.trim()}
                className="h-16 w-16 rounded-[22px] bg-[#a8740b] text-white hover:bg-[#936607]"
              >
                <Send className="h-6 w-6" />
              </Button>
            </form>
          </div>
        </aside>
      </div>
    </DashboardLayout>
  )
}

function MetricCard({
  title,
  value,
  detail,
  icon,
}: {
  title: string
  value: string
  detail: string
  icon: ReactNode
}) {
  return (
    <article className="rounded-[28px] border border-[#eee2d5] bg-white p-7 shadow-[0_18px_45px_rgba(115,81,39,0.06)]">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f5efe7] text-[#8d5c07]">{icon}</div>
      <p className="mt-8 text-[14px] font-medium uppercase tracking-[0.18em] text-[#8f8174]">{title}</p>
      <p className="mt-4 font-serif text-4xl leading-none text-[#21150f]">{value}</p>
      <p className="mt-3 text-sm text-[#7f7368]">{detail}</p>
    </article>
  )
}
