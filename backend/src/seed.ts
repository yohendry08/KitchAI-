import type { DbSchema, InventoryItem, MenuItem, Order, Reservation, User } from "./types.js";
import { hash, inventoryStatus, nowIso } from "./utils.js";

const ts = nowIso();
const SEED_DEFAULT_PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "123456";

const adminUserId = "user-admin-manuel";
const opsAdminUserId = "user-admin-lucia";
const employeeUserId = "user-employee-maria";
const employeeChefUserId = "user-employee-diego";
const clientUserId = "user-client-laura";
const vipClientUserId = "user-client-carlos";

const menuItems: MenuItem[] = [
  {
    id: "menu-carpaccio-remolacha",
    name: "Carpaccio de Remolacha",
    description: "Remolacha asada, queso de cabra, nueces caramelizadas y miel especiada.",
    price: 520,
    category: "Entradas",
    image: "/images/carpaccio-remolacha.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-remolacha", quantity: 0.35 },
      { inventoryItemId: "inv-queso-cabra", quantity: 0.08 },
      { inventoryItemId: "inv-nueces", quantity: 0.04 }
    ],
    createdAt: ts
  },
  {
    id: "menu-vieiras-citricos",
    name: "Vieiras al Fuego de Citricos",
    description: "Vieiras selladas con pure de coliflor tostada, limon real y aceite de eneldo.",
    price: 760,
    category: "Entradas",
    image: "/images/vieiras-citricos.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-vieiras", quantity: 0.18 },
      { inventoryItemId: "inv-coliflor", quantity: 0.16 },
      { inventoryItemId: "inv-limon", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-croquetas-cangrejo",
    name: "Croquetas de Cangrejo",
    description: "Croquetas cremosas de cangrejo, aioli de limon y ensalada fresca de hierbas.",
    price: 480,
    category: "Entradas",
    image: "/images/caprese-salad.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-cangrejo", quantity: 0.14 },
      { inventoryItemId: "inv-harina", quantity: 0.05 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-pulpo-brasa",
    name: "Pulpo a la Brasa",
    description: "Pulpo tierno con papas confitadas, pimenton ahumado y vinagreta de perejil.",
    price: 890,
    category: "Entradas",
    image: "/images/hero-dish.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-pulpo", quantity: 0.22 },
      { inventoryItemId: "inv-platano", quantity: 0.18 },
      { inventoryItemId: "inv-limon", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-solomillo-lumiere",
    name: "Solomillo Lumiere",
    description: "Corte madurado con reduccion de vino, gratin de papas y romero fresco.",
    price: 1850,
    category: "Platos Fuertes",
    image: "/images/solomillo-lumiere.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-solomillo", quantity: 0.32 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.04 },
      { inventoryItemId: "inv-harina", quantity: 0.06 }
    ],
    createdAt: ts
  },
  {
    id: "menu-bacalao-oro",
    name: "Bacalao en Piel de Oro",
    description: "Bacalao confitado con esparragos y emulsion ligera de azafran.",
    price: 1490,
    category: "Platos Fuertes",
    image: "/images/bacalao-oro.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-bacalao", quantity: 0.28 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.03 },
      { inventoryItemId: "inv-limon", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-risotto-hongos",
    name: "Risotto de Hongos",
    description: "Arroz carnaroli, setas silvestres, mantequilla de porcini y parmesano.",
    price: 1180,
    category: "Platos Fuertes",
    image: "/images/risotto-hongos.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-arroz-carnaroli", quantity: 0.18 },
      { inventoryItemId: "inv-setas", quantity: 0.16 },
      { inventoryItemId: "inv-parmesano", quantity: 0.05 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-pato-lavanda",
    name: "Pato a la Lavanda",
    description: "Magret glaseado con miel de campo, higos frescos y perfume de lavanda.",
    price: 1680,
    category: "Platos Fuertes",
    image: "/images/pato-lavanda.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-pato", quantity: 0.3 },
      { inventoryItemId: "inv-higos", quantity: 0.09 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-salmon-parrilla",
    name: "Salmon a la Parrilla",
    description: "Salmon sellado con pure de yuca suave, esparragos y mantequilla citrica.",
    price: 1390,
    category: "Platos Fuertes",
    image: "/images/grilled-salmon.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-salmon", quantity: 0.3 },
      { inventoryItemId: "inv-yuca", quantity: 0.2 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.03 },
      { inventoryItemId: "inv-limon", quantity: 0.03 }
    ],
    createdAt: ts
  },
  {
    id: "menu-mofongo-camarones",
    name: "Mofongo Cremoso de Camarones",
    description: "Mofongo suave con camarones salteados, caldo concentrado y aceite de cilantro.",
    price: 1320,
    category: "Platos Fuertes",
    image: "/images/hero-dish.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-platano", quantity: 0.25 },
      { inventoryItemId: "inv-camarones", quantity: 0.22 },
      { inventoryItemId: "inv-limon", quantity: 0.02 }
    ],
    createdAt: ts
  },
  {
    id: "menu-esfera-chocolate",
    name: "Esfera de Chocolate Valrhona",
    description: "Esfera de chocolate oscuro con crema de pistacho y centro tibio de cacao.",
    price: 420,
    category: "Postres",
    image: "/images/esfera-chocolate.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-chocolate", quantity: 0.12 },
      { inventoryItemId: "inv-pistacho", quantity: 0.04 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.02 }
    ],
    createdAt: ts
  },
  {
    id: "menu-pavlova-frutos-rojos",
    name: "Pavlova de Frutos Rojos",
    description: "Merengue crujiente con chantilly ligera y coulis de frutos rojos.",
    price: 390,
    category: "Postres",
    image: "/images/pavlova.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-frutos-rojos", quantity: 0.1 },
      { inventoryItemId: "inv-harina", quantity: 0.04 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.02 }
    ],
    createdAt: ts
  },
  {
    id: "menu-flan-vainilla",
    name: "Flan de Vainilla",
    description: "Flan suave de vainilla natural con caramelo oscuro y sal marina.",
    price: 310,
    category: "Postres",
    image: "/images/pavlova.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-harina", quantity: 0.05 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.02 }
    ],
    createdAt: ts
  },
  {
    id: "menu-tarta-coco",
    name: "Tarta Tibia de Coco",
    description: "Tarta de coco con helado de canela y reduccion de ron especiado.",
    price: 360,
    category: "Postres",
    image: "/images/esfera-chocolate.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-coco", quantity: 0.12 },
      { inventoryItemId: "inv-ron", quantity: 0.05 },
      { inventoryItemId: "inv-harina", quantity: 0.05 },
      { inventoryItemId: "inv-mantequilla", quantity: 0.02 }
    ],
    createdAt: ts
  },
  {
    id: "menu-mojito-maracuya",
    name: "Mojito de Maracuya",
    description: "Coctel fresco con maracuya, hierbabuena y citricos.",
    price: 340,
    category: "Bebidas",
    image: "/images/reservation-ambience.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-maracuya", quantity: 0.18 },
      { inventoryItemId: "inv-hierbabuena", quantity: 0.01 },
      { inventoryItemId: "inv-limon", quantity: 0.04 },
      { inventoryItemId: "inv-ron", quantity: 0.08 }
    ],
    createdAt: ts
  },
  {
    id: "menu-limonada-jengibre",
    name: "Limonada de Jengibre",
    description: "Limonada natural con jengibre fresco, menta y un toque de miel.",
    price: 180,
    category: "Bebidas",
    image: "/images/restaurant-ambience.jpg",
    available: true,
    ingredients: [
      { inventoryItemId: "inv-limon", quantity: 0.08 },
      { inventoryItemId: "inv-hierbabuena", quantity: 0.01 }
    ],
    createdAt: ts
  }
];

const inventoryItems: InventoryItem[] = [
  { id: "inv-remolacha", name: "Remolacha organica", quantity: 25, unit: "kg", minStock: 10, cost: 95, status: inventoryStatus(25, 10), updatedAt: ts },
  { id: "inv-queso-cabra", name: "Queso de cabra", quantity: 12, unit: "kg", minStock: 6, cost: 420, status: inventoryStatus(12, 6), updatedAt: ts },
  { id: "inv-nueces", name: "Nueces caramelizadas", quantity: 7, unit: "kg", minStock: 4, cost: 310, status: inventoryStatus(7, 4), updatedAt: ts },
  { id: "inv-vieiras", name: "Vieiras premium", quantity: 9, unit: "kg", minStock: 10, cost: 1450, status: inventoryStatus(9, 10), updatedAt: ts },
  { id: "inv-coliflor", name: "Coliflor", quantity: 14, unit: "kg", minStock: 8, cost: 110, status: inventoryStatus(14, 8), updatedAt: ts },
  { id: "inv-cangrejo", name: "Carne de cangrejo", quantity: 8, unit: "kg", minStock: 5, cost: 890, status: inventoryStatus(8, 5), updatedAt: ts },
  { id: "inv-pulpo", name: "Pulpo", quantity: 6, unit: "kg", minStock: 5, cost: 980, status: inventoryStatus(6, 5), updatedAt: ts },
  { id: "inv-solomillo", name: "Solomillo madurado", quantity: 18, unit: "kg", minStock: 12, cost: 1250, status: inventoryStatus(18, 12), updatedAt: ts },
  { id: "inv-bacalao", name: "Bacalao premium", quantity: 12, unit: "kg", minStock: 8, cost: 780, status: inventoryStatus(12, 8), updatedAt: ts },
  { id: "inv-setas", name: "Setas silvestres", quantity: 11, unit: "kg", minStock: 9, cost: 430, status: inventoryStatus(11, 9), updatedAt: ts },
  { id: "inv-arroz-carnaroli", name: "Arroz carnaroli", quantity: 22, unit: "kg", minStock: 12, cost: 185, status: inventoryStatus(22, 12), updatedAt: ts },
  { id: "inv-parmesano", name: "Parmesano reggiano", quantity: 9, unit: "kg", minStock: 5, cost: 560, status: inventoryStatus(9, 5), updatedAt: ts },
  { id: "inv-pato", name: "Magret de pato", quantity: 7, unit: "kg", minStock: 8, cost: 960, status: inventoryStatus(7, 8), updatedAt: ts },
  { id: "inv-higos", name: "Higos frescos", quantity: 5, unit: "kg", minStock: 6, cost: 290, status: inventoryStatus(5, 6), updatedAt: ts },
  { id: "inv-salmon", name: "Salmon fresco", quantity: 13, unit: "kg", minStock: 8, cost: 840, status: inventoryStatus(13, 8), updatedAt: ts },
  { id: "inv-yuca", name: "Yuca", quantity: 30, unit: "kg", minStock: 15, cost: 55, status: inventoryStatus(30, 15), updatedAt: ts },
  { id: "inv-camarones", name: "Camarones", quantity: 10, unit: "kg", minStock: 8, cost: 620, status: inventoryStatus(10, 8), updatedAt: ts },
  { id: "inv-platano", name: "Platano verde", quantity: 40, unit: "kg", minStock: 20, cost: 42, status: inventoryStatus(40, 20), updatedAt: ts },
  { id: "inv-chocolate", name: "Chocolate Valrhona", quantity: 12, unit: "kg", minStock: 6, cost: 730, status: inventoryStatus(12, 6), updatedAt: ts },
  { id: "inv-pistacho", name: "Pistacho", quantity: 6, unit: "kg", minStock: 4, cost: 890, status: inventoryStatus(6, 4), updatedAt: ts },
  { id: "inv-frutos-rojos", name: "Frutos rojos frescos", quantity: 8, unit: "kg", minStock: 8, cost: 360, status: inventoryStatus(8, 8), updatedAt: ts },
  { id: "inv-coco", name: "Leche de coco", quantity: 18, unit: "lt", minStock: 10, cost: 145, status: inventoryStatus(18, 10), updatedAt: ts },
  { id: "inv-ron", name: "Ron anejo", quantity: 14, unit: "botellas", minStock: 6, cost: 520, status: inventoryStatus(14, 6), updatedAt: ts },
  { id: "inv-maracuya", name: "Pulpa de maracuya", quantity: 9, unit: "lt", minStock: 5, cost: 210, status: inventoryStatus(9, 5), updatedAt: ts },
  { id: "inv-limon", name: "Limon persa", quantity: 35, unit: "kg", minStock: 15, cost: 80, status: inventoryStatus(35, 15), updatedAt: ts },
  { id: "inv-hierbabuena", name: "Hierbabuena", quantity: 5, unit: "kg", minStock: 4, cost: 95, status: inventoryStatus(5, 4), updatedAt: ts },
  { id: "inv-mantequilla", name: "Mantequilla", quantity: 16, unit: "kg", minStock: 8, cost: 260, status: inventoryStatus(16, 8), updatedAt: ts },
  { id: "inv-harina", name: "Harina de trigo", quantity: 28, unit: "kg", minStock: 12, cost: 58, status: inventoryStatus(28, 12), updatedAt: ts }
];

const users: User[] = [
  { id: adminUserId, firstName: "Manuel", lastName: "Guzman", email: "admin@kitchai.com", phone: "+1 809 555 5701", role: "admin", passwordHash: hash(SEED_DEFAULT_PASSWORD), active: true, createdAt: ts },
  { id: opsAdminUserId, firstName: "Lucia", lastName: "Navarro", email: "operaciones@kitchai.com", phone: "+1 809 555 5702", role: "admin", passwordHash: hash(SEED_DEFAULT_PASSWORD), active: true, createdAt: ts },
  { id: employeeUserId, firstName: "Maria", lastName: "Gomez", email: "empleado@kitchai.com", phone: "+1 809 555 5703", role: "employee", passwordHash: hash(SEED_DEFAULT_PASSWORD), active: true, createdAt: ts },
  { id: employeeChefUserId, firstName: "Diego", lastName: "Mendoza", email: "cocina@kitchai.com", phone: "+1 809 555 5704", role: "employee", passwordHash: hash(SEED_DEFAULT_PASSWORD), active: true, createdAt: ts },
  { id: clientUserId, firstName: "Laura", lastName: "Campos", email: "cliente@kitchai.com", phone: "+1 809 555 5799", role: "client", passwordHash: hash(SEED_DEFAULT_PASSWORD), active: true, createdAt: ts },
  { id: vipClientUserId, firstName: "Carlos", lastName: "Ibarra", email: "vip@kitchai.com", phone: "+1 809 555 5798", role: "client", passwordHash: hash(SEED_DEFAULT_PASSWORD), active: true, createdAt: ts }
];

const orders: Order[] = [
  {
    id: "#0018",
    table: "Mesa 2",
    type: "salon",
    status: "Pendiente",
    total: 2770,
    createdAt: ts,
    createdBy: employeeUserId,
    items: [
      { menuItemId: "menu-solomillo-lumiere", name: "Solomillo Lumiere", quantity: 1, unitPrice: 1850 },
      { menuItemId: "menu-carpaccio-remolacha", name: "Carpaccio de Remolacha", quantity: 1, unitPrice: 520 },
      { menuItemId: "menu-esfera-chocolate", name: "Esfera de Chocolate Valrhona", quantity: 1, unitPrice: 420 }
    ]
  },
  {
    id: "#0017",
    table: "Mesa 2",
    type: "salon",
    status: "En Proceso",
    total: 730,
    createdAt: ts,
    createdBy: employeeUserId,
    note: "Segundo tiempo para la mesa",
    items: [
      { menuItemId: "menu-limonada-jengibre", name: "Limonada de Jengibre", quantity: 2, unitPrice: 180 },
      { menuItemId: "menu-flan-vainilla", name: "Flan de Vainilla", quantity: 1, unitPrice: 310 },
      { menuItemId: "menu-mojito-maracuya", name: "Mojito de Maracuya", quantity: 1, unitPrice: 340 }
    ]
  },
  {
    id: "#0016",
    table: "Delivery",
    type: "delivery",
    status: "En Proceso",
    total: 2860,
    createdAt: ts,
    createdBy: employeeChefUserId,
    customerName: "Laura Campos",
    customerPhone: "+1 809 555 5799",
    customerAddress: "Av. Winston Churchill 145, Santo Domingo",
    note: "Sin frutos secos en postre",
    items: [
      { menuItemId: "menu-risotto-hongos", name: "Risotto de Hongos", quantity: 1, unitPrice: 1180 },
      { menuItemId: "menu-pato-lavanda", name: "Pato a la Lavanda", quantity: 1, unitPrice: 1680 }
    ]
  },
  {
    id: "#0015",
    table: "Para Llevar",
    type: "takeaway",
    status: "Entregado",
    total: 1510,
    createdAt: ts,
    createdBy: employeeUserId,
    customerName: "Carlos Ibarra",
    customerPhone: "+1 809 555 5798",
    items: [
      { menuItemId: "menu-vieiras-citricos", name: "Vieiras al Fuego de Citricos", quantity: 1, unitPrice: 760 },
      { menuItemId: "menu-pavlova-frutos-rojos", name: "Pavlova de Frutos Rojos", quantity: 1, unitPrice: 390 },
      { menuItemId: "menu-limonada-jengibre", name: "Limonada de Jengibre", quantity: 2, unitPrice: 180 }
    ]
  }
];

const reservations: Reservation[] = [
  { id: "#3012", date: "2026-04-08", hour: "19:30", guests: 4, name: "Laura Campos", email: "cliente@kitchai.com", phone: "+1 809 555 5799", status: "Confirmada", createdAt: ts },
  { id: "#3013", date: "2026-04-09", hour: "20:00", guests: 2, name: "Carlos Ibarra", email: "vip@kitchai.com", phone: "+1 809 555 5798", status: "Pendiente", createdAt: ts },
  { id: "#3014", date: "2026-04-10", hour: "21:00", guests: 6, name: "Paola De La Cruz", email: "paola@example.com", phone: "+1 809 555 5715", status: "Pendiente", createdAt: ts }
];

export const seedData: DbSchema = {
  users,
  sessions: [],
  menuItems,
  employees: [
    { id: "emp-admin-manuel", userId: adminUserId, salary: 82000 },
    { id: "emp-admin-lucia", userId: opsAdminUserId, salary: 76000 },
    { id: "emp-maria", userId: employeeUserId, salary: 42000 },
    { id: "emp-diego", userId: employeeChefUserId, salary: 47000 }
  ],
  orders,
  reservations,
  inventoryItems,
  inventoryMovements: [
    { id: "mov-001", itemId: "inv-vieiras", type: "out", quantity: 2, note: "Servicio de degustacion del mediodia", createdAt: ts, createdBy: employeeChefUserId },
    { id: "mov-002", itemId: "inv-frutos-rojos", type: "adjustment", quantity: 8, note: "Recuento de cierre", createdAt: ts, createdBy: opsAdminUserId },
    { id: "mov-003", itemId: "inv-platano", type: "in", quantity: 10, note: "Recepcion de proveedor local", createdAt: ts, createdBy: adminUserId },
    { id: "mov-004", itemId: "inv-salmon", type: "out", quantity: 3, note: "Preparacion de turno noche", createdAt: ts, createdBy: employeeChefUserId }
  ],
  activity: [
    { id: "activity-001", user: "Lucia Navarro", action: "actualizo", detail: "inventario de frutos rojos", time: "2026-04-08 10:15" },
    { id: "activity-002", user: "Maria Gomez", action: "creo", detail: "pedido #0018", time: "2026-04-08 10:22" },
    { id: "activity-003", user: "Manuel Guzman", action: "gestiono", detail: "cuentas del personal", time: "2026-04-08 09:48" },
    { id: "activity-004", user: "Diego Mendoza", action: "preparo", detail: "mise en place de salmon y risotto", time: "2026-04-08 11:06" }
  ]
};
