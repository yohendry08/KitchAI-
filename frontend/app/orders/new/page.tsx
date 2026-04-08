"use client";

import React, { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ApiError, api, getCreateOrderErrors } from "@/lib/api";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDopCurrency } from "@/lib/utils";

const ORDER_TYPES = [
  { value: "salon", label: "Salón" },
  { value: "takeaway", label: "Para Llevar" },
  { value: "delivery", label: "Delivery" },
] as const;

type OrderType = (typeof ORDER_TYPES)[number]["value"];

interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

interface TableOption {
  id: string;
  name: string;
  status: string;
  activeOrders: number;
}

interface OrderDraft {
  orderType: OrderType;
  selectedTable: string | null;
  customer: {
    name: string;
    phone: string;
    address: string;
  };
  category: string;
  orderItems: OrderItem[];
  orderNote: string;
  productQty: Record<string, number>;
  productNote: Record<string, string>;
}

type OrderItem = MenuItem & { qty: number; note: string };

const BORRADOR_KEY = "kitchai-order-drafts";

export default function NewOrderPage() {
  const [orderType, setOrderType] = useState<OrderType>("salon");
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [customer, setCustomer] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [category, setCategory] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableOption[]>([]);
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [productQty, setProductQty] = useState<Record<string, number>>({});
  const [productNote, setProductNote] = useState<Record<string, string>>({});
  const [orderNote, setOrderNote] = useState("");
  const [sending, setSending] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showDraft, setShowDraft] = useState(false);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitErrors, setSubmitErrors] = useState<string[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const refreshData = async () => {
    setLoadError(null);
    const [options, items] = await Promise.all([api.getOrderOptions(), api.getMenuItems("", "Todos")]);
    setTables(options.tables || []);
    setCategories(options.categories || []);
    setCategory((current) => current || options.categories?.[0] || "");
    setMenuItems(items || []);
  };

  useEffect(() => {
    refreshData().catch((error: unknown) => {
      setLoadError(error instanceof ApiError ? error.message : "No se pudieron cargar menu y mesas desde backend.");
      setTables([]);
      setCategories([]);
      setMenuItems([]);
    });
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "f") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = !category || item.category === category;
    const matchesSearch =
      !search.trim() || item.name.toLowerCase().includes(search.trim().toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const searchResults =
    search.trim().length > 0
      ? menuItems.filter((item) =>
          item.name.toLowerCase().includes(search.trim().toLowerCase())
        )
      : [];

  const subtotal = orderItems.reduce((sum, item) => sum + item.price * item.qty, 0);
  const total = subtotal;

  const currentTableName = tables.find((table) => table.id === selectedTable)?.name || "";

  const getDraftId = () => {
    if (orderType === "salon" && selectedTable) return `salon-${selectedTable}`;
    if (orderType === "takeaway" && customer.phone.trim()) return `takeaway-${customer.phone.trim()}`;
    if (orderType === "delivery" && customer.phone.trim()) return `delivery-${customer.phone.trim()}`;
    return null;
  };

  useEffect(() => {
    const nextDraftId = getDraftId();
    if (!nextDraftId) return;

    const drafts = JSON.parse(localStorage.getItem(BORRADOR_KEY) || "{}") as Record<string, OrderDraft>;
    drafts[nextDraftId] = {
      orderType,
      selectedTable,
      customer,
      category,
      orderItems,
      orderNote,
      productQty,
      productNote,
    };
    localStorage.setItem(BORRADOR_KEY, JSON.stringify(drafts));
    setDraftId(nextDraftId);
  }, [orderType, selectedTable, customer, category, orderItems, orderNote, productQty, productNote]);

  useEffect(() => {
    const drafts = JSON.parse(localStorage.getItem(BORRADOR_KEY) || "{}") as Record<string, OrderDraft>;
    const ids = Object.keys(drafts);
    if (ids.length > 0) {
      setDraftId(ids[0]);
      setShowDraft(true);
    }
  }, []);

  const continueDraft = () => {
    const drafts = JSON.parse(localStorage.getItem(BORRADOR_KEY) || "{}") as Record<string, OrderDraft>;
    if (!draftId || !drafts[draftId]) return;
    const draft = drafts[draftId];
    setOrderType(draft.orderType);
    setSelectedTable(draft.selectedTable);
    setCustomer(draft.customer);
    setCategory(draft.category);
    setOrderItems(draft.orderItems);
    setOrderNote(draft.orderNote);
    setProductQty(draft.productQty);
    setProductNote(draft.productNote);
    setShowDraft(false);
  };

  const deleteDraft = () => {
    const drafts = JSON.parse(localStorage.getItem(BORRADOR_KEY) || "{}") as Record<string, OrderDraft>;
    if (draftId) delete drafts[draftId];
    localStorage.setItem(BORRADOR_KEY, JSON.stringify(drafts));
    setShowDraft(false);
  };

  const resetOrder = () => {
    const activeDraftId = getDraftId();
    if (activeDraftId) {
      const drafts = JSON.parse(localStorage.getItem(BORRADOR_KEY) || "{}") as Record<string, OrderDraft>;
      delete drafts[activeDraftId];
      localStorage.setItem(BORRADOR_KEY, JSON.stringify(drafts));
    }

    setOrderItems([]);
    setOrderNote("");
    setCustomer({ name: "", phone: "", address: "" });
    setSelectedTable(null);
    setProductQty({});
    setProductNote({});
    setSubmitErrors([]);
  };

  const addToOrder = (item: MenuItem, qty: number, note: string) => {
    setOrderItems((prev) => {
      const existingIndex = prev.findIndex((current) => current.id === item.id && current.note === note);
      if (existingIndex >= 0) {
        return prev.map((current, index) =>
          index === existingIndex ? { ...current, qty: current.qty + qty } : current
        );
      }

      return [...prev, { ...item, qty, note }];
    });

    setProductQty((prev) => ({ ...prev, [item.id]: 1 }));
    setProductNote((prev) => ({ ...prev, [item.id]: "" }));
  };

  const changeQty = (id: string, note: string, delta: number) => {
    setOrderItems((prev) =>
      prev
        .map((item) =>
          item.id === id && item.note === note
            ? { ...item, qty: Math.max(1, item.qty + delta) }
            : item
        )
        .filter((item) => item.qty > 0)
    );
  };

  const removeItem = (id: string, note: string) => {
    setOrderItems((prev) => prev.filter((item) => !(item.id === id && item.note === note)));
  };

  const validateOrder = () => {
    if (orderItems.length === 0) return "Debe agregar al menos un producto.";
    if (orderType === "salon" && !selectedTable) return "Debe seleccionar una mesa.";
    if (orderType === "takeaway" && (!customer.name.trim() || !customer.phone.trim())) {
      return "Nombre y teléfono requeridos.";
    }
    if (
      orderType === "delivery" &&
      (!customer.name.trim() || !customer.phone.trim() || !customer.address.trim())
    ) {
      return "Nombre, teléfono y dirección requeridos.";
    }
    return null;
  };

  const sendOrder = async () => {
    const validationError = validateOrder();
    if (validationError) {
      setSubmitErrors([validationError]);
      toast({ title: "Error", description: validationError, variant: "destructive" });
      return;
    }

    const tableLabel =
      orderType === "salon"
        ? currentTableName
        : orderType === "takeaway"
          ? "Para Llevar"
          : "Delivery";

    setSending(true);
    setSubmitErrors([]);
    try {
      const createdOrder = await api.createOrder({
        table: tableLabel,
        type: orderType,
        note: orderNote,
        customerName: customer.name || undefined,
        customerPhone: customer.phone || undefined,
        customerAddress: customer.address || undefined,
        items: orderItems.map((item) => ({
          menuItemId: item.id,
          name: item.name,
          quantity: item.qty,
          unitPrice: item.price,
        })),
      });

      setOrderId(createdOrder.id);
      setShowConfirm(false);
      toast({
        title: "Pedido enviado",
        description: `Pedido ${createdOrder.id} enviado exitosamente.`,
      });
      resetOrder();
      await refreshData();
    } catch (error) {
      let description = error instanceof Error ? error.message : "Error inesperado.";
      if (error instanceof ApiError) {
        const parsed = getCreateOrderErrors(error);
        const fieldMessages = Object.values(parsed.fieldErrors || {})
          .flat()
          .join(" ");
        const globalMessages = (parsed.globalErrors || []).join(" ");
        const deterministicErrors = [
          ...(parsed.globalErrors || []),
          ...Object.values(parsed.fieldErrors || {}).flat(),
        ];
        if (deterministicErrors.length > 0) {
          setSubmitErrors(deterministicErrors);
        }
        description = [description, fieldMessages, globalMessages].filter(Boolean).join(" ").trim();
      }
      toast({
        title: "No se pudo enviar el pedido",
        description,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6 p-4">
      {loadError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}

      {showDraft && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Tienes un pedido sin terminar</h2>
            <div className="mb-2 text-muted-foreground">¿Deseas continuar el borrador?</div>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={deleteDraft}>
                Eliminar
              </Button>
              <Button variant="default" onClick={continueDraft}>
                Continuar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex items-center gap-2">
        <Input
          ref={searchInputRef}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Buscar producto... (Ctrl+F)"
          className="w-full text-lg md:w-2/3"
        />
        {search.length > 0 && (
          <Button variant="outline" onClick={() => setSearch("")}>
            Limpiar
          </Button>
        )}
      </div>

      {search.length > 0 && searchResults.length > 0 && (
        <div className="mb-4">
          <div className="rounded-lg bg-muted p-2 shadow">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {searchResults.map((item) => (
                <Card key={item.id} className="flex items-center gap-4 p-3">
                  <img
                    src={item.image || "/placeholder.svg"}
                    alt={item.name}
                    className="h-16 w-16 rounded-lg border object-cover"
                  />
                  <div className="flex-1">
                    <CardTitle className="text-base font-semibold">{item.name}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                  <Button disabled={!item.available} onClick={() => addToOrder(item, 1, "")}>
                    Agregar
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-center gap-4">
        {ORDER_TYPES.map((type) => (
          <Button
            key={type.value}
            variant={orderType === type.value ? "default" : "outline"}
            className="rounded-xl px-6 py-3 text-lg font-semibold shadow-sm"
            onClick={() => {
              setOrderType(type.value);
              setSelectedTable(null);
            }}
          >
            {type.label}
          </Button>
        ))}
      </div>

      <div>
        {orderType === "salon" && (
          <div>
            <h2 className="mb-2 text-xl font-bold">Selecciona una mesa</h2>
            {tables.length === 0 ? (
              <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                No hay mesas configuradas en el backend. Define `RESTAURANT_TABLES` en `.env`.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                {tables.map((table) => (
                  <Card
                    key={table.id}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center border-2 p-6 transition-all",
                      selectedTable === table.id && "border-primary ring-2 ring-primary",
                      table.status === "available" ? "bg-green-100" : "bg-amber-100"
                    )}
                    onClick={() => setSelectedTable(table.id)}
                  >
                    <span className="mb-1 text-lg font-semibold">{table.name}</span>
                    <span
                      className={cn(
                        "rounded-full px-2 py-1 text-xs font-medium",
                        table.status === "available" ? "bg-green-500 text-white" : "bg-red-500 text-white"
                      )}
                    >
                      {table.status === "available" ? "Disponible" : `${table.activeOrders} pedidos activos`}
                    </span>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {orderType === "takeaway" && (
          <div className="mx-auto grid max-w-lg grid-cols-1 gap-4 md:grid-cols-2">
            <Input
              placeholder="Nombre del cliente"
              value={customer.name}
              onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="Teléfono"
              value={customer.phone}
              onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
              type="tel"
            />
          </div>
        )}

        {orderType === "delivery" && (
          <div className="mx-auto grid max-w-2xl grid-cols-1 gap-4 md:grid-cols-3">
            <Input
              placeholder="Nombre del cliente"
              value={customer.name}
              onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))}
            />
            <Input
              placeholder="Teléfono"
              value={customer.phone}
              onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))}
              type="tel"
            />
            <Input
              placeholder="Dirección completa"
              value={customer.address}
              onChange={(event) => setCustomer((current) => ({ ...current, address: event.target.value }))}
            />
          </div>
        )}
      </div>

      <div className="mt-8 flex flex-col gap-6 md:flex-row">
        <div className="w-full md:w-3/5">
          <Tabs value={category} onValueChange={setCategory}>
            <TabsList className="mb-4 flex w-full gap-2">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat} className="flex-1 py-3 text-base md:text-lg">
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>

            {categories.map((cat) => (
              <TabsContent key={cat} value={cat}>
                <ScrollArea className="h-[420px] pr-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {filteredItems
                      .filter((item) => item.category === cat)
                      .map((item) => {
                        const qty = productQty[item.id] || 1;
                        const note = productNote[item.id] || "";

                        return (
                          <Card key={item.id} className="flex flex-col gap-2 p-4">
                            <div className="flex items-center gap-4">
                              <img
                                src={item.image || "/placeholder.svg"}
                                alt={item.name}
                                className="h-24 w-24 rounded-lg border object-cover"
                                loading="lazy"
                              />
                              <div className="flex flex-1 flex-col gap-1">
                                <CardTitle className="text-lg font-semibold">{item.name}</CardTitle>
                                <CardDescription>{item.description}</CardDescription>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-lg font-bold text-primary">
                                    {formatDopCurrency(item.price * qty)}
                                  </span>
                                  {!item.available && <Badge variant="destructive">Sin stock</Badge>}
                                </div>
                              </div>
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setProductQty((current) => ({
                                    ...current,
                                    [item.id]: Math.max(1, (current[item.id] || 1) - 1),
                                  }))
                                }
                              >
                                -
                              </Button>
                              <span className="w-8 text-center">{qty}</span>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  setProductQty((current) => ({
                                    ...current,
                                    [item.id]: (current[item.id] || 1) + 1,
                                  }))
                                }
                              >
                                +
                              </Button>
                              <Input
                                className="ml-2 flex-1"
                                placeholder="Notas especiales"
                                value={note}
                                onChange={(event) =>
                                  setProductNote((current) => ({
                                    ...current,
                                    [item.id]: event.target.value,
                                  }))
                                }
                              />
                              <Button
                                disabled={!item.available}
                                className="ml-2"
                                onClick={() => addToOrder(item, qty, note)}
                              >
                                Agregar
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        <div className="w-full md:w-2/5">
          <Card className="sticky top-4">
            <CardContent>
              <CardTitle className="mb-2 text-xl">Resumen del Pedido</CardTitle>
              {submitErrors.length > 0 && (
                <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <ul className="list-disc pl-5">
                    {submitErrors.map((message, index) => (
                      <li key={`${message}-${index}`}>{message}</li>
                    ))}
                  </ul>
                </div>
              )}
              {orderItems.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  Agrega productos para ver el resumen
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="divide-y">
                    {orderItems.map((item) => (
                      <div key={`${item.id}-${item.note}`} className="flex items-center gap-2 py-2">
                        <div className="flex-1">
                          <span className="font-medium">{item.name}</span>
                          {item.note && (
                            <p className="text-xs text-muted-foreground">{item.note}</p>
                          )}
                        </div>
                        <span className="w-16 text-right">{formatDopCurrency(item.price)}</span>
                        <div className="flex items-center gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeQty(item.id, item.note, -1)}
                          >
                            -
                          </Button>
                          <span className="w-6 text-center">{item.qty}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => changeQty(item.id, item.note, 1)}
                          >
                            +
                          </Button>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => removeItem(item.id, item.note)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-2 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Notas especiales:</span>
                      <Input
                        className="flex-1"
                        placeholder="Notas para el pedido completo"
                        value={orderNote}
                        onChange={(event) => setOrderNote(event.target.value)}
                      />
                    </div>
                    <div className="mt-2 flex flex-col gap-1 text-sm">
                      <div className="flex justify-between">
                        <span>Total</span>
                        <span className="font-bold text-primary">{formatDopCurrency(total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="destructive" onClick={resetOrder}>
                      Cancelar Pedido
                    </Button>
                    <Button variant="secondary" onClick={() => toast({ title: "Borrador guardado" })}>
                      Guardar Borrador
                    </Button>
                    <Button variant="default" onClick={() => setShowConfirm(true)} disabled={sending}>
                      Enviar a Cocina
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">
              ¿Enviar pedido de{" "}
              {orderType === "salon" ? currentTableName : `Cliente ${customer.name || "sin nombre"}`}?
            </h2>
            <div className="mt-4 flex gap-2">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Cancelar
              </Button>
              <Button variant="default" onClick={sendOrder} disabled={sending}>
                Confirmar y Enviar
              </Button>
            </div>
          </div>
        </div>
      )}

      {orderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-xl font-bold">Pedido enviado correctamente</h2>
            <div className="mb-2 text-muted-foreground">ID de pedido: {orderId}</div>
            <div className="mt-4 flex gap-2">
              <Button variant="default" onClick={() => setOrderId(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
