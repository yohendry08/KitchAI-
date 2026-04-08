import { getToken } from "./auth"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "/api"

export class ApiError extends Error {
  status: number
  details: unknown

  constructor(message: string, status: number, details: unknown = null) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

export interface AuthUser {
  id: string
  firstName: string
  lastName: string
  email: string
  role: "admin" | "employee" | "client"
}

export interface LoginResponse {
  token: string
  user: AuthUser
}

export interface MenuItemRecord {
  id: string
  name: string
  description: string
  price: number
  category: string
  image: string
  available: boolean
  ingredients: MenuIngredientRecord[]
  createdAt: string
}

export interface MenuIngredientRecord {
  inventoryItemId: string
  quantity: number
}

export interface OrderRecord {
  id: string
  table: string
  type?: "salon" | "takeaway" | "delivery"
  status: string
  total: number
  createdAt: string
  customerName?: string
  customerPhone?: string
  customerAddress?: string
  note?: string
  items: Array<{
    menuItemId: string
    name: string
    quantity: number
    unitPrice: number
  }>
}

export interface EmployeeRecord {
  id: string
  userId: string
  name: string
  firstName: string
  lastName: string
  role: "admin" | "employee"
  roleLabel: string
  email: string
  phone?: string
  salary: number
  active: boolean
  createdAt: string
}

export interface InventoryItemRecord {
  id: string
  name: string
  quantity: number
  unit: string
  minStock: number
  cost: number
  status: string
  updatedAt: string
}

export interface InventoryMovementRecord {
  id: string
  itemId: string
  itemName: string
  type: "in" | "out" | "adjustment"
  quantity: number
  unitCost?: number
  note?: string
  createdAt: string
  createdBy?: string
  createdByName: string
}

export interface AccountRecord {
  id: string
  name: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  role: "admin" | "employee" | "client"
  roleLabel: string
  active: boolean
  createdAt: string
  employeeId: string | null
  salary: number | null
}

export interface ReservationRecord {
  id: string
  date: string
  hour: string
  guests: number
  name: string
  email: string
  phone?: string
  status: string
  createdAt: string
}

export interface ReportKpisResponse {
  sales: number
  reservationsToday: number
  activeOrders: number
  lowStock: number
  totalEmployees: number
  totalAccounts: number
  inventoryValue: number
}

export interface AdminDashboardResponse {
  recentOrders: OrderRecord[]
  employees: EmployeeRecord[]
  weeklyData: Array<{ day: string; sales: number }>
  recentActivity: Array<{ id: string; user: string; action: string; detail: string; time: string }>
}

export interface EmployeeDashboardResponse {
  recentOrders: OrderRecord[]
  lowStockItems: Array<{ id: string; name: string; quantity: number; unit: string; status: string }>
  reservationsToday: number
}

export interface ClientDashboardResponse {
  recentOrders: OrderRecord[]
  reservations: ReservationRecord[]
  messageCount: number
}

export type ChatRole = "admin" | "employee" | "client"

export interface CreateOrderValidationErrors {
  fieldErrors?: Record<string, string[]>
  globalErrors?: string[]
}

export interface CreateOrderErrorPayload {
  message: string
  errors?: CreateOrderValidationErrors
}

export const getCreateOrderErrors = (error: unknown): CreateOrderValidationErrors => {
  if (!(error instanceof ApiError)) return {}
  const details = error.details as CreateOrderErrorPayload | undefined
  return {
    fieldErrors: details?.errors?.fieldErrors || {},
    globalErrors: details?.errors?.globalErrors || [],
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getToken()
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
    cache: "no-store",
  })

  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const message =
      typeof data === "object" && data && "message" in data && typeof data.message === "string"
        ? data.message
        : "Error de API"
    throw new ApiError(message, res.status, data)
  }
  return res.json() as Promise<T>
}

export const api = {
  health: () => request<{ ok: boolean }>("/health"),
  login: (email: string, password: string) =>
    request<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<AuthUser>("/auth/me"),
  register: (payload: {
    firstName: string
    lastName: string
    email: string
    password: string
    phone?: string
  }) =>
    request<{ message: string; user: AuthUser }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getAdminDashboard: () => request<AdminDashboardResponse>("/dashboard/admin"),
  getEmployeeDashboard: () => request<EmployeeDashboardResponse>("/dashboard/employee"),
  getClientDashboard: () => request<ClientDashboardResponse>("/dashboard/client"),
  getMenuItems: (q = "", category = "Todos") =>
    request<MenuItemRecord[]>(`/menu-items?q=${encodeURIComponent(q)}&category=${encodeURIComponent(category)}`),
  createMenuItem: (payload: {
    name: string
    description: string
    price: number
    category: string
    image?: string
    available?: boolean
    ingredients?: MenuIngredientRecord[]
  }) => request<MenuItemRecord>("/menu-items", { method: "POST", body: JSON.stringify(payload) }),
  updateMenuItem: (
    id: string,
    payload: Partial<{
      name: string
      description: string
      price: number
      category: string
      image: string
      available: boolean
      ingredients: MenuIngredientRecord[]
    }>,
  ) => request<MenuItemRecord>(`/menu-items/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteMenuItem: (id: string) => request(`/menu-items/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getOrders: (q = "", status = "Todos") =>
    request<OrderRecord[]>(`/orders?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`),
  getOrderOptions: () =>
    request<{ categories: string[]; tables: Array<{ id: string; name: string; status: string; activeOrders: number }> }>("/orders/options"),
  createOrder: (payload: {
    table: string
    type: "salon" | "takeaway" | "delivery"
    status?: string
    note?: string
    customerName?: string
    customerPhone?: string
    customerAddress?: string
    items: Array<{
      menuItemId: string
      name: string
      quantity: number
      unitPrice: number
    }>
  }) =>
    request<OrderRecord>("/orders", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  updateOrderStatus: (id: string, status: string) =>
    request(`/orders/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  getInventoryItems: (q = "", status = "Todos") =>
    request<InventoryItemRecord[]>(`/inventory/items?q=${encodeURIComponent(q)}&status=${encodeURIComponent(status)}`),
  createInventoryItem: (payload: {
    name: string
    quantity: number
    unit: string
    minStock: number
    cost: number
  }) => request<InventoryItemRecord>("/inventory/items", { method: "POST", body: JSON.stringify(payload) }),
  updateInventoryItem: (
    id: string,
    payload: Partial<{
      name: string
      quantity: number
      unit: string
      minStock: number
      cost: number
    }>,
  ) =>
    request<InventoryItemRecord>(`/inventory/items/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  deleteInventoryItem: (id: string) => request(`/inventory/items/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getInventoryMovements: (itemId = "") =>
    request<InventoryMovementRecord[]>(`/inventory/movements?itemId=${encodeURIComponent(itemId)}`),
  createInventoryMovement: (payload: {
    itemId: string
    type: "in" | "out" | "adjustment"
    quantity: number
    unitCost?: number
    note?: string
  }) => request<InventoryItemRecord>("/inventory/movements", { method: "POST", body: JSON.stringify(payload) }),
  getEmployees: () => request<EmployeeRecord[]>("/employees"),
  createEmployee: (payload: {
    name: string
    email: string
    phone?: string
    role?: "admin" | "employee"
    salary: number
    password?: string
  }) => request<EmployeeRecord>("/employees", { method: "POST", body: JSON.stringify(payload) }),
  updateEmployee: (
    id: string,
    payload: Partial<{
      firstName: string
      lastName: string
      name: string
      email: string
      phone: string
      role: "admin" | "employee"
      salary: number
      active: boolean
      password: string
    }>,
  ) => request<EmployeeRecord>(`/employees/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteEmployee: (id: string) => request(`/employees/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getAccounts: (q = "", role = "Todos") =>
    request<AccountRecord[]>(`/accounts?q=${encodeURIComponent(q)}&role=${encodeURIComponent(role)}`),
  createAccount: (payload: {
    firstName: string
    lastName?: string
    email: string
    phone?: string
    role: "admin" | "employee" | "client"
    active?: boolean
    password?: string
    salary?: number
  }) => request<AccountRecord>("/accounts", { method: "POST", body: JSON.stringify(payload) }),
  updateAccount: (
    id: string,
    payload: Partial<{
      firstName: string
      lastName: string
      email: string
      phone: string
      role: "admin" | "employee" | "client"
      active: boolean
      password: string
      salary: number
    }>,
  ) => request<AccountRecord>(`/accounts/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(payload) }),
  deleteAccount: (id: string) => request(`/accounts/${encodeURIComponent(id)}`, { method: "DELETE" }),
  getReportKpis: () => request<ReportKpisResponse>("/reports/kpis"),
  getWeeklySales: () => request<Array<{ day: string; sales: number }>>("/reports/sales-weekly"),
  getReservations: () => request<ReservationRecord[]>("/reservations"),
  createReservation: (payload: {
    date: string
    hour: string
    guests: number
    name: string
    email: string
    phone?: string
  }) => request<ReservationRecord>("/reservations", { method: "POST", body: JSON.stringify(payload) }),
  updateReservationStatus: (id: string, status: "Pendiente" | "Confirmada" | "Cancelada") =>
    request<ReservationRecord>(`/reservations/${encodeURIComponent(id)}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  askChat: (question: string, role: ChatRole = "client") =>
    request<{ answer: string }>("/chat/ask", {
      method: "POST",
      body: JSON.stringify({ question, role }),
    }),
}
