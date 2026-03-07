import { Heart, MessageCircle, Lock, Eye, Crown, DollarSign, BadgeCheck, X, Play, Gift } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import GiftModal from "./GiftModal";
import PaymentModal from "./PaymentModal";
import SubscribeModal from "./SubscribeModal";
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
}

const typeLabels: Record<string, { label: string; icon: any }> = {
  subscribers: { label: "Assinantes", icon: Crown },
  ppv: { label: "Pago", icon: DollarSign },
  "ppv-subscribers": { label: "Assinantes + Pago", icon: Lock },
};

const PostCard = ({
  id, creator, content, image, video, likes, comments, locked, type, price, timeAgo,
  isAdmin, isOwner, isSubscribed, hasPurchased, creatorId, creatorPriceMonthly = 0, creatorPriceYearly = 0, currentUserId, onUnlocked,
}: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const [fullscreen, setFullscreen] = useState(false);
  const [videoPlaying, setVideoPlaying] = useState(false);
  const [giftOpen, setGiftOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [subscribeOpen, setSubscribeOpen] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const typeInfo = typeLabels[type];

  const isVideo = !!video;

  // Determine if content should be visible
  const canView = !locked || isAdmin || isOwner || unlocked ||
    (isSubscribed && (type === "subscribers")) ||
    (hasPurchased && (type === "ppv" || type === "ppv-subscribers")) ||
    (isSubscribed && hasPurchased && type === "ppv-subscribers");

  const showLocked = locked && !canView;

  // Determine which unlock action to show
  const needsSubscription = (type === "subscribers" || type === "ppv-subscribers") && !isSubscribed;
  const needsPayment = (type === "ppv" || (type === "ppv-subscribers" && isSubscribed)) && !hasPurchased;

  const handleGiftConfirm = async (amount: number) => {
    if (!currentUserId || !creatorId) return;
    await supabase.from("gifts").insert({
      sender_id: currentUserId,
      creator_id: creatorId,
      post_id: String(id),
      amount,
    });
    toast.success("Presente enviado!");
  };

  const handlePaymentConfirm = async () => {
    if (!currentUserId) return;
    await supabase.from("ppv_purchases").insert({
      buyer_id: currentUserId,
      post_id: String(id),
      amount: price || 0,
    });
    setUnlocked(true);
    onUnlocked?.();
  };

  const handleSubscribeConfirm = async (plan: "monthly" | "yearly") => {
    if (!currentUserId || !creatorId) return;
    const amount = plan === "monthly" ? creatorPriceMonthly : creatorPriceYearly;
    await supabase.from("subscriptions").insert({
      subscriber_id: currentUserId,
      creator_id: creatorId,
      plan,
      amount,
    });
    setUnlocked(true);
    onUnlocked?.();
  };

  return (
    <>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
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
          {typeInfo && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <typeInfo.icon className="w-3 h-3" />
              <span>{typeInfo.label}</span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pb-3">
          <p className="text-sm text-foreground/85 leading-relaxed">{content}</p>
        </div>

        {/* Media */}
        {(image || video) && (
          <div className="relative cursor-pointer" onClick={() => !showLocked && (isVideo ? setVideoPlaying(true) : setFullscreen(true))}>
            {isVideo ? (
              <div className="relative w-full" style={{ aspectRatio: "9/16" }}>
                <video src={video} className={`w-full h-full object-cover ${showLocked ? "blur-2xl scale-105" : ""}`} muted playsInline loop />
                {!showLocked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/10 transition-opacity hover:bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-white/15 backdrop-blur-md border border-white/20 flex items-center justify-center transition-transform duration-200 hover:scale-110">
                      <Play className="w-5 h-5 text-white ml-0.5 drop-shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <img src={image} alt="" className={`w-full object-cover ${showLocked ? "blur-2xl scale-105" : ""}`} style={{ aspectRatio: "4/5" }} />
            )}
            {showLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50 px-6">
                <Lock className="w-8 h-8 text-muted-foreground mb-3" />
                <p className="text-sm text-foreground font-medium mb-4">Conteúdo exclusivo</p>
                {needsSubscription && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSubscribeOpen(true); }}
                    className="w-full max-w-[240px] px-5 py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <Crown className="w-4 h-4" />
                    Tornar-se assinante
                  </button>
                )}
                {needsPayment && price && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setPaymentOpen(true); }}
                    className="w-full max-w-[240px] px-5 py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors mt-2 flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    Desbloquear por R${Number(price).toFixed(2)}
                  </button>
                )}
              </div>
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

      {/* Payment Modal */}
      {price && <PaymentModal open={paymentOpen} onClose={() => setPaymentOpen(false)} amount={price} onConfirm={handlePaymentConfirm} />}

      {/* Subscribe Modal */}
      <SubscribeModal
        open={subscribeOpen}
        onClose={() => setSubscribeOpen(false)}
        creatorName={creator.name}
        priceMonthly={creatorPriceMonthly}
        priceYearly={creatorPriceYearly}
        onConfirm={handleSubscribeConfirm}
      />
    </>
  );
};

export default PostCard;
