import PostCard from "@/components/PostCard";
import CreatorCard from "@/components/CreatorCard";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const tabs = ["Para Você", "Seguindo"];

const Index = () => {
  const [activeTab, setActiveTab] = useState("Para Você");
  const [posts, setPosts] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState<Set<string>>(new Set());
  const [purchases, setPurchases] = useState<Set<string>>(new Set());
  const [following, setFollowing] = useState<Set<string>>(new Set());
  const { user, isAdmin } = useAuth();

  useEffect(() => {
    const loadData = async () => {
      const { data: creatorsData } = await supabase
        .from("profiles").select("*").eq("verified", true).order("followers_count", { ascending: false }).limit(10);
      setCreators(creatorsData || []);

      const { data: postsData } = await supabase
        .from("posts").select("*, profiles!posts_creator_id_fkey(name, username, verified, avatar_url, price_monthly, price_yearly)")
        .order("created_at", { ascending: false }).limit(50);
      setPosts(postsData || []);

      if (user) {
        const [{ data: subsData }, { data: ppvData }, { data: followData }] = await Promise.all([
          supabase.from("subscriptions").select("creator_id").eq("subscriber_id", user.id).eq("status", "active"),
          supabase.from("ppv_purchases").select("post_id").eq("buyer_id", user.id),
          supabase.from("followers").select("creator_id").eq("follower_id", user.id),
        ]);
        setSubscriptions(new Set((subsData || []).map((s: any) => s.creator_id)));
        setPurchases(new Set((ppvData || []).map((p: any) => p.post_id)));
        setFollowing(new Set((followData || []).map((f: any) => f.creator_id)));
      }
      setLoading(false);
    };
    loadData();
  }, [user]);

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const filteredPosts = activeTab === "Seguindo" ? [] : posts.filter((p) => (p.profiles as any)?.verified);

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8">
          <div>
            <div className="flex justify-center md:justify-start gap-1 mb-6 border-b border-border">
              {tabs.map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-5 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                    activeTab === tab ? "border-foreground text-foreground font-medium" : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}>{tab}</button>
              ))}
            </div>

            <div className="space-y-4">
              {loading ? (
                <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
              ) : filteredPosts.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-12">
                  {activeTab === "Seguindo" ? "Você ainda não segue nenhum criador." : "Nenhuma publicação encontrada."}
                </p>
              ) : (
                filteredPosts.map((post) => {
                  const profile = post.profiles as any;
                  return (
                    <PostCard
                      key={post.id}
                      id={post.id}
                      creator={{ name: profile?.name || "Criador", username: profile?.username || "", verified: profile?.verified || false }}
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
                      isOwner={user?.id === post.creator_id}
                      isSubscribed={subscriptions.has(post.creator_id)}
                      hasPurchased={purchases.has(post.id)}
                      creatorId={post.creator_id}
                      creatorPriceMonthly={Number(profile?.price_monthly) || 0}
                      creatorPriceYearly={Number(profile?.price_yearly) || 0}
                      currentUserId={user?.id}
                    />
                  );
                })
              )}
            </div>
          </div>

          <div className="hidden lg:block space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Criadores em destaque</h3>
            {creators.map((creator, i) => (
              <CreatorCard key={creator.id} name={creator.name} username={creator.username} avatar={creator.avatar_url || ""}
                category={creator.category || ""} followers={creator.followers_count} price={Number(creator.price_monthly)} verified={creator.verified} index={i} />
            ))}
            {creators.length === 0 && !loading && <p className="text-xs text-muted-foreground">Nenhum criador verificado ainda.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
