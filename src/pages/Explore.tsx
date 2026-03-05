import { motion } from "framer-motion";
import CreatorCard from "@/components/CreatorCard";
import { Search, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const allCreators = [
  { name: "Luna Dark", username: "lunadark", avatar: "", category: "Photography", followers: 45200, price: 39.90 },
  { name: "Marcus Vibe", username: "marcusvibe", avatar: "", category: "Music", followers: 32100, price: 29.90 },
  { name: "Aria Rose", username: "ariarose", avatar: "", category: "Art & Design", followers: 28700, price: 24.90 },
  { name: "Jake Steel", username: "jakesteel", avatar: "", category: "Fitness", followers: 61400, price: 49.90 },
  { name: "Sofia Night", username: "sofianight", avatar: "", category: "Dance", followers: 19300, price: 19.90 },
  { name: "Diego Flame", username: "diegoflame", avatar: "", category: "Cooking", followers: 15800, price: 14.90 },
  { name: "Mia Storm", username: "miastorm", avatar: "", category: "Fashion", followers: 52400, price: 34.90 },
  { name: "Leo Beats", username: "leobeats", avatar: "", category: "Music", followers: 41200, price: 29.90 },
];

const categories = ["All", "Photography", "Music", "Art & Design", "Fitness", "Dance", "Cooking", "Fashion"];

const Explore = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  const filtered = allCreators.filter((c) => {
    const matchCategory = activeCategory === "All" || c.category === activeCategory;
    const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.username.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-1">Explore Creators</h1>
          <p className="text-muted-foreground">Discover amazing content from top creators</p>
        </motion.div>

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search creators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card border-border focus:border-primary"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <Button
              key={cat}
              size="sm"
              variant={activeCategory === cat ? "default" : "outline"}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap ${activeCategory === cat ? "gradient-red text-primary-foreground" : "border-border text-muted-foreground hover:text-foreground hover:bg-secondary"}`}
            >
              {cat}
            </Button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((creator, i) => (
            <CreatorCard key={creator.username} {...creator} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Explore;
