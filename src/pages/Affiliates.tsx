import { useState, useEffect } from "react";
import { ArrowLeft, Users2, TrendingUp, Search, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Affiliates = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [creators, setCreators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, verified, subscribers_count")
        .eq("is_creator", true)
        .order("subscribers_count", { ascending: false });
      setCreators(data || []);
      setLoading(false);
    };
    load();
  }, []);

  const filtered = creators.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase())
  );

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
                <p className="text-sm text-muted-foreground">Divulgue o perfil do criador e traga novos assinantes</p>
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
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Afiliações ativas</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
              <p className="text-xs text-muted-foreground">Comissão total</p>
            </div>
          </div>

          {/* Search creators */}
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
                  filtered.slice(0, 20).map(c => (
                    <div key={c.id} className="flex items-center justify-between px-4 py-3">
                      <button
                        onClick={() => navigate(`/${c.username}`)}
                        className="flex items-center gap-3 min-w-0"
                      >
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground text-sm font-semibold shrink-0 overflow-hidden">
                          {c.avatar_url ? <img src={c.avatar_url} alt="" className="w-full h-full object-cover" /> : c.name?.[0] || "U"}
                        </div>
                        <div className="min-w-0 text-left">
                          <p className="text-sm text-foreground truncate">{c.name}</p>
                          <p className="text-xs text-muted-foreground truncate">@{c.username}</p>
                        </div>
                      </button>
                      <button className="px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors shrink-0">
                        Afiliar-se
                      </button>
                    </div>
                  ))
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
