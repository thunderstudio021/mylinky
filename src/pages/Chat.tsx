import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, MessageCircle } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { motion, AnimatePresence } from "framer-motion";

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
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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

    // Get other user IDs
    const otherIds = convs.map(c =>
      c.participant_1 === user.id ? c.participant_2 : c.participant_1
    );

    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, verified")
      .in("id", otherIds);

    const profileMap = new Map((profiles || []).map(p => [p.id, p]));

    // Get last message for each conversation
    const convIds = convs.map(c => c.id);
    const lastMessages: Record<string, string> = {};
    const unreadCounts: Record<string, number> = {};

    for (const convId of convIds) {
      const { data: lastMsg } = await supabase
        .from("messages")
        .select("content")
        .eq("conversation_id", convId)
        .order("created_at", { ascending: false })
        .limit(1);
      if (lastMsg?.[0]) lastMessages[convId] = lastMsg[0].content;

      const { count } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("conversation_id", convId)
        .eq("read", false)
        .neq("sender_id", user.id);
      unreadCounts[convId] = count || 0;
    }

    const mapped: Conversation[] = convs.map(c => {
      const otherId = c.participant_1 === user.id ? c.participant_2 : c.participant_1;
      const p = profileMap.get(otherId);
      return {
        ...c,
        otherUser: {
          id: otherId,
          name: p?.name || "Usuário",
          username: p?.username || "",
          avatar_url: p?.avatar_url || null,
          verified: p?.verified || false,
        },
        lastMessage: lastMessages[c.id] || "",
        unreadCount: unreadCounts[c.id] || 0,
      };
    });

    setConversations(mapped);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Realtime for new messages
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("chat-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        // If in active conversation, add message
        if (activeConv && newMsg.conversation_id === activeConv.id) {
          setMessages(prev => [...prev, newMsg]);
          // Mark as read if from other user
          if (newMsg.sender_id !== user.id) {
            supabase.from("messages").update({ read: true }).eq("id", newMsg.id).then(() => {});
          }
          setTimeout(scrollToBottom, 50);
        }
        // Refresh conversation list
        loadConversations();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, activeConv, loadConversations]);

  const openConversation = async (conv: Conversation) => {
    setActiveConv(conv);
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });
    setMessages(data || []);

    // Mark unread messages as read
    if (user) {
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("conversation_id", conv.id)
        .neq("sender_id", user.id)
        .eq("read", false);
    }

    setTimeout(scrollToBottom, 100);
  };

  const sendMessage = async () => {
    if (!text.trim() || !activeConv || !user || sending) return;
    const content = text.trim();
    setText("");
    setSending(true);

    await supabase.from("messages").insert({
      conversation_id: activeConv.id,
      sender_id: user.id,
      content,
    });

    await supabase
      .from("conversations")
      .update({ last_message_at: new Date().toISOString() })
      .eq("id", activeConv.id);

    setSending(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d`;
    return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  const formatMessageTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">Faça login para acessar o chat.</p>
      </div>
    );
  }

  // Message view
  if (activeConv) {
    return (
      <div className="fixed inset-0 z-[80] bg-background flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 h-14 border-b border-border shrink-0">
          <button
            onClick={() => { setActiveConv(null); loadConversations(); }}
            className="text-foreground p-1"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
            {activeConv.otherUser.avatar_url ? (
              <img src={activeConv.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm font-medium text-foreground">{activeConv.otherUser.name[0]}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate flex items-center gap-1">
              {activeConv.otherUser.name}
              {activeConv.otherUser.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
            </p>
            <p className="text-[11px] text-muted-foreground truncate">@{activeConv.otherUser.username}</p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user.id;
            const showDate = i === 0 || (
              new Date(msg.created_at).toDateString() !== new Date(messages[i - 1].created_at).toDateString()
            );
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
                        ? "bg-foreground text-background rounded-br-md"
                        : "bg-secondary text-foreground rounded-bl-md"
                    }`}
                  >
                    <p className="text-[13.5px] leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                    <p className={`text-[10px] mt-0.5 ${isMine ? "text-background/60" : "text-muted-foreground"} text-right`}>
                      {formatMessageTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input — font-size 16px to prevent iOS zoom */}
        <div className="shrink-0 border-t border-border bg-background px-3 py-2.5 safe-area-bottom">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Digite uma mensagem..."
              autoComplete="off"
              style={{ fontSize: "16px" }}
              className="flex-1 bg-secondary border border-border rounded-full px-4 py-2.5 text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30 transition-colors"
            />
            <button
              onClick={sendMessage}
              disabled={!text.trim() || sending}
              className="w-10 h-10 rounded-full bg-foreground text-background flex items-center justify-center shrink-0 disabled:opacity-40 transition-opacity"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Conversation list
  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
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
            <p className="text-xs text-muted-foreground">Quando você assinar um criador, uma conversa será iniciada automaticamente.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => openConversation(conv)}
                className="flex items-center gap-3 w-full px-4 py-3.5 hover:bg-secondary/50 transition-colors text-left"
              >
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center shrink-0 overflow-hidden">
                  {conv.otherUser.avatar_url ? (
                    <img src={conv.otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base font-medium text-foreground">{conv.otherUser.name[0]}</span>
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
                  <div className="flex items-center justify-between mt-0.5">
                    <p className="text-xs text-muted-foreground truncate pr-2">
                      {conv.lastMessage || "Iniciar conversa..."}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="min-w-[18px] h-[18px] px-1 flex items-center justify-center bg-foreground text-background text-[10px] font-bold rounded-full shrink-0">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
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
