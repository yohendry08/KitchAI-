"use client"

import { useEffect, useMemo, useState } from "react"
import { ArrowRightLeft, Loader2, PackagePlus, Pencil, Plus, Trash2 } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
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
import { ApiError, api, type InventoryItemRecord, type InventoryMovementRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

type InventoryFormState = {
  name: string
  quantity: number
  unit: string
  minStock: number
  cost: number
}

type MovementFormState = {
  itemId: string
  type: "in" | "out" | "adjustment"
  quantity: number
  unitCost: number
  note: string
}

const emptyItem: InventoryFormState = {
  name: "",
  quantity: 0,
  unit: "kg",
  minStock: 0,
  cost: 0,
}

const emptyMovement: MovementFormState = {
  itemId: "",
  type: "in",
  quantity: 0,
  unitCost: 0,
  note: "",
}

export default function InventarioPage() {
  const [items, setItems] = useState<InventoryItemRecord[]>([])
  const [movements, setMovements] = useState<InventoryMovementRecord[]>([])
  const [search, setSearch] = useState("")
  const [activeStatus, setActiveStatus] = useState("Todos")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [itemDialogOpen, setItemDialogOpen] = useState(false)
  const [movementDialogOpen, setMovementDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<InventoryItemRecord | null>(null)
  const [itemForm, setItemForm] = useState<InventoryFormState>(emptyItem)
  const [movementForm, setMovementForm] = useState<MovementFormState>(emptyMovement)
  const [isSaving, setIsSaving] = useState(false)

  const loadInventory = async () => {
    setLoading(true)
    setError(null)
    try {
      const [itemsData, movementData] = await Promise.all([
        api.getInventoryItems("", "Todos"),
        api.getInventoryMovements(),
      ])
      setItems(itemsData)
      setMovements(movementData)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el inventario.")
      setItems([])
      setMovements([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadInventory()
  }, [])

  const filteredItems = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchSearch = !needle || item.name.toLowerCase().includes(needle) || item.unit.toLowerCase().includes(needle)
      const matchStatus = activeStatus === "Todos" || item.status === activeStatus
      return matchSearch && matchStatus
    })
  }, [activeStatus, items, search])

  const metrics = useMemo(() => {
    const lowStock = items.filter((item) => item.status !== "Normal").length
    const totalValue = items.reduce((sum, item) => sum + item.quantity * item.cost, 0)
    return { total: items.length, lowStock, totalValue }
  }, [items])

  const statuses = useMemo(() => ["Todos", "Normal", "Bajo", "Critico"], [])

  const openItemDialog = (item?: InventoryItemRecord) => {
    if (item) {
      setEditingItem(item)
      setItemForm({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit,
        minStock: item.minStock,
        cost: item.cost,
      })
    } else {
      setEditingItem(null)
      setItemForm(emptyItem)
    }
    setItemDialogOpen(true)
  }

  const openMovementDialog = (item?: InventoryItemRecord) => {
    setMovementForm({
      ...emptyMovement,
      itemId: item?.id || items[0]?.id || "",
    })
    setMovementDialogOpen(true)
  }

  const closeDialogs = () => {
    setEditingItem(null)
    setItemForm(emptyItem)
    setMovementForm(emptyMovement)
    setItemDialogOpen(false)
    setMovementDialogOpen(false)
  }

  const handleSaveItem = async () => {
    if (!itemForm.name || !itemForm.unit) {
      setError("Completa nombre y unidad del insumo.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      if (editingItem) {
        await api.updateInventoryItem(editingItem.id, itemForm)
      } else {
        await api.createInventoryItem(itemForm)
      }
      closeDialogs()
      await loadInventory()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el insumo.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveMovement = async () => {
    if (!movementForm.itemId || movementForm.quantity <= 0) {
      setError("Selecciona un insumo y una cantidad valida.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      await api.createInventoryMovement({
        itemId: movementForm.itemId,
        type: movementForm.type,
        quantity: movementForm.quantity,
        unitCost: movementForm.unitCost || undefined,
        note: movementForm.note || undefined,
      })
      closeDialogs()
      await loadInventory()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo registrar el movimiento.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (item: InventoryItemRecord) => {
    if (!window.confirm(`¿Eliminar ${item.name} del inventario?`)) return
    try {
      await api.deleteInventoryItem(item.id)
      await loadInventory()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el insumo.")
    }
  }

  return (
    <DashboardLayout
      role="admin"
      title="Inventario"
      searchPlaceholder="Buscar insumos, unidades o estado..."
      searchValue={search}
      onSearchChange={setSearch}
    >
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#21150f] md:text-5xl">Inventario maestro</h1>
            <p className="mt-2 max-w-3xl text-base text-[#74685d]">
              El admin puede crear insumos, ajustar stock, registrar entradas y salidas y revisar los ultimos movimientos.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="gap-2" onClick={() => openMovementDialog()}>
              <ArrowRightLeft className="h-4 w-4" />
              Registrar movimiento
            </Button>
            <Button className="gap-2" onClick={() => openItemDialog()}>
              <PackagePlus className="h-4 w-4" />
              Nuevo insumo
            </Button>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Insumos monitoreados</p>
            <p className="mt-2 text-3xl font-semibold">{metrics.total}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Alertas de stock</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{metrics.lowStock}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Valor estimado del inventario</p>
            <p className="mt-2 text-3xl font-semibold">{formatDopCurrency(metrics.totalValue)}</p>
          </article>
        </section>

        <section className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setActiveStatus(status)}
              className={`rounded-full border px-4 py-2 text-sm ${
                activeStatus === status ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {status}
            </button>
          ))}
        </section>

        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando inventario...</div>}

        {!loading && (
          <>
            <section className="overflow-hidden rounded-2xl border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-muted/40">
                    <tr>
                      {["Insumo", "Cantidad", "Stock minimo", "Costo", "Estado", "Acciones"].map((heading) => (
                        <th key={heading} className="px-6 py-4 text-left text-xs uppercase tracking-[0.18em] text-muted-foreground">
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item) => (
                      <tr key={item.id} className="border-t">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium">{item.name}</p>
                            <p className="text-sm text-muted-foreground">Actualizado: {new Date(item.updatedAt).toLocaleString("es-MX")}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm">{item.quantity} {item.unit}</td>
                        <td className="px-6 py-4 text-sm text-muted-foreground">{item.minStock} {item.unit}</td>
                        <td className="px-6 py-4 text-sm font-medium">{formatDopCurrency(item.cost)}</td>
                        <td className="px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={() => openMovementDialog(item)}>
                              <Plus className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => openItemDialog(item)}>
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => void handleDelete(item)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {!filteredItems.length && (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-muted-foreground">
                          No hay insumos para este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="rounded-2xl border bg-card p-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-serif text-2xl text-foreground">Ultimos movimientos</h2>
                  <p className="text-sm text-muted-foreground">Historial reciente de entradas, salidas y ajustes.</p>
                </div>
              </div>
              <div className="space-y-3">
                {movements.slice(0, 8).map((movement) => (
                  <div key={movement.id} className="flex flex-col gap-2 rounded-xl border p-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="font-medium">{movement.itemName}</p>
                      <p className="text-sm text-muted-foreground">
                        {movement.createdByName} · {movement.note || "Sin nota"}
                      </p>
                    </div>
                    <div className="text-sm">
                      <p className="font-medium uppercase">{movement.type}</p>
                      <p className="text-muted-foreground">
                        {movement.quantity} · {new Date(movement.createdAt).toLocaleString("es-MX")}
                      </p>
                    </div>
                  </div>
                ))}
                {!movements.length && <p className="text-sm text-muted-foreground">Aun no hay movimientos registrados.</p>}
              </div>
            </section>
          </>
        )}
      </div>

      <Dialog open={itemDialogOpen} onOpenChange={setItemDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar insumo" : "Nuevo insumo"}</DialogTitle>
            <DialogDescription>Define stock, costo y minimo operativo del inventario.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={itemForm.name} onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="quantity">Cantidad</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0"
                  value={itemForm.quantity || ""}
                  onChange={(event) => setItemForm((current) => ({ ...current, quantity: Number(event.target.value || 0) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unidad</Label>
                <Input id="unit" value={itemForm.unit} onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))} />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="minStock">Stock minimo</Label>
                <Input
                  id="minStock"
                  type="number"
                  min="0"
                  value={itemForm.minStock || ""}
                  onChange={(event) => setItemForm((current) => ({ ...current, minStock: Number(event.target.value || 0) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cost">Costo unitario</Label>
                <Input
                  id="cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.cost || ""}
                  onChange={(event) => setItemForm((current) => ({ ...current, cost: Number(event.target.value || 0) }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveItem()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? "Guardar cambios" : "Crear insumo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={movementDialogOpen} onOpenChange={setMovementDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Registrar movimiento</DialogTitle>
            <DialogDescription>Usa entrada, salida o ajuste para mantener el stock real del restaurante.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label>Insumo</Label>
              <Select value={movementForm.itemId} onValueChange={(value) => setMovementForm((current) => ({ ...current, itemId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un insumo" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={movementForm.type}
                  onValueChange={(value: "in" | "out" | "adjustment") => setMovementForm((current) => ({ ...current, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in">Entrada</SelectItem>
                    <SelectItem value="out">Salida</SelectItem>
                    <SelectItem value="adjustment">Ajuste</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="movementQty">Cantidad</Label>
                <Input
                  id="movementQty"
                  type="number"
                  min="0"
                  value={movementForm.quantity || ""}
                  onChange={(event) => setMovementForm((current) => ({ ...current, quantity: Number(event.target.value || 0) }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unitCost">Costo unitario</Label>
                <Input
                  id="unitCost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={movementForm.unitCost || ""}
                  onChange={(event) => setMovementForm((current) => ({ ...current, unitCost: Number(event.target.value || 0) }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="note">Nota</Label>
              <Textarea id="note" rows={3} value={movementForm.note} onChange={(event) => setMovementForm((current) => ({ ...current, note: event.target.value }))} />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialogs} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSaveMovement()} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Guardar movimiento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
