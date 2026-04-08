const API_URL = process.env.API_URL || "http://localhost:4000";
const PASSWORD = process.env.SEED_DEFAULT_PASSWORD || "123456";

const jsonFetch = async (path, init = {}) => {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { ok: response.ok, status: response.status, body };
};

const login = async (email) => {
  const result = await jsonFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  if (!result.ok || !result.body?.token) {
    throw new Error(`Login failed for ${email}: ${JSON.stringify(result.body)}`);
  }
  return result.body.token;
};

const assert = (condition, message) => {
  if (!condition) {
    throw new Error(message);
  }
};

const run = async () => {
  const employeeToken = await login("empleado@kitchai.com");
  const clientToken = await login("cliente@kitchai.com");

  const options = await jsonFetch("/orders/options", {
    headers: { Authorization: `Bearer ${employeeToken}` },
  });
  assert(options.ok, `Expected /orders/options to succeed, got ${options.status}`);

  const firstTable = options.body?.tables?.[0]?.name || "Mesa 1";
  const menuItems = await jsonFetch("/menu-items?q=&category=Todos", {
    headers: { Authorization: `Bearer ${employeeToken}` },
  });
  assert(menuItems.ok && Array.isArray(menuItems.body) && menuItems.body.length > 0, "Expected menu items available");

  const item = menuItems.body[0];

  const validationFailure = await jsonFetch("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({ table: firstTable, type: "salon", items: [] }),
  });
  assert(validationFailure.status === 400, "Expected validation failure for empty order items");
  assert(Boolean(validationFailure.body?.errors?.fieldErrors?.items), "Expected fieldErrors.items in validation payload");

  const unauthorizedMutation = await jsonFetch("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({
      table: firstTable,
      type: "salon",
      items: [
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 1,
          unitPrice: Number(item.price),
        },
      ],
    }),
  });
  assert(unauthorizedMutation.status === 403, "Expected client order mutation to be rejected with 403");

  const created = await jsonFetch("/orders", {
    method: "POST",
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({
      table: firstTable,
      type: "salon",
      items: [
        {
          menuItemId: item.id,
          name: item.name,
          quantity: 2,
          unitPrice: Number(item.price),
        },
      ],
      note: "smoke-live-order",
    }),
  });
  assert(
    created.status === 201,
    `Expected order create 201, got ${created.status} body=${JSON.stringify(created.body)}`,
  );
  assert(created.body?.id && created.body?.status, "Expected order response to include id and status");

  const unauthorizedStatusUpdate = await jsonFetch(`/orders/${encodeURIComponent(created.body.id)}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ status: "Entregado" }),
  });
  assert(unauthorizedStatusUpdate.status === 403, "Expected client status mutation to be rejected with 403");

  const employeeStatusUpdate = await jsonFetch(`/orders/${encodeURIComponent(created.body.id)}/status`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${employeeToken}` },
    body: JSON.stringify({ status: "Entregado" }),
  });
  assert(employeeStatusUpdate.status === 200, "Expected employee status mutation to succeed");
  assert(employeeStatusUpdate.body?.status === "Entregado", "Expected updated order status to be Entregado");

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: {
          validationFailure: true,
          unauthorizedMutation: true,
          unauthorizedStatusMutation: true,
          authorizedStatusMutation: true,
          orderCreated: true,
        },
        orderId: created.body.id,
      },
      null,
      2,
    ),
  );
};

run().catch((error) => {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown smoke failure",
      },
      null,
      2,
    ),
  );
  process.exit(1);
});
