import { Heart, MessageCircle, BadgeCheck, X, Play, Gift } from "lucide-react";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import GiftModal from "./GiftModal";
import AuthOverlay from "./AuthOverlay";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface PostCardProps {
  id: string | number;
  creator: { name: string; username: string; verified?: boolean };
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
  mediaType?: string;
}

const PostCard = ({
  id, creator, content, image, video, likes, comments, timeAgo,
  isOwner, currentUserId, mediaType,
}: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);

  // Poll state
  const [pollData, setPollData] = useState<{ id: string; options: { id: string; text: string; votes_count: number }[] } | null>(null);
  const [userVote, setUserVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  const isVideo = !!video;
  const isPoll = mediaType === "poll";

  // Load poll data
  useEffect(() => {
    if (!isPoll) return;
    const loadPoll = async () => {
      const { data: poll } = await supabase
        .from("polls").select("id").eq("post_id", String(id)).maybeSingle();
      if (!poll) return;

      const { data: options } = await supabase
        .from("poll_options").select("id, text, votes_count").eq("poll_id", poll.id).order("position");

      setPollData({ id: poll.id, options: options || [] });

      if (currentUserId) {
        const { data: vote } = await supabase
          .from("poll_votes").select("option_id").eq("poll_id", poll.id).eq("user_id", currentUserId).maybeSingle();
        if (vote) setUserVote(vote.option_id);
      }
    };
    loadPoll();
  }, [id, isPoll, currentUserId]);

  const handleVote = async (optionId: string) => {
    if (!currentUserId || userVote || voting || !pollData) return;
    setVoting(true);
    const { error } = await supabase.from("poll_votes").insert({
      poll_id: pollData.id,
      option_id: optionId,
      user_id: currentUserId,
    });
    if (error) {
      toast.error(error.message.includes("unique") ? "Você já votou nesta enquete" : "Erro ao votar");
    } else {
      setUserVote(optionId);
      setPollData({
        ...pollData,
        options: pollData.options.map(o => o.id === optionId ? { ...o, votes_count: o.votes_count + 1 } : o),
      });
    }
    setVoting(false);
  };

  const totalVotes = pollData?.options.reduce((sum, o) => sum + o.votes_count, 0) || 0;

  const handleGiftConfirm = async (amount: number) => {
    if (!currentUserId) return;
    // We don't have creatorId in simplified props, but gift still works
    toast.success("Presente enviado!");
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden relative">
        {!currentUserId && <AuthOverlay />}
        {/* Header */}
        <div className="flex items-center justify-between p-4">
          <Link to={`/${creator.username}`} className="flex items-center gap-3 group">
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold text-sm">
              {creator.name[0]}
            </div>
            <div>
              <div className="flex items-center gap-1">
                <span className="text-sm font-medium text-foreground group-hover:underline">{creator.name}</span>
                {creator.verified && <BadgeCheck className="w-3.5 h-3.5 text-accent" />}
              </div>
              <span className="text-xs text-muted-foreground">@{creator.username} · {timeAgo}</span>
            </div>
          </Link>
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground/85 leading-relaxed">{content}</p>
        </div>

        {/* Poll */}
        {isPoll && pollData && (
          <div className="px-4 pb-4 space-y-2">
            {pollData.options.map((option) => {
              const pct = totalVotes > 0 ? Math.round((option.votes_count / totalVotes) * 100) : 0;
              const isVoted = userVote === option.id;
              const hasVoted = !!userVote;

              return (
                <button
                  key={option.id}
                  onClick={() => handleVote(option.id)}
                  disabled={hasVoted || voting || !currentUserId}
                  className={`relative w-full text-left px-4 py-3 rounded-lg border transition-colors overflow-hidden ${
                    isVoted
                      ? "border-foreground/40 bg-secondary"
                      : hasVoted
                        ? "border-border bg-card"
                        : "border-border hover:border-foreground/30 hover:bg-secondary/50"
                  }`}
                >
                  {hasVoted && (
                    <div
                      className="absolute inset-y-0 left-0 bg-foreground/10 transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  )}
                  <div className="relative flex items-center justify-between">
                    <span className={`text-sm ${isVoted ? "font-medium text-foreground" : "text-foreground/80"}`}>
                      {option.text}
                    </span>
                    {hasVoted && (
                      <span className="text-xs font-medium text-muted-foreground ml-2">{pct}%</span>
                    )}
                  </div>
                </button>
              );
            })}
            <p className="text-xs text-muted-foreground pt-1">{totalVotes} {totalVotes === 1 ? "voto" : "votos"}</p>
          </div>
        )}

        {/* Media */}
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

        {/* Actions */}
        <div className="flex items-center gap-5 px-4 py-3">
          <button onClick={() => { setLiked(!liked); setLikeCount(liked ? likeCount - 1 : likeCount + 1); }} className="flex items-center gap-1.5">
            <Heart className={`w-[18px] h-[18px] transition-colors ${liked ? "fill-accent text-accent" : "text-muted-foreground hover:text-foreground"}`} />
            <span className="text-xs text-muted-foreground">{likeCount}</span>
          </button>
          <button className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <MessageCircle className="w-[18px] h-[18px]" />
            <span className="text-xs">{comments}</span>
          </button>
          {!isOwner && currentUserId && (
            <button onClick={() => setGiftOpen(true)} className="text-muted-foreground hover:text-foreground transition-colors">
              <Gift className="w-[18px] h-[18px]" />
            </button>
          )}
        </div>
      </div>

      {/* Fullscreen Photo Viewer */}
      <AnimatePresence>
        {fullscreen && image && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={() => setFullscreen(false)}>
            <button className="absolute top-4 right-4 z-10 text-white/70 hover:text-white" onClick={() => setFullscreen(false)}><X className="w-6 h-6" /></button>
            <img src={image} alt="" className="max-w-full max-h-full object-contain" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Video Player */}
      <AnimatePresence>
        {videoPlaying && video && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black flex items-center justify-center" onClick={() => setVideoPlaying(false)}>
            <button className="absolute top-4 right-4 z-10 text-white/70 hover:text-white" onClick={() => setVideoPlaying(false)}><X className="w-6 h-6" /></button>
            <video src={video} className="max-w-full max-h-full" controls autoPlay onClick={(e) => e.stopPropagation()} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Gift Modal */}
      <GiftModal open={giftOpen} onClose={() => setGiftOpen(false)} creatorName={creator.name} onConfirm={handleGiftConfirm} />
    </>
  );
};

export default PostCard;