import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.js";
import { supabaseAdmin } from "../supabaseAdmin.js";

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Não autenticado" });

  const { data } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", req.user.id)
    .eq("role", "admin")
    .maybeSingle();

  if (!data) return res.status(403).json({ error: "Acesso restrito a administradores" });
  next();
}

export async function requireCreator(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user) return res.status(401).json({ error: "Não autenticado" });

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("is_creator")
    .eq("id", req.user.id)
    .maybeSingle();

  if (!data?.is_creator) return res.status(403).json({ error: "Acesso restrito a criadores" });
  next();
}
