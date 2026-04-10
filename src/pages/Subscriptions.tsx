import { useState, useEffect } from "react";
import { ArrowLeft, Crown, Loader2, MessageCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppAvatar } from "@/components/AppAvatar";
import { supabase } from "@/integrations/supabase/client";

const Subscriptions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) { setLoading(false); return; }
      const { data } = await supabase
        .from("subscriptions")
        .select("id, plan, amount, status, created_at, expires_at, creator_id")
        .eq("subscriber_id", user.id)
        .eq("status", "active");

      if (data && data.length > 0) {
        const creatorIds = data.map(s => s.creator_id);
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, name, username, avatar_url, verified")
          .in("id", creatorIds);

        const profileMap = new Map((profiles || []).map(p => [p.id, p]));
        setSubs(data.map(s => ({ ...s, creator: profileMap.get(s.creator_id) })));
      }
      setLoading(false);
    };
    load();
  }, [user]);

  if (!user) return null;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Assinaturas</h1>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : subs.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center">
            <Crown className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm font-medium text-foreground mb-1">Nenhuma assinatura ativa</p>
            <p className="text-xs text-muted-foreground mb-4">Explore criadores e assine para ter acesso ao conteúdo exclusivo</p>
            <button
              onClick={() => navigate("/explore")}
              className="px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
            >
              Explorar criadores
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">{subs.length} assinatura(s) ativa(s)</p>
            {subs.map(sub => (
              <div key={sub.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => navigate(`/${sub.creator?.username}`)}
                    className="flex items-center gap-3 min-w-0"
                  >
                    <AppAvatar src={sub.creator?.avatar_url} name={sub.creator?.name ?? "?"} className="w-11 h-11 shrink-0" sizePx={88} textClassName="text-sm" />
                    <div className="min-w-0 text-left">
                      <p className="text-sm font-medium text-foreground truncate">{sub.creator?.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{sub.creator?.username}</p>
                    </div>
                  </button>
                  <button
                    onClick={() => navigate(`/chat/${sub.creator_id}`)}
                    className="p-2 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors"
                    title="Enviar mensagem"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-medium bg-secondary text-foreground rounded-full">
                      {sub.plan === "monthly" ? "Mensal" : "Anual"}
                    </span>
                    <span className="text-sm font-semibold text-foreground">R$ {fmt(sub.amount)}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Desde {new Date(sub.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Subscriptions;
