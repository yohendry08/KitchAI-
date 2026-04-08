# KitchAI

Sistema de gestión para restaurantes potenciado por IA.

## Stack

| Capa | Tecnología |
|------|-----------|
| Frontend | Next.js 14 · Tailwind CSS · shadcn/ui |
| Backend | Node.js · TypeScript · Express |
| Base de datos | PostgreSQL |
| Infraestructura | Docker · Docker Compose |

## Inicio rápido

### Con Docker

```bash
docker compose up --build
```

### Desarrollo local

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
pnpm install
pnpm dev
```

## Variables de entorno

Copia `.env.example` (si existe) a `.env` y ajusta los valores según tu entorno.

Variables clave para integracion frontend-backend:

- `NEXT_PUBLIC_API_URL=/api`: base publica estable usada por el frontend.
- `BACKEND_INTERNAL_URL`: destino real del proxy de Next.js (`http://localhost:4000` en local, `http://backend:4000` en Docker).
- `API_BASE_PATH=/api`: ruta base API canónica en runtime.
- `APP_ORIGIN` / `FRONTEND_ORIGIN`: origen permitido por CORS para el backend.

Con este contrato, el frontend siempre consume `/api/*` y Next.js reenvia al backend segun `BACKEND_INTERNAL_URL`.

## Módulos Principales

### Backend (Node.js con Express y PostgreSQL)

Los módulos del backend manejan la lógica del servidor, autenticación y persistencia de datos.

- **auth.ts**: Gestiona la autenticación de usuarios, incluyendo login, registro, verificación de roles (cliente, empleado, administrador) y manejo de sesiones.
- **db.ts**: Maneja la conexión a la base de datos PostgreSQL, incluyendo operaciones CRUD, inicialización de esquemas y fallback a archivos JSON locales.
- **index.ts**: Servidor principal que define los endpoints de la API REST para autenticación, gestión de usuarios, pedidos, inventario, reportes y reservas.
- **seed.ts**: Proporciona datos iniciales para poblar la base de datos al iniciar la aplicación.
- **types.ts**: Define los tipos TypeScript para estructuras de datos como usuarios, pedidos, inventario y reservas.
- **utils.ts**: Contiene funciones utilitarias como hashing de contraseñas, generación de IDs únicos, manejo de fechas y validaciones.

**Scripts adicionales**:
- `scripts/migrate-dbjson-to-postgres.mjs`: Migra datos de un archivo JSON a PostgreSQL.
- `scripts/migrate-dbjson-to-business-schema.mjs`: Migra datos al esquema de negocio actualizado.
- `sql/`: Archivos SQL para inicialización de base de datos, semillas y esquemas.

### Frontend (Next.js con React y Tailwind CSS)

Los módulos del frontend manejan la interfaz de usuario y la interacción con la API.

- **Páginas principales**:
  - `admin/`: Panel de administración para configurar empleados, inventario, menú y ver reportes.
  - `cliente/`: Interfaz para clientes, incluyendo visualización de menú y realización de pedidos/reservas.
  - `empleado/`: Dashboard para empleados, con acceso a chat, inventario y gestión de pedidos.
  - `login/`: Página de inicio de sesión.
  - `register/`: Página de registro de nuevos usuarios.
  - `page.tsx`: Página de inicio (landing page) con información pública del restaurante.

- **Componentes**:
  - `dashboard/`: Componentes para dashboards (layout, tarjetas KPI, sidebar de navegación, barra superior, badges de estado).
  - `public/`: Componentes para páginas públicas (hero section, navbar, footer, sección de menú, contacto, prensa, reservas).
  - `ui/`: Componentes reutilizables de UI (botones, formularios, tablas, modales, calendarios, etc., basados en shadcn/ui).
  - `theme-provider.tsx`: Gestiona el tema de la aplicación (modo claro/oscuro).

- **Otros**:
  - `lib/api.ts`: Cliente para llamadas a la API del backend.
  - `lib/auth.ts`: Utilidades de autenticación en el frontend.
  - `lib/data.ts`: Manejo de datos y estado local.
  - `lib/site-config.ts`: Configuración del sitio.
  - `lib/utils.ts`: Funciones utilitarias del frontend.
  - `hooks/`: Hooks personalizados (manejo de responsive, toasts).

## Estructura del proyecto

```
KitchAI/
├── backend/        # API REST (Node.js + TypeScript)
├── frontend/       # Aplicación web (Next.js)
├── docker-compose.yml
└── README.md
```
