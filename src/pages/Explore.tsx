import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, BadgeCheck, Crown } from "lucide-react";
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

const TopBadge = ({ rank }: { rank: number }) => {
  const colors: Record<number, string> = {
    1: "from-[hsl(45,80%,50%)] to-[hsl(35,90%,45%)]",
    2: "from-[hsl(0,0%,65%)] to-[hsl(0,0%,50%)]",
    3: "from-[hsl(25,60%,45%)] to-[hsl(20,50%,35%)]",
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-gradient-to-r ${colors[rank]} text-[10px] font-bold text-background uppercase tracking-wider`}>
      <Crown className="w-3 h-3" />
      Top {rank}
    </div>
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
            {topCreators.map((creator, i) => (
              <Link
                key={creator.id}
                to={`/${creator.username}`}
                className="block group"
              >
                <div className={`relative bg-card border border-border rounded-xl p-5 hover:border-muted-foreground/30 transition-all ${
                  i === 0 ? "border-[hsl(45,80%,50%)]/20 bg-gradient-to-r from-card to-[hsl(45,80%,50%)]/[0.03]" : ""
                }`}>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`shrink-0 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold overflow-hidden ${
                      i === 0 ? "w-16 h-16 text-xl" : "w-13 h-13 text-lg"
                    }`}
                      style={{ width: i === 0 ? 64 : 52, height: i === 0 ? 64 : 52 }}
                    >
                      {creator.avatar_url ? (
                        <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                      ) : creator.name[0]}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <TopBadge rank={i + 1} />
                      </div>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <span className={`font-semibold text-foreground truncate group-hover:underline ${
                          i === 0 ? "text-base" : "text-sm"
                        }`}>{creator.name}</span>
                        {creator.verified && <BadgeCheck className="w-4 h-4 text-accent shrink-0" />}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">@{creator.username}</p>
                    </div>

                    {/* Stats */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1 text-muted-foreground justify-end">
                        <Users className="w-3.5 h-3.5" />
                        <span className="text-sm font-medium text-foreground">{formatFollowers(creator.followers_count)}</span>
                      </div>
                      {creator.price_monthly > 0 && (
                        <p className="text-[11px] text-muted-foreground mt-1">R${Number(creator.price_monthly).toFixed(2)}/mês</p>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Other creators */}
        {otherCreators.length > 0 && (
          <>
            <div className="mb-4">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Todos os criadores</h2>
            </div>
            <div className="space-y-2">
              {otherCreators.map((creator) => (
                <Link
                  key={creator.id}
                  to={`/${creator.username}`}
                  className="block group"
                >
                  <div className="bg-card border border-border rounded-lg px-4 py-3.5 hover:border-muted-foreground/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold text-sm shrink-0 overflow-hidden">
                        {creator.avatar_url ? (
                          <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                        ) : creator.name[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium text-foreground truncate group-hover:underline">{creator.name}</span>
                          {creator.verified && <BadgeCheck className="w-3.5 h-3.5 text-accent shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground">@{creator.username}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
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
          <p className="text-sm text-muted-foreground text-center py-16">Nenhum criador ativo no momento.</p>
        )}
      </div>
    </div>
  );
};

export default Explore;
