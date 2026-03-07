import { Heart, MessageCircle, BadgeCheck, X, Play, Gift, MoreVertical, Pencil, Trash2, MessageSquareOff, Lock, Crown, Send, Loader2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import GiftModal from "./GiftModal";
import AuthOverlay from "./AuthOverlay";
import SubscribeModal from "./SubscribeModal";
import PaymentModal from "./PaymentModal";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostCardProps {
  id: string | number;
  creator: { name: string; username: string; verified?: boolean; avatar_url?: string };
  content: string;
  image?: string;
  video?: string;
  likes: number;
  comments: number;
  locked: boolean;
  type: "free" | "subscribers" | "ppv" | "ppv-subscribers";
  price?: number;
  timeAgo: string;
  isAdmin?: boolean;
  isOwner?: boolean;
  isSubscribed?: boolean;
  hasPurchased?: boolean;
  creatorId?: string;
  creatorPriceMonthly?: number;
  creatorPriceYearly?: number;
  currentUserId?: string;
  onUnlocked?: () => void;
  onDelete?: (postId: string | number) => void;
  onEdit?: (postId: string | number) => void;
  mediaType?: string;
  commentsEnabled?: boolean;
}

const PostCard = ({
  id, creator, content, image, video, likes, comments, timeAgo,
  isOwner, isAdmin, isSubscribed, hasPurchased, currentUserId, mediaType,
  onDelete, onEdit, type, price, creatorId, creatorPriceMonthly, creatorPriceYearly, onUnlocked,
  commentsEnabled = true,
}: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [commentCount, setCommentCount] = useState(comments);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [localSubscribed, setLocalSubscribed] = useState(isSubscribed || false);
  const [localPurchased, setLocalPurchased] = useState(hasPurchased || false);
  const [likingInProgress, setLikingInProgress] = useState(false);

  // Comments state
  const [commentsOpen, setCommentsOpen] = useState(false);
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [localCommentsEnabled, setLocalCommentsEnabled] = useState(commentsEnabled);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // Poll state
  const [pollData, setPollData] = useState<{ id: string; options: { id: string; text: string; votes_count: number }[] } | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const isVideo = !!video;
  const isPoll = mediaType === "poll";

  const isContentLocked = (() => {
    if (isOwner || isAdmin) return false;
    if (type === "free") return false;
    if (type === "subscribers" && localSubscribed) return false;
    if (type === "ppv" && localPurchased) return false;
    if (type === "ppv-subscribers" && (localSubscribed || localPurchased)) return false;
    return true;
  })();

  const needsSubscription = type === "subscribers" || (type === "ppv-subscribers" && !localPurchased);
  const needsPayment = type === "ppv" || (type === "ppv-subscribers" && !localSubscribed);

  useEffect(() => { setLocalSubscribed(isSubscribed || false); }, [isSubscribed]);
  useEffect(() => { setLocalPurchased(hasPurchased || false); }, [hasPurchased]);

  // Check if user already liked
  useEffect(() => {
    if (!currentUserId) return;
    supabase.from("likes").select("id").eq("post_id", String(id)).eq("user_id", currentUserId).maybeSingle()
      .then(({ data }) => { if (data) setLiked(true); });
  }, [id, currentUserId]);

  // Load poll data
  useEffect(() => {
    if (!isPoll) return;
    const loadPoll = async () => {
      const { data: poll } = await supabase.from("polls").select("id").eq("post_id", String(id)).maybeSingle();
      if (!poll) return;
      const { data: options } = await supabase.from("poll_options").select("id, text, votes_count").eq("poll_id", poll.id).order("position");
      setPollData({ id: poll.id, options: options || [] });
      if (currentUserId) {
        const { data: vote } = await supabase.from("poll_votes").select("option_id").eq("poll_id", poll.id).eq("user_id", currentUserId).maybeSingle();
        if (vote) setUserVote(vote.option_id);
      }
    };
    loadPoll();
  }, [id, isPoll, currentUserId]);

  const handleVote = async (optionId: string) => {
    if (!currentUserId || userVote || voting || !pollData) return;
    setVoting(true);
    const { error } = await supabase.from("poll_votes").insert({ poll_id: pollData.id, option_id: optionId, user_id: currentUserId });
    if (error) {
      toast.error(error.message.includes("unique") ? "Você já votou nesta enquete" : "Erro ao votar");
    } else {
      setUserVote(optionId);
      setPollData({ ...pollData, options: pollData.options.map(o => o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o) });
    }
    setVoting(false);
  };

  const totalVotes = pollData?.options.reduce((sum, o) => sum + o.votes_count, 0) || 0;

  // Like/unlike
  const handleLike = async () => {
    if (!currentUserId || isContentLocked || likingInProgress) return;
    setLikingInProgress(true);
    if (liked) {
      setLiked(false);
      setLikeCount(prev => Math.max(0, prev - 1));
      await supabase.from("likes").delete().eq("post_id", String(id)).eq("user_id", currentUserId);
    } else {
      setLiked(true);
      setLikeCount(prev => prev + 1);
      await supabase.from("likes").insert({ post_id: String(id), user_id: currentUserId });
    }
    setLikingInProgress(false);
  };

  // Comments
  const loadComments = async () => {
    setLoadingComments(true);
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, user_id")
      .eq("post_id", String(id))
      .order("created_at", { ascending: true });

    if (data && data.length > 0) {
      const userIds = [...new Set(data.map(c => c.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url")
        .in("id", userIds);
      const profileMap = new Map((profiles || []).map(p => [p.id, p]));
      setCommentsList(data.map(c => ({ ...c, profile: profileMap.get(c.user_id) })));
    } else {
      setCommentsList([]);
    }
    setLoadingComments(false);
  };

  const handleOpenComments = () => {
    if (!localCommentsEnabled && !isOwner && !isAdmin) {
      toast.info("Comentários desativados nesta publicação");
      return;
    }
    setCommentsOpen(true);
    loadComments();
  };

  const handlePostComment = async () => {
    if (!currentUserId || !newComment.trim() || postingComment) return;
    setPostingComment(true);
    const { error } = await supabase.from("comments").insert({
      post_id: String(id), user_id: currentUserId, content: newComment.trim(),
    });
    if (error) {
      toast.error("Erro ao comentar");
    } else {
      setNewComment("");
      setCommentCount(prev => prev + 1);
      loadComments();
    }
    setPostingComment(false);
  };

  const handleDeleteComment = async (commentId: string) => {
    await supabase.from("comments").delete().eq("id", commentId);
    setCommentCount(prev => Math.max(0, prev - 1));
    setCommentsList(prev => prev.filter(c => c.id !== commentId));
  };

  const handleToggleComments = async () => {
    const newVal = !localCommentsEnabled;
    setLocalCommentsEnabled(newVal);
    setMenuOpen(false);
    await supabase.from("posts").update({ comments_enabled: newVal } as any).eq("id", String(id));
    toast.success(newVal ? "Comentários ativados" : "Comentários desativados");
  };

  const handleGiftConfirm = async (amount: number) => {
    if (!currentUserId) return;
    toast.success("Presente enviado!");
  };

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir esta publicação?")) return;
    setDeleting(true);
    setMenuOpen(false);
    const { error } = await supabase.from("posts").delete().eq("id", String(id));
    if (error) {
      toast.error("Erro ao excluir publicação");
    } else {
      toast.success("Publicação excluída!");
      onDelete?.(id);
    }
    setDeleting(false);
  };

  const handleSubscribeConfirm = async (plan: "monthly" | "yearly", method: "pix" | "credit_card") => {
    if (!currentUserId || !creatorId) return;
    const amount = plan === "monthly" ? (creatorPriceMonthly || 0) : (creatorPriceYearly || 0);
    await supabase.from("subscriptions").insert({
      subscriber_id: currentUserId, creator_id: creatorId, plan, amount, payment_method: method,
    });
    setLocalSubscribed(true);
    toast.success("Assinatura ativada!");
    onUnlocked?.();
  };

  const handlePaymentConfirm = async (method: "pix" | "credit_card") => {
    if (!currentUserId || !creatorId) return;
    await supabase.from("ppv_purchases").insert({
      buyer_id: currentUserId, post_id: String(id), amount: price || 0, payment_method: method,
    });
    setLocalPurchased(true);
    toast.success("Conteúdo desbloqueado!");
    onUnlocked?.();
  };

  const showMenu = isOwner || isAdmin;
  const displayContent = isContentLocked ? content.substring(0, 80) + (content.length > 80 ? "..." : "") : content;

  const getTimeAgoShort = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h`;
    return `${Math.floor(hours / 24)}d`;
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden relative">
        {!currentUserId && <AuthOverlay />}
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/${creator.username}`} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold text-sm overflow-hidden">
              {creator.avatar_url ? (
                <img src={creator.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : creator.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground group-hover:underline">{creator.name}</span>
                {creator.verified && <BadgeCheck className="w-3.5 h-3.5 text-accent" />}
              </div>
              <span className="text-xs text-muted-foreground">@{creator.username} · {timeAgo}</span>
            </div>
          </Link>
          {showMenu && (
            <div className="relative">
              <button onClick={() => setMenuOpen(!menuOpen)} className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <MoreVertical className="w-4 h-4" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-8 z-40 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[180px]">
                    <button onClick={() => { setMenuOpen(false); onEdit?.(id); }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={handleDelete} disabled={deleting} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors">
                      <Trash2 className="w-3.5 h-3.5" /> {deleting ? "Excluindo..." : "Excluir"}
                    </button>
                    <button onClick={handleToggleComments} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors whitespace-nowrap">
                      <MessageSquareOff className="w-3.5 h-3.5 shrink-0" />
                      {localCommentsEnabled ? "Desativar comentários" : "Ativar comentários"}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground/85 leading-relaxed">{displayContent}</p>
        </div>

        {/* Locked overlay for media/poll */}
        {isContentLocked ? (
          <div className="relative">
            {(image || video) && !isPoll && (
              <div className="relative overflow-hidden">
                {isVideo ? (
                  <div className="relative w-full" style={{ aspectRatio: "9/16" }}>
                    <video src={video} className="w-full h-full object-cover blur-xl scale-110" muted playsInline />
                  </div>
                ) : (
                  <img src={image} alt="" className="w-full object-cover blur-xl scale-110" style={{ aspectRatio: "4/5" }} />
                )}
              </div>
            )}
            {isPoll && (
              <div className="px-4 pb-4 blur-lg select-none pointer-events-none">
                <div className="space-y-2"><div className="h-10 rounded-lg bg-secondary" /><div className="h-10 rounded-lg bg-secondary" /></div>
              </div>
            )}
            {!image && !video && !isPoll && <div className="h-32 bg-secondary/30" />}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex flex-col items-center justify-center gap-3 p-6">
              <div className="w-10 h-10 rounded-full bg-secondary/80 flex items-center justify-center">
                <Lock className="w-5 h-5 text-muted-foreground" />
              </div>
              {type === "subscribers" && (
                <>
                  <p className="text-sm text-foreground font-medium text-center">Conteúdo exclusivo para assinantes</p>
                  <button onClick={() => setSubscribeOpen(true)} className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors">
                    <Crown className="w-3.5 h-3.5" /> Assinar por R${Number(creatorPriceMonthly || 0).toFixed(2)}/mês
                  </button>
                </>
              )}
              {type === "ppv" && (
                <>
                  <p className="text-sm text-foreground font-medium text-center">Conteúdo pago</p>
                  <button onClick={() => setPaymentOpen(true)} className="px-5 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors">
                    Desbloquear por R${Number(price || 0).toFixed(2)}
                  </button>
                </>
              )}
              {type === "ppv-subscribers" && (
                <>
                  <p className="text-sm text-foreground font-medium text-center">Conteúdo exclusivo</p>
                  <div className="flex flex-col gap-2 items-center">
                    <button onClick={() => setSubscribeOpen(true)} className="flex items-center gap-1.5 px-5 py-2 text-sm font-medium rounded-full bg-foreground text-background hover:bg-foreground/90 transition-colors">
                      <Crown className="w-3.5 h-3.5" /> Assinar por R${Number(creatorPriceMonthly || 0).toFixed(2)}/mês
                    </button>
                    <span className="text-xs text-muted-foreground">ou</span>
                    <button onClick={() => setPaymentOpen(true)} className="px-5 py-2 text-sm font-medium rounded-full border border-foreground/20 text-foreground hover:bg-secondary transition-colors">
                      Pagar R${Number(price || 0).toFixed(2)} uma vez
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            {isPoll && pollData && (
              <div className="px-4 pb-4 space-y-2">
                {pollData.options.map((option) => {
                  const pct = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
                  const isVoted = userVote === option.id;
                  const hasVoted = !!userVote;
                  return (
                    <button key={option.id} onClick={() => handleVote(option.id)} disabled={hasVoted || voting || !currentUserId}
                      className={`relative w-full text-left px-4 py-3 rounded-lg border transition-colors overflow-hidden ${isVoted ? "border-foreground/40 bg-secondary" : hasVoted ? "border-border bg-card" : "border-border hover:border-foreground/30 hover:bg-secondary/50"}`}>
                      {hasVoted && <div className="absolute inset-y-0 left-0 bg-foreground/10 transition-all duration-500" style={{ width: `${pct}%` }} />}
                      <div className="relative flex items-center justify-between">
                        <span className={`text-sm ${isVoted ? "font-medium text-foreground" : "text-foreground/80"}`}>{option.text}</span>
                        {hasVoted && <span className="text-xs font-medium text-muted-foreground ml-2">{pct}%</span>}
                      </div>
                    </button>
                  );
                })}
                <p className="text-xs text-muted-foreground pt-1">{totalVotes} {totalVotes === 1 ? "voto" : "votos"}</p>
              </div>
            )}
            {(image || video) && !isPoll && (
              <div className="relative cursor-pointer" onClick={() => isVideo ? setVideoPlaying(true) : setFullscreen(true)}>
                {isVideo ? (
                  <div className="relative w-full" style={{ aspectRatio: "9/16" }}>
                    <video src={video} className="w-full h-full object-cover" muted playsInline loop />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity hover:bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                        <Play className="w-5 h-5 text-white ml-0.5 drop-shadow-sm" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <img src={image} alt="" className="w-full object-cover" style={{ aspectRatio: "4/5" }} />
                )}
              </div>
            )}
          </>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 px-4 py-3">
          <button onClick={handleLike} className="flex items-center gap-1.5" disabled={likingInProgress}>
            <Heart className={`w-[18px] h-[18px] transition-colors ${liked ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
            <span className="text-xs text-muted-foreground">{likeCount}</span>
          </button>
          <button onClick={handleOpenComments} className={`flex items-center gap-1.5 transition-colors ${!localCommentsEnabled && !isOwner && !isAdmin ? "opacity-40 cursor-not-allowed" : "text-muted-foreground hover:text-foreground"}`}>
            <MessageCircle className="w-[18px] h-[18px]" />
            <span className="text-xs">{commentCount}</span>
          </button>
          {!isOwner && currentUserId && !isContentLocked && (
            <button onClick={() => setGiftOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
              <Gift className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Comments Panel */}
      <AnimatePresence>
        {commentsOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-end md:items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setCommentsOpen(false)} />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-md md:mx-4 bg-card border border-border rounded-t-xl md:rounded-xl overflow-hidden max-h-[70vh] flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
                <h3 className="text-sm font-semibold text-foreground">Comentários ({commentCount})</h3>
                <button onClick={() => setCommentsOpen(false)} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingComments ? (
                  <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                ) : commentsList.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">Nenhum comentário ainda</p>
                ) : (
                  commentsList.map(c => (
                    <div key={c.id} className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-semibold shrink-0 overflow-hidden">
                        {c.profile?.avatar_url ? <img src={c.profile.avatar_url} alt="" className="w-full h-full object-cover" /> : c.profile?.name?.[0] || "U"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-foreground">{c.profile?.name || "Usuário"}</span>
                          <span className="text-[10px] text-muted-foreground">{getTimeAgoShort(c.created_at)}</span>
                          {(c.user_id === currentUserId || isAdmin) && (
                            <button onClick={() => handleDeleteComment(c.id)} className="text-muted-foreground hover:text-destructive ml-auto">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground/80 mt-0.5">{c.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {currentUserId && localCommentsEnabled && (
                <div className="border-t border-border px-4 py-3 flex items-center gap-2 shrink-0">
                  <input
                    ref={commentInputRef}
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handlePostComment()}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-muted-foreground/30"
                  />
                  <button onClick={handlePostComment} disabled={postingComment || !newComment.trim()} className="p-2 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors disabled:opacity-50">
                    {postingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              )}
              {!localCommentsEnabled && (
                <div className="border-t border-border px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Comentários desativados pelo criador</p>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Photo */}
      <AnimatePresence>
        {fullscreen && image && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={() => setFullscreen(false)}>
            <button className="absolute top-4 right-4 z-10 text-white/70 hover:text-white" onClick={() => setFullscreen(false)}><X className="w-6 h-6" /></button>
            <img src={image} alt="" className="max-w-full max-h-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Video */}
      <AnimatePresence>
        {videoPlaying && video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={() => setVideoPlaying(false)}>
            <button className="absolute top-4 right-4 z-10 text-white/70 hover:text-white" onClick={() => setVideoPlaying(false)}><X className="w-6 h-6" /></button>
            <video src={video} className="max-w-full max-h-full" controls autoPlay onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      <GiftModal open={giftOpen} onClose={() => setGiftOpen(false)} creatorName={creator.name} onConfirm={handleGiftConfirm} />
      <SubscribeModal open={subscribeOpen} onClose={() => setSubscribeOpen(false)} creatorName={creator.name} priceMonthly={creatorPriceMonthly || 0} priceYearly={creatorPriceYearly || 0} onConfirm={handleSubscribeConfirm} />
      <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={price || 0} onConfirm={handlePaymentConfirm} />
    </>
  );
};

export default PostCard;
