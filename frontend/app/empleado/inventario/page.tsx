"use client"

import { useEffect, useState } from "react"
import { Plus, Search } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard/dashboard-layout"
import { StatusBadge } from "@/components/dashboard/status-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ApiError, api } from "@/lib/api"

type InventoryItem = {
  id: string
  name: string
  quantity: number
  unit: string
  minStock: number
  status: string
}

export default function EmpleadoInventarioPage() {
  const [search, setSearch] = useState("")
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadItems = async (term: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await api.getInventoryItems(term)
      setItems(response)
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "No se pudo cargar inventario."
      setError(message)
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      void loadItems(search)
    }, 250)

    return () => clearTimeout(timer)
  }, [search])

  return (
    <DashboardLayout role="employee" userName="Maria Gomez" userRole="Mesero" title="Inventario">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar producto..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-lg border-border pl-10"
          />
        </div>
        <Button className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="mr-2 h-4 w-4" />
          Registrar Movimiento
        </Button>
      </div>

      {error && (
        <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          <p>{error}</p>
          <p className="mt-2 text-xs text-destructive/80">Modo fail-closed activo: no se exponen datos stale de inventario.</p>
          <Button variant="outline" className="mt-4" onClick={() => void loadItems(search)}>
            Reintentar
          </Button>
        </div>
      )}

      <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Cantidad</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Min. Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-muted-foreground">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!loading && items.map((item) => (
                <tr key={item.id} className="transition-colors hover:bg-muted/50">
                  <td className="px-6 py-4 text-sm font-medium text-foreground">{item.name}</td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted-foreground">
                    {item.minStock} {item.unit}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={item.status} />
                  </td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    No hay datos de inventario disponibles.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-muted-foreground">
                    Cargando inventario...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardLayout>
  )
}
