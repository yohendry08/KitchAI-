import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";
import type { DbSchema } from "./types.js";
import { seedData } from "./seed.js";

const dataDir = path.resolve(process.cwd(), "data");
const dbPath = path.join(dataDir, "db.json");
const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV || "development";
const APP_STATE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  data JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
)
`;

let pool: Pool | null = null;
let cachedDb: DbSchema | null = null;
let initialized = false;
let persistenceMode: "postgres" | "json-fallback" | "uninitialized" = "uninitialized";

const isProductionCapableMode = () => NODE_ENV !== "development";

const ensureFallbackAllowed = () => {
  if (isProductionCapableMode()) {
    throw new Error(
      "DATABASE_URL is required when NODE_ENV is not development. Refusing JSON fallback in production-capable mode."
    );
  }
};

const ensureDataFile = () => {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(seedData, null, 2), "utf-8");
  }
};

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

const readDbFile = (): DbSchema => {
  ensureDataFile();
  const raw = fs.readFileSync(dbPath, "utf-8");
  return JSON.parse(raw) as DbSchema;
};

const writeDbFile = (db: DbSchema) => {
  fs.writeFileSync(dbPath, JSON.stringify(db, null, 2), "utf-8");
};

const persistToPostgres = async (db: DbSchema) => {
  if (!pool) return;
  await pool.query(APP_STATE_TABLE_SQL);
  await pool.query(
    `
    INSERT INTO app_state (id, data, updated_at)
    VALUES (1, $1::jsonb, NOW())
    ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data,
          updated_at = NOW()
    `,
    [JSON.stringify(db)]
  );
};

export const initDb = async () => {
  if (initialized) return;
  initialized = true;

  if (!DATABASE_URL) {
    ensureFallbackAllowed();
    cachedDb = readDbFile();
    persistenceMode = "json-fallback";
    return;
  }

  try {
    pool = new Pool({ connectionString: DATABASE_URL });
    await pool.query(APP_STATE_TABLE_SQL);
    const { rows } = await pool.query<{ data: DbSchema }>(
      "SELECT data FROM app_state WHERE id = 1 LIMIT 1"
    );

    if (rows.length > 0) {
      cachedDb = rows[0].data;
      persistenceMode = "postgres";
      return;
    }

    const initial = fs.existsSync(dbPath) ? readDbFile() : deepClone(seedData);
    cachedDb = initial;
    await persistToPostgres(initial);
    persistenceMode = "postgres";
  } catch (error) {
    pool = null;
    throw new Error(
      `PostgreSQL init failed while DATABASE_URL is configured. Canonical persistence cannot fallback. ${
        error instanceof Error ? error.message : "Unknown PostgreSQL error"
      }`
    );
  }
};

export const readDb = (): DbSchema => {
  if (!cachedDb) {
    if (!DATABASE_URL) {
      ensureFallbackAllowed();
      cachedDb = fs.existsSync(dbPath) ? readDbFile() : deepClone(seedData);
      persistenceMode = "json-fallback";
    } else {
      throw new Error("Database not initialized. Call initDb() before readDb() when DATABASE_URL is configured.");
    }
  }
  return deepClone(cachedDb);
};

export const writeDb = async (db: DbSchema) => {
  cachedDb = deepClone(db);
  if (persistenceMode === "json-fallback") {
    writeDbFile(cachedDb);
    return;
  }

  if (persistenceMode !== "postgres") {
    throw new Error("Persistence mode is not initialized. Call initDb() before writeDb().");
  }

  await persistToPostgres(cachedDb);
};

export const getPersistenceStatus = () => ({
  mode: persistenceMode,
  canonical: persistenceMode === "postgres" ? "postgres" : "json-fallback",
  databaseUrlConfigured: Boolean(DATABASE_URL),
  nodeEnv: NODE_ENV,
  fallbackAllowed: !DATABASE_URL && !isProductionCapableMode()
});
