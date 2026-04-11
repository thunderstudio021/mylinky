import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, Crown } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AppAvatar } from "@/components/AppAvatar";
import { supabase } from "@/integrations/supabase/client";

interface Creator {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  followers_count: number;
  price_monthly: number;
  verified: boolean;
}

const formatFollowers = (n: number) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

const rankConfig: Record<number, {
  badge: string;
  card: string;
  crownColor: string;
  label: string;
}> = {
  1: {
    badge: "bg-amber-400/10 text-amber-400 border border-amber-400/20",
    card: "border-amber-400/20",
    crownColor: "text-amber-400",
    label: "#1",
  },
  2: {
    badge: "bg-zinc-400/10 text-zinc-400 border border-zinc-400/20",
    card: "",
    crownColor: "text-zinc-400",
    label: "#2",
  },
  3: {
    badge: "bg-orange-600/10 text-orange-500 border border-orange-600/20",
    card: "",
    crownColor: "text-orange-500",
    label: "#3",
  },
};

const TopBadge = ({ rank }: { rank: number }) => {
  const cfg = rankConfig[rank] || {
    badge: "bg-muted/10 text-muted-foreground border border-border",
    crownColor: "text-muted-foreground",
    label: `#${rank}`,
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold tracking-widest uppercase ${cfg.badge}`}>
      <Crown className={`w-2.5 h-2.5 ${cfg.crownColor}`} />
      {cfg.label}
    </span>
  );
};

const Explore = () => {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, bio, followers_count, price_monthly, verified")
        .eq("is_creator", true)
        .order("followers_count", { ascending: false });

      setCreators((data as Creator[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const topCreators = creators.slice(0, 3);
  const otherCreators = creators.slice(3);

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-5 md:px-6">

        {/* Header */}
        <div className="mb-8 pt-2">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Explorar</h1>
          <p className="text-sm text-muted-foreground mt-1">Criadores em destaque</p>
        </div>

        {/* Top 3 */}
        {topCreators.length > 0 && (
          <div className="space-y-3 mb-8">
            {topCreators.map((creator, i) => {
              const rank = i + 1;
              const cfg = rankConfig[rank] || rankConfig[3];
              return (
                <Link key={creator.id} to={`/${creator.username}`} className="block group">
                  <div className={`bg-card border rounded-xl p-4 hover:border-muted-foreground/30 transition-all ${cfg.card || "border-border"}`}>
                    <div className="flex items-center gap-4">
                      {/* Avatar — tamanho fixo independente de ter foto */}
                      <AppAvatar
                        src={creator.avatar_url}
                        name={creator.name}
                        sizePx={56}
                        className="w-14 h-14 shrink-0"
                        textClassName="text-lg font-bold"
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <TopBadge rank={rank} />
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <span className="text-sm font-semibold text-foreground truncate group-hover:underline">
                            {creator.name}
                          </span>
                          {creator.verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">@{creator.username}</p>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <div className="flex items-center gap-1 text-muted-foreground justify-end">
                          <Users className="w-3.5 h-3.5" />
                          <span className="text-sm font-semibold text-foreground">
                            {formatFollowers(creator.followers_count)}
                          </span>
                        </div>
                        {creator.price_monthly > 0 && (
                          <p className="text-[11px] text-muted-foreground mt-1">
                            R${Number(creator.price_monthly).toFixed(2)}/mês
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* Other creators */}
        {otherCreators.length > 0 && (
          <>
            <div className="mb-4">
              <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
                Todos os criadores
              </h2>
            </div>
            <div className="space-y-2">
              {otherCreators.map((creator) => (
                <Link key={creator.id} to={`/${creator.username}`} className="block group">
                  <div className="bg-card border border-border rounded-lg px-4 py-3 hover:border-muted-foreground/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <AppAvatar
                        src={creator.avatar_url}
                        name={creator.name}
                        className="w-11 h-11 shrink-0"
                        sizePx={88}
                        textClassName="text-sm font-bold"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground truncate group-hover:underline">
                            {creator.name}
                          </span>
                          {creator.verified && <VerifiedBadge className="w-3.5 h-3.5 shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">@{creator.username}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                        <Users className="w-3 h-3" />
                        <span>{formatFollowers(creator.followers_count)}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {creators.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-16">
            Nenhum criador ativo no momento.
          </p>
        )}
      </div>
    </div>
  );
};

export default Explore;
