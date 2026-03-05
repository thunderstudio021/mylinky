import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string;
  change?: string;
  icon: LucideIcon;
  index: number;
}

const StatsCard = ({ title, value, change, icon: Icon }: StatsCardProps) => (
  <div className="bg-card border border-border rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-xs text-muted-foreground">{title}</span>
      <Icon className="w-4 h-4 text-muted-foreground" />
    </div>
    <p className="text-xl font-semibold text-foreground">{value}</p>
    {change && <p className="text-xs text-muted-foreground mt-1">{change}</p>}
  </div>
);

export default StatsCard;
