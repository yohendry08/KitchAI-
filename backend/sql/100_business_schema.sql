BEGIN;

-- ============================================
-- Tabla: roles
-- ============================================
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: permissions
-- ============================================
CREATE TABLE IF NOT EXISTS permissions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: users
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role_id TEXT NOT NULL REFERENCES roles(id),
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: role_permissions
-- ============================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id TEXT PRIMARY KEY,
  role_id TEXT NOT NULL REFERENCES roles(id),
  permission_id TEXT NOT NULL REFERENCES permissions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (role_id, permission_id)
);

-- ============================================
-- Tabla: jwt_blacklist
-- ============================================
CREATE TABLE IF NOT EXISTS jwt_blacklist (
  id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  revoked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ============================================
-- Tabla: login_attempts
-- ============================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  success SMALLINT NOT NULL CHECK (success IN (0, 1)),
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: menu_items
-- ============================================
CREATE TABLE IF NOT EXISTS menu_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(12, 2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Tabla: orders
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_name TEXT NOT NULL,
  customer_phone TEXT,
  table_number INTEGER,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')),
  total_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  tax_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  final_amount NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (final_amount >= 0),
  payment_status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded')),
  payment_method TEXT
    CHECK (payment_method IN ('cash', 'card', 'transfer') OR payment_method IS NULL),
  special_instructions TEXT,
  waiter_id TEXT NOT NULL REFERENCES users(id),
  cancelled_by TEXT REFERENCES users(id),
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- Tabla: order_items
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id TEXT NOT NULL REFERENCES menu_items(id),
  menu_item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0),
  subtotal NUMERIC(12, 2) NOT NULL CHECK (subtotal >= 0),
  special_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- Índices
-- ============================================
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_permission ON role_permissions(permission_id);
CREATE INDEX IF NOT EXISTS idx_jwt_blacklist_token ON jwt_blacklist(token);
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_menu_items_active ON menu_items(is_active);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_waiter ON orders(waiter_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menu_item ON order_items(menu_item_id);

-- ============================================
-- Triggers y funciones
-- ============================================
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION recalculate_order_totals(target_order_id TEXT)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE orders o
  SET
    total_amount = COALESCE((
      SELECT SUM(oi.subtotal)
      FROM order_items oi
      WHERE oi.order_id = target_order_id
    ), 0),
    tax_amount = COALESCE((
      SELECT SUM(oi.subtotal)
      FROM order_items oi
      WHERE oi.order_id = target_order_id
    ), 0) * 0.18,
    final_amount = (
      COALESCE((
        SELECT SUM(oi.subtotal)
        FROM order_items oi
        WHERE oi.order_id = target_order_id
      ), 0)
      +
      (COALESCE((
        SELECT SUM(oi.subtotal)
        FROM order_items oi
        WHERE oi.order_id = target_order_id
      ), 0) * 0.18)
      -
      o.discount_amount
    )
  WHERE o.id = target_order_id;
END;
$$;

CREATE OR REPLACE FUNCTION trg_order_items_recalculate()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_order_totals(OLD.order_id);
    RETURN OLD;
  END IF;

  PERFORM recalculate_order_totals(NEW.order_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION prevent_update_if_not_pending()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF OLD.status <> 'pending' THEN
    RAISE EXCEPTION 'Solo se pueden modificar pedidos en estado pendiente';
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION set_cancelled_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status <> 'cancelled' THEN
    NEW.cancelled_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_users_set_updated_at ON users;
CREATE TRIGGER trg_users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS trg_menu_items_set_updated_at ON menu_items;
CREATE TRIGGER trg_menu_items_set_updated_at
BEFORE UPDATE ON menu_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS trg_orders_set_updated_at ON orders;
CREATE TRIGGER trg_orders_set_updated_at
BEFORE UPDATE ON orders
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();

DROP TRIGGER IF EXISTS trg_recalculate_order_after_insert ON order_items;
CREATE TRIGGER trg_recalculate_order_after_insert
AFTER INSERT ON order_items
FOR EACH ROW
EXECUTE FUNCTION trg_order_items_recalculate();

DROP TRIGGER IF EXISTS trg_recalculate_order_after_update ON order_items;
CREATE TRIGGER trg_recalculate_order_after_update
AFTER UPDATE ON order_items
FOR EACH ROW
EXECUTE FUNCTION trg_order_items_recalculate();

DROP TRIGGER IF EXISTS trg_recalculate_order_after_delete ON order_items;
CREATE TRIGGER trg_recalculate_order_after_delete
AFTER DELETE ON order_items
FOR EACH ROW
EXECUTE FUNCTION trg_order_items_recalculate();

DROP TRIGGER IF EXISTS trg_prevent_update_if_not_pending ON orders;
CREATE TRIGGER trg_prevent_update_if_not_pending
BEFORE UPDATE ON orders
FOR EACH ROW
WHEN (OLD.status <> 'pending')
EXECUTE FUNCTION prevent_update_if_not_pending();

DROP TRIGGER IF EXISTS trg_set_cancelled_timestamp ON orders;
CREATE TRIGGER trg_set_cancelled_timestamp
BEFORE UPDATE OF status ON orders
FOR EACH ROW
EXECUTE FUNCTION set_cancelled_timestamp();

-- ============================================
-- Seed base
-- ============================================
INSERT INTO roles (id, name, description) VALUES
  ('uuid-role-admin', 'admin', 'Administrador con acceso total'),
  ('uuid-role-employee', 'employee', 'Empleado con acceso a inventario y reportes'),
  ('uuid-role-waiter', 'waiter', 'Mesero con acceso a pedidos y mesas'),
  ('uuid-role-client', 'client', 'Cliente del restaurante')
ON CONFLICT (id) DO NOTHING;

INSERT INTO permissions (id, name, description) VALUES
  ('perm-1', 'manage_users', 'Gestionar usuarios'),
  ('perm-2', 'manage_inventory', 'Gestionar inventario'),
  ('perm-3', 'view_reports', 'Ver reportes'),
  ('perm-4', 'manage_orders', 'Gestionar pedidos'),
  ('perm-5', 'view_tables', 'Ver mesas')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (id, role_id, permission_id) VALUES
  ('rp-1', 'uuid-role-admin', 'perm-1'),
  ('rp-2', 'uuid-role-admin', 'perm-2'),
  ('rp-3', 'uuid-role-admin', 'perm-3'),
  ('rp-4', 'uuid-role-admin', 'perm-4'),
  ('rp-5', 'uuid-role-admin', 'perm-5'),
  ('rp-6', 'uuid-role-employee', 'perm-2'),
  ('rp-7', 'uuid-role-employee', 'perm-3'),
  ('rp-8', 'uuid-role-waiter', 'perm-4'),
  ('rp-9', 'uuid-role-waiter', 'perm-5')
ON CONFLICT (id) DO NOTHING;

COMMIT;
