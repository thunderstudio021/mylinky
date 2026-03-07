import { useState, useMemo } from "react";
import { Search as SearchIcon, X, BadgeCheck, Users } from "lucide-react";
import { Link } from "react-router-dom";

const mockCreators = [
  { name: "Luna Dark", username: "lunadark", category: "Fotografia", followers: 45200, price: 39.90, verified: true, bio: "Fotógrafa profissional & criadora de conteúdo" },
  { name: "Marcus Vibe", username: "marcusvibe", category: "Música", followers: 23100, price: 29.90, verified: true, bio: "Produtor musical e DJ" },
  { name: "Ana Costa", username: "anacosta", category: "Fitness", followers: 67400, price: 49.90, verified: true, bio: "Personal trainer e atleta" },
  { name: "Pedro Silva", username: "pedrosilva", category: "Culinária", followers: 12800, price: 19.90, verified: true, bio: "Chef de cozinha e professor" },
  { name: "Carla Mendes", username: "carlamendes", category: "Moda", followers: 89300, price: 59.90, verified: true, bio: "Estilista e influenciadora" },
  { name: "Rafael Lima", username: "rafaellima", category: "Games", followers: 34600, price: 24.90, verified: true, bio: "Streamer e gamer profissional" },
];

const Search = () => {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return mockCreators.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.username.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [query]);

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
              placeholder="Buscar criadores, categorias..."
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

        {/* Results */}
        {query.trim() === "" ? (
          <div className="mt-16 text-center">
            <SearchIcon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              Busque por nome, username ou categoria
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum criador encontrado para "{query}"
            </p>
          </div>
        ) : (
          <div className="space-y-1 mt-2">
            <p className="text-xs text-muted-foreground px-1 mb-3">
              {results.length} resultado{results.length !== 1 ? "s" : ""}
            </p>
            {results.map((creator) => (
              <Link
                key={creator.username}
                to={`/${creator.username}`}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="w-11 h-11 rounded-full bg-secondary border border-border flex items-center justify-center text-foreground font-semibold text-base shrink-0">
                  {creator.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-foreground truncate">
                      {creator.name}
                    </span>
                    {creator.verified && (
                      <BadgeCheck className="w-3.5 h-3.5 text-accent shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">@{creator.username}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="w-3 h-3" />
                    {formatFollowers(creator.followers)}
                  </div>
                  <span className="text-xs text-muted-foreground">{creator.category}</span>
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
