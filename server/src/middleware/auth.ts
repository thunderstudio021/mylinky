import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";

export interface AuthRequest extends Request {
  user?: { id: string; email: string };
}

async function resolveUser(token: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return { id: data.user.id, email: data.user.email! };
}

export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token de autenticação ausente" });
  }
  const user = await resolveUser(header.slice(7));
  if (!user) return res.status(401).json({ error: "Token inválido ou expirado" });
  req.user = user;
  next();
}

export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    const user = await resolveUser(header.slice(7));
    if (user) req.user = user;
  }
  next();
}
