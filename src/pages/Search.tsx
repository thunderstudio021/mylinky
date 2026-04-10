import { useState, useEffect, useMemo } from "react";
import { Search as SearchIcon, X, Users } from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { AppAvatar } from "@/components/AppAvatar";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface Creator {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  followers_count: number;
  verified: boolean;
}

const Search = () => {
  const [query, setQuery] = useState("");
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, followers_count, verified")
        .eq("is_creator", true)
        .order("followers_count", { ascending: false });
      setCreators((data as Creator[]) || []);
      setLoading(false);
    };
    load();
  }, []);

  const results = useMemo(() => {
    if (!query.trim()) return creators;
    const q = query.toLowerCase();
    return creators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q)
    );
  }, [query, creators]);

  const formatFollowers = (n: number) =>
    n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);

  return (
    <div className="min-h-screen bg-background pt-12 md:pt-14 pb-20 md:pb-8">
      <div className="max-w-2xl mx-auto px-4 md:px-6">
        {/* Search input */}
        <div className="sticky top-12 md:top-14 z-10 bg-background pt-4 pb-3">
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar criadores..."
              autoFocus
              className="w-full h-10 pl-9 pr-9 bg-secondary border border-border rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/30"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
        ) : results.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              {query.trim() ? `Nenhum criador encontrado para "${query}"` : "Nenhum criador ativo no momento."}
            </p>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            {query.trim() && (
              <p className="text-xs text-muted-foreground px-1 mb-3">
                {results.length} resultado{results.length !== 1 ? "s" : ""}
              </p>
            )}
            {results.map((creator) => (
              <Link
                key={creator.id}
                to={`/${creator.username}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <AppAvatar src={creator.avatar_url} name={creator.name} className="w-11 h-11 border border-border" sizePx={88} textClassName="text-base" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground truncate">{creator.name}</span>
                    {creator.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-xs text-muted-foreground">@{creator.username}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Users className="w-3 h-3" />
                  {formatFollowers(creator.followers_count)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
