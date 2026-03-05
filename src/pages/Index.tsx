import { motion } from "framer-motion";
import PostCard from "@/components/PostCard";
import CreatorCard from "@/components/CreatorCard";
import { TrendingUp, Flame } from "lucide-react";

const mockPosts = [
  { id: 1, creator: { name: "Luna Dark", username: "lunadark", avatar: "" }, content: "New exclusive photoshoot dropping tonight 🔥 Stay tuned!", image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=400&fit=crop", likes: 342, comments: 28, locked: false, type: "free" as const, timeAgo: "2h" },
  { id: 2, creator: { name: "Marcus Vibe", username: "marcusvibe", avatar: "" }, content: "Behind the scenes from my latest music video. Subscribers only 🎵", image: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=600&h=400&fit=crop", likes: 891, comments: 65, locked: true, type: "subscribers" as const, timeAgo: "4h" },
  { id: 3, creator: { name: "Aria Rose", username: "ariarose", avatar: "" }, content: "Exclusive tutorial: Advanced photography techniques revealed 📸", image: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&h=400&fit=crop", likes: 156, comments: 12, locked: true, type: "ppv" as const, price: 29.90, timeAgo: "6h" },
  { id: 4, creator: { name: "Jake Steel", username: "jakesteel", avatar: "" }, content: "Training day 💪 Check out my new workout program for subscribers!", image: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=600&h=400&fit=crop", likes: 567, comments: 43, locked: true, type: "ppv-subscribers" as const, price: 49.90, timeAgo: "8h" },
];

const mockCreators = [
  { name: "Luna Dark", username: "lunadark", avatar: "", category: "Photography", followers: 45200, price: 39.90 },
  { name: "Marcus Vibe", username: "marcusvibe", avatar: "", category: "Music", followers: 32100, price: 29.90 },
  { name: "Aria Rose", username: "ariarose", avatar: "", category: "Art & Design", followers: 28700, price: 24.90 },
  { name: "Jake Steel", username: "jakesteel", avatar: "", category: "Fitness", followers: 61400, price: 49.90 },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Feed */}
          <div className="lg:col-span-2 space-y-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-2">
              <Flame className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">Your Feed</h2>
            </motion.div>
            {mockPosts.map((post) => (
              <PostCard key={post.id} {...post} />
            ))}
          </div>

          {/* Sidebar */}
          <div className="space-y-6 hidden lg:block">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-bold text-foreground">Trending Creators</h3>
            </div>
            <div className="space-y-4">
              {mockCreators.map((creator, i) => (
                <CreatorCard key={creator.username} {...creator} index={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
