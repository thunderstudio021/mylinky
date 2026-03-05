import { Users, FileText, Heart, Gift, UserPlus, Lock, Share2, BadgeCheck } from "lucide-react";
import PostCard from "@/components/PostCard";

const mockPosts = [
  { id: 1, creator: { name: "Luna Dark", username: "lunadark", verified: true }, content: "Vibes do golden hour ☀️ Novo set disponível agora!", image: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=600&h=400&fit=crop", likes: 1240, comments: 89, locked: false, type: "free" as const, timeAgo: "1h" },
  { id: 2, creator: { name: "Luna Dark", username: "lunadark", verified: true }, content: "Bastidores exclusivos da minha viagem pra Bali 🌴", image: "https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=600&h=400&fit=crop", likes: 2310, comments: 156, locked: true, type: "subscribers" as const, timeAgo: "3h" },
  { id: 3, creator: { name: "Luna Dark", username: "lunadark", verified: true }, content: "Set de fotos completo nunca lançado — 42 fotos exclusivas 📸", image: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=600&h=400&fit=crop", likes: 890, comments: 45, locked: true, type: "ppv" as const, price: 39.90, timeAgo: "1d" },
];

const CreatorProfile = () => {
  return (
    <div className="min-h-screen bg-background pt-12 md:pt-14 pb-20 md:pb-8">
      {/* Cover */}
      <div className="relative h-40 md:h-56 bg-secondary">
        <img
          src="https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=1200&h=400&fit=crop"
          alt="Capa"
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="-mt-12 relative z-10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-foreground text-3xl font-semibold">
              L
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-semibold text-foreground">Luna Dark</h1>
                <BadgeCheck className="w-4.5 h-4.5 text-accent" />
              </div>
              <p className="text-sm text-muted-foreground">@lunadark</p>
              <p className="text-sm text-foreground/75 mt-2 max-w-md leading-relaxed">
                Fotógrafa profissional & criadora de conteúdo. Compartilhando arte exclusiva, bastidores e ensaios premium. 📸
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 mt-4 flex-wrap">
            <button className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
              <Lock className="w-3.5 h-3.5" /> Assinar R$39,90/mês
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground hover:bg-secondary transition-colors">
              <Gift className="w-3.5 h-3.5" /> Presente
            </button>
            <button className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium border border-border rounded-md text-foreground hover:bg-secondary transition-colors">
              <UserPlus className="w-3.5 h-3.5" /> Seguir
            </button>
            <button className="p-2 border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Share2 className="w-4 h-4" />
            </button>
          </div>

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-4 border-t border-border">
            {[
              { label: "Posts", value: "324", icon: FileText },
              { label: "Seguidores", value: "45,2K", icon: Users },
              { label: "Curtidas", value: "1,2M", icon: Heart },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-1.5">
                <stat.icon className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {mockPosts.map((post) => (
            <PostCard key={post.id} {...post} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
