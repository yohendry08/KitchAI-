import type { NextFunction, Request, Response } from "express";
import { readDb } from "./db.js";
import type { Role, User } from "./types.js";

declare global {
  namespace Express {
    interface Request {
      currentUser?: User;
    }
  }
}

const SESSION_TTL_MS =
  Number(process.env.SESSION_TTL_HOURS ?? 24) * 3_600_000;

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const auth = req.headers.authorization;
  const token = auth?.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return res.status(401).json({ message: "Token requerido" });

  const db = readDb();
  const now = Date.now();
  const session = db.sessions.find(
    (s) =>
      s.token === token &&
      now - new Date(s.createdAt).getTime() < SESSION_TTL_MS,
  );
  if (!session) return res.status(401).json({ message: "Sesion invalida o expirada" });

  const user = db.users.find((u) => u.id === session.userId && u.active);
  if (!user) return res.status(401).json({ message: "Usuario no valido" });

  req.currentUser = user;
  return next();
};

export const requireRole =
  (roles: Role[]) => (req: Request, res: Response, next: NextFunction) => {
    if (!req.currentUser) return res.status(401).json({ message: "No autenticado" });
    if (!roles.includes(req.currentUser.role)) {
      return res.status(403).json({
        message: "No autorizado",
        errors: {
          fieldErrors: {},
          globalErrors: ["No tienes permisos para esta operacion"]
        }
      });
    }
    return next();
  };

