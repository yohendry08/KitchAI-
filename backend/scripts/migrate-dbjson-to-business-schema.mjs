import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const backendDir = path.resolve(scriptDir, "..");

const dbJsonPath = path.resolve(backendDir, "data", "db.json");
const outputSqlPath = path.resolve(backendDir, "sql", "110_seed_business_from_dbjson.sql");

if (!fs.existsSync(dbJsonPath)) {
  console.error(`No se encontro el archivo: ${dbJsonPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(dbJsonPath, "utf8");
const db = JSON.parse(raw);

const roleIdByName = {
  admin: "uuid-role-admin",
  employee: "uuid-role-employee",
  waiter: "uuid-role-waiter",
  client: "uuid-role-client"
};

const sqlString = (value) => {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
};

const sqlNum = (value, fallback = 0) => {
  const n = Number(value);
  return Number.isFinite(n) ? String(n) : String(fallback);
};

const mapOrderStatus = (status) => {
  switch (status) {
    case "Pendiente":
      return "pending";
    case "En Proceso":
      return "preparing";
    case "Entregado":
      return "served";
    default:
      return "pending";
  }
};

const tableNumberFromLabel = (label) => {
  const match = String(label || "").match(/\d+/);
  return match ? Number(match[0]) : null;
};

const userIds = new Set((db.users || []).map((u) => u.id));
const fallbackWaiterId = (db.users || []).find((u) => u.role === "employee")?.id
  || (db.users || []).find((u) => u.role === "admin")?.id
  || null;

const statements = [];
statements.push("BEGIN;");
statements.push("TRUNCATE TABLE order_items, orders, menu_items, users RESTART IDENTITY CASCADE;");

for (const user of db.users || []) {
  const roleId = roleIdByName[user.role] || "uuid-role-client";
  const fullName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email || "Usuario";
  statements.push(`
INSERT INTO users (
  id, name, email, phone, password_hash, role_id, failed_login_attempts, locked_until, created_at, updated_at
) VALUES (
  ${sqlString(user.id)},
  ${sqlString(fullName)},
  ${sqlString(String(user.email || "").toLowerCase())},
  ${sqlString(user.phone || null)},
  ${sqlString(user.passwordHash || "")},
  ${sqlString(roleId)},
  0,
  NULL,
  COALESCE(${sqlString(user.createdAt)}, NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  updated_at = NOW();
  `.trim());
}

for (const item of db.menuItems || []) {
  statements.push(`
INSERT INTO menu_items (
  id, name, description, price, is_active, created_at, updated_at
) VALUES (
  ${sqlString(item.id)},
  ${sqlString(item.name)},
  ${sqlString(item.description || "")},
  ${sqlNum(item.price, 0)},
  ${item.available === false ? "FALSE" : "TRUE"},
  COALESCE(${sqlString(item.createdAt)}, NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
  `.trim());
}

for (const order of db.orders || []) {
  const waiterId = userIds.has(order.createdBy) ? order.createdBy : fallbackWaiterId;
  const tableNumber = tableNumberFromLabel(order.table);
  const createdAt = order.createdAt || new Date().toISOString();
  statements.push(`
INSERT INTO orders (
  id, order_number, customer_name, customer_phone, table_number, status, total_amount,
  tax_amount, discount_amount, final_amount, payment_status, payment_method, special_instructions,
  waiter_id, cancelled_by, cancelled_at, created_at, updated_at, completed_at
) VALUES (
  ${sqlString(order.id)},
  ${sqlString(order.id)},
  ${sqlString("Cliente General")},
  NULL,
  ${tableNumber === null ? "NULL" : String(tableNumber)},
  ${sqlString(mapOrderStatus(order.status))},
  ${sqlNum(order.total, 0)},
  0,
  0,
  ${sqlNum(order.total, 0)},
  'unpaid',
  NULL,
  NULL,
  ${sqlString(waiterId)},
  NULL,
  NULL,
  COALESCE(${sqlString(createdAt)}, NOW()::text)::timestamptz,
  NOW(),
  ${order.status === "Entregado" ? "COALESCE(" + sqlString(createdAt) + ", NOW()::text)::timestamptz" : "NULL"}
)
ON CONFLICT (id) DO UPDATE SET
  order_number = EXCLUDED.order_number,
  table_number = EXCLUDED.table_number,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount,
  final_amount = EXCLUDED.final_amount,
  waiter_id = EXCLUDED.waiter_id,
  updated_at = NOW();
  `.trim());

  for (let i = 0; i < (order.items || []).length; i += 1) {
    const oi = order.items[i];
    const lineId = `${order.id}-${i + 1}`;
    const subtotal = Number(oi.quantity || 0) * Number(oi.unitPrice || 0);
    statements.push(`
INSERT INTO order_items (
  id, order_id, menu_item_id, menu_item_name, quantity, unit_price, subtotal, special_notes, created_at
) VALUES (
  ${sqlString(lineId)},
  ${sqlString(order.id)},
  ${sqlString(oi.menuItemId || ((db.menuItems || [])[0]?.id || "unknown-menu-item"))},
  ${sqlString(oi.name || "Item")},
  ${sqlNum(oi.quantity, 1)},
  ${sqlNum(oi.unitPrice, 0)},
  ${sqlNum(subtotal, 0)},
  NULL,
  COALESCE(${sqlString(createdAt)}, NOW()::text)::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
  quantity = EXCLUDED.quantity,
  unit_price = EXCLUDED.unit_price,
  subtotal = EXCLUDED.subtotal;
    `.trim());
  }
}

statements.push("COMMIT;");
fs.writeFileSync(outputSqlPath, `${statements.join("\n\n")}\n`, "utf8");
console.log(`SQL generado en: ${outputSqlPath}`);
