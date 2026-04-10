import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, Users2, TrendingUp, Search, Loader2, Copy, Check, Link2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { AppAvatar } from "@/components/AppAvatar";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Affiliates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [myAffiliations, setMyAffiliations] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [affiliating, setAffiliating] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) return;

    const { data: creatorsData } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url, verified, subscribers_count")
      .eq("is_creator", true)
      .order("subscribers_count", { ascending: false });

    setCreators(creatorsData || []);

    // Load user's affiliations (graceful if tables not yet created)
    try {
      const { data: affs } = await (supabase as any)
        .from("affiliate_relationships")
        .select("*, creator:profiles!creator_id(name, username, avatar_url, verified)")
        .eq("affiliate_id", user.id)
        .eq("status", "active");

      setMyAffiliations(affs || []);

      if (affs && affs.length > 0) {
        const { data: earningsData } = await (supabase as any)
          .from("affiliate_earnings")
          .select("commission_amount")
          .eq("affiliate_id", user.id);
        const total = (earningsData || []).reduce((s: number, e: any) => s + Number(e.commission_amount), 0);
        setEarnings(total);
      }
    } catch {
      // Tables not yet created — show zeros silently
    }

    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const affiliatedCreatorIds = new Set(myAffiliations.map((a: any) => a.creator_id));

  const handleAffiliate = async (creatorId: string) => {
    if (!user) { navigate("/login"); return; }
    setAffiliating(creatorId);
    try {
      const { error } = await (supabase as any)
        .from("affiliate_relationships")
        .insert({ affiliate_id: user.id, creator_id: creatorId });

      if (error) {
        if (error.message?.includes("does not exist")) {
          toast.error("Execute o SQL de migração no Supabase para ativar afiliados.");
        } else if (error.code === "23505") {
          toast.info("Você já é afiliado deste criador.");
        } else {
          toast.error(error.message || "Erro ao criar afiliação");
        }
      } else {
        toast.success("Afiliação criada! Copie seu link abaixo.");
        await load();
      }
    } catch {
      toast.error("Erro inesperado ao criar afiliação.");
    }
    setAffiliating(null);
  };

  const handleCopyLink = async (aff: any) => {
    const code = aff.referral_code;
    const creator = aff.creator;
    if (!code || !creator?.username) return;
    const link = `${window.location.origin}/${creator.username}?ref=${code}`;
    await navigator.clipboard.writeText(link);
    setCopied(aff.id);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  const filtered = creators.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtBRL = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Afiliações</h1>
        </div>

        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Users2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Como funciona?</h2>
                <p className="text-xs text-muted-foreground">Ganhe promovendo criadores</p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">1</span>
                <p className="text-sm text-muted-foreground">Afilie-se a um criador de conteúdo abaixo</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">2</span>
                <p className="text-sm text-muted-foreground">Copie seu link exclusivo e divulgue para novos assinantes</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">3</span>
                <p className="text-sm text-muted-foreground">Ganhe <span className="text-foreground font-semibold">20% de comissão</span> sobre cada assinatura que você trouxer</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Users2 className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{myAffiliations.length}</p>
              <p className="text-xs text-muted-foreground">Afiliações ativas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">R$ {fmtBRL(earnings)}</p>
              <p className="text-xs text-muted-foreground">Comissão total</p>
            </div>
          </div>

          {/* My affiliate links */}
          {myAffiliations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-3">Meus links de afiliado</h3>
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {myAffiliations.map((aff: any) => (
                  <div key={aff.id} className="flex items-center justify-between px-4 py-3 gap-3">
                    <button onClick={() => navigate(`/${aff.creator?.username}`)} className="flex items-center gap-3 min-w-0">
                      <AppAvatar src={aff.creator?.avatar_url} name={aff.creator?.name ?? "?"} className="w-9 h-9 shrink-0" sizePx={72} textClassName="text-sm" />
                      <div className="min-w-0 text-left">
                        <div className="flex items-center gap-1">
                          <p className="text-sm text-foreground truncate">{aff.creator?.name}</p>
                          {aff.creator?.verified && <VerifiedBadge className="w-3 h-3" />}
                        </div>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">?ref={aff.referral_code}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleCopyLink(aff)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-secondary rounded-lg hover:bg-secondary/70 transition-colors shrink-0"
                    >
                      {copied === aff.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied === aff.id ? "Copiado" : "Copiar link"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Browse creators */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Criadores disponíveis</h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar criador..."
                className="w-full pl-9 pr-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/30"
              />
            </div>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl divide-y divide-border">
                {filtered.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum criador encontrado</p>
                ) : (
                  filtered.slice(0, 20).map(c => {
                    const isAffiliated = affiliatedCreatorIds.has(c.id);
                    const isLoading = affiliating === c.id;
                    return (
                      <div key={c.id} className="flex items-center justify-between px-4 py-3">
                        <button onClick={() => navigate(`/${c.username}`)} className="flex items-center gap-3 min-w-0">
                          <AppAvatar src={c.avatar_url} name={c.name ?? "U"} className="w-9 h-9 shrink-0" sizePx={72} textClassName="text-sm" />
                          <div className="min-w-0 text-left">
                            <div className="flex items-center gap-1">
                              <p className="text-sm text-foreground truncate">{c.name}</p>
                              {c.verified && <VerifiedBadge className="w-3 h-3" />}
                            </div>
                            <p className="text-xs text-muted-foreground truncate">@{c.username}</p>
                          </div>
                        </button>
                        {isAffiliated ? (
                          <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 rounded-lg shrink-0">
                            <Check className="w-3 h-3" /> Afiliado
                          </div>
                        ) : (
                          <button
                            onClick={() => handleAffiliate(c.id)}
                            disabled={isLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors shrink-0 disabled:opacity-50"
                          >
                            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2 className="w-3 h-3" />}
                            Afiliar-se
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Affiliates;
