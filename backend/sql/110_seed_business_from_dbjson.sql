BEGIN;

TRUNCATE TABLE order_items, orders, menu_items, users RESTART IDENTITY CASCADE;

INSERT INTO users (
  id, name, email, phone, password_hash, role_id, failed_login_attempts, locked_until, created_at, updated_at
) VALUES (
  '51f89870-2cff-495f-9ea2-f832e4fd2c07',
  'Manuel Guzman',
  'admin@kitchai.com',
  '+1 234 570',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'uuid-role-admin',
  0,
  NULL,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  updated_at = NOW();

INSERT INTO users (
  id, name, email, phone, password_hash, role_id, failed_login_attempts, locked_until, created_at, updated_at
) VALUES (
  '7d44a917-69a1-4b3d-a6bd-87628a087c08',
  'Maria Gomez',
  'empleado@kitchai.com',
  '+1 234 567',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'uuid-role-employee',
  0,
  NULL,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  updated_at = NOW();

INSERT INTO users (
  id, name, email, phone, password_hash, role_id, failed_login_attempts, locked_until, created_at, updated_at
) VALUES (
  'ceb88d49-a60a-4eee-bc5f-afed4aab46bd',
  'Cliente Demo',
  'cliente@kitchai.com',
  '+1 234 999',
  '8d969eef6ecad3c29a3a629280e686cf0c3f5d5a86aff3ca12020c923adc6c92',
  'uuid-role-client',
  0,
  NULL,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  password_hash = EXCLUDED.password_hash,
  role_id = EXCLUDED.role_id,
  updated_at = NOW();

INSERT INTO menu_items (
  id, name, description, price, is_active, created_at, updated_at
) VALUES (
  '1e5cf10a-c522-4243-a28b-061f63ae4b71',
  'Caprese Salad',
  'Rodaja de tomate fresco, mozzarella y albahaca.',
  8,
  TRUE,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO menu_items (
  id, name, description, price, is_active, created_at, updated_at
) VALUES (
  'ef8ef245-6e9c-4a26-9dee-a264517ae602',
  'Grilled Salmon',
  'Filete de salmon a la parrilla con esparragos.',
  16,
  TRUE,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO menu_items (
  id, name, description, price, is_active, created_at, updated_at
) VALUES (
  '878b24c2-87ce-46aa-9939-057c0a12a77a',
  'Tiramisu',
  'Postre clasico italiano con mascarpone.',
  7.5,
  TRUE,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

INSERT INTO orders (
  id, order_number, customer_name, customer_phone, table_number, status, total_amount,
  tax_amount, discount_amount, final_amount, payment_status, payment_method, special_instructions,
  waiter_id, cancelled_by, cancelled_at, created_at, updated_at, completed_at
) VALUES (
  '#0016',
  '#0016',
  'Cliente General',
  NULL,
  2,
  'pending',
  40,
  0,
  0,
  40,
  'unpaid',
  NULL,
  NULL,
  '7d44a917-69a1-4b3d-a6bd-87628a087c08',
  NULL,
  NULL,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW(),
  NULL
)
ON CONFLICT (id) DO UPDATE SET
  order_number = EXCLUDED.order_number,
  table_number = EXCLUDED.table_number,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount,
  final_amount = EXCLUDED.final_amount,
  waiter_id = EXCLUDED.waiter_id,
  updated_at = NOW();

INSERT INTO orders (
  id, order_number, customer_name, customer_phone, table_number, status, total_amount,
  tax_amount, discount_amount, final_amount, payment_status, payment_method, special_instructions,
  waiter_id, cancelled_by, cancelled_at, created_at, updated_at, completed_at
) VALUES (
  '#0015',
  '#0015',
  'Cliente General',
  NULL,
  3,
  'served',
  68,
  0,
  0,
  68,
  'unpaid',
  NULL,
  NULL,
  '7d44a917-69a1-4b3d-a6bd-87628a087c08',
  NULL,
  NULL,
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz,
  NOW(),
  COALESCE('2026-02-18T02:02:28.495Z', NOW()::text)::timestamptz
)
ON CONFLICT (id) DO UPDATE SET
  order_number = EXCLUDED.order_number,
  table_number = EXCLUDED.table_number,
  status = EXCLUDED.status,
  total_amount = EXCLUDED.total_amount,
  final_amount = EXCLUDED.final_amount,
  waiter_id = EXCLUDED.waiter_id,
  updated_at = NOW();

COMMIT;
