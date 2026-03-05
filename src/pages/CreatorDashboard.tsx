import StatsCard from "@/components/StatsCard";
import { DollarSign, Users, TrendingUp, ShoppingCart, Wallet, ArrowUpRight } from "lucide-react";

const stats = [
  { title: "Ganhos hoje", value: "R$1.240,00", change: "+12% de ontem", icon: DollarSign },
  { title: "Ganhos do mês", value: "R$28.450,00", change: "+8,2% do mês anterior", icon: TrendingUp },
  { title: "Assinantes", value: "1.247", change: "+23 esta semana", icon: Users },
  { title: "Conteúdo vendido", value: "89", change: "+15 hoje", icon: ShoppingCart },
];

const recentTransactions = [
  { user: "Pedro M.", type: "Assinatura", amount: 39.90, time: "2 min atrás" },
  { user: "Ana K.", type: "Conteúdo pago", amount: 29.90, time: "15 min atrás" },
  { user: "Carlos R.", type: "Presente", amount: 100.00, time: "1h atrás" },
  { user: "Julia S.", type: "Assinatura", amount: 39.90, time: "2h atrás" },
  { user: "Rafael P.", type: "Conteúdo pago", amount: 49.90, time: "3h atrás" },
];

const CreatorDashboard = () => {
  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-5xl mx-auto px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Painel do Criador</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu desempenho e ganhos</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {stats.map((stat, i) => (
            <StatsCard key={stat.title} {...stat} index={i} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Carteira */}
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-medium text-foreground">Carteira</h3>
            </div>
            <div className="space-y-3">
              <div className="bg-secondary rounded-md p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Saldo disponível</p>
                <p className="text-lg font-semibold text-foreground mt-0.5">R$18.320,50</p>
              </div>
              <div className="bg-secondary rounded-md p-3">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Pendente</p>
                <p className="text-base font-medium text-muted-foreground mt-0.5">R$3.240,00</p>
              </div>
              <button className="w-full py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                Sacar via PIX
              </button>
            </div>
          </div>

          {/* Transações */}
          <div className="lg:col-span-2 bg-card border border-border rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-sm font-medium text-foreground">Transações recentes</h3>
              </div>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Ver todas</button>
            </div>
            <div className="space-y-1">
              {recentTransactions.map((tx, i) => (
                <div key={i} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-medium">
                      {tx.user[0]}
                    </div>
                    <div>
                      <p className="text-sm text-foreground">{tx.user}</p>
                      <p className="text-[11px] text-muted-foreground">{tx.type} · {tx.time}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-foreground">+R${tx.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorDashboard;
