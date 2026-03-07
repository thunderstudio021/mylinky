import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Users, FileText, Heart, Crown, UserPlus, BadgeCheck, UserCheck, Camera, Pencil, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import PostCard from "@/components/PostCard";
import SubscribeModal from "@/components/SubscribeModal";
import ImageCropModal from "@/components/ImageCropModal";
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

  // Edit state
  const [editingName, setEditingName] = useState(false);
  const [editingBio, setEditingBio] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [bioValue, setBioValue] = useState("");
  const [uploading, setUploading] = useState(false);

  // Crop modal state
  const [cropOpen, setCropOpen] = useState(false);
  const [cropImageUrl, setCropImageUrl] = useState("");
  const [cropType, setCropType] = useState<"avatar" | "cover">("avatar");

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const isOwnProfile = myProfile?.username === username;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data: profileData } = await supabase
        .from("profiles").select("*").eq("username", username).single();

      if (profileData) {
        setCreator(profileData as Profile);
        setNameValue(profileData.name);
        setBioValue(profileData.bio || "");
        const { data: postsData } = await supabase
          .from("posts").select("*").eq("creator_id", profileData.id).order("created_at", { ascending: false });
        setPosts(postsData || []);

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

  const uploadBlob = async (blob: Blob, folder: string) => {
    const filePath = `${folder}/${user!.id}_${Date.now()}.jpg`;
    const { error } = await supabase.storage.from("media").upload(filePath, blob, { upsert: true, contentType: "image/jpeg" });
    if (error) throw error;
    const { data } = supabase.storage.from("media").getPublicUrl(filePath);
    return data.publicUrl;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "avatar" | "cover") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropType(type);
    setCropImageUrl(url);
    setCropOpen(true);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!creator) return;
    setCropOpen(false);
    setUploading(true);
    try {
      const folder = cropType === "avatar" ? "avatars" : "covers";
      const field = cropType === "avatar" ? "avatar_url" : "cover_url";
      const url = await uploadBlob(blob, folder);
      await supabase.from("profiles").update({ [field]: url }).eq("id", creator.id);
      setCreator({ ...creator, [field]: url });
      toast.success(cropType === "avatar" ? "Foto de perfil atualizada!" : "Foto de capa atualizada!");
    } catch {
      toast.error("Erro ao enviar foto");
    }
    setUploading(false);
  };

  const saveName = async () => {
    if (!creator || !nameValue.trim()) return;
    await supabase.from("profiles").update({ name: nameValue.trim() }).eq("id", creator.id);
    setCreator({ ...creator, name: nameValue.trim() });
    setEditingName(false);
    toast.success("Nome atualizado!");
  };

  const saveBio = async () => {
    if (!creator) return;
    await supabase.from("profiles").update({ bio: bioValue.trim() }).eq("id", creator.id);
    setCreator({ ...creator, bio: bioValue.trim() });
    setEditingBio(false);
    toast.success("Biografia atualizada!");
  };

  const getTimeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  const totalLikes = posts.reduce((sum, p) => sum + (p.likes_count || 0), 0);

  if (loading) return <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center"><p className="text-sm text-muted-foreground">Carregando...</p></div>;
  if (!creator) return <div className="min-h-screen bg-background pt-14 md:pt-[72px] flex items-center justify-center"><p className="text-sm text-muted-foreground">Perfil não encontrado</p></div>;

  return (
    <div className="min-h-screen bg-background pt-12 md:pt-14 pb-20 md:pb-8">
      {/* Hidden file inputs */}
      <input ref={avatarInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "avatar")} />
      <input ref={coverInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "cover")} />

      {/* Cover */}
      <div className="relative bg-secondary group" style={{ aspectRatio: "16/5" }}>
        {creator.cover_url ? (
          <img src={creator.cover_url} alt="Capa" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-secondary to-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        {isOwnProfile && (
          <button
            onClick={() => coverInputRef.current?.click()}
            disabled={uploading}
            className="absolute top-3 right-3 p-2 rounded-full bg-background/60 backdrop-blur-sm text-foreground/80 hover:bg-background/80 transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="-mt-12 relative z-10 mb-6">
          {/* Avatar + Info */}
          <div className="flex flex-col items-center text-center">
            {/* Avatar */}
            <div className="relative group/avatar">
              <div className="w-24 h-24 rounded-full bg-secondary border-4 border-background flex items-center justify-center text-foreground text-3xl font-semibold overflow-hidden">
                {creator.avatar_url ? (
                  <img src={creator.avatar_url} alt={creator.name} className="w-full h-full object-cover" />
                ) : creator.name[0]}
              </div>
              {isOwnProfile && (
                <button
                  onClick={() => avatarInputRef.current?.click()}
                  disabled={uploading}
                  className="absolute bottom-0 right-0 p-1.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-all"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Name */}
            <div className="mt-3">
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameValue}
                    onChange={(e) => setNameValue(e.target.value)}
                    className="bg-secondary border border-border rounded-lg px-3 py-1.5 text-lg font-semibold text-foreground text-center w-48 focus:outline-none focus:ring-1 focus:ring-accent"
                    autoFocus
                  />
                  <button onClick={saveName} className="p-1.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/80"><Check className="w-3.5 h-3.5" /></button>
                  <button onClick={() => { setEditingName(false); setNameValue(creator.name); }} className="p-1.5 rounded-full bg-secondary text-muted-foreground hover:bg-secondary/80"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 justify-center">
                  <h1 className="text-xl font-semibold text-foreground">{creator.name}</h1>
                  {creator.verified && <BadgeCheck className="w-4.5 h-4.5 text-accent" />}
                  {isOwnProfile && (
                    <button onClick={() => setEditingName(true)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-0.5">@{creator.username}</p>
            </div>

            {/* Bio */}
            <div className="mt-2 max-w-sm">
              {editingBio ? (
                <div className="flex flex-col items-center gap-2">
                  <textarea
                    value={bioValue}
                    onChange={(e) => setBioValue(e.target.value)}
                    rows={3}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground w-full focus:outline-none focus:ring-1 focus:ring-accent resize-none"
                    placeholder="Escreva sua biografia..."
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button onClick={saveBio} className="px-3 py-1 rounded-lg bg-accent text-accent-foreground text-xs font-medium hover:bg-accent/80">Salvar</button>
                    <button onClick={() => { setEditingBio(false); setBioValue(creator.bio || ""); }} className="px-3 py-1 rounded-lg bg-secondary text-muted-foreground text-xs font-medium hover:bg-secondary/80">Cancelar</button>
                  </div>
                </div>
              ) : (
                <div className="group/bio flex items-start gap-1 justify-center">
                  <p className="text-sm text-foreground/75 leading-relaxed">
                    {creator.bio || (isOwnProfile ? "Adicione uma biografia..." : "")}
                  </p>
                  {isOwnProfile && (
                    <button onClick={() => setEditingBio(true)} className="p-1 rounded-full hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                      <Pencil className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Stats - minimal centered */}
            <div className="flex items-center justify-center gap-8 mt-4">
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-foreground">{posts.length}</span>
                <span className="text-xs text-muted-foreground">Posts</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-foreground">{creator.followers_count}</span>
                <span className="text-xs text-muted-foreground">Seguidores</span>
              </div>
              <div className="w-px h-8 bg-border" />
              <div className="flex flex-col items-center">
                <span className="text-lg font-bold text-foreground">{totalLikes}</span>
                <span className="text-xs text-muted-foreground">Curtidas</span>
              </div>
            </div>

            {/* Actions */}
            {!isOwnProfile && creator.verified && user && (
              <div className="flex gap-2 mt-4 justify-center">
                <button
                  onClick={handleFollow}
                  disabled={followLoading}
                  className={`px-5 py-2 text-sm font-medium rounded-full transition-all ${
                    isFollowing
                      ? "bg-secondary text-foreground border border-border hover:bg-secondary/80"
                      : "border border-foreground/20 text-foreground hover:bg-secondary"
                  }`}
                >
                  {isFollowing ? "Seguindo" : "Seguir"}
                </button>

                <button
                  onClick={() => !isSubscribed && setSubscribeOpen(true)}
                  className={`flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full transition-all ${
                    isSubscribed
                      ? "bg-accent/10 text-accent border border-accent/20"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                >
                  <Crown className="w-3.5 h-3.5" />
                  {isSubscribed ? "Assinante" : "Assinar"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Posts */}
        <div className="space-y-4">
          {(() => {
            const visiblePosts = posts.filter((post) => {
              // Owner and admin see everything
              if (isOwnProfile || isAdmin) return true;
              // Free posts visible to all
              if (post.post_visibility === "free") return true;
              // Subscriber-only posts
              if (post.post_visibility === "subscribers" && isSubscribed) return true;
              // PPV posts - only if purchased
              if (post.post_visibility === "ppv" && purchasedPosts.has(post.id)) return true;
              // PPV+subscribers
              if (post.post_visibility === "ppv-subscribers" && (isSubscribed || purchasedPosts.has(post.id))) return true;
              return false;
            });

            return visiblePosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-12">
                {isOwnProfile ? "Você ainda não publicou nada." : posts.length > 0 ? "Assine para ver as publicações exclusivas." : "Nenhuma publicação ainda."}
              </p>
            ) : (
              visiblePosts.map((post) => (
                <PostCard
                  key={post.id}
                  id={post.id}
                  creator={{ name: creator.name, username: creator.username, verified: creator.verified }}
                  content={post.content}
                  image={post.media_type === "photo" ? post.media_url : undefined}
                  video={post.media_type === "video" ? post.media_url : undefined}
                  likes={post.likes_count}
                  comments={post.comments_count}
                  locked={false}
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
                  mediaType={post.media_type}
                />
              ))
            );
          })()}
        </div>
      </div>

      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        creatorName={creator.name}
        priceMonthly={creator.price_monthly}
        priceYearly={creator.price_yearly}
        onConfirm={handleSubscribeConfirm}
      />

      <ImageCropModal
        open={cropOpen}
        imageUrl={cropImageUrl}
        aspectRatio={cropType === "avatar" ? 1 : 16 / 5}
        shape={cropType === "avatar" ? "circle" : "rect"}
        onConfirm={handleCropConfirm}
        onClose={() => setCropOpen(false)}
      />
    </div>
  );
};

export default CreatorProfile;
