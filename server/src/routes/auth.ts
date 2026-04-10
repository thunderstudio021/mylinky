import { Router, Request, Response } from "express";
import { z } from "zod";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  username: z.string().min(3).regex(/^[a-z0-9_]+$/, "Username: apenas letras minúsculas, números e _"),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post("/register", async (req: Request, res: Response) => {
  const parse = registerSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { email, password, name, username } = parse.data;

  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (existing) return res.status(409).json({ error: "Username já em uso" });

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, username },
  });

  if (error || !data.user) {
    return res.status(400).json({ error: error?.message ?? "Erro ao registrar" });
  }

  await supabaseAdmin.from("profiles").update({ name, username }).eq("id", data.user.id);

  return res.status(201).json({ message: "Usuário criado com sucesso", userId: data.user.id });
});

// POST /api/auth/login
router.post("/login", async (req: Request, res: Response) => {
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.errors });

  const { email, password } = parse.data;
  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email, password });

  if (error || !data.session) {
    return res.status(401).json({ error: "Credenciais inválidas" });
  }

  return res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    user: { id: data.user.id, email: data.user.email },
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("*")
    .eq("id", req.user!.id)
    .maybeSingle();

  if (!profile) return res.status(404).json({ error: "Perfil não encontrado" });

  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("role")
    .eq("user_id", req.user!.id);

  return res.json({ ...profile, roles: roles?.map((r) => r.role) ?? [] });
});

// POST /api/auth/refresh
router.post("/refresh", async (req: Request, res: Response) => {
  const { refresh_token } = req.body;
  if (!refresh_token) return res.status(400).json({ error: "refresh_token obrigatório" });

  const { data, error } = await supabaseAdmin.auth.refreshSession({ refresh_token });
  if (error || !data.session) return res.status(401).json({ error: "Token inválido" });

  return res.json({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });
});

// PUT /api/auth/password
router.put("/password", requireAuth, async (req: AuthRequest, res: Response) => {
  const { new_password } = req.body;
  if (!new_password || new_password.length < 6) {
    return res.status(400).json({ error: "Senha deve ter pelo menos 6 caracteres" });
  }

  const { error } = await supabaseAdmin.auth.admin.updateUserById(req.user!.id, {
    password: new_password,
  });

  if (error) return res.status(400).json({ error: error.message });
  return res.json({ message: "Senha atualizada" });
});

// POST /api/auth/forgot-password
router.post("/forgot-password", async (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email obrigatório" });

  await supabaseAdmin.auth.resetPasswordForEmail(email, {
    redirectTo: `${process.env.CORS_ORIGIN}/reset-password`,
  });

  return res.json({ message: "Se o email existir, um link de recuperação foi enviado" });
});

export default router;
