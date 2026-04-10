import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AppAvatar } from "@/components/AppAvatar";
import { motion, AnimatePresence } from "framer-motion";
import { useParams, useNavigate } from "react-router-dom";

interface Conversation {
  id: string;
  participant_1: string;
  participant_2: string;
  last_message_at: string;
  otherUser: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    verified: boolean;
  };
  lastMessage?: string;
  unreadCount: number;
}

interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const Chat = () => {
  const { user } = useAuth();
  const { userId: paramUserId } = useParams<{ userId?: string }>();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [opening, setOpening] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  };

  // ── Load conversation list ─────────────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    if (!user) return;

    const { data: convs } = await supabase
      .from("conversations")
      .select("*")
      .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
      .order("last_message_at", { ascending: false });

    if (!convs || convs.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    const otherIds = convs.map(c =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, verified")
      .in("id", otherIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Batch: last message + unread count per conversation
    const enriched: Conversation[] = await Promise.all(
      convs.map(async c => {
        const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
        const p = profileMap.get(otherId);

        const [{ data: lastMsgArr }, { count }] = await Promise.all([
          supabase.from("messages").select("content").eq("conversation_id", c.id)
            .order("created_at", { ascending: false }).limit(1),
          supabase.from("messages").select("id", { count: "exact", head: true })
            .eq("conversation_id", c.id).eq("read", false).neq("sender_id", user.id),
        ]);

        return {
          ...c,
          otherUser: {
            id: otherId,
            name: p?.name || "Usuário",
            username: p?.username || "",
            avatar_url: p?.avatar_url || null,
            verified: p?.verified || false,
          },
          lastMessage: lastMsgArr?.[0]?.content || "",
          unreadCount: count || 0,
        };
      })
    );

    setConversations(enriched);
    setLoading(false);
    return enriched;
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Open a conversation and load its messages ──────────────────────────────
  const openConversation = useCallback(async (conv: Conversation) => {
    setActiveConv(conv);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // Mark all received messages as read
    if (user) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("read", false);
    }

    setTimeout(() => scrollToBottom("instant"), 80);
    inputRef.current?.focus();
  }, [user]);

  // ── Find or create a conversation with a specific user, then open it ───────
  const openOrCreateConversation = useCallback(async (targetUserId: string) => {
    if (!user || opening) return;
    setOpening(true);

    try {
      // Try both orderings
      const { data: existing } = await supabase
        .from("conversations")
        .select("*")
        .or(
          `and(participant_1.eq.${user.id},participant_2.eq.${targetUserId}),` +
          `and(participant_1.eq.${targetUserId},participant_2.eq.${user.id})`
        )
        .maybeSingle();

      let convRow = existing;

      if (!convRow) {
        // Create new conversation
        const { data: created, error } = await supabase
          .from("conversations")
          .insert({
            participant_1: user.id < targetUserId ? user.id : targetUserId,
            participant_2: user.id < targetUserId ? targetUserId : user.id,
            last_message_at: new Date().toISOString(),
          })
          .select()
          .single();
        if (error || !created) { setOpening(false); return; }
        convRow = created;
      }

      // Fetch other user's profile
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, verified")
        .eq("id", targetUserId)
        .single();

      if (!profile) { setOpening(false); return; }

      const conv: Conversation = {
        ...convRow,
        otherUser: {
          id: targetUserId,
          name: profile.name || "Usuário",
          username: profile.username || "",
          avatar_url: profile.avatar_url || null,
          verified: profile.verified || false,
        },
        lastMessage: "",
        unreadCount: 0,
      };

      await openConversation(conv);
    } finally {
      setOpening(false);
    }
  }, [user, opening, openConversation]);

  // ── Auto-open conversation when navigated via /chat/:userId ────────────────
  useEffect(() => {
    if (paramUserId && user) {
      openOrCreateConversation(paramUserId);
    }
  }, [paramUserId, user]); // intentionally omit openOrCreateConversation to run once

  // ── Realtime: new messages ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-realtime-" + user.id)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;

        // Add to active conversation
        setActiveConv(prev => {
          if (prev && newMsg.conversation_id === prev.id) {
            setMessages(msgs => {
              // Avoid duplicate if optimistic insert already added it
              if (msgs.find(m => m.id === newMsg.id)) return msgs;
              return [...msgs, newMsg];
            });
            // Mark as read if from other user and chat is open
            if (newMsg.sender_id !== user.id) {
              supabase.from("messages").update({ read: true }).eq("id", newMsg.id).then(() => {});
            }
            setTimeout(() => scrollToBottom("smooth"), 50);
          }
          return prev;
        });

        // Refresh conversation list for last message + unread badge
        loadConversations();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadConversations]);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = async () => {
    if (!text.trim() || !activeConv || !user || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);

    // Optimistic insert
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
      read: false,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    const [msgResult] = await Promise.all([
      supabase.from("messages").insert({
        conversation_id: activeConv.id,
        sender_id: user.id,
        content,
      }).select().single(),
      supabase.from("conversations")
        .update({ last_message_at: new Date().toISOString() })
        .eq("id", activeConv.id),
    ]);

    // Replace temp message with real one
    if (msgResult.data) {
      setMessages(prev => prev.map(m => m.id === tempMsg.id ? msgResult.data : m));
    }

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatMessageTime = (dateStr: string) =>
    new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // ── Loading / auth guards ──────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Faça login para acessar o chat.</p>
      </div>
    );
  }

  if (opening) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  // ── Active conversation (message view) ─────────────────────────────────────
  if (activeConv) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0 bg-background">
          <button
            onClick={() => {
              setActiveConv(null);
              setMessages([]);
              navigate("/chat", { replace: true });
              loadConversations();
            }}
            className="text-foreground p-1 -ml-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <AppAvatar
            src={activeConv.otherUser.avatar_url}
            name={activeConv.otherUser.name}
            className="w-9 h-9 shrink-0"
            sizePx={72}
            textClassName="text-sm"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
              {activeConv.otherUser.name}
              {activeConv.otherUser.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">@{activeConv.otherUser.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AppAvatar
                src={activeConv.otherUser.avatar_url}
                name={activeConv.otherUser.name}
                className="w-16 h-16 mb-3"
                sizePx={128}
                textClassName="text-xl"
              />
              <p className="text-sm font-semibold text-foreground">{activeConv.otherUser.name}</p>
              <p className="text-xs text-muted-foreground mt-1">Inicie a conversa!</p>
            </div>
          )}

          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id;
            const isTemp = msg.id.startsWith("temp-");
            const prevMsg = messages[i - 1];
            const showDate =
              i === 0 ||
              new Date(msg.created_at).toDateString() !== new Date(prevMsg.created_at).toDateString();

            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2.5 py-1 rounded-full">
                      {new Date(msg.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long" })}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                  <div
                    className={`max-w-[80%] px-3.5 py-2 rounded-2xl ${
                      isMine
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    } ${isTemp ? "opacity-70" : ""}`}
                  >
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">
                      {msg.content}
                    </p>
                    <p className={`text-[10px] mt-0.5 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"} text-right`}>
                      {isTemp ? "enviando…" : formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div
          className="shrink-0 border-t border-border bg-background px-3 py-2.5"
          style={{ paddingBottom: "calc(0.625rem + env(safe-area-inset-bottom, 0px))" }}
        >
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              autoComplete="off"
              style={{ fontSize: "16px" }}
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/40 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Conversation list ──────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-24 md:pb-8">
      <div className="max-w-2xl mx-auto">
        <div className="px-4 py-4">
          <h1 className="text-lg font-semibold text-foreground">Mensagens</h1>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
              <MessageCircle className="w-7 h-7 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Nenhuma conversa ainda</p>
            <p className="text-xs text-muted-foreground">
              Assine um criador para iniciar uma conversa automaticamente.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map(conv => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <AppAvatar
                    src={conv.otherUser.avatar_url}
                    name={conv.otherUser.name}
                    className="w-12 h-12"
                    sizePx={96}
                    textClassName="text-base"
                  />
                  {conv.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-primary text-primary-foreground text-[10px] font-bold rounded-full">
                      {conv.unreadCount}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
                      {conv.otherUser.name}
                      {conv.otherUser.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                    </p>
                    <span className="text-[11px] text-muted-foreground shrink-0 ml-2">
                      {formatTime(conv.last_message_at)}
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {conv.lastMessage || "Iniciar conversa..."}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
