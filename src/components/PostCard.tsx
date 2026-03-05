import { motion } from "framer-motion";
import { Heart, MessageCircle, Share2, Lock, Eye, Crown, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface PostCardProps {
  id: number;
  creator: { name: string; username: string; avatar: string };
  content: string;
  image?: string;
  likes: number;
  comments: number;
  locked: boolean;
  type: "free" | "subscribers" | "ppv" | "ppv-subscribers";
  price?: number;
  timeAgo: string;
}

const typeLabels = {
  free: { label: "Free", icon: Eye, color: "text-green-400" },
  subscribers: { label: "Subscribers", icon: Crown, color: "text-gold" },
  ppv: { label: "Pay Per View", icon: DollarSign, color: "text-primary" },
  "ppv-subscribers": { label: "PPV + Sub", icon: Lock, color: "text-premium-glow" },
};

const PostCard = ({ creator, content, image, likes, comments, locked, type, price, timeAgo }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const typeInfo = typeLabels[type];

  const handleLike = () => {
    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border/50 rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full gradient-red flex items-center justify-center text-primary-foreground font-bold text-sm">
            {creator.name[0]}
          </div>
          <div>
            <p className="font-semibold text-sm text-foreground">{creator.name}</p>
            <p className="text-xs text-muted-foreground">@{creator.username} · {timeAgo}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1 text-xs ${typeInfo.color}`}>
          <typeInfo.icon className="w-3 h-3" />
          <span>{typeInfo.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/90">{content}</p>
      </div>

      {/* Image */}
      {image && (
        <div className="relative">
          <img
            src={image}
            alt="Post content"
            className={`w-full aspect-video object-cover ${locked ? "blur-xl" : ""}`}
          />
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/40 backdrop-blur-sm">
              <Lock className="w-10 h-10 text-primary mb-3" />
              <p className="text-foreground font-semibold text-sm">Exclusive Content</p>
              {price && (
                <Button size="sm" className="mt-3 gradient-red text-primary-foreground font-semibold">
                  Unlock for R${price.toFixed(2)}
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-4 p-4">
        <button onClick={handleLike} className="flex items-center gap-1.5 group">
          <Heart className={`w-5 h-5 transition-colors ${liked ? "fill-primary text-primary" : "text-muted-foreground group-hover:text-primary"}`} />
          <span className="text-sm text-muted-foreground">{likeCount}</span>
        </button>
        <button className="flex items-center gap-1.5 group">
          <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
          <span className="text-sm text-muted-foreground">{comments}</span>
        </button>
        <button className="flex items-center gap-1.5 group">
          <Share2 className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </button>
      </div>
    </motion.div>
  );
};

export default PostCard;
