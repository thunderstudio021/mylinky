import { motion } from "framer-motion";
import StatsCard from "@/components/StatsCard";
import { DollarSign, Users, FileText, TrendingUp, ShoppingCart, Eye, Wallet, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { title: "Today's Earnings", value: "R$1,240.00", change: "+12% from yesterday", icon: DollarSign },
  { title: "Monthly Earnings", value: "R$28,450.00", change: "+8.2% from last month", icon: TrendingUp },
  { title: "Subscribers", value: "1,247", change: "+23 this week", icon: Users },
  { title: "Content Sold", value: "89", change: "+15 today", icon: ShoppingCart },
];

const recentTransactions = [
  { user: "Pedro M.", type: "Subscription", amount: 39.90, time: "2 min ago" },
  { user: "Ana K.", type: "PPV Unlock", amount: 29.90, time: "15 min ago" },
  { user: "Carlos R.", type: "Gift", amount: 100.00, time: "1h ago" },
  { user: "Julia S.", type: "Subscription", amount: 39.90, time: "2h ago" },
  { user: "Rafael P.", type: "PPV Unlock", amount: 49.90, time: "3h ago" },
];

const CreatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Creator Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your performance and earnings</p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <StatsCard key={stat.title} {...stat} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Wallet */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-5 h-5 text-primary" />
              <h3 className="font-semibold text-foreground">Wallet</h3>
            </div>
            <div className="space-y-4">
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Available Balance</p>
                <p className="text-2xl font-bold text-foreground mt-1">R$18,320.50</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-4">
                <p className="text-xs text-muted-foreground">Pending</p>
                <p className="text-lg font-semibold text-gold mt-1">R$3,240.00</p>
              </div>
              <Button className="w-full gradient-red text-primary-foreground font-semibold">
                Withdraw via PIX
              </Button>
            </div>
          </motion.div>

          {/* Recent Transactions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="lg:col-span-2 bg-card border border-border/50 rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Recent Transactions</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground text-xs">View All</Button>
            </div>
            <div className="space-y-3">
              {recentTransactions.map((tx, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.05 }}
                  className="flex items-center justify-between py-3 border-b border-border/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {tx.user[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.user}</p>
                      <p className="text-xs text-muted-foreground">{tx.type} · {tx.time}</p>
                    </div>
                  </div>
                  <span className="text-sm font-semibold text-green-400">+R${tx.amount.toFixed(2)}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
