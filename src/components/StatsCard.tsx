import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  index: number;
}

const StatsCard = ({ title, value, change, icon: Icon, index }: StatsCardProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.1 }}
    className="bg-card border border-border/50 rounded-xl p-5"
  >
    <div className="flex items-center justify-between mb-3">
      <span className="text-sm text-muted-foreground">{title}</span>
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    {change && <p className="text-xs text-green-400 mt-1">{change}</p>}
  </motion.div>
);

export default StatsCard;
