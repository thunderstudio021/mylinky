import CreatorCard from "@/components/CreatorCard";
import { Search } from "lucide-react";
import { useState } from "react";

const allCreators = [
  { name: "Luna Dark", username: "lunadark", avatar: "", category: "Fotografia", followers: 45200, price: 39.90, verified: true },
  { name: "Marcus Vibe", username: "marcusvibe", avatar: "", category: "Música", followers: 32100, price: 29.90, verified: true },
  { name: "Aria Rose", username: "ariarose", avatar: "", category: "Arte & Design", followers: 28700, price: 24.90, verified: true },
  { name: "Jake Steel", username: "jakesteel", avatar: "", category: "Fitness", followers: 61400, price: 49.90, verified: true },
  { name: "Sofia Night", username: "sofianight", avatar: "", category: "Dança", followers: 19300, price: 19.90, verified: true },
  { name: "Diego Flame", username: "diegoflame", avatar: "", category: "Culinária", followers: 15800, price: 14.90, verified: true },
  { name: "Mia Storm", username: "miastorm", avatar: "", category: "Moda", followers: 52400, price: 34.90, verified: true },
  { name: "Leo Beats", username: "leobeats", avatar: "", category: "Música", followers: 41200, price: 29.90, verified: true },
];

const categories = ["Todos", "Fotografia", "Música", "Arte & Design", "Fitness", "Dança", "Culinária", "Moda"];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [search, setSearch] = useState("");

  const filtered = allCreators.filter((c) => {
    const matchCategory = activeCategory === "Todos" || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Explorar</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Descubra criadores incríveis</p>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            placeholder="Buscar criadores..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-card border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
          />
        </div>

        {/* Categories */}
        <div className="flex gap-1.5 mb-6 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap px-3 py-1.5 text-xs rounded-md transition-colors ${
                activeCategory === cat
                  ? "bg-foreground text-background font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((creator, i) => (
            <CreatorCard key={creator.username} {...creator} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
