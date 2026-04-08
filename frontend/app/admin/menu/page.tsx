"use client"

import Image from "next/image"
import { useEffect, useMemo, useRef, useState } from "react"
import { Loader2, Pencil, Plus, Search, Trash2, Upload, X } from "lucide-react"
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
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { ApiError, api, type InventoryItemRecord, type MenuIngredientRecord, type MenuItemRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

const defaultCategories = ["Entradas", "Platos Fuertes", "Postres"]

type MenuFormState = {
  name: string
  description: string
  price: number
  category: string
  image: string
  available: boolean
  ingredients: MenuIngredientRecord[]
}

const emptyItem: MenuFormState = {
  name: "",
  description: "",
  price: 0,
  category: "Entradas",
  image: "",
  available: true,
  ingredients: [],
}

export default function MenuPage() {
  const [items, setItems] = useState<MenuItemRecord[]>([])
  const [inventoryItems, setInventoryItems] = useState<InventoryItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [activeCategory, setActiveCategory] = useState("Todos")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItemRecord | null>(null)
  const [formData, setFormData] = useState<MenuFormState>(emptyItem)
  const [isUploading, setIsUploading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getMenuItems("", "Todos")
      setItems(data)
      const inventory = await api.getInventoryItems("", "Todos")
      setInventoryItems(inventory)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo cargar el menu.")
      setItems([])
      setInventoryItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadItems()
  }, [])

  const categories = useMemo(() => {
    const dynamic = Array.from(new Set(items.map((item) => item.category))).sort((a, b) => a.localeCompare(b))
    return ["Todos", ...Array.from(new Set([...defaultCategories, ...dynamic]))]
  }, [items])

  const filtered = useMemo(() => {
    const needle = search.trim().toLowerCase()
    return items.filter((item) => {
      const matchSearch =
        !needle ||
        item.name.toLowerCase().includes(needle) ||
        item.description.toLowerCase().includes(needle)
      const matchCategory = activeCategory === "Todos" || item.category === activeCategory
      return matchSearch && matchCategory
    })
  }, [activeCategory, items, search])

  const stats = useMemo(() => {
    const available = items.filter((item) => item.available).length
    const hidden = items.length - available
    return { total: items.length, available, hidden }
  }, [items])

  const openDialog = (item?: MenuItemRecord) => {
    if (item) {
      setEditingItem(item)
      setFormData({
        name: item.name,
        description: item.description,
        price: item.price,
        category: item.category,
        image: item.image,
        available: item.available,
        ingredients: item.ingredients || [],
      })
    } else {
      setEditingItem(null)
      setFormData(emptyItem)
    }
    setIsDialogOpen(true)
  }

  const closeDialog = () => {
    setEditingItem(null)
    setFormData(emptyItem)
    setIsDialogOpen(false)
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: uploadData,
      })

      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(typeof data?.error === "string" ? data.error : "Error al subir imagen")
      }

      const data = (await response.json()) as { url: string }
      setFormData((current) => ({ ...current, image: data.url }))
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir la imagen.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleRemoveImage = async () => {
    if (formData.image && formData.image.includes("blob.vercel-storage.com")) {
      await fetch("/api/upload/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.image }),
      }).catch(() => null)
    }
    setFormData((current) => ({ ...current, image: "" }))
  }

  const handleSave = async () => {
    if (!formData.name || !formData.description || !formData.category || formData.price <= 0) {
      setError("Completa nombre, descripcion, categoria y precio.")
      return
    }
    if (!formData.ingredients.length) {
      setError("Debes asignar al menos un ingrediente al plato.")
      return
    }
    if (formData.ingredients.some((ingredient) => !ingredient.inventoryItemId || ingredient.quantity <= 0)) {
      setError("Cada ingrediente debe tener un insumo y una cantidad mayor que cero.")
      return
    }

    setIsSaving(true)
    setError(null)
    try {
      if (editingItem) {
        await api.updateMenuItem(editingItem.id, formData)
      } else {
        await api.createMenuItem(formData)
      }
      closeDialog()
      await loadItems()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo guardar el plato.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este plato del menu?")) return
    try {
      await api.deleteMenuItem(id)
      await loadItems()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "No se pudo eliminar el plato.")
    }
  }

  const addIngredient = () => {
    const fallbackItem = inventoryItems[0]
    setFormData((current) => ({
      ...current,
      ingredients: [
        ...current.ingredients,
        {
          inventoryItemId: fallbackItem?.id || "",
          quantity: 0,
        },
      ],
    }))
  }

  const updateIngredient = (index: number, patch: Partial<MenuIngredientRecord>) => {
    setFormData((current) => ({
      ...current,
      ingredients: current.ingredients.map((ingredient, ingredientIndex) =>
        ingredientIndex === index ? { ...ingredient, ...patch } : ingredient,
      ),
    }))
  }

  const removeIngredient = (index: number) => {
    setFormData((current) => ({
      ...current,
      ingredients: current.ingredients.filter((_, ingredientIndex) => ingredientIndex !== index),
    }))
  }

  const getInventoryLabel = (inventoryItemId: string) => {
    const inventoryItem = inventoryItems.find((item) => item.id === inventoryItemId)
    return inventoryItem ? `${inventoryItem.name} (${inventoryItem.unit})` : "Ingrediente sin referencia"
  }

  return (
    <DashboardLayout role="admin" title="Menu" searchPlaceholder="Buscar platos o categorias..." searchValue={search} onSearchChange={setSearch}>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="font-serif text-4xl text-[#21150f] md:text-5xl">Menu operativo</h1>
            <p className="mt-2 max-w-2xl text-base text-[#74685d]">
              Los platos publicados en esta pantalla alimentan el menu publico y el flujo de pedidos del restaurante.
            </p>
          </div>
          <Button onClick={() => openDialog()} className="gap-2">
            <Plus className="h-4 w-4" />
            Nuevo plato
          </Button>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Platos registrados</p>
            <p className="mt-2 text-3xl font-semibold">{stats.total}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Disponibles</p>
            <p className="mt-2 text-3xl font-semibold text-emerald-700">{stats.available}</p>
          </article>
          <article className="rounded-2xl border bg-card p-5">
            <p className="text-sm text-muted-foreground">Ocultos o sin venta</p>
            <p className="mt-2 text-3xl font-semibold text-amber-700">{stats.hidden}</p>
          </article>
        </section>

        <section className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setActiveCategory(category)}
              className={`rounded-full border px-4 py-2 text-sm ${
                activeCategory === category ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
              }`}
            >
              {category}
            </button>
          ))}
        </section>

        {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
        {loading && <div className="rounded-xl border p-6 text-sm text-muted-foreground">Cargando platos desde backend...</div>}

        {!loading && (
          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border bg-card">
                <div className="relative aspect-[4/3]">
                  <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
                </div>
                <div className="space-y-4 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{item.category}</p>
                      <h2 className="mt-1 font-serif text-2xl text-foreground">{item.name}</h2>
                    </div>
                    <StatusBadge status={item.available ? "Normal" : "Critico"} />
                  </div>
                  <p className="text-sm leading-6 text-muted-foreground">{item.description}</p>
                  <div className="rounded-xl bg-muted/40 p-3 text-sm text-muted-foreground">
                    {item.ingredients?.length ?? 0} ingredientes configurados
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{formatDopCurrency(item.price)}</span>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openDialog(item)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
            {!filtered.length && <div className="rounded-xl border border-dashed p-6 text-sm text-muted-foreground">No hay platos para este filtro.</div>}
          </section>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? "Editar plato" : "Nuevo plato"}</DialogTitle>
            <DialogDescription>Este cambio impacta el menu publico y la toma de pedidos.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-2">
            <div className="space-y-2">
              <Label>Imagen</Label>
              {formData.image ? (
                <div className="relative aspect-video overflow-hidden rounded-xl border">
                  <Image src={formData.image} alt="Vista previa" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute right-3 top-3 rounded-full bg-black/70 p-2 text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-sm text-muted-foreground"
                >
                  {isUploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Upload className="h-6 w-6" />}
                  {isUploading ? "Subiendo imagen..." : "Seleccionar imagen"}
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="hidden"
                onChange={handleImageUpload}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={formData.name} onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripcion</Label>
              <Textarea
                id="description"
                rows={4}
                value={formData.description}
                onChange={(event) => setFormData((current) => ({ ...current, description: event.target.value }))}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="price">Precio</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price || ""}
                  onChange={(event) => setFormData((current) => ({ ...current, price: Number(event.target.value || 0) }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData((current) => ({ ...current, category: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories
                      .filter((category) => category !== "Todos")
                      .map((category) => (
                        <SelectItem key={category} value={category}>
                          {category}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl border p-4">
              <div>
                <p className="font-medium">Disponible para venta</p>
                <p className="text-sm text-muted-foreground">Si lo desactivas, desaparece del menu publico.</p>
              </div>
              <Switch checked={formData.available} onCheckedChange={(checked) => setFormData((current) => ({ ...current, available: checked }))} />
            </div>

            <div className="space-y-4 rounded-xl border p-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium">Ingredientes del plato</p>
                  <p className="text-sm text-muted-foreground">
                    Esta receta se usa para descontar inventario cuando se crea un pedido.
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={addIngredient} disabled={!inventoryItems.length}>
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar ingrediente
                </Button>
              </div>

              {!formData.ingredients.length && (
                <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                  Agrega al menos un ingrediente desde inventario para este plato.
                </div>
              )}

              <div className="space-y-3">
                {formData.ingredients.map((ingredient, index) => (
                  <div key={`${ingredient.inventoryItemId}-${index}`} className="grid gap-3 rounded-xl border p-3 md:grid-cols-[minmax(0,1fr)_160px_48px]">
                    <div className="space-y-2">
                      <Label>Ingrediente</Label>
                      <Select
                        value={ingredient.inventoryItemId}
                        onValueChange={(value) => updateIngredient(index, { inventoryItemId: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona ingrediente" />
                        </SelectTrigger>
                        <SelectContent>
                          {inventoryItems.map((inventoryItem) => (
                            <SelectItem key={inventoryItem.id} value={inventoryItem.id}>
                              {getInventoryLabel(inventoryItem.id)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Cantidad</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.001"
                        value={ingredient.quantity || ""}
                        onChange={(event) =>
                          updateIngredient(index, { quantity: Number(event.target.value || 0) })
                        }
                      />
                    </div>

                    <div className="flex items-end">
                      <Button type="button" variant="outline" size="icon" onClick={() => removeIngredient(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog} disabled={isSaving}>
              Cancelar
            </Button>
            <Button onClick={() => void handleSave()} disabled={isSaving || isUploading}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingItem ? "Guardar cambios" : "Crear plato"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  )
}
