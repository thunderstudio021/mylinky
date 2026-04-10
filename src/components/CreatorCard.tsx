import { Users } from "lucide-react";
import { Link } from "react-router-dom";
import { VerifiedBadge } from "./VerifiedBadge";
import { AppAvatar } from "./AppAvatar";

interface CreatorCardProps {
  name: string;
  username: string;
  avatar: string;
  category: string;
  followers: number;
  price: number;
  verified?: boolean;
  index: number;
}

const CreatorCard = ({ name, username, avatar, category, followers, price, verified, index }: CreatorCardProps) => {
  return (
    <Link to={`/${username}`} className="block group">
      <div className="bg-card border border-border rounded-lg p-4 hover:border-muted-foreground/30 transition-colors">
        <div className="flex items-center gap-3">
          <AppAvatar src={avatar} name={name} className="w-11 h-11" sizePx={88} textClassName="text-base" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-foreground truncate group-hover:underline">{name}</span>
              {verified && <VerifiedBadge className="w-3.5 h-3.5" />}
            </div>
            <p className="text-xs text-muted-foreground">@{username}</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-xs font-medium text-foreground">R${price}</p>
            <p className="text-[10px] text-muted-foreground">/mês</p>
          </div>
        </div>
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
          <span className="text-xs text-muted-foreground">{category}</span>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3 h-3" />
            {followers >= 1000 ? `${(followers / 1000).toFixed(1)}K` : followers}
          </div>
        </div>
      </div>
    </Link>
  );
};

export default CreatorCard;
