import crypto from "node:crypto";
import bcrypt from "bcryptjs";

export const nowIso = () => new Date().toISOString();
export const id = () => crypto.randomUUID();

/** Genera un hash seguro con bcrypt (salt rounds = 12) */
export const hash = (value: string) => bcrypt.hashSync(value, 12);

/** Verifica un valor contra un hash bcrypt */
export const verifyHash = (value: string, digest: string) =>
  bcrypt.compareSync(value, digest);

export const inventoryStatus = (
  quantity: number,
  minStock: number
): "Normal" | "Bajo" | "Critico" => {
  if (quantity <= minStock * 0.5) return "Critico";
  if (quantity < minStock) return "Bajo";
  return "Normal";
};
