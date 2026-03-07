import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, FileText, Heart, Gift, UserPlus, Lock, Share2, BadgeCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import type { Profile } from "@/contexts/AuthContext";

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile } = useAuth();
  const [creator, setCreator] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const isOwnProfile = myProfile?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      // Fetch creator profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileData) {
        setCreator(profileData as Profile);
        // Fetch posts
        const { data: postsData } = await supabase
          .from("posts")
          .select("*")
          .eq("creator_id", profileData.id)
          .order("created_at", { ascending: false });
        setPosts(postsData || []);
      }
      setLoading(false);
    };
    if (username) load();
  }, [username]);

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    const days = Math.floor(hours / 24);
    return `${days}d`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  if (!creator) {
    return (
      <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Perfil não encontrado</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-12 md:pt-14 pb-20 md:pb-8">
      {/* Cover */}
      <div className="relative h-40 md:h-56 bg-secondary">
        {creator.cover_url ? (
          <img src={creator.cover_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div className="-mt-12 relative z-10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-foreground text-3xl font-semibold overflow-hidden">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
              ) : (
                creator.name[0]
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-semibold text-foreground">{creator.name}</h1>
                {creator.verified && <BadgeCheck className="w-4.5 h-4.5 text-accent" />}
              </div>
              <p className="text-sm text-muted-foreground">@{creator.username}</p>
              {creator.bio && (
                <p className="text-sm text-foreground/75 mt-2 max-w-md leading-relaxed">{creator.bio}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && creator.verified && (
            <div className="flex gap-2 mt-4 flex-wrap">
              {creator.price_monthly > 0 && (
                <button className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                  <Lock className="w-3.5 h-3.5" /> Assinar R${Number(creator.price_monthly).toFixed(2)}/mês
                </button>
              )}
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
          )}

          {/* Stats */}
          <div className="flex gap-6 mt-5 pt-4 border-t border-border">
            {[
              { label: "Posts", value: posts.length.toString(), icon: FileText },
              { label: "Seguidores", value: creator.followers_count.toString(), icon: Users },
              { label: "Curtidas", value: "0", icon: Heart },
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
          {posts.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              {isOwnProfile ? "Você ainda não publicou nada." : "Nenhuma publicação ainda."}
            </p>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                id={post.id}
                creator={{ name: creator.name, username: creator.username, verified: creator.verified }}
                content={post.content}
                image={post.media_type === "photo" ? post.media_url : undefined}
                video={post.media_type === "video" ? post.media_url : undefined}
                likes={post.likes_count}
                comments={post.comments_count}
                locked={post.post_visibility !== "free"}
                type={post.post_visibility}
                price={post.ppv_price > 0 ? post.ppv_price : undefined}
                timeAgo={getTimeAgo(post.created_at)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default CreatorProfile;
