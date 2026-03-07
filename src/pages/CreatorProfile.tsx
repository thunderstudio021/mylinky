import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { Users, FileText, Heart, Gift, UserPlus, Lock, Share2, BadgeCheck, UserCheck, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import SubscribeModal from "@/components/SubscribeModal";
import GiftModal from "@/components/GiftModal";
import { toast } from "sonner";
import type { Profile } from "@/contexts/AuthContext";

const CreatorProfile = () => {
  const { username } = useParams<{ username: string }>();
  const { user, profile: myProfile, isAdmin } = useAuth();
  const [creator, setCreator] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [purchasedPosts, setPurchasedPosts] = useState<Set<string>>(new Set());
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = myProfile?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("username", username).single();

      if (profileData) {
        setCreator(profileData as Profile);
        const { data: postsData } = await supabase
          .from("posts").select("*").eq("creator_id", profileData.id).order("created_at", { ascending: false });
        setPosts(postsData || []);

        // Check follow/subscribe status
        if (user) {
          const [{ data: followData }, { data: subData }, { data: ppvData }] = await Promise.all([
            supabase.from("followers").select("id").eq("follower_id", user.id).eq("creator_id", profileData.id).maybeSingle(),
            supabase.from("subscriptions").select("id").eq("subscriber_id", user.id).eq("creator_id", profileData.id).eq("status", "active").maybeSingle(),
            supabase.from("ppv_purchases").select("post_id").eq("buyer_id", user.id),
          ]);
          setIsFollowing(!!followData);
          setIsSubscribed(!!subData);
          setPurchasedPosts(new Set((ppvData || []).map((p: any) => p.post_id)));
        }
      }
      setLoading(false);
    };
    if (username) load();
  }, [username, user]);

  const handleFollow = async () => {
    if (!user || !creator) return;
    setFollowLoading(true);
    if (isFollowing) {
      await supabase.from("followers").delete().eq("follower_id", user.id).eq("creator_id", creator.id);
      setIsFollowing(false);
      setCreator({ ...creator, followers_count: Math.max(0, creator.followers_count - 1) });
    } else {
      await supabase.from("followers").insert({ follower_id: user.id, creator_id: creator.id });
      setIsFollowing(true);
      setCreator({ ...creator, followers_count: creator.followers_count + 1 });
    }
    setFollowLoading(false);
  };

  const handleSubscribeConfirm = async (plan: "monthly" | "yearly") => {
    if (!user || !creator) return;
    const amount = plan === "monthly" ? creator.price_monthly : creator.price_yearly;
    await supabase.from("subscriptions").insert({
      subscriber_id: user.id, creator_id: creator.id, plan, amount,
    });
    setIsSubscribed(true);
    setCreator({ ...creator, subscribers_count: creator.subscribers_count + 1 });
    toast.success("Assinatura ativada!");
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  if (loading) return <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!creator) return <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center"><p className="text-sm text-muted-foreground">Perfil não encontrado</p></div>;

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
        <div className="-mt-12 relative z-10 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-foreground text-3xl font-semibold overflow-hidden">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
              ) : creator.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xl font-semibold text-foreground">{creator.name}</h1>
                {creator.verified && <BadgeCheck className="w-4.5 h-4.5 text-accent" />}
              </div>
              <p className="text-sm text-muted-foreground">@{creator.username}</p>
              {creator.bio && <p className="text-sm text-foreground/75 mt-2 max-w-md leading-relaxed">{creator.bio}</p>}
            </div>
          </div>

          {/* Actions */}
          {!isOwnProfile && creator.verified && user && (
            <div className="flex gap-3 mt-5 flex-wrap">
              {/* Follow button */}
              <button
                onClick={handleFollow}
                disabled={followLoading}
                className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isFollowing
                    ? "bg-secondary text-foreground border border-border hover:bg-secondary/80"
                    : "bg-foreground text-background hover:bg-foreground/90"
                }`}
              >
                {isFollowing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                {isFollowing ? "Seguindo" : "Seguir"}
              </button>

              {/* Subscribe button */}
              {creator.price_monthly > 0 && (
                <button
                  onClick={() => !isSubscribed && setSubscribeOpen(true)}
                  className={`flex items-center gap-2 px-6 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isSubscribed
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  <Crown className="w-4 h-4" />
                  {isSubscribed ? "Assinante" : `Assinar R$${Number(creator.price_monthly).toFixed(2)}/mês`}
                </button>
              )}

              {/* Share */}
              <button className="p-2.5 border border-border rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <Share2 className="w-4.5 h-4.5" />
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
                isAdmin={isAdmin}
                isOwner={isOwnProfile}
                isSubscribed={isSubscribed}
                hasPurchased={purchasedPosts.has(post.id)}
                creatorId={creator.id}
                creatorPriceMonthly={creator.price_monthly}
                creatorPriceYearly={creator.price_yearly}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>
      </div>

      {/* Subscribe Modal */}
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        creatorName={creator.name}
        priceMonthly={creator.price_monthly}
        priceYearly={creator.price_yearly}
        onConfirm={handleSubscribeConfirm}
      />
    </div>
  );
};

export default CreatorProfile;
