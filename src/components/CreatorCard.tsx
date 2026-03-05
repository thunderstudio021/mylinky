import { motion } from "framer-motion";
import { Crown, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface CreatorCardProps {
  name: string;
  username: string;
  avatar: string;
  category: string;
  followers: number;
  price: number;
  index: number;
}

const CreatorCard = ({ name, username, category, followers, price, index }: CreatorCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link to={`/creator/${username}`} className="block">
        <div className="bg-card border border-border/50 rounded-xl overflow-hidden group hover:border-primary/30 transition-all duration-300">
          {/* Cover */}
          <div className="h-24 gradient-red opacity-80 group-hover:opacity-100 transition-opacity" />
          
          {/* Avatar */}
          <div className="px-4 -mt-8">
            <div className="w-16 h-16 rounded-full border-4 border-card gradient-red flex items-center justify-center text-primary-foreground font-bold text-xl">
              {name[0]}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 pt-2">
            <div className="flex items-center gap-1.5">
              <h3 className="font-semibold text-foreground">{name}</h3>
              <Crown className="w-3.5 h-3.5 text-gold" />
            </div>
            <p className="text-xs text-muted-foreground">@{username}</p>
            <p className="text-xs text-primary mt-1">{category}</p>

            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Users className="w-3.5 h-3.5" />
                <span>{followers.toLocaleString()}</span>
              </div>
              <Button size="sm" className="h-7 text-xs gradient-red text-primary-foreground font-semibold px-4">
                R${price}/mo
              </Button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default CreatorCard;
