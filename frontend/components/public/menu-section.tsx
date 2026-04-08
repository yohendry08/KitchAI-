"use client"

import Image from "next/image"
import { useEffect, useMemo, useState } from "react"
import { Clock } from "lucide-react"
import { ApiError, api, type MenuItemRecord } from "@/lib/api"
import { formatDopCurrency } from "@/lib/utils"

export function MenuSection() {
  const [items, setItems] = useState<MenuItemRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadMenu = async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await api.getMenuItems("", "Todos")
        setItems(data.filter((item) => item.available))
      } catch (err) {
        setError(err instanceof ApiError ? err.message : "No se pudo cargar el menu.")
        setItems([])
      } finally {
        setLoading(false)
      }
    }

    void loadMenu()
  }, [])

  const grouped = useMemo(() => {
    return {
      entradas: items.filter((item) => item.category === "Entradas"),
      fuertes: items.filter((item) => item.category === "Platos Fuertes"),
      postres: items.filter((item) => item.category === "Postres"),
    }
  }, [items])

  const featuredMain = grouped.fuertes[0]
  const otherMains = grouped.fuertes.slice(1)

  return (
    <section id="menu" className="bg-background">
      <div className="py-16 text-center">
        <h2 className="font-serif text-4xl font-normal text-foreground md:text-5xl">La Propuesta Gastronomica</h2>
        <p className="mx-auto mt-4 max-w-2xl px-6 leading-relaxed text-muted-foreground">
          El menu se publica directamente desde la operacion del restaurante. Lo que ves aqui es lo mismo que administra el equipo interno.
        </p>
      </div>

      {loading && <div className="mx-auto max-w-7xl px-6 pb-16 text-sm text-muted-foreground">Cargando menu...</div>}
      {error && <div className="mx-auto max-w-7xl rounded-xl border border-destructive/30 bg-destructive/5 px-6 py-4 text-sm text-destructive">{error}</div>}

      {!loading && !error && (
        <>
          <div className="mx-auto max-w-7xl px-6 pb-20">
            <div className="mb-12 text-center">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">Apertura</p>
              <h3 className="font-serif text-3xl font-normal text-foreground">Entradas</h3>
            </div>

            <div className="grid gap-12 lg:grid-cols-2">
              {grouped.entradas.map((item) => (
                <article key={item.id} className="group">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="mt-6">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-serif text-xl text-foreground">{item.name}</h4>
                      <span className="font-serif text-xl text-foreground">{formatDopCurrency(item.price)}</span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>

          <div className="bg-[#f8f6f3]">
            <div className="mx-auto max-w-7xl px-6 py-20">
              <div className="mb-12 text-center">
                <p className="mb-2 text-xs font-medium uppercase tracking-[0.3em] text-muted-foreground">El Corazon</p>
                <h3 className="font-serif text-3xl font-normal text-foreground">Platos Fuertes</h3>
              </div>

              {featuredMain && (
                <div className="mb-16 grid gap-8 lg:grid-cols-2">
                  <div className="relative aspect-[4/3] overflow-hidden lg:min-h-[500px]">
                    <Image src={featuredMain.image} alt={featuredMain.name} fill className="object-cover" />
                  </div>
                  <div className="flex flex-col justify-center bg-white p-8 lg:p-12">
                    <div className="mb-6 inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-primary">
                      <span className="h-px w-8 bg-primary" />
                      Seleccion destacada
                    </div>
                    <h4 className="mb-4 font-serif text-3xl text-foreground">{featuredMain.name}</h4>
                    <p className="mb-8 text-sm leading-relaxed text-muted-foreground">{featuredMain.description}</p>
                    <div className="mb-6 flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Preparado por cocina al momento
                    </div>
                    <div className="font-serif text-3xl text-foreground">{formatDopCurrency(featuredMain.price)}</div>
                  </div>
                </div>
              )}

              <div className="grid gap-8 sm:grid-cols-3">
                {otherMains.map((item) => (
                  <article key={item.id} className="group">
                    <div className="relative aspect-square overflow-hidden">
                      <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
                    </div>
                    <div className="mt-4">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-serif text-lg text-foreground">{item.name}</h4>
                        <span className="font-serif text-lg text-foreground">{formatDopCurrency(item.price)}</span>
                      </div>
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-6 py-20">
            <h3 className="mb-8 font-serif text-2xl text-foreground">Final Dulce</h3>
            <div className="grid gap-6 md:grid-cols-2">
              {grouped.postres.map((item) => (
                <article key={item.id} className="flex items-start gap-4 rounded-2xl border bg-card p-4">
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full">
                    <Image src={item.image} alt={item.name} fill className="object-cover" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-base text-foreground">{item.name}</h4>
                      <span className="font-serif text-base text-foreground">{formatDopCurrency(item.price)}</span>
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
