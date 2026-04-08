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

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

const registerUser = async () => {
  const unique = Date.now();
  const payload = {
    firstName: "Smoke",
    lastName: "Client",
    email: `smoke-client-${unique}@kitchai.test`,
    password: PASSWORD,
    phone: `+1 999 ${String(unique).slice(-4)}`,
  };

  const result = await jsonFetch("/auth/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  assert(result.status === 201, `Expected register 201, got ${result.status}`);
  return payload.email;
};

const login = async (email) => {
  const result = await jsonFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert(result.ok, `Login failed for ${email}: ${JSON.stringify(result.body)}`);
  assert(Boolean(result.body?.token), `Missing token in login response for ${email}`);
  return result.body.token;
};

const run = async () => {
  const health = await jsonFetch("/health");
  assert(health.ok, "Expected /health to succeed");
  assert(Boolean(health.body?.persistence?.mode), "Expected /health.persistence.mode");

  const adminToken = await login("admin@kitchai.com");
  const employeeToken = await login("empleado@kitchai.com");
  const clientToken = await login("cliente@kitchai.com");

  const adminDashboard = await jsonFetch("/dashboard/admin", {
    headers: { Authorization: `Bearer ${adminToken}` },
  });
  assert(adminDashboard.status === 200, `Expected /dashboard/admin 200, got ${adminDashboard.status}`);

  const employeeDashboard = await jsonFetch("/dashboard/employee", {
    headers: { Authorization: `Bearer ${employeeToken}` },
  });
  assert(
    employeeDashboard.status === 200,
    `Expected /dashboard/employee 200, got ${employeeDashboard.status}`,
  );

  const clientDashboard = await jsonFetch("/dashboard/client", {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert(clientDashboard.status === 200, `Expected /dashboard/client 200, got ${clientDashboard.status}`);

  const clientSeesAdminDashboard = await jsonFetch("/dashboard/admin", {
    headers: { Authorization: `Bearer ${clientToken}` },
  });
  assert(clientSeesAdminDashboard.status === 403, "Expected client to be rejected from admin dashboard");

  const invalidLogin = await jsonFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email: "admin@kitchai.com", password: "bad-password" }),
  });
  assert(invalidLogin.status === 401, "Expected invalid login to return 401");

  const registeredEmail = await registerUser();
  const registeredToken = await login(registeredEmail);

  const me = await jsonFetch("/auth/me", {
    headers: { Authorization: `Bearer ${registeredToken}` },
  });
  assert(me.status === 200, `Expected /auth/me 200 for registered user, got ${me.status}`);
  assert(me.body?.email === registeredEmail.toLowerCase(), "Expected /auth/me email to match registered user");

  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: {
          health: true,
          dashboardAdmin: true,
          dashboardEmployee: true,
          dashboardClient: true,
          roleGuard: true,
          invalidLoginRejected: true,
          registerAndHydrate: true,
        },
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
