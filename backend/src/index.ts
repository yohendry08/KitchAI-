import express from "express";
import cors from "cors";
import OpenAI from "openai";
import { getPersistenceStatus, initDb, readDb, writeDb } from "./db.js";
import { hash, verifyHash, id, inventoryStatus, nowIso } from "./utils.js";
import { requireAuth, requireRole } from "./auth.js";
import type { DbSchema, Employee, MenuIngredient, MovementType, Order, OrderType, ReservationStatus, Role, User } from "./types.js";

const app = express();

const PORT = Number(process.env.PORT || 4000);
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || process.env.APP_ORIGIN || "*";
const API_BASE_PATH = process.env.API_BASE_PATH || "/api";
const corsOrigin = FRONTEND_ORIGIN === "*" ? true : FRONTEND_ORIGIN;
const DEFAULT_EMPLOYEE_PASSWORD = process.env.DEFAULT_EMPLOYEE_PASSWORD || "123456";
const RESTAURANT_TABLES = String(process.env.RESTAURANT_TABLES || "")
  .split(",")
  .map((table) => table.trim())
  .filter(Boolean);
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";
const OPENAI_CHAT_TEMPERATURE = Number(process.env.OPENAI_CHAT_TEMPERATURE || "0.2");
const openai = OPENAI_API_KEY ? new OpenAI({ apiKey: OPENAI_API_KEY }) : null;
const isStaffRole = (role: Role) => role === "admin" || role === "employee";

const formatDateLabel = (value: string) => value.slice(0, 16).replace("T", " ");

const getUserFullName = (user: Pick<User, "firstName" | "lastName">) => `${user.firstName} ${user.lastName}`.trim();

const getRoleLabel = (role: Role) => {
  if (role === "admin") return "Administrador";
  if (role === "employee") return "Empleado";
  return "Cliente";
};

const sanitizeUser = (user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt
});

const pushActivity = (db: DbSchema, actor: string, action: string, detail: string) => {
  db.activity.unshift({ id: id(), user: actor, action, detail, time: formatDateLabel(nowIso()) });
  db.activity = db.activity.slice(0, 30);
};

const findEmployeeByUserId = (db: DbSchema, userId: string) => db.employees.find((employee) => employee.userId === userId);

const ensureEmployeeRecord = (db: DbSchema, userId: string, salary: number) => {
  const existing = findEmployeeByUserId(db, userId);
  if (existing) {
    existing.salary = salary;
    return existing;
  }

  const employee: Employee = { id: id(), userId, salary };
  db.employees.push(employee);
  return employee;
};

const normalizeMenuIngredients = (db: DbSchema, input: unknown) => {
  if (!Array.isArray(input)) {
    return { ingredients: [] as MenuIngredient[], errors: ["Debes indicar al menos un ingrediente."] };
  }

  const normalized: MenuIngredient[] = [];
  const errors: string[] = [];
  const seen = new Set<string>();

  for (const candidate of input) {
    const inventoryItemId = String((candidate as { inventoryItemId?: unknown })?.inventoryItemId || "").trim();
    const quantity = Number((candidate as { quantity?: unknown })?.quantity || 0);

    if (!inventoryItemId || !Number.isFinite(quantity) || quantity <= 0) {
      errors.push("Cada ingrediente debe tener un insumo valido y una cantidad mayor que cero.");
      continue;
    }

    if (seen.has(inventoryItemId)) {
      errors.push("No puedes repetir el mismo insumo dentro de la receta.");
      continue;
    }

    const inventoryItem = db.inventoryItems.find((item) => item.id === inventoryItemId);
    if (!inventoryItem) {
      errors.push("Uno de los ingredientes no existe en inventario.");
      continue;
    }

    seen.add(inventoryItemId);
    normalized.push({ inventoryItemId, quantity });
  }

  if (normalized.length === 0) {
    errors.push("Debes indicar al menos un ingrediente.");
  }

  return { ingredients: normalized, errors };
};

const applyOrderInventoryConsumption = (
  db: DbSchema,
  items: Order["items"],
  orderId: string,
  actorId?: string,
) => {
  const required = new Map<string, number>();

  for (const orderItem of items) {
    const menuItem = db.menuItems.find((candidate) => candidate.id === orderItem.menuItemId);
    if (!menuItem) {
      return { ok: false as const, message: `El plato ${orderItem.name} no existe en el menu.` };
    }

    if (!menuItem.ingredients || menuItem.ingredients.length === 0) {
      return { ok: false as const, message: `El plato ${menuItem.name} no tiene ingredientes configurados.` };
    }

    for (const ingredient of menuItem.ingredients) {
      required.set(
        ingredient.inventoryItemId,
        (required.get(ingredient.inventoryItemId) || 0) + ingredient.quantity * orderItem.quantity,
      );
    }
  }

  const shortages: string[] = [];

  for (const [inventoryItemId, quantityNeeded] of required.entries()) {
    const inventoryItem = db.inventoryItems.find((candidate) => candidate.id === inventoryItemId);
    if (!inventoryItem) {
      shortages.push(`Falta un insumo configurado en inventario para poder preparar el pedido.`);
      continue;
    }

    if (inventoryItem.quantity < quantityNeeded) {
      shortages.push(
        `${inventoryItem.name}: disponible ${inventoryItem.quantity} ${inventoryItem.unit}, requerido ${Number(
          quantityNeeded.toFixed(3),
        )} ${inventoryItem.unit}.`,
      );
    }
  }

  if (shortages.length > 0) {
    return { ok: false as const, message: `Stock insuficiente para preparar el pedido.\n${shortages.join("\n")}` };
  }

  for (const [inventoryItemId, quantityNeeded] of required.entries()) {
    const inventoryItem = db.inventoryItems.find((candidate) => candidate.id === inventoryItemId);
    if (!inventoryItem) continue;

    inventoryItem.quantity = Number((inventoryItem.quantity - quantityNeeded).toFixed(3));
    inventoryItem.status = inventoryStatus(inventoryItem.quantity, inventoryItem.minStock);
    inventoryItem.updatedAt = nowIso();

    db.inventoryMovements.unshift({
      id: id(),
      itemId: inventoryItem.id,
      type: "out",
      quantity: Number(quantityNeeded.toFixed(3)),
      unitCost: inventoryItem.cost,
      note: `Consumo por pedido ${orderId}`,
      createdAt: nowIso(),
      createdBy: actorId,
    });
  }

  return { ok: true as const };
};

const RESTAURANT_NAME = process.env.RESTAURANT_NAME || "KitchAI";
const RESTAURANT_ADDRESS = process.env.RESTAURANT_ADDRESS || "";
const RESTAURANT_OPEN_TIME = process.env.RESTAURANT_OPEN_TIME || "";
const RESTAURANT_CLOSE_TIME = process.env.RESTAURANT_CLOSE_TIME || "";

const normalizeText = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const includesAny = (value: string, terms: string[]) => terms.some((term) => value.includes(normalizeText(term)));

const getTodayIsoDate = () => nowIso().slice(0, 10);

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 2 }).format(value);

const buildInventoryItemBrief = (item: DbSchema["inventoryItems"][number]) => ({
  id: item.id,
  name: item.name,
  quantity: item.quantity,
  unit: item.unit,
  minStock: item.minStock,
  cost: item.cost,
  status: item.status
});

const buildOrderBrief = (order: Order) => ({
  id: order.id,
  table: order.table,
  type: order.type || "salon",
  status: order.status,
  total: order.total,
  customerName: order.customerName || null,
  customerPhone: order.customerPhone || null,
  customerAddress: order.customerAddress || null,
  note: order.note || null,
  items: order.items,
  createdAt: order.createdAt
});

const buildReservationBrief = (reservation: DbSchema["reservations"][number]) => ({
  id: reservation.id,
  date: reservation.date,
  hour: reservation.hour,
  guests: reservation.guests,
  name: reservation.name,
  email: reservation.email,
  phone: reservation.phone || null,
  status: reservation.status,
  createdAt: reservation.createdAt
});

const buildLowStockSummary = (db: DbSchema) =>
  db.inventoryItems
    .filter((item) => item.status !== "Normal")
    .sort((left, right) => left.quantity - right.quantity)
    .slice(0, 5)
    .map((item) => `${item.name} (${item.quantity}/${item.minStock} ${item.unit}, ${item.status})`);

const buildMenuHighlights = (db: DbSchema) =>
  db.menuItems
    .filter((item) => item.available)
    .slice(0, 5)
    .map((item) => `${item.name} - ${formatCurrency(item.price)}`);

const buildOrderStatusSummary = (orders: Order[]) => {
  const counts = orders.reduce(
    (accumulator, order) => {
      accumulator[order.status] += 1;
      return accumulator;
    },
    { Pendiente: 0, "En Proceso": 0, Entregado: 0 } as Record<Order["status"], number>
  );

  return [`Pendientes: ${counts.Pendiente}`, `En proceso: ${counts["En Proceso"]}`, `Entregados: ${counts.Entregado}`].join("\n");
};

const toEmployeePayload = (db: DbSchema, employee: Employee) => {
  const user = db.users.find((candidate) => candidate.id === employee.userId);
  if (!user) return null;
  return {
    id: employee.id,
    userId: employee.userId,
    salary: employee.salary,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt
  };
};

const toAccountPayload = (db: DbSchema, user: User) => ({
  id: user.id,
  firstName: user.firstName,
  lastName: user.lastName,
  email: user.email,
  phone: user.phone || null,
  role: user.role,
  active: user.active,
  createdAt: user.createdAt,
  salary: findEmployeeByUserId(db, user.id)?.salary ?? null
});

const revokeUserSessions = (db: DbSchema, userId: string) => {
  db.sessions = db.sessions.filter((session) => session.userId !== userId);
};

const removeEmployeeRecord = (db: DbSchema, userId: string) => {
  db.employees = db.employees.filter((employee) => employee.userId !== userId);
};

const parseToolArguments = (value: string) => {
  try {
    const parsed = JSON.parse(value) as Record<string, unknown>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const buildChatToolDefinitions = (role: Role) => {
  const tools = [
    { type: "function" as const, function: { name: "get_inventory_summary", description: "Resumen de inventario operativo.", parameters: { type: "object", properties: { limit: { type: "number" } }, additionalProperties: false } } },
    { type: "function" as const, function: { name: "search_inventory_items", description: "Buscar insumos del inventario.", parameters: { type: "object", properties: { q: { type: "string" }, status: { type: "string" }, limit: { type: "number" } }, additionalProperties: false } } },
    { type: "function" as const, function: { name: "create_inventory_movement", description: "Registrar un movimiento de inventario.", parameters: { type: "object", properties: { itemId: { type: "string" }, type: { type: "string" }, quantity: { type: "number" }, unitCost: { type: "number" }, note: { type: "string" } }, required: ["itemId", "type", "quantity"], additionalProperties: false } } },
    { type: "function" as const, function: { name: "get_orders_summary", description: "Resumen de pedidos.", parameters: { type: "object", properties: { q: { type: "string" }, status: { type: "string" }, limit: { type: "number" } }, additionalProperties: false } } },
    { type: "function" as const, function: { name: "search_orders", description: "Buscar pedidos.", parameters: { type: "object", properties: { q: { type: "string" }, status: { type: "string" }, limit: { type: "number" } }, additionalProperties: false } } },
    { type: "function" as const, function: { name: "get_order_details", description: "Ver detalle de un pedido.", parameters: { type: "object", properties: { orderId: { type: "string" } }, required: ["orderId"], additionalProperties: false } } },
    { type: "function" as const, function: { name: "create_order", description: "Crear un pedido operativo.", parameters: { type: "object", properties: { table: { type: "string" }, type: { type: "string" }, status: { type: "string" }, items: { type: "array" }, customerName: { type: "string" }, customerPhone: { type: "string" }, customerAddress: { type: "string" }, note: { type: "string" } }, required: ["table", "items"], additionalProperties: false } } },
    { type: "function" as const, function: { name: "update_order_status", description: "Actualizar el estado de un pedido.", parameters: { type: "object", properties: { orderId: { type: "string" }, status: { type: "string" } }, required: ["orderId", "status"], additionalProperties: false } } },
    { type: "function" as const, function: { name: "get_reservations_summary", description: "Resumen de reservaciones.", parameters: { type: "object", properties: { q: { type: "string" }, status: { type: "string" }, date: { type: "string" }, limit: { type: "number" } }, additionalProperties: false } } },
    { type: "function" as const, function: { name: "search_reservations", description: "Buscar reservaciones.", parameters: { type: "object", properties: { q: { type: "string" }, status: { type: "string" }, date: { type: "string" }, limit: { type: "number" } }, additionalProperties: false } } },
    { type: "function" as const, function: { name: "get_reservation_details", description: "Ver detalle de una reservacion.", parameters: { type: "object", properties: { reservationId: { type: "string" } }, required: ["reservationId"], additionalProperties: false } } },
    { type: "function" as const, function: { name: "create_reservation", description: "Crear una reservacion.", parameters: { type: "object", properties: { date: { type: "string" }, hour: { type: "string" }, guests: { type: "number" }, name: { type: "string" }, email: { type: "string" }, phone: { type: "string" } }, required: ["date", "hour", "guests"], additionalProperties: false } } },
    { type: "function" as const, function: { name: "update_reservation_status", description: "Actualizar una reservacion.", parameters: { type: "object", properties: { reservationId: { type: "string" }, status: { type: "string" } }, required: ["reservationId", "status"], additionalProperties: false } } }
  ];

  if (role === "client") {
    return tools.filter((tool) => !["get_inventory_summary", "search_inventory_items", "create_inventory_movement", "create_order", "update_order_status", "update_reservation_status"].includes(tool.function.name));
  }

  if (role === "employee") {
    return tools.filter((tool) => tool.function.name !== "create_inventory_movement");
  }

  return tools;
};
const runChatTool = async (name: string, args: Record<string, unknown>, db: DbSchema, user: User) => {
  const limit = Math.min(Math.max(Number(args.limit || 5), 1), 10);
  const query = normalizeText(String(args.q || ""));
  const status = String(args.status || "Todos");

  if (name === "get_inventory_summary") {
    if (!isStaffRole(user.role)) return { ok: false, error: "No tienes permiso para consultar inventario operativo." };
    const lowStockItems = db.inventoryItems.filter((item) => item.status !== "Normal");
    return { ok: true, data: { totalItems: db.inventoryItems.length, lowStockCount: lowStockItems.length, normalCount: db.inventoryItems.filter((item) => item.status === "Normal").length, lowStockItems: lowStockItems.slice(0, 5).map(buildInventoryItemBrief), totalValue: db.inventoryItems.reduce((accumulator, item) => accumulator + item.quantity * item.cost, 0) } };
  }

  if (name === "search_inventory_items") {
    if (!isStaffRole(user.role)) return { ok: false, error: "No tienes permiso para consultar inventario operativo." };
    const items = db.inventoryItems.filter((item) => {
      const matchesQuery = !query || normalizeText(item.name).includes(query);
      const matchesStatus = status === "Todos" || !status || item.status === status;
      return matchesQuery && matchesStatus;
    });
    return { ok: true, data: { count: items.length, items: items.slice(0, limit).map(buildInventoryItemBrief) } };
  }

  if (name === "create_inventory_movement") {
    if (!isStaffRole(user.role)) return { ok: false, error: "No tienes permiso para registrar movimientos de inventario." };
    const itemId = String(args.itemId || "").trim();
    const movementType = String(args.type || "").trim() as MovementType;
    const quantity = Number(args.quantity || 0);
    const unitCost = args.unitCost !== undefined ? Number(args.unitCost) : undefined;
    const note = String(args.note || "").trim() || undefined;
    if (!itemId || !["in", "out", "adjustment"].includes(movementType) || !Number.isFinite(quantity) || quantity <= 0) return { ok: false, error: "Datos invalidos para el movimiento de inventario." };
    const item = db.inventoryItems.find((candidate) => candidate.id === itemId);
    if (!item) return { ok: false, error: "Item no encontrado." };
    if (movementType === "out" && item.quantity - quantity < 0) return { ok: false, error: "Stock insuficiente para registrar la salida." };
    if (movementType === "in") item.quantity += quantity;
    if (movementType === "out") item.quantity -= quantity;
    if (movementType === "adjustment") item.quantity = quantity;
    item.status = inventoryStatus(item.quantity, item.minStock);
    item.updatedAt = nowIso();
    db.inventoryMovements.unshift({ id: id(), itemId: item.id, type: movementType, quantity, unitCost, note, createdAt: nowIso(), createdBy: user.id });
    pushActivity(db, getUserFullName(user), "movio", `${item.name} (${movementType})`);
    await writeDb(db);
    return { ok: true, data: buildInventoryItemBrief(item) };
  }

  if (name === "get_orders_summary" || name === "search_orders") {
    const orders = user.role === "client" ? db.orders.filter((order) => order.customerPhone === user.phone || order.customerPhone === user.email) : db.orders;
    const filtered = orders.filter((order) => {
      const matchesQuery = !query || normalizeText(order.id).includes(query) || normalizeText(order.table).includes(query) || normalizeText(order.customerName || "").includes(query) || normalizeText(order.status).includes(query);
      const matchesStatus = status === "Todos" || !status || order.status === status;
      return name === "get_orders_summary" ? matchesStatus : matchesQuery && matchesStatus;
    });
    const totalSales = filtered.reduce((accumulator, order) => accumulator + order.total, 0);
    return { ok: true, data: { count: filtered.length, activeCount: filtered.filter((order) => order.status !== "Entregado").length, pendingCount: filtered.filter((order) => order.status === "Pendiente").length, inProgressCount: filtered.filter((order) => order.status === "En Proceso").length, deliveredCount: filtered.filter((order) => order.status === "Entregado").length, totalSales, averageTicket: filtered.length ? totalSales / filtered.length : 0, recentOrders: filtered.slice(0, limit).map(buildOrderBrief) } };
  }

  if (name === "get_order_details") {
    const orderId = String(args.orderId || "").trim();
    const order = db.orders.find((candidate) => candidate.id === orderId);
    if (!order) return { ok: false, error: "Pedido no encontrado." };
    if (user.role === "client" && order.customerPhone !== user.phone && order.customerPhone !== user.email) return { ok: false, error: "No tienes permiso para ver ese pedido." };
    return { ok: true, data: buildOrderBrief(order) };
  }

  if (name === "create_order") {
    if (!isStaffRole(user.role)) return { ok: false, error: "No tienes permiso para crear pedidos operativos." };
    const table = String(args.table || "").trim();
    const type = String(args.type || "salon") as OrderType;
    const statusValue = String(args.status || "Pendiente") as Order["status"];
    const items = Array.isArray(args.items) ? (args.items as Array<{ menuItemId?: unknown; name?: unknown; quantity?: unknown; unitPrice?: unknown }>) : [];
    if (!table || !["salon", "takeaway", "delivery"].includes(type) || !["Pendiente", "En Proceso", "Entregado"].includes(statusValue)) return { ok: false, error: "Datos invalidos para el pedido." };
    if (type === "salon" && RESTAURANT_TABLES.length > 0 && !RESTAURANT_TABLES.includes(table)) return { ok: false, error: "La mesa no existe en la configuracion del restaurante." };
    const normalizedItems = items.map((item) => ({ menuItemId: String(item.menuItemId || "").trim(), name: String(item.name || "").trim(), quantity: Number(item.quantity || 0), unitPrice: Number(item.unitPrice || 0) })).filter((item) => item.menuItemId && item.name && item.quantity > 0 && item.unitPrice >= 0);
    if (normalizedItems.length === 0) return { ok: false, error: "Debes incluir al menos un producto valido." };
    if (normalizedItems.some((item) => !db.menuItems.some((menuItem) => menuItem.id === item.menuItemId))) return { ok: false, error: "Hay productos del pedido que no existen en el menu." };
    const itemsWithoutIngredients = normalizedItems
      .map((item) => db.menuItems.find((menuItem) => menuItem.id === item.menuItemId))
      .filter((menuItem) => menuItem && (!menuItem.ingredients || menuItem.ingredients.length === 0))
      .map((menuItem) => menuItem!.name);
    if (itemsWithoutIngredients.length > 0) {
      return { ok: false, error: `Hay platos sin ingredientes configurados: ${itemsWithoutIngredients.join(", ")}.` };
    }
    const customerName = String(args.customerName || "").trim() || undefined;
    const customerPhone = String(args.customerPhone || "").trim() || undefined;
    const customerAddress = String(args.customerAddress || "").trim() || undefined;
    const note = String(args.note || "").trim() || undefined;
    const total = normalizedItems.reduce((accumulator, item) => accumulator + item.quantity * item.unitPrice, 0);
    const order: Order = { id: `#${String(db.orders.length + 1).padStart(4, "0")}`, table, type, status: statusValue, total, createdAt: nowIso(), createdBy: user.id, customerName, customerPhone, customerAddress, note, items: normalizedItems };
    const inventoryConsumption = applyOrderInventoryConsumption(db, normalizedItems, order.id, user.id);
    if (!inventoryConsumption.ok) return { ok: false, error: inventoryConsumption.message };
    db.orders.unshift(order);
    pushActivity(db, getUserFullName(user), "creo", `pedido ${order.id}`);
    await writeDb(db);
    return { ok: true, data: buildOrderBrief(order) };
  }

  if (name === "update_order_status") {
    if (!isStaffRole(user.role)) return { ok: false, error: "No tienes permiso para actualizar pedidos." };
    const orderId = String(args.orderId || "").trim();
    const nextStatus = String(args.status || "").trim() as Order["status"];
    if (!orderId || !["Pendiente", "En Proceso", "Entregado"].includes(nextStatus)) return { ok: false, error: "Datos invalidos para actualizar el pedido." };
    const order = db.orders.find((candidate) => candidate.id === orderId);
    if (!order) return { ok: false, error: "Pedido no encontrado." };
    order.status = nextStatus;
    pushActivity(db, getUserFullName(user), "actualizo", `pedido ${order.id} a ${order.status}`);
    await writeDb(db);
    return { ok: true, data: buildOrderBrief(order) };
  }

  if (name === "get_reservations_summary") {
    const today = new Date().toISOString().slice(0, 10);
    const reservations = user.role === "client" ? db.reservations.filter((reservation) => reservation.email === user.email) : db.reservations;
    const filtered = reservations.filter((reservation) => {
      const matchesQuery = !query || normalizeText(reservation.id).includes(query) || normalizeText(reservation.name).includes(query) || normalizeText(reservation.email).includes(query) || normalizeText(reservation.status).includes(query);
      const matchesStatus = status === "Todos" || !status || reservation.status === status;
      const matchesDate = !args.date || reservation.date === String(args.date);
      return matchesStatus && matchesDate;
    });
    return { ok: true, data: { count: filtered.length, todayCount: filtered.filter((reservation) => reservation.date === today).length, pendingCount: filtered.filter((reservation) => reservation.status === "Pendiente").length, confirmedCount: filtered.filter((reservation) => reservation.status === "Confirmada").length, canceledCount: filtered.filter((reservation) => reservation.status === "Cancelada").length, upcomingReservations: filtered.slice(0, limit).map(buildReservationBrief) } };
  }

  if (name === "search_reservations") {
    const reservations = user.role === "client" ? db.reservations.filter((reservation) => reservation.email === user.email) : db.reservations;
    const filtered = reservations.filter((reservation) => {
      const matchesQuery = !query || normalizeText(reservation.id).includes(query) || normalizeText(reservation.name).includes(query) || normalizeText(reservation.email).includes(query) || normalizeText(reservation.status).includes(query);
      const matchesStatus = status === "Todos" || !status || reservation.status === status;
      const matchesDate = !args.date || reservation.date === String(args.date);
      return matchesQuery && matchesStatus && matchesDate;
    });
    return { ok: true, data: { count: filtered.length, todayCount: filtered.filter((reservation) => reservation.date === getTodayIsoDate()).length, pendingCount: filtered.filter((reservation) => reservation.status === "Pendiente").length, confirmedCount: filtered.filter((reservation) => reservation.status === "Confirmada").length, canceledCount: filtered.filter((reservation) => reservation.status === "Cancelada").length, upcomingReservations: filtered.slice(0, limit).map(buildReservationBrief) } };
  }

  if (name === "get_reservation_details") {
    const reservationId = String(args.reservationId || "").trim();
    const reservation = db.reservations.find((candidate) => candidate.id === reservationId);
    if (!reservation) return { ok: false, error: "Reservacion no encontrada." };
    if (user.role === "client" && reservation.email !== user.email) return { ok: false, error: "No tienes permiso para ver esa reservacion." };
    return { ok: true, data: buildReservationBrief(reservation) };
  }

  if (name === "create_reservation") {
    const date = String(args.date || "").trim();
    const hour = String(args.hour || "").trim();
    const guests = Number(args.guests || 0);
    const reservationName = user.role === "client" ? getUserFullName(user) : String(args.name || "").trim();
    const reservationEmail = user.role === "client" ? user.email : String(args.email || "").trim();
    const reservationPhone = String(args.phone || "").trim() || undefined;
    if (!date || !hour || !Number.isFinite(guests) || guests < 1 || !reservationName || !reservationEmail) return { ok: false, error: "Faltan datos validos para crear la reservacion." };
    const reservation: DbSchema["reservations"][number] = { id: `#${3000 + db.reservations.length + 1}`, date, hour, guests: Math.floor(guests), name: reservationName, email: reservationEmail, phone: reservationPhone, status: "Pendiente", createdAt: nowIso() };
    db.reservations.unshift(reservation);
    pushActivity(db, getUserFullName(user), "creo", `reservacion ${reservation.id}`);
    await writeDb(db);
    return { ok: true, data: buildReservationBrief(reservation) };
  }

  if (name === "update_reservation_status") {
    if (!isStaffRole(user.role)) return { ok: false, error: "No tienes permiso para actualizar reservaciones." };
    const reservationId = String(args.reservationId || "").trim();
    const nextStatus = String(args.status || "").trim() as ReservationStatus;
    if (!reservationId || !["Pendiente", "Confirmada", "Cancelada"].includes(nextStatus)) return { ok: false, error: "Datos invalidos para actualizar la reservacion." };
    const reservation = db.reservations.find((candidate) => candidate.id === reservationId);
    if (!reservation) return { ok: false, error: "Reservacion no encontrada." };
    reservation.status = nextStatus;
    pushActivity(db, getUserFullName(user), "actualizo", `reservacion ${reservation.id} a ${reservation.status}`);
    await writeDb(db);
    return { ok: true, data: buildReservationBrief(reservation) };
  }

  return { ok: false, error: `Herramienta no reconocida: ${name}` };
};


const buildRestaurantChatContext = (db: DbSchema, user: User) => {
  const today = getTodayIsoDate();
  const lowStockItems = db.inventoryItems.filter((item) => item.status !== "Normal");
  const activeOrders = db.orders.filter((order) => order.status !== "Entregado");
  const reservationsToday = db.reservations.filter((reservation) => reservation.date === today);
  const pendingReservations = db.reservations.filter((reservation) => reservation.status === "Pendiente");
  const sales = db.orders.reduce((accumulator, order) => accumulator + order.total, 0);
  const averageTicket = db.orders.length ? sales / db.orders.length : 0;
  const availableMenuItems = db.menuItems.filter((item) => item.available);
  const lowStockHighlights = buildLowStockSummary(db);
  const menuHighlights = buildMenuHighlights(db);
  const staffCount = db.employees.length;
  const inventoryValue = db.inventoryItems.reduce((accumulator, item) => accumulator + item.quantity * item.cost, 0);
  const recentOrderLabels = activeOrders.slice(0, 3).map((order) => `${order.id} (${order.table}, ${order.status})`);

  return [
    `restaurant_name: ${RESTAURANT_NAME}`,
    `today: ${today}`,
    `user_role: ${getRoleLabel(user.role)}`,
    `user_name: ${getUserFullName(user)}`,
    `menu_active_count: ${availableMenuItems.length}`,
    `menu_highlights: ${menuHighlights.length > 0 ? menuHighlights.join(" | ") : "none"}`,
    `low_stock_count: ${lowStockItems.length}`,
    `low_stock_highlights: ${lowStockHighlights.length > 0 ? lowStockHighlights.join(" | ") : "none"}`,
    `active_orders_count: ${activeOrders.length}`,
    `active_orders_highlights: ${recentOrderLabels.length > 0 ? recentOrderLabels.join(" | ") : "none"}`,
    `reservations_today: ${reservationsToday.length}`,
    `pending_reservations: ${pendingReservations.length}`,
    `staff_count: ${staffCount}`,
    `inventory_value_dop: ${inventoryValue.toFixed(2)}`,
    `sales_dop: ${sales.toFixed(2)}`,
    `average_ticket_dop: ${averageTicket.toFixed(2)}`,
    `restaurant_address: ${RESTAURANT_ADDRESS || "not configured"}`,
    `restaurant_hours: ${RESTAURANT_OPEN_TIME && RESTAURANT_CLOSE_TIME ? `${RESTAURANT_OPEN_TIME}-${RESTAURANT_CLOSE_TIME}` : "not configured"}`
  ].join("\n");
};

const buildRestaurantChatAnswerFallback = (db: DbSchema, user: User, question: string) => {
  const normalizedQuestion = normalizeText(question);
  const today = getTodayIsoDate();
  const role = user.role;
  const lowStockItems = db.inventoryItems.filter((item) => item.status !== "Normal");
  const activeOrders = db.orders.filter((order) => order.status !== "Entregado");
  const reservationsToday = db.reservations.filter((reservation) => reservation.date === today);
  const pendingReservations = db.reservations.filter((reservation) => reservation.status === "Pendiente");
  const sales = db.orders.reduce((accumulator, order) => accumulator + order.total, 0);
  const averageTicket = db.orders.length ? sales / db.orders.length : 0;
  const availableMenuItems = db.menuItems.filter((item) => item.available);
  const lowStockHighlights = buildLowStockSummary(db);
  const menuHighlights = buildMenuHighlights(db);
  const staffCount = db.employees.length;
  const inventoryValue = db.inventoryItems.reduce((accumulator, item) => accumulator + item.quantity * item.cost, 0);
  const recentOrderLabels = activeOrders.slice(0, 3).map((order) => `${order.id} (${order.table}, ${order.status})`);

  if (role === "client") {
    if (includesAny(normalizedQuestion, ["menu", "menu del dia", "carta", "plato", "recomend", "chef"])) {
      const menuText = menuHighlights.length > 0 ? menuHighlights.join("\n- ") : "No hay platos disponibles en este momento.";
      return [
        `${RESTAURANT_NAME} tiene ${availableMenuItems.length} platos activos en carta.`,
        "Recomendaciones visibles:",
        `- ${menuText}`,
        "Si quieres, también puedo orientarte por precio, categoría o disponibilidad."
      ].join("\n");
    }

    if (includesAny(normalizedQuestion, ["reserv", "mesa", "reserva"])) {
      return [
        "Puedo ayudarte a preparar una reservación. Necesito: nombre, fecha, hora, número de personas y cualquier preferencia especial.",
        `Ahora mismo hay ${pendingReservations.length} reservaciones pendientes de confirmación.`
      ].join("\n");
    }

    if (includesAny(normalizedQuestion, ["pedido", "orden", "estado", "seguimiento"])) {
      return [
        `Tienes ${db.orders.filter((order) => order.customerPhone === user.phone || order.customerPhone === user.email).length} pedidos vinculados a tu cuenta.`,
        `Pedidos activos generales en el sistema: ${activeOrders.length}.`,
        activeOrders.length > 0 ? `Referencia rápida: ${recentOrderLabels.join(", ")}.` : "No hay pedidos activos ahora mismo."
      ].join("\n");
    }

    if (includesAny(normalizedQuestion, ["ubic", "direccion", "horario", "telefono", "contacto"])) {
      const schedule = RESTAURANT_OPEN_TIME && RESTAURANT_CLOSE_TIME ? `Horario: ${RESTAURANT_OPEN_TIME} - ${RESTAURANT_CLOSE_TIME}.` : "Horario: configuración pendiente.";
      const address = RESTAURANT_ADDRESS ? `Dirección: ${RESTAURANT_ADDRESS}.` : "Dirección: configuración pendiente.";
      return [address, schedule, "Si lo prefieres, también puedo ayudarte a reservar una mesa."].join("\n");
    }

    return [
      `Soy ${RESTAURANT_NAME}, tu asistente de atención.`,
      "Puedo ayudarte con menú, reservaciones, pedidos o información general.",
      `Ahora mismo tenemos ${availableMenuItems.length} platos activos y ${reservationsToday.length} reservaciones para hoy.`
    ].join("\n");
  }

  if (role === "employee") {
    if (includesAny(normalizedQuestion, ["inventario", "stock", "ingrediente", "insumo", "producto"])) {
      const lowStockText = lowStockHighlights.length > 0 ? lowStockHighlights.join("\n- ") : "No hay alertas de inventario.";
      return [
        `Hay ${lowStockItems.length} productos con stock bajo o crítico.`,
        `- ${lowStockText}`,
        "Si quieres, puedo resumirte las prioridades de reabasto por urgencia."
      ].join("\n");
    }

    if (includesAny(normalizedQuestion, ["pedido", "pedidos", "turno", "cocina", "servicio"])) {
      return [
        `Pedidos activos: ${activeOrders.length}.`,
        buildOrderStatusSummary(db.orders),
        activeOrders.length > 0 ? `Primeros pedidos activos: ${recentOrderLabels.join(", ")}.` : "No hay pedidos activos en este momento."
      ].join("\n");
    }

    if (includesAny(normalizedQuestion, ["reserva", "reservacion", "reservaciones", "hoy"])) {
      return [
        `Reservaciones de hoy: ${reservationsToday.length}.`,
        `Pendientes de confirmación: ${pendingReservations.length}.`,
        "Puedo ayudarte a revisar el flujo de llegada, confirmación o cambios de mesa."
      ].join("\n");
    }

    return [
      "Como apoyo operativo, puedo revisar inventario, pedidos, reservas y procedimientos del turno.",
      `Inventario bajo: ${lowStockItems.length}. Pedidos activos: ${activeOrders.length}. Reservaciones de hoy: ${reservationsToday.length}.`
    ].join("\n");
  }

  if (includesAny(normalizedQuestion, ["kpi", "ventas", "ingreso", "reporte", "resumen", "rendimiento"])) {
    return [
      `Ventas acumuladas: ${formatCurrency(sales)}.`,
      `Ticket promedio: ${formatCurrency(averageTicket)}.`,
      `Pedidos activos: ${activeOrders.length}.`,
      `Alertas de inventario: ${lowStockItems.length}.`,
      `Reservaciones de hoy: ${reservationsToday.length}.`,
      `Valor estimado de inventario: ${formatCurrency(inventoryValue)}.`
    ].join("\n");
  }

  if (includesAny(normalizedQuestion, ["inventario", "stock", "insumo", "ingrediente"])) {
    const lowStockText = lowStockHighlights.length > 0 ? lowStockHighlights.join("\n- ") : "No hay alertas de inventario.";
    return [
      `Hay ${lowStockItems.length} items con stock bajo o crítico.`,
      `- ${lowStockText}`,
      `Valor total estimado del inventario: ${formatCurrency(inventoryValue)}.`
    ].join("\n");
  }

  if (includesAny(normalizedQuestion, ["empleado", "personal", "equipo", "nomina", "salario"])) {
    return [
      `Registros de empleados: ${staffCount}.`,
      `Usuarios activos de staff: ${db.users.filter((candidate) => isStaffRole(candidate.role) && candidate.active).length}.`,
      "Puedo ayudarte a revisar altas, bajas, carga de turno o desempeño general."
    ].join("\n");
  }

  if (includesAny(normalizedQuestion, ["pedido", "pedidos", "orden", "estado"])) {
    return [
      `Pedidos activos: ${activeOrders.length}.`,
      buildOrderStatusSummary(db.orders),
      activeOrders.length > 0 ? `Pedidos visibles: ${recentOrderLabels.join(", ")}.` : "No hay pedidos activos en el sistema."
    ].join("\n");
  }

  if (includesAny(normalizedQuestion, ["reserva", "reservacion", "reservaciones", "agenda"])) {
    return [
      `Reservaciones de hoy: ${reservationsToday.length}.`,
      `Pendientes: ${pendingReservations.length}.`,
      "Puedo ayudarte a revisar ocupación, confirmaciones o capacidad estimada."
    ].join("\n");
  }

  return [
    "Puedo ayudarte con KPIs, inventario, pedidos, reservas y personal.",
    `Resumen rápido: ventas ${formatCurrency(sales)}, pedidos activos ${activeOrders.length}, alertas de inventario ${lowStockItems.length}.`
  ].join("\n");
};

const buildRestaurantChatAnswer = async (db: DbSchema, user: User, question: string) => {
  if (!openai) {
    return {
      answer: buildRestaurantChatAnswerFallback(db, user, question),
      provider: "rules" as const,
      model: null as string | null,
      fallbackUsed: true
    };
  }

  const context = buildRestaurantChatContext(db, user);
  const tools = buildChatToolDefinitions(user.role);
  const messages: any[] = [
    {
      role: "system" as const,
      content:
        "Eres el asistente operativo de un restaurante llamado KitchAI. Responde siempre en espanol, con tono breve, claro y util. No inventes datos. Usa las herramientas disponibles para consultas de inventario, pedidos y reservaciones cuando necesites datos concretos."
    },
    {
      role: "system" as const,
      content:
        "Enfocate segun el rol del usuario: cliente para reservas, menu y pedidos; empleado para operaciones, inventario y servicio; administrador para KPIs, reportes y personal. No reveles datos sensibles que no correspondan al rol."
    },
    {
      role: "system" as const,
      content: `Contexto estructurado del restaurante:\n${context}`
    },
    {
      role: "user" as const,
      content: question
    }
  ];

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const completion = await openai.chat.completions.create({
        model: OPENAI_CHAT_MODEL,
        temperature: Number.isFinite(OPENAI_CHAT_TEMPERATURE) ? OPENAI_CHAT_TEMPERATURE : 0.2,
        messages,
        tools: tools as any,
        tool_choice: "auto",
        max_tokens: 400
      });

      const assistantMessage = completion.choices[0]?.message;
      const answer = assistantMessage?.content?.trim();
      const toolCalls = assistantMessage?.tool_calls || [];

      if (toolCalls.length === 0) {
        if (!answer) {
          break;
        }

        return {
          answer,
          provider: "openai" as const,
          model: OPENAI_CHAT_MODEL,
          fallbackUsed: false
        };
      }

      messages.push({
        role: "assistant" as const,
        content: assistantMessage?.content || null,
        tool_calls: toolCalls
      });

      for (const toolCall of toolCalls as any[]) {
        const toolName = String(toolCall.function?.name || "");
        const toolArgs = parseToolArguments(String(toolCall.function?.arguments || "{}"));
        const toolResult = await runChatTool(toolName, toolArgs, db, user);

        messages.push({
          role: "tool" as const,
          tool_call_id: String(toolCall.id),
          content: JSON.stringify(toolResult)
        });
      }
    }
  } catch {
    // Fall through to deterministic response.
  }

  return {
    answer: buildRestaurantChatAnswerFallback(db, user, question),
    provider: "rules" as const,
    model: OPENAI_CHAT_MODEL,
    fallbackUsed: true
  };
};

app.use(cors({ origin: corsOrigin, credentials: FRONTEND_ORIGIN !== "*" }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "kitchai-backend",
    date: nowIso(),
    persistence: getPersistenceStatus()
  });
});

app.post("/auth/register", async (req, res) => {
  const { firstName, lastName, email, password, phone } = req.body as {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    phone?: string;
  };
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ message: "Datos incompletos" });
  }

  const db = readDb();
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    return res.status(409).json({ message: "Email ya registrado" });
  }

  const user = {
    id: id(),
    firstName,
    lastName,
    email: email.toLowerCase(),
    phone,
    role: "client" as Role,
    passwordHash: hash(password),
    active: true,
    createdAt: nowIso()
  };

  db.users.push(user);
  pushActivity(db, getUserFullName(user), "registro", "cuenta de cliente creada");
  await writeDb(db);
  return res.status(201).json({
    message: "Usuario creado",
    user: sanitizeUser(user)
  });
});

app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) return res.status(400).json({ message: "Datos incompletos" });

  const db = readDb();
  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase() && u.active);
  if (!user || !verifyHash(password, user.passwordHash)) {
    return res.status(401).json({ message: "Credenciales invalidas" });
  }

  const token = id();
  db.sessions.push({ token, userId: user.id, createdAt: nowIso() });
  await writeDb(db);

  return res.json({
    token,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role
    }
  });
});

app.get("/auth/me", requireAuth, (req, res) => {
  const user = req.currentUser!;
  return res.json({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    role: user.role
  });
});

app.get("/menu-items", (req, res) => {
  const db = readDb();
  const q = String(req.query.q || "").toLowerCase();
  const category = String(req.query.category || "");
  const result = db.menuItems.filter((m) => {
    const matchQ = !q || m.name.toLowerCase().includes(q);
    const matchCategory = !category || category === "Todos" || m.category === category;
    return matchQ && matchCategory;
  });
  return res.json(result);
});

app.post("/menu-items", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    name: string;
    description: string;
    price: number;
    category: string;
    image?: string;
    available?: boolean;
    ingredients?: MenuIngredient[];
  };

  if (!body.name || !body.description || !body.category || Number.isNaN(Number(body.price))) {
    return res.status(400).json({ message: "Datos invalidos" });
  }

  const ingredientResult = normalizeMenuIngredients(db, body.ingredients);
  if (ingredientResult.errors.length > 0) {
    return res.status(400).json({ message: ingredientResult.errors.join(" ") });
  }

  const actor = req.currentUser!;
  const item = {
    id: id(),
    name: body.name,
    description: body.description,
    price: Number(body.price),
    category: body.category,
    image: body.image || "/placeholder.jpg",
    available: body.available ?? true,
    ingredients: ingredientResult.ingredients,
    createdAt: nowIso()
  };
  db.menuItems.push(item);
  pushActivity(db, getUserFullName(actor), "agrego", `plato ${item.name}`);
  await writeDb(db);
  return res.status(201).json(item);
});

app.patch("/menu-items/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const item = db.menuItems.find((m) => m.id === req.params.id);
  if (!item) return res.status(404).json({ message: "No encontrado" });

  const body = req.body as Partial<{
    name: string;
    description: string;
    price: number;
    category: string;
    image: string;
    available: boolean;
    ingredients: MenuIngredient[];
  }>;

  if (body.name !== undefined) item.name = body.name;
  if (body.description !== undefined) item.description = body.description;
  if (body.price !== undefined && !Number.isNaN(Number(body.price))) item.price = Number(body.price);
  if (body.category !== undefined) item.category = body.category;
  if (body.image !== undefined) item.image = body.image;
  if (body.available !== undefined) item.available = Boolean(body.available);
  if (body.ingredients !== undefined) {
    const ingredientResult = normalizeMenuIngredients(db, body.ingredients);
    if (ingredientResult.errors.length > 0) {
      return res.status(400).json({ message: ingredientResult.errors.join(" ") });
    }
    item.ingredients = ingredientResult.ingredients;
  }

  pushActivity(db, getUserFullName(req.currentUser!), "actualizo", `plato ${item.name}`);
  await writeDb(db);
  return res.json(item);
});

app.delete("/menu-items/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const item = db.menuItems.find((m) => m.id === req.params.id);
  const before = db.menuItems.length;
  db.menuItems = db.menuItems.filter((m) => m.id !== req.params.id);
  if (db.menuItems.length === before) return res.status(404).json({ message: "No encontrado" });
  if (item) {
    pushActivity(db, getUserFullName(req.currentUser!), "elimino", `plato ${item.name}`);
  }
  await writeDb(db);
  return res.json({ message: "Eliminado" });
});

app.get("/employees", requireAuth, requireRole(["admin"]), (_req, res) => {
  const db = readDb();
  const payload = db.employees.map((employee) => toEmployeePayload(db, employee)).filter(Boolean);
  return res.json(payload);
});

app.post("/employees", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    name: string;
    email: string;
    phone?: string;
    role?: string;
    salary: number;
    password?: string;
  };
  if (!body.name || !body.email || Number.isNaN(Number(body.salary))) {
    return res.status(400).json({ message: "Datos invalidos" });
  }
  if (db.users.some((u) => u.email.toLowerCase() === body.email.toLowerCase())) {
    return res.status(409).json({ message: "Email ya existe" });
  }

  const [firstName, ...rest] = body.name.trim().split(/\s+/);
  const lastName = rest.join(" ");
  const role: Role = body.role?.toLowerCase() === "admin" ? "admin" : "employee";

  const user = {
    id: id(),
    firstName,
    lastName,
    email: body.email.toLowerCase(),
    phone: body.phone,
    role,
    passwordHash: hash(body.password || DEFAULT_EMPLOYEE_PASSWORD),
    active: true,
    createdAt: nowIso()
  };
  const employee = ensureEmployeeRecord(db, user.id, Number(body.salary));
  db.users.push(user);
  pushActivity(db, getUserFullName(req.currentUser!), "creo", `empleado ${getUserFullName(user)}`);
  await writeDb(db);
  return res.status(201).json(toEmployeePayload(db, employee));
});

app.patch("/employees/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const employee = db.employees.find((candidate) => candidate.id === req.params.id);
  if (!employee) return res.status(404).json({ message: "No encontrado" });

  const user = db.users.find((candidate) => candidate.id === employee.userId);
  if (!user) return res.status(404).json({ message: "Cuenta de empleado no encontrada" });

  const body = req.body as {
    firstName?: string;
    lastName?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: Role;
    salary?: number;
    active?: boolean;
    password?: string;
  };

  if (body.email && db.users.some((candidate) => candidate.id !== user.id && candidate.email.toLowerCase() === body.email!.toLowerCase())) {
    return res.status(409).json({ message: "Email ya existe" });
  }

  if (body.name && !body.firstName && !body.lastName) {
    const [firstName, ...rest] = body.name.trim().split(/\s+/);
    body.firstName = firstName;
    body.lastName = rest.join(" ");
  }

  if (body.firstName !== undefined) user.firstName = body.firstName;
  if (body.lastName !== undefined) user.lastName = body.lastName;
  if (body.email !== undefined) user.email = body.email.toLowerCase();
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.active !== undefined) user.active = Boolean(body.active);
  if (body.password) user.passwordHash = hash(body.password);
  if (body.role && isStaffRole(body.role)) user.role = body.role;
  if (body.salary !== undefined && !Number.isNaN(Number(body.salary))) {
    employee.salary = Number(body.salary);
  }
  if (!user.active) {
    revokeUserSessions(db, user.id);
  }

  pushActivity(db, getUserFullName(req.currentUser!), "actualizo", `empleado ${getUserFullName(user)}`);
  await writeDb(db);
  return res.json(toEmployeePayload(db, employee));
});

app.delete("/employees/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const employee = db.employees.find((e) => e.id === req.params.id);
  if (!employee) return res.status(404).json({ message: "No encontrado" });
  const user = db.users.find((candidate) => candidate.id === employee.userId);
  db.employees = db.employees.filter((e) => e.id !== req.params.id);
  db.users = db.users.filter((u) => u.id !== employee.userId);
  revokeUserSessions(db, employee.userId);
  if (user) {
    pushActivity(db, getUserFullName(req.currentUser!), "elimino", `empleado ${getUserFullName(user)}`);
  }
  await writeDb(db);
  return res.json({ message: "Empleado eliminado" });
});

app.get("/accounts", requireAuth, requireRole(["admin"]), (req, res) => {
  const db = readDb();
  const q = String(req.query.q || "").toLowerCase();
  const role = String(req.query.role || "");
  const accounts = db.users
    .filter((user) => {
      const name = getUserFullName(user).toLowerCase();
      const matchQuery =
        !q ||
        name.includes(q) ||
        user.email.toLowerCase().includes(q) ||
        (user.phone || "").toLowerCase().includes(q);
      const matchRole = !role || role === "Todos" || user.role === role;
      return matchQuery && matchRole;
    })
    .map((user) => toAccountPayload(db, user));

  return res.json(accounts);
});

app.post("/accounts", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    firstName: string;
    lastName?: string;
    email: string;
    phone?: string;
    role: Role;
    active?: boolean;
    password?: string;
    salary?: number;
  };

  if (!body.firstName || !body.email || !body.role) {
    return res.status(400).json({ message: "Datos invalidos" });
  }
  if (db.users.some((user) => user.email.toLowerCase() === body.email.toLowerCase())) {
    return res.status(409).json({ message: "Email ya existe" });
  }

  const user: User = {
    id: id(),
    firstName: body.firstName,
    lastName: body.lastName || "",
    email: body.email.toLowerCase(),
    phone: body.phone,
    role: body.role,
    passwordHash: hash(body.password || DEFAULT_EMPLOYEE_PASSWORD),
    active: body.active ?? true,
    createdAt: nowIso()
  };

  db.users.push(user);
  if (isStaffRole(user.role)) {
    ensureEmployeeRecord(db, user.id, Number(body.salary || 0));
  }

  pushActivity(db, getUserFullName(req.currentUser!), "creo", `cuenta ${user.email}`);
  await writeDb(db);
  return res.status(201).json(toAccountPayload(db, user));
});

app.patch("/accounts/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const user = db.users.find((candidate) => candidate.id === req.params.id);
  if (!user) return res.status(404).json({ message: "No encontrado" });

  const body = req.body as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    role?: Role;
    active?: boolean;
    password?: string;
    salary?: number;
  };

  if (body.email && db.users.some((candidate) => candidate.id !== user.id && candidate.email.toLowerCase() === body.email!.toLowerCase())) {
    return res.status(409).json({ message: "Email ya existe" });
  }

  if (body.firstName !== undefined) user.firstName = body.firstName;
  if (body.lastName !== undefined) user.lastName = body.lastName;
  if (body.email !== undefined) user.email = body.email.toLowerCase();
  if (body.phone !== undefined) user.phone = body.phone;
  if (body.active !== undefined) user.active = Boolean(body.active);
  if (body.password) user.passwordHash = hash(body.password);

  if (body.role) {
    user.role = body.role;
    if (isStaffRole(body.role)) {
      ensureEmployeeRecord(db, user.id, Number(body.salary ?? findEmployeeByUserId(db, user.id)?.salary ?? 0));
    } else {
      removeEmployeeRecord(db, user.id);
    }
  } else if (body.salary !== undefined && isStaffRole(user.role)) {
    ensureEmployeeRecord(db, user.id, Number(body.salary));
  }

  if (!user.active) {
    revokeUserSessions(db, user.id);
  }

  pushActivity(db, getUserFullName(req.currentUser!), "actualizo", `cuenta ${user.email}`);
  await writeDb(db);
  return res.json(toAccountPayload(db, user));
});

app.delete("/accounts/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const accountId = String(req.params.id);
  if (req.currentUser?.id === accountId) {
    return res.status(400).json({ message: "No puedes eliminar tu propia cuenta" });
  }

  const user = db.users.find((candidate) => candidate.id === accountId);
  if (!user) return res.status(404).json({ message: "No encontrado" });

  db.users = db.users.filter((candidate) => candidate.id !== accountId);
  removeEmployeeRecord(db, accountId);
  revokeUserSessions(db, accountId);
  pushActivity(db, getUserFullName(req.currentUser!), "elimino", `cuenta ${user.email}`);
  await writeDb(db);
  return res.json({ message: "Cuenta eliminada" });
});

app.get("/orders", requireAuth, (req, res) => {
  const db = readDb();
  const q = String(req.query.q || "").toLowerCase();
  const status = String(req.query.status || "");
  const visibleOrders =
    req.currentUser?.role === "client"
      ? db.orders.filter((order) => {
          if (!req.currentUser?.phone) return false;
          return order.customerPhone === req.currentUser.phone;
        })
      : db.orders;

  const filtered = visibleOrders.filter((o) => {
    const matchQ = !q || o.id.toLowerCase().includes(q) || o.table.toLowerCase().includes(q);
    const matchStatus = !status || status === "Todos" || o.status === status;
    return matchQ && matchStatus;
  });
  return res.json(filtered);
});

app.get("/orders/options", requireAuth, requireRole(["admin", "employee"]), (_req, res) => {
  const db = readDb();
  const activeOrdersByTable = db.orders.reduce<Record<string, number>>((acc, order) => {
    if (order.type === "salon" && order.status !== "Entregado") {
      acc[order.table] = (acc[order.table] || 0) + 1;
    }
    return acc;
  }, {});
  const categories = Array.from(new Set(db.menuItems.map((item) => item.category))).sort((a, b) =>
    a.localeCompare(b)
  );

  return res.json({
    categories,
    tables: RESTAURANT_TABLES.map((name, index) => ({
      id: String(index + 1),
      name,
      status: activeOrdersByTable[name] ? "occupied" : "available",
      activeOrders: activeOrdersByTable[name] || 0
    }))
  });
});

app.post("/orders", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    table: string;
    type?: OrderType;
    items?: Order["items"];
    status?: Order["status"];
    customerName?: string;
    customerPhone?: string;
    customerAddress?: string;
    note?: string;
  };
  if (!req.currentUser || (req.currentUser.role !== "admin" && req.currentUser.role !== "employee")) {
    return res.status(403).json({
      message: "No autorizado",
      errors: {
        fieldErrors: {},
        globalErrors: ["No tienes permiso para crear pedidos"]
      }
    });
  }

  const allowedTypes = new Set<OrderType>(["salon", "takeaway", "delivery"]);
  const fieldErrors: Record<string, string[]> = {};
  const globalErrors: string[] = [];
  if (!body.table || !String(body.table).trim()) {
    fieldErrors.table = ["Mesa requerida"];
  }
  const type = body.type || "salon";
  if (!allowedTypes.has(type)) {
    fieldErrors.type = ["Tipo de pedido invalido"];
  }
  if (type === "salon" && RESTAURANT_TABLES.length > 0 && !RESTAURANT_TABLES.includes(String(body.table).trim())) {
    fieldErrors.table = [...(fieldErrors.table || []), "Mesa no valida"];
  }
  if ((type === "takeaway" || type === "delivery") && !String(body.customerName || "").trim()) {
    fieldErrors.customerName = ["Nombre del cliente requerido"];
  }
  if ((type === "takeaway" || type === "delivery") && !String(body.customerPhone || "").trim()) {
    fieldErrors.customerPhone = ["Telefono del cliente requerido"];
  }
  if (type === "delivery" && !String(body.customerAddress || "").trim()) {
    fieldErrors.customerAddress = ["Direccion del cliente requerida"];
  }
  if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
    fieldErrors.items = ["Debe incluir al menos un producto"];
  }
  if (body.items?.some((item) => !item.menuItemId || item.quantity <= 0 || item.unitPrice < 0)) {
    fieldErrors.items = ["Los productos del pedido son invalidos"];
  }
  if (Array.isArray(body.items)) {
    const invalidMenuIds = body.items
      .map((item) => item.menuItemId)
      .filter((menuItemId) => !db.menuItems.some((menuItem) => menuItem.id === menuItemId));
    if (invalidMenuIds.length > 0) {
      fieldErrors.items = [...(fieldErrors.items || []), "Hay productos que no existen en el menu"];
    }
    const itemsWithoutIngredients = body.items
      .map((item) => db.menuItems.find((menuItem) => menuItem.id === item.menuItemId))
      .filter((menuItem) => menuItem && (!menuItem.ingredients || menuItem.ingredients.length === 0))
      .map((menuItem) => menuItem!.name);
    if (itemsWithoutIngredients.length > 0) {
      fieldErrors.items = [
        ...(fieldErrors.items || []),
        `Hay platos sin ingredientes configurados: ${itemsWithoutIngredients.join(", ")}`,
      ];
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return res.status(400).json({
      message: "Validacion de pedido fallida",
      errors: {
        fieldErrors,
        globalErrors
      }
    });
  }

  const orderNumber = db.orders.length + 1;
  const orderId = `#${String(orderNumber).padStart(4, "0")}`;
  const items = body.items ?? [];
  const total = items.reduce((acc, i) => acc + i.quantity * i.unitPrice, 0);
  const order: Order = {
    id: orderId,
    table: body.table,
    type,
    status: body.status || "Pendiente",
    total,
    createdAt: nowIso(),
    createdBy: req.currentUser?.id,
    customerName: body.customerName,
    customerPhone: body.customerPhone,
    customerAddress: body.customerAddress,
    note: body.note,
    items
  };

  const inventoryConsumption = applyOrderInventoryConsumption(db, items, orderId, req.currentUser?.id);
  if (!inventoryConsumption.ok) {
    return res.status(400).json({
      message: "No fue posible crear el pedido",
      errors: {
        fieldErrors,
        globalErrors: [...globalErrors, inventoryConsumption.message]
      }
    });
  }

  db.orders.unshift(order);
  pushActivity(db, getUserFullName(req.currentUser!), "creo", `pedido ${order.id}`);
  await writeDb(db);
  return res.status(201).json(order);
});

app.patch("/orders/:id/status", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
  if (!req.currentUser || (req.currentUser.role !== "admin" && req.currentUser.role !== "employee")) {
    return res.status(403).json({ message: "No autorizado" });
  }
  const db = readDb();
  const order = db.orders.find((o) => o.id === req.params.id);
  if (!order) return res.status(404).json({ message: "No encontrado" });
  const status = req.body.status as Order["status"];
  if (!status) return res.status(400).json({ message: "Estado requerido" });
  const allowedStatus = new Set<Order["status"]>(["Pendiente", "En Proceso", "Entregado"]);
  if (!allowedStatus.has(status)) {
    return res.status(400).json({ message: "Estado invalido" });
  }
  order.status = status;
  pushActivity(db, getUserFullName(req.currentUser!), "actualizo", `pedido ${order.id} a ${status}`);
  await writeDb(db);
  return res.json(order);
});

app.get("/inventory/items", requireAuth, (req, res) => {
  const db = readDb();
  const q = String(req.query.q || "").toLowerCase();
  const status = String(req.query.status || "");
  const items = db.inventoryItems.filter((item) => {
    const matchQuery = !q || item.name.toLowerCase().includes(q);
    const matchStatus = !status || status === "Todos" || item.status === status;
    return matchQuery && matchStatus;
  });
  return res.json(items);
});

app.post("/inventory/items", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    name: string;
    quantity: number;
    unit: string;
    minStock: number;
    cost: number;
  };
  if (!body.name || !body.unit) return res.status(400).json({ message: "Datos invalidos" });
  const quantity = Number(body.quantity);
  const minStock = Number(body.minStock);
  const item = {
    id: id(),
    name: body.name,
    quantity,
    unit: body.unit,
    minStock,
    cost: Number(body.cost),
    status: inventoryStatus(quantity, minStock),
    updatedAt: nowIso()
  };
  db.inventoryItems.push(item);
  pushActivity(db, getUserFullName(req.currentUser!), "agrego", `insumo ${item.name}`);
  await writeDb(db);
  return res.status(201).json(item);
});

app.patch("/inventory/items/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const item = db.inventoryItems.find((candidate) => candidate.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Item no encontrado" });

  const body = req.body as {
    name?: string;
    quantity?: number;
    unit?: string;
    minStock?: number;
    cost?: number;
  };

  if (body.name !== undefined) item.name = body.name;
  if (body.unit !== undefined) item.unit = body.unit;
  if (body.quantity !== undefined && !Number.isNaN(Number(body.quantity))) item.quantity = Number(body.quantity);
  if (body.minStock !== undefined && !Number.isNaN(Number(body.minStock))) item.minStock = Number(body.minStock);
  if (body.cost !== undefined && !Number.isNaN(Number(body.cost))) item.cost = Number(body.cost);

  item.status = inventoryStatus(item.quantity, item.minStock);
  item.updatedAt = nowIso();

  pushActivity(db, getUserFullName(req.currentUser!), "actualizo", `insumo ${item.name}`);
  await writeDb(db);
  return res.json(item);
});

app.delete("/inventory/items/:id", requireAuth, requireRole(["admin"]), async (req, res) => {
  const db = readDb();
  const item = db.inventoryItems.find((candidate) => candidate.id === req.params.id);
  if (!item) return res.status(404).json({ message: "Item no encontrado" });

  db.inventoryItems = db.inventoryItems.filter((candidate) => candidate.id !== req.params.id);
  db.inventoryMovements = db.inventoryMovements.filter((movement) => movement.itemId !== req.params.id);
  pushActivity(db, getUserFullName(req.currentUser!), "elimino", `insumo ${item.name}`);
  await writeDb(db);
  return res.json({ message: "Item eliminado" });
});

app.get("/inventory/movements", requireAuth, requireRole(["admin", "employee"]), (req, res) => {
  const db = readDb();
  const itemId = String(req.query.itemId || "");
  const movements = db.inventoryMovements
    .filter((movement) => !itemId || movement.itemId === itemId)
    .map((movement) => {
      const item = db.inventoryItems.find((candidate) => candidate.id === movement.itemId);
      const user = movement.createdBy
        ? db.users.find((candidate) => candidate.id === movement.createdBy)
        : null;
      return {
        ...movement,
        itemName: item?.name || "Item eliminado",
        createdByName: user ? getUserFullName(user) : "Sistema"
      };
    });

  return res.json(movements);
});

app.post("/inventory/movements", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    itemId: string;
    type: MovementType;
    quantity: number;
    unitCost?: number;
    note?: string;
  };
  const item = db.inventoryItems.find((i) => i.id === body.itemId);
  if (!item) return res.status(404).json({ message: "Item no encontrado" });
  const quantity = Number(body.quantity);
  if (!quantity || quantity <= 0) return res.status(400).json({ message: "Cantidad invalida" });
  if (!body.type || !["in", "out", "adjustment"].includes(body.type)) {
    return res.status(400).json({ message: "Tipo de movimiento invalido" });
  }
  if (body.type === "out" && item.quantity - quantity < 0) {
    return res.status(400).json({ message: "Stock insuficiente para la salida" });
  }

  if (body.type === "in") item.quantity += quantity;
  if (body.type === "out") item.quantity -= quantity;
  if (body.type === "adjustment") item.quantity = quantity;

  item.status = inventoryStatus(item.quantity, item.minStock);
  item.updatedAt = nowIso();

  db.inventoryMovements.unshift({
    id: id(),
    itemId: item.id,
    type: body.type,
    quantity,
    unitCost: body.unitCost,
    note: body.note,
    createdAt: nowIso(),
    createdBy: req.currentUser?.id
  });
  pushActivity(db, getUserFullName(req.currentUser!), "movio", `${item.name} (${body.type})`);
  await writeDb(db);
  return res.status(201).json(item);
});

app.get("/reservations", requireAuth, requireRole(["admin", "employee", "client"]), (req, res) => {
  const db = readDb();
  if (req.currentUser?.role === "client") {
    return res.json(db.reservations.filter((reservation) => reservation.email === req.currentUser?.email));
  }
  return res.json(db.reservations);
});

app.post("/reservations", requireAuth, requireRole(["admin", "employee", "client"]), async (req, res) => {
  const db = readDb();
  const body = req.body as {
    date: string;
    hour: string;
    guests: number;
    name: string;
    email: string;
    phone?: string;
  };
  const ownerEmail = req.currentUser?.role === "client" ? req.currentUser.email : body.email;
  if (!body.date || !body.hour || !body.name || !ownerEmail) {
    return res.status(400).json({ message: "Datos incompletos" });
  }
  const reservation = {
    id: `#${3000 + db.reservations.length + 1}`,
    date: body.date,
    hour: body.hour,
    guests: Number(body.guests || 1),
    name: body.name,
    email: ownerEmail,
    phone: body.phone,
    status: "Pendiente" as ReservationStatus,
    createdAt: nowIso()
  };
  db.reservations.unshift(reservation);
  pushActivity(db, getUserFullName(req.currentUser!), "creo", `reservacion ${reservation.id}`);
  await writeDb(db);
  return res.status(201).json(reservation);
});

app.patch("/reservations/:id/status", requireAuth, requireRole(["admin", "employee"]), async (req, res) => {
  const db = readDb();
  const reservation = db.reservations.find((r) => r.id === req.params.id);
  if (!reservation) return res.status(404).json({ message: "No encontrado" });
  reservation.status = req.body.status as ReservationStatus;
  pushActivity(db, getUserFullName(req.currentUser!), "actualizo", `reservacion ${reservation.id} a ${reservation.status}`);
  await writeDb(db);
  return res.json(reservation);
});

app.get("/reports/kpis", requireAuth, requireRole(["admin"]), (_req, res) => {
  const db = readDb();
  const sales = db.orders.reduce((acc, o) => acc + o.total, 0);
  const activeOrders = db.orders.filter((o) => o.status !== "Entregado").length;
  const lowStock = db.inventoryItems.filter((i) => i.status !== "Normal").length;
  const inventoryValue = db.inventoryItems.reduce((acc, item) => acc + item.quantity * item.cost, 0);
  const today = new Date().toISOString().slice(0, 10);
  const reservationsToday = db.reservations.filter((r) => r.date === today).length;
  res.json({
    sales,
    reservationsToday,
    activeOrders,
    lowStock,
    totalEmployees: db.employees.length,
    totalAccounts: db.users.length,
    inventoryValue
  });
});

app.get("/reports/sales-weekly", requireAuth, requireRole(["admin"]), (_req, res) => {
  const db = readDb();
  const labels = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
  const data = labels.map((day) => ({ day, sales: 0 }));
  db.orders.forEach((o, idx) => {
    data[idx % 7].sales += o.total;
  });
  return res.json(data);
});

app.get("/dashboard/admin", requireAuth, requireRole(["admin"]), (_req, res) => {
  const db = readDb();
  const labels = ["LUN", "MAR", "MIE", "JUE", "VIE", "SAB", "DOM"];
  const weeklyData = labels.map((day) => ({ day, sales: 0 }));
  db.orders.forEach((o, idx) => {
    weeklyData[idx % 7].sales += o.total;
  });
  const recentOrders = db.orders.slice(0, 8);
  const employees = db.employees
    .slice(0, 8)
    .map((employee) => toEmployeePayload(db, employee))
    .filter(Boolean);
  return res.json({
    recentOrders,
    employees,
    weeklyData,
    recentActivity: db.activity.slice(0, 8)
  });
});

app.get("/dashboard/employee", requireAuth, requireRole(["employee", "admin"]), (_req, res) => {
  const db = readDb();
  const today = new Date().toISOString().slice(0, 10);
  return res.json({
    recentOrders: db.orders.slice(0, 8),
    lowStockItems: db.inventoryItems.filter((i) => i.status !== "Normal"),
    reservationsToday: db.reservations.filter((reservation) => reservation.date === today).length
  });
});

app.get("/dashboard/client", requireAuth, requireRole(["client"]), (req, res) => {
  const db = readDb();
  const recentOrders = db.orders
    .filter((order) => order.customerPhone && order.customerPhone === req.currentUser?.phone)
    .slice(0, 6);
  const reservations = db.reservations
    .filter((reservation) => reservation.email === req.currentUser?.email)
    .slice(0, 6);

  return res.json({
    recentOrders,
    reservations,
    messageCount: 0
  });
});

app.post("/chat/ask", requireAuth, async (req, res) => {
  const db = readDb();
  const question = String(req.body?.question || "").trim();
  if (!question) {
    return res.status(400).json({ message: "La pregunta es obligatoria" });
  }

  const result = await buildRestaurantChatAnswer(db, req.currentUser!, question);

  return res.json({
    answer: result.answer,
    role: req.currentUser?.role,
    restaurantName: RESTAURANT_NAME,
    provider: result.provider,
    model: result.model,
    fallbackUsed: result.fallbackUsed
  });
});

const start = async () => {
  await initDb();
  app.listen(PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`Backend running on http://localhost:${PORT}`);
    // eslint-disable-next-line no-console
    console.log(`Runtime config => FRONTEND_ORIGIN=${FRONTEND_ORIGIN} API_BASE_PATH=${API_BASE_PATH}`);
  });
};

void start().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Backend failed to start due to persistence initialization error.", error);
  process.exit(1);
});
