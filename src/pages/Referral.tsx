import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, Link2, Users, TrendingUp, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppAvatar } from "@/components/AppAvatar";

interface ReferredUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_creator: boolean;
  created_at: string;
  commission_rate: number;
}

const Referral = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [referred, setReferred] = useState<ReferredUser[]>([]);
  const [loading, setLoading] = useState(true);

  const referralLink = `${window.location.origin}/register?ref=${profile?.username || user?.id?.slice(0, 8)}`;

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      // Get all users referred by this user
      const { data: rels } = await (supabase as any)
        .from("referral_relationships")
        .select("referred_id, commission_rate, created_at")
        .eq("referrer_id", user.id);

      if (!rels || rels.length === 0) { setLoading(false); return; }

      const ids = rels.map((r: any) => r.referred_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, is_creator, created_at")
        .in("id", ids);

      const relMap = new Map(rels.map((r: any) => [r.referred_id, r]));
      const enriched: ReferredUser[] = (profiles || []).map((p: any) => ({
        ...p,
        commission_rate: relMap.get(p.id)?.commission_rate ?? 10,
      }));
      setReferred(enriched);
      setLoading(false);
    };
    load();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const creatorsReferred = referred.filter(r => r.is_creator);
  const totalIndicados = referred.length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Indicação</h1>
        </div>

        <div className="space-y-4">
          {/* How it works */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Link2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Como funciona?</h2>
                <p className="text-xs text-muted-foreground">Ganhe comissão indicando criadores</p>
              </div>
            </div>
            <div className="space-y-3">
              {[
                "Compartilhe seu link de indicação",
                "A pessoa se cadastra e vira criador de conteúdo",
                `Você recebe uma % do faturamento mensal dela — definida pelo criador (padrão 10%)`,
                "A plataforma mantém os seus 20% normalmente",
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <p className="text-sm text-muted-foreground">{text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Referral link */}
          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Seu link de indicação
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground truncate font-mono">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{totalIndicados}</p>
              <p className="text-xs text-muted-foreground">Indicados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{creatorsReferred.length}</p>
              <p className="text-xs text-muted-foreground">Criadores ativos</p>
            </div>
          </div>

          {/* Referred users list */}
          {!loading && referred.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Seus indicados</h3>
              </div>
              <div className="divide-y divide-border">
                {referred.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <AppAvatar
                      src={r.avatar_url}
                      name={r.name}
                      className="w-9 h-9 shrink-0"
                      sizePx={72}
                      textClassName="text-xs"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">@{r.username}</p>
                    </div>
                    <div className="text-right shrink-0">
                      {r.is_creator ? (
                        <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          {r.commission_rate}% comissão
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                          Usuário
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          )}

          {!loading && referred.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-8 text-center">
              <DollarSign className="w-8 h-8 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-sm font-medium text-foreground mb-1">Nenhum indicado ainda</p>
              <p className="text-xs text-muted-foreground">
                Compartilhe seu link e ganhe comissão quando alguém virar criador.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Referral;
