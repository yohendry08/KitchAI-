export type Role = "admin" | "employee" | "client";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: Role;
  passwordHash: string;
  active: boolean;
  createdAt: string;
}

export interface Session {
  token: string;
  userId: string;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  available: boolean;
  ingredients: MenuIngredient[];
  createdAt: string;
}

export interface MenuIngredient {
  inventoryItemId: string;
  quantity: number;
}

export interface Employee {
  id: string;
  userId: string;
  salary: number;
}

export type OrderType = "salon" | "takeaway" | "delivery";
export type OrderStatus = "Pendiente" | "En Proceso" | "Entregado";

export interface OrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  table: string;
  type?: OrderType;
  status: OrderStatus;
  total: number;
  createdAt: string;
  createdBy?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  note?: string;
  items: OrderItem[];
}

export type ReservationStatus = "Pendiente" | "Confirmada" | "Cancelada";

export interface Reservation {
  id: string;
  date: string;
  hour: string;
  guests: number;
  name: string;
  email: string;
  phone?: string;
  status: ReservationStatus;
  createdAt: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  minStock: number;
  cost: number;
  status: "Normal" | "Bajo" | "Critico";
  updatedAt: string;
}

export type MovementType = "in" | "out" | "adjustment";

export interface InventoryMovement {
  id: string;
  itemId: string;
  type: MovementType;
  quantity: number;
  unitCost?: number;
  note?: string;
  createdAt: string;
  createdBy?: string;
}

export interface Activity {
  id: string;
  user: string;
  action: string;
  detail: string;
  time: string;
}

export interface DbSchema {
  users: User[];
  sessions: Session[];
  menuItems: MenuItem[];
  employees: Employee[];
  orders: Order[];
  reservations: Reservation[];
  inventoryItems: InventoryItem[];
  inventoryMovements: InventoryMovement[];
  activity: Activity[];
}
