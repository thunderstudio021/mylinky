import { motion } from "framer-motion";
import { Crown, Users, FileText, Heart, Gift, UserPlus, Lock, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import PostCard from "@/components/PostCard";

const mockPosts = [
  { id: 1, creator: { name: "Luna Dark", username: "lunadark", avatar: "" }, content: "Golden hour vibes ☀️ New set available now!", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=400&fit=crop", likes: 1240, comments: 89, locked: false, type: "free" as const, timeAgo: "1h" },
  { id: 2, creator: { name: "Luna Dark", username: "lunadark", avatar: "" }, content: "Exclusive behind the scenes from my Bali trip 🌴", image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop", likes: 2310, comments: 156, locked: true, type: "subscribers" as const, timeAgo: "3h" },
  { id: 3, creator: { name: "Luna Dark", username: "lunadark", avatar: "" }, content: "Full unreleased photoset — 42 exclusive photos 📸", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop", likes: 890, comments: 45, locked: true, type: "ppv" as const, price: 39.90, timeAgo: "1d" },
];

const CreatorProfile = () => {
  return (
    <div className="min-h-screen bg-background pt-14 md:pt-16 pb-20 md:pb-8">
      {/* Cover */}
      <div className="relative h-48 md:h-64">
        <img
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop"
          alt="Cover"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-4xl mx-auto px-4 md:px-6">
        {/* Profile Header */}
        <div className="-mt-16 relative z-10">
          <div className="flex flex-col md:flex-row md:items-end gap-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-background gradient-red flex items-center justify-center text-primary-foreground text-4xl font-bold shadow-xl"
            >
              L
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Luna Dark</h1>
                <Crown className="w-5 h-5 text-gold" />
              </div>
              <p className="text-muted-foreground">@lunadark</p>
              <p className="text-sm text-foreground/80 mt-2 max-w-lg">Professional photographer & content creator. Sharing exclusive art, behind-the-scenes, and premium photosets. 🔥📸</p>
            </motion.div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="flex gap-2 flex-wrap">
              <Button className="gradient-red text-primary-foreground font-semibold glow-red">
                <Lock className="w-4 h-4 mr-1.5" /> Subscribe R$39.90/mo
              </Button>
              <Button variant="outline" className="border-border hover:bg-secondary">
                <Gift className="w-4 h-4 mr-1.5" /> Gift
              </Button>
              <Button variant="outline" className="border-border hover:bg-secondary">
                <UserPlus className="w-4 h-4 mr-1.5" /> Follow
              </Button>
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <Share2 className="w-4 h-4" />
              </Button>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-6 mt-6 py-4 border-y border-border/50"
          >
            {[
              { label: "Posts", value: "324", icon: FileText },
              { label: "Followers", value: "45.2K", icon: Users },
              { label: "Likes", value: "1.2M", icon: Heart },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-2">
                <stat.icon className="w-4 h-4 text-primary" />
                <span className="font-bold text-foreground">{stat.value}</span>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-6">
          {mockPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
