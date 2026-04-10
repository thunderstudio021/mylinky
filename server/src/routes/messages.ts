import { Router, Response } from "express";
import { supabaseAdmin } from "../supabaseAdmin.js";
import { requireAuth, AuthRequest } from "../middleware/auth.js";

const router = Router();

// GET /api/messages/conversations — lista conversas do usuário
router.get("/conversations", requireAuth, async (req: AuthRequest, res: Response) => {
  const { data } = await supabaseAdmin
    .from("conversations")
    .select(
      `*,
      p1:profiles!conversations_participant_1_fkey(id, username, name, avatar_url),
      p2:profiles!conversations_participant_2_fkey(id, username, name, avatar_url)`
    )
    .or(`participant_1.eq.${req.user!.id},participant_2.eq.${req.user!.id}`)
    .order("last_message_at", { ascending: false });

  return res.json(data ?? []);
});

// POST /api/messages/conversations — iniciar conversa
router.post("/conversations", requireAuth, async (req: AuthRequest, res: Response) => {
  const { other_user_id } = req.body;
  if (!other_user_id) return res.status(400).json({ error: "other_user_id obrigatório" });
  if (other_user_id === req.user!.id) return res.status(400).json({ error: "Não pode conversar consigo mesmo" });

  // Verifica se já existe
  const { data: existing } = await supabaseAdmin
    .from("conversations")
    .select("*")
    .or(
      `and(participant_1.eq.${req.user!.id},participant_2.eq.${other_user_id}),and(participant_1.eq.${other_user_id},participant_2.eq.${req.user!.id})`
    )
    .maybeSingle();

  if (existing) return res.json(existing);

  const { data, error } = await supabaseAdmin
    .from("conversations")
    .insert({ participant_1: req.user!.id, participant_2: other_user_id })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });
  return res.status(201).json(data);
});

// GET /api/messages/:conversationId — mensagens da conversa
router.get("/:conversationId", requireAuth, async (req: AuthRequest, res: Response) => {
  // Verifica se o usuário faz parte da conversa
  const { data: convo } = await supabaseAdmin
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", req.params.conversationId)
    .maybeSingle();

  if (!convo) return res.status(404).json({ error: "Conversa não encontrada" });
  if (convo.participant_1 !== req.user!.id && convo.participant_2 !== req.user!.id) {
    return res.status(403).json({ error: "Sem permissão" });
  }

  const page = parseInt(req.query.page as string ?? "1");
  const limit = Math.min(parseInt(req.query.limit as string ?? "50"), 100);
  const from = (page - 1) * limit;

  const { data } = await supabaseAdmin
    .from("messages")
    .select("*, profiles(id, username, name, avatar_url)")
    .eq("conversation_id", req.params.conversationId)
    .order("created_at", { ascending: false })
    .range(from, from + limit - 1);

  return res.json(data ?? []);
});

// POST /api/messages/:conversationId — enviar mensagem
router.post("/:conversationId", requireAuth, async (req: AuthRequest, res: Response) => {
  const { content } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "Conteúdo da mensagem obrigatório" });

  const { data: convo } = await supabaseAdmin
    .from("conversations")
    .select("participant_1, participant_2")
    .eq("id", req.params.conversationId)
    .maybeSingle();

  if (!convo) return res.status(404).json({ error: "Conversa não encontrada" });
  if (convo.participant_1 !== req.user!.id && convo.participant_2 !== req.user!.id) {
    return res.status(403).json({ error: "Sem permissão" });
  }

  const { data, error } = await supabaseAdmin
    .from("messages")
    .insert({
      conversation_id: req.params.conversationId,
      sender_id: req.user!.id,
      content: content.trim(),
    })
    .select("*, profiles(id, username, name, avatar_url)")
    .single();

  if (error) return res.status(400).json({ error: error.message });

  // Atualiza timestamp da última mensagem
  await supabaseAdmin
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", req.params.conversationId);

  return res.status(201).json(data);
});

export default router;
