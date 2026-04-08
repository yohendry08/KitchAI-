import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptFile = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptFile);
const backendDir = path.resolve(scriptDir, "..");

const dbJsonPath = path.resolve(backendDir, "data", "db.json");
const outputSqlPath = path.resolve(backendDir, "sql", "002_seed_from_dbjson.sql");

if (!fs.existsSync(dbJsonPath)) {
  console.error(`No se encontro el archivo: ${dbJsonPath}`);
  process.exit(1);
}

const raw = fs.readFileSync(dbJsonPath, "utf8");
const parsed = JSON.parse(raw);
const compactJson = JSON.stringify(parsed);
const escaped = compactJson.replace(/'/g, "''");

const sql = `BEGIN;
INSERT INTO app_state (id, data, updated_at)
VALUES (1, '${escaped}'::jsonb, NOW())
ON CONFLICT (id) DO UPDATE
SET data = EXCLUDED.data,
    updated_at = NOW();
COMMIT;
`;

fs.writeFileSync(outputSqlPath, sql, "utf8");
console.log(`SQL generado en: ${outputSqlPath}`);
