import { Heart, MessageCircle, Share2, Lock, Eye, Crown, DollarSign, BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

interface PostCardProps {
  id: number;
  creator: { name: string; username: string; verified?: boolean };
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
  free: { label: "Público", icon: Eye },
  subscribers: { label: "Assinantes", icon: Crown },
  ppv: { label: "Pago", icon: DollarSign },
  "ppv-subscribers": { label: "Assinantes + Pago", icon: Lock },
};

const PostCard = ({ creator, content, image, likes, comments, locked, type, price, timeAgo }: PostCardProps) => {
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(likes);
  const typeInfo = typeLabels[type];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4">
        <Link to={`/creator/${creator.username}`} className="flex items-center gap-3 group">
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <typeInfo.icon className="w-3 h-3" />
          <span>{typeInfo.label}</span>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        <p className="text-sm text-foreground/85 leading-relaxed">{content}</p>
      </div>

      {/* Image */}
      {image && (
        <div className="relative">
          <img src={image} alt="" className={`w-full aspect-[16/10] object-cover ${locked ? "blur-2xl scale-105" : ""}`} />
          {locked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/50">
              <Lock className="w-8 h-8 text-muted-foreground mb-2" />
              <p className="text-sm text-foreground font-medium">Conteúdo exclusivo</p>
              {price && (
                <button className="mt-3 px-5 py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                  Desbloquear por R${price.toFixed(2)}
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
        <button className="text-muted-foreground hover:text-foreground transition-colors">
          <Share2 className="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  );
};

export default PostCard;
