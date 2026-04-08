"use client"

import { useEffect, useMemo, useState } from "react"
import { FileText, Loader2, Plus, Printer, Search } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, api, type MenuItemRecord, type OrderRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

type OrderType = "salon" | "takeaway" | "delivery"

type TableOption = {
  id: string
  name: string
  status: string
  activeOrders: number
}

type DraftItem = {
  menuItemId: string
  name: string
  quantity: number
  unitPrice: number
}

const statusOptions = ["Todos", "Pendiente", "En Proceso", "Entregado"] as const

const emptyDraft = {
  orderType: "salon" as OrderType,
  selectedTable: "",
  customerName: "",
  customerPhone: "",
  customerAddress: "",
  note: "",
}

export default function PedidosPage() {
  const [orders, setOrders] = useState<OrderRecord[]>([])
  const [menuItems, setMenuItems] = useState<MenuItemRecord[]>([])
  const [tables, setTables] = useState<TableOption[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<(typeof statusOptions)[number]>("Todos")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [draft, setDraft] = useState(emptyDraft)
  const [draftItems, setDraftItems] = useState<DraftItem[]>([])
  const [menuSearch, setMenuSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("Todos")
  const [invoiceOpen, setInvoiceOpen] = useState(false)
  const [invoiceOrders, setInvoiceOrders] = useState<OrderRecord[]>([])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [nextOrders, nextOptions, nextMenu] = await Promise.all([
        api.getOrders("", "Todos"),
        api.getOrderOptions(),
        api.getMenuItems("", "Todos"),
      ])
      setOrders(nextOrders)
      setTables(nextOptions.tables)
      setMenuItems(nextMenu.filter((item) => item.available))
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudieron cargar los pedidos.")
      setOrders([])
      setTables([])
      setMenuItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [])

  const categories = useMemo(
    () => ["Todos", ...Array.from(new Set(menuItems.map((item) => item.category))).sort((a, b) => a.localeCompare(b))],
    [menuItems],
  )

  const filteredOrders = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return orders.filter((order) => {
      const matchSearch =
        !needle ||
        order.id.toLowerCase().includes(needle) ||
        order.table.toLowerCase().includes(needle) ||
        (order.customerName || "").toLowerCase().includes(needle)
      const matchStatus = statusFilter === "Todos" || order.status === statusFilter
      return matchSearch && matchStatus
    })
  }, [orders, search, statusFilter])

  const tableSummary = useMemo(() => {
    const salonOrders = orders.filter((order) => order.type === "salon")
    return tables.map((table) => {
      const tableOrders = salonOrders.filter((order) => order.table === table.name)
      return {
        ...table,
        totalOrders: tableOrders.length,
        activeOrders: tableOrders.filter((order) => order.status !== "Entregado").length,
        totalAmount: tableOrders.reduce((sum, order) => sum + order.total, 0),
      }
    })
  }, [orders, tables])

  const filteredMenuItems = useMemo(() => {
    const needle = menuSearch.trim().toLowerCase()
    return menuItems.filter((item) => {
      const matchSearch = !needle || item.name.toLowerCase().includes(needle)
      const matchCategory = selectedCategory === "Todos" || item.category === selectedCategory
      return matchSearch && matchCategory
    })
  }, [menuItems, menuSearch, selectedCategory])

  const draftTotal = useMemo(
    () => draftItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0),
    [draftItems],
  )

  const openCreateDialog = (tableName?: string) => {
    setDraft({
      ...emptyDraft,
      selectedTable: tableName || "",
    })
    setDraftItems([])
    setMenuSearch("")
    setSelectedCategory("Todos")
    setCreateOpen(true)
  }

  const resetDraft = () => {
    setDraft(emptyDraft)
    setDraftItems([])
    setMenuSearch("")
    setSelectedCategory("Todos")
    setCreateOpen(false)
  }

  const addItemToDraft = (item: MenuItemRecord) => {
    setDraftItems((current) => {
      const existing = current.find((candidate) => candidate.menuItemId === item.id)
      if (existing) {
        return current.map((candidate) =>
          candidate.menuItemId === item.id
            ? { ...candidate, quantity: candidate.quantity + 1 }
            : candidate,
        )
      }

      return [
        ...current,
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: item.price,
        },
      ]
    })
  }

  const updateDraftItemQty = (menuItemId: string, quantity: number) => {
    setDraftItems((current) =>
      current
        .map((item) => (item.menuItemId === menuItemId ? { ...item, quantity: Math.max(1, quantity) } : item))
        .filter((item) => item.quantity > 0),
    )
  }

  const removeDraftItem = (menuItemId: string) => {
    setDraftItems((current) => current.filter((item) => item.menuItemId !== menuItemId))
  }

  const createOrder = async () => {
    if (draft.orderType === "salon" && !draft.selectedTable) {
      setError("Selecciona una mesa para el pedido.")
      return
    }
    if (!draftItems.length) {
      setError("Agrega al menos un plato al pedido.")
      return
    }
    if ((draft.orderType === "takeaway" || draft.orderType === "delivery") && !draft.customerName.trim()) {
      setError("Captura el nombre del cliente.")
      return
    }
    if ((draft.orderType === "takeaway" || draft.orderType === "delivery") && !draft.customerPhone.trim()) {
      setError("Captura el telefono del cliente.")
      return
    }
    if (draft.orderType === "delivery" && !draft.customerAddress.trim()) {
      setError("Captura la direccion del cliente.")
      return
    }

    const tableLabel =
      draft.orderType === "salon"
        ? draft.selectedTable
        : draft.orderType === "takeaway"
          ? "Para Llevar"
          : "Delivery"

    setSaving(true)
    setError(null)
    try {
      await api.createOrder({
        table: tableLabel,
        type: draft.orderType,
        note: draft.note || undefined,
        customerName: draft.customerName || undefined,
        customerPhone: draft.customerPhone || undefined,
        customerAddress: draft.customerAddress || undefined,
        items: draftItems,
      })
      resetDraft()
      await loadData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo crear el pedido.")
    } finally {
      setSaving(false)
    }
  }

  const updateOrderStatus = async (orderId: string, status: OrderRecord["status"]) => {
    setSaving(true)
    setError(null)
    try {
      await api.updateOrderStatus(orderId, status)
      await loadData()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo actualizar el estado del pedido.")
    } finally {
      setSaving(false)
    }
  }

  const openInvoice = (order: OrderRecord) => {
    const relatedOrders =
      order.type === "salon"
        ? orders.filter((candidate) => candidate.table === order.table)
        : [order]
    setInvoiceOrders(relatedOrders)
    setInvoiceOpen(true)
  }

  const invoiceData = useMemo(() => buildInvoice(invoiceOrders), [invoiceOrders])

  const handlePrintInvoice = () => {
    if (!invoiceOrders.length) return
    printInvoice(invoiceData)
  }

  return (
    <DashboardLayout
      role="employee"
      title="Pedidos"
      searchPlaceholder="Buscar pedidos, mesas o clientes..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-3xl text-foreground md:text-4xl">Gestion de pedidos por mesa</h1>
            <p className="mt-2 max-w-3xl text-sm text-muted-foreground">
              El equipo puede crear varios pedidos en una misma mesa, moverlos entre estados y cerrar el servicio con una factura imprimible.
            </p>
          </div>
          <Button onClick={() => openCreateDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Crear pedido
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          {tableSummary.map((table) => (
            <button
              key={table.id}
              type="button"
              onClick={() => openCreateDialog(table.name)}
              className={`rounded-2xl border p-4 text-left transition ${
                table.activeOrders > 0 ? "border-amber-300 bg-amber-50" : "border-border bg-card"
              }`}
            >
              <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{table.name}</p>
              <p className="mt-2 text-2xl font-semibold">{table.totalOrders}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {table.activeOrders} activos · {formatDopCurrency(table.totalAmount)}
              </p>
            </button>
          ))}
        </section>

        <section className="flex flex-wrap gap-2">
          {statusOptions.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/50"
              }`}
            >
              {status}
            </button>
          ))}
        </section>

        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando pedidos...</div>}

        {!loading && (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px]">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Pedido</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Mesa / tipo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Items</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Total</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Hora</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-foreground">
                        <div>{order.id}</div>
                        {order.customerName && (
                          <div className="text-xs text-muted-foreground">{order.customerName}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        <div>{order.table}</div>
                        <div className="text-xs uppercase">{order.type || "salon"}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">{order.items.length} platos</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={order.status} />
                      </td>
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{formatDopCurrency(order.total)}</td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleTimeString("es-MX", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {order.status === "Pendiente" && (
                            <Button size="sm" variant="outline" onClick={() => void updateOrderStatus(order.id, "En Proceso")} disabled={saving}>
                              En Proceso
                            </Button>
                          )}
                          {order.status !== "Entregado" && (
                            <Button size="sm" onClick={() => void updateOrderStatus(order.id, "Entregado")} disabled={saving}>
                              Entregar
                            </Button>
                          )}
                          <Button size="sm" variant="outline" onClick={() => openInvoice(order)}>
                            <FileText className="mr-1 h-4 w-4" />
                            Factura
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filteredOrders.length && (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-sm text-muted-foreground">
                        No se encontraron pedidos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear pedido</DialogTitle>
            <DialogDescription>
              Puedes abrir tantos pedidos como necesites para la misma mesa y gestionarlos por separado.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo de pedido</Label>
                  <Select
                    value={draft.orderType}
                    onValueChange={(value: OrderType) =>
                      setDraft((current) => ({
                        ...current,
                        orderType: value,
                        selectedTable: value === "salon" ? current.selectedTable : "",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="salon">Salon</SelectItem>
                      <SelectItem value="takeaway">Para llevar</SelectItem>
                      <SelectItem value="delivery">Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {draft.orderType === "salon" && (
                  <div className="space-y-2">
                    <Label>Mesa</Label>
                    <Select
                      value={draft.selectedTable}
                      onValueChange={(value) => setDraft((current) => ({ ...current, selectedTable: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona una mesa" />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((table) => (
                          <SelectItem key={table.id} value={table.name}>
                            {table.name} {table.activeOrders > 0 ? `· ${table.activeOrders} activos` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              {(draft.orderType === "takeaway" || draft.orderType === "delivery") && (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="customerName">Cliente</Label>
                    <Input
                      id="customerName"
                      value={draft.customerName}
                      onChange={(event) => setDraft((current) => ({ ...current, customerName: event.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customerPhone">Telefono</Label>
                    <Input
                      id="customerPhone"
                      value={draft.customerPhone}
                      onChange={(event) => setDraft((current) => ({ ...current, customerPhone: event.target.value }))}
                    />
                  </div>
                  {draft.orderType === "delivery" && (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="customerAddress">Direccion</Label>
                      <Input
                        id="customerAddress"
                        value={draft.customerAddress}
                        onChange={(event) => setDraft((current) => ({ ...current, customerAddress: event.target.value }))}
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Input
                  placeholder="Buscar plato..."
                  value={menuSearch}
                  onChange={(event) => setMenuSearch(event.target.value)}
                />
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {filteredMenuItems.map((item) => (
                  <Card key={item.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <CardTitle className="text-base">{item.name}</CardTitle>
                          <CardDescription className="mt-1">{item.description}</CardDescription>
                          <p className="mt-2 text-sm font-semibold text-primary">{formatDopCurrency(item.price)}</p>
                        </div>
                        <Button size="sm" onClick={() => addItemToDraft(item)}>
                          Agregar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div className="space-y-4 rounded-2xl border bg-muted/20 p-4">
              <div>
                <h3 className="font-semibold">Resumen del pedido</h3>
                <p className="text-sm text-muted-foreground">
                  {draft.orderType === "salon" ? draft.selectedTable || "Sin mesa" : draft.orderType}
                </p>
              </div>

              <div className="space-y-3">
                {draftItems.map((item) => (
                  <div key={item.menuItemId} className="rounded-xl border bg-card p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-muted-foreground">{formatDopCurrency(item.unitPrice)} c/u</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDraftItem(item.menuItemId)}
                        className="text-sm text-destructive"
                      >
                        Quitar
                      </button>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => updateDraftItemQty(item.menuItemId, item.quantity - 1)}>
                        -
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button size="sm" variant="outline" onClick={() => updateDraftItemQty(item.menuItemId, item.quantity + 1)}>
                        +
                      </Button>
                      <span className="ml-auto text-sm font-medium">{formatDopCurrency(item.quantity * item.unitPrice)}</span>
                    </div>
                  </div>
                ))}
                {!draftItems.length && <p className="text-sm text-muted-foreground">Todavia no agregas platos.</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Nota general</Label>
                <Textarea
                  id="note"
                  rows={3}
                  value={draft.note}
                  onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                />
              </div>

              <div className="flex items-center justify-between border-t pt-3 text-sm">
                <span>Total</span>
                <span className="text-lg font-semibold text-primary">{formatDopCurrency(draftTotal)}</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={resetDraft} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={() => void createOrder()} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar pedido"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Factura de {invoiceData.label}</DialogTitle>
            <DialogDescription>
              Resumen consolidado listo para imprimir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 rounded-2xl border bg-card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold">KitchAI</p>
                <p className="text-sm text-muted-foreground">Factura generada desde el panel de empleados</p>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>{invoiceData.label}</p>
                <p>{new Date().toLocaleString("es-MX")}</p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Pedidos incluidos</p>
                <p className="mt-2 text-sm">{invoiceData.orderIds.join(", ")}</p>
              </div>
              <div className="rounded-xl border p-4">
                <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Total facturado</p>
                <p className="mt-2 text-2xl font-semibold">{formatDopCurrency(invoiceData.total)}</p>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border">
              <table className="w-full">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Concepto</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Cantidad</th>
                    <th className="px-4 py-3 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">Unitario</th>
                    <th className="px-4 py-3 text-right text-xs uppercase tracking-[0.18em] text-muted-foreground">Importe</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={`${item.name}-${item.unitPrice}`} className="border-t">
                      <td className="px-4 py-3 text-sm">{item.name}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{item.quantity}</td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">{formatDopCurrency(item.unitPrice)}</td>
                      <td className="px-4 py-3 text-right text-sm font-medium">{formatDopCurrency(item.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setInvoiceOpen(false)}>
              Cerrar
            </Button>
            <Button onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" />
              Imprimir factura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}

function buildInvoice(orders: OrderRecord[]) {
  const groupedItems = new Map<string, { name: string; quantity: number; unitPrice: number; total: number }>()

  for (const order of orders) {
    for (const item of order.items) {
      const key = `${item.menuItemId}-${item.unitPrice}`
      const current = groupedItems.get(key)
      if (current) {
        current.quantity += item.quantity
        current.total += item.quantity * item.unitPrice
      } else {
        groupedItems.set(key, {
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.quantity * item.unitPrice,
        })
      }
    }
  }

  return {
    label: orders[0]?.table || "Pedido",
    orderIds: orders.map((order) => order.id),
    items: Array.from(groupedItems.values()),
    total: orders.reduce((sum, order) => sum + order.total, 0),
  }
}

function printInvoice(invoice: ReturnType<typeof buildInvoice>) {
  const html = `
    <html>
      <head>
        <title>Factura ${invoice.label}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
          h1 { margin: 0 0 8px; font-size: 24px; }
          p { margin: 4px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          th, td { border-bottom: 1px solid #ddd; padding: 10px 8px; text-align: left; }
          th:last-child, td:last-child { text-align: right; }
          .total { margin-top: 24px; text-align: right; font-size: 20px; font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>KitchAI</h1>
        <p>Factura: ${invoice.label}</p>
        <p>Pedidos: ${invoice.orderIds.join(", ")}</p>
        <p>Fecha: ${new Date().toLocaleString("es-MX")}</p>
        <table>
          <thead>
            <tr>
              <th>Concepto</th>
              <th>Cantidad</th>
              <th>Unitario</th>
              <th>Importe</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items
              .map(
                (item) => `
                <tr>
                  <td>${item.name}</td>
                  <td>${item.quantity}</td>
                  <td>RD$ ${item.unitPrice.toFixed(2)}</td>
                  <td>RD$ ${item.total.toFixed(2)}</td>
                </tr>`,
              )
              .join("")}
          </tbody>
        </table>
        <div class="total">Total: RD$ ${invoice.total.toFixed(2)}</div>
        <script>
          window.onload = function () { window.print(); };
        </script>
      </body>
    </html>
  `

  const popup = window.open("", "_blank", "width=900,height=700")
  if (!popup) return
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
}
