import { useState } from "react";
import { Shield, CheckCircle, XCircle, Clock, CreditCard, Settings } from "lucide-react";
import StatsCard from "@/components/StatsCard";
import { DollarSign, Users, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pendingCreators = [
  { name: "Carolina Mendes", username: "carolmendes", cpf: "***.***.***-12", category: "Fitness", price: 29.90 },
  { name: "Thiago Alves", username: "thiagoalves", cpf: "***.***.***-45", category: "Música", price: 19.90 },
  { name: "Beatriz Lima", username: "bialima", cpf: "***.***.***-78", category: "Fotografia", price: 39.90 },
];

const creatorsList = [
  { name: "Luna Dark", username: "lunadark", subscribers: 1247, earnings: 28450, commission: 20 },
  { name: "Marcus Vibe", username: "marcusvibe", subscribers: 892, earnings: 18200, commission: 15 },
  { name: "Aria Rose", username: "ariarose", subscribers: 654, earnings: 12800, commission: 20 },
  { name: "Jake Steel", username: "jakesteel", subscribers: 2103, earnings: 45600, commission: 10 },
];

const adminStats = [
  { title: "Receita total", value: "R$342.800", change: "+18% este mês", icon: DollarSign },
  { title: "Criadores ativos", value: "156", change: "+12 este mês", icon: Users },
  { title: "Aprovações pendentes", value: "3", icon: Clock },
  { title: "Alertas de fraude", value: "2", icon: AlertTriangle },
];

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-0.5">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Painel Admin</h1>
          </div>
          <p className="text-sm text-muted-foreground">Gerencie criadores, finanças e configurações da plataforma</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          {adminStats.map((stat, i) => (
            <StatsCard key={stat.title} {...stat} index={i} />
          ))}
        </div>

        <Tabs defaultValue="approvals" className="space-y-4">
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="approvals" className="text-xs data-[state=active]:bg-secondary">Aprovações</TabsTrigger>
            <TabsTrigger value="creators" className="text-xs data-[state=active]:bg-secondary">Criadores</TabsTrigger>
            <TabsTrigger value="gateway" className="text-xs data-[state=active]:bg-secondary">Gateway</TabsTrigger>
            <TabsTrigger value="settings" className="text-xs data-[state=active]:bg-secondary">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="approvals" className="space-y-3">
            {pendingCreators.map((creator) => (
              <div key={creator.username} className="bg-card border border-border rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-medium">{creator.name[0]}</div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{creator.name}</p>
                    <p className="text-xs text-muted-foreground">@{creator.username} · {creator.category} · R${creator.price}/mês</p>
                    <p className="text-[11px] text-muted-foreground">CPF: {creator.cpf}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                    <CheckCircle className="w-3 h-3" /> Aprovar
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-md text-foreground hover:bg-secondary transition-colors">
                    <Clock className="w-3 h-3" /> Reverificar
                  </button>
                  <button className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium border border-border rounded-md text-muted-foreground hover:bg-secondary transition-colors">
                    <XCircle className="w-3 h-3" /> Rejeitar
                  </button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="creators">
            <div className="bg-card border border-border rounded-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Criador</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Assinantes</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ganhos</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Comissão</th>
                      <th className="text-left p-3 text-xs font-medium text-muted-foreground">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorsList.map((c) => (
                      <tr key={c.username} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-medium">{c.name[0]}</div>
                            <div>
                              <p className="text-sm text-foreground">{c.name}</p>
                              <p className="text-[11px] text-muted-foreground">@{c.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-sm text-foreground">{c.subscribers.toLocaleString()}</td>
                        <td className="p-3 text-sm text-foreground">R${c.earnings.toLocaleString()}</td>
                        <td className="p-3 text-sm text-foreground">{c.commission}%</td>
                        <td className="p-3">
                          <button className="px-3 py-1 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">Editar</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="gateway">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: "Stripe", active: true, fee: "2,9%" },
                { name: "Mercado Pago", active: false, fee: "3,5%" },
                { name: "Pagar.me", active: false, fee: "2,5%" },
                { name: "Asaas", active: true, fee: "1,99%" },
              ].map((gw) => (
                <div key={gw.name} className="bg-card border border-border rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{gw.name}</p>
                      <p className="text-xs text-muted-foreground">Taxa: {gw.fee}</p>
                    </div>
                  </div>
                  <button className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                    gw.active ? "bg-foreground text-background" : "border border-border text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}>
                    {gw.active ? "Ativo" : "Ativar"}
                  </button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="bg-card border border-border rounded-lg p-5">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2 mb-4">
                <Settings className="w-4 h-4 text-muted-foreground" /> Configurações da Plataforma
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { label: "Comissão padrão", value: "20%" },
                  { label: "Saque mínimo", value: "R$50,00" },
                  { label: "Prazo de processamento", value: "3 dias úteis" },
                  { label: "Taxa de saque", value: "R$3,50" },
                ].map((setting) => (
                  <div key={setting.label} className="bg-secondary rounded-md p-3 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">{setting.label}</p>
                      <p className="text-sm font-medium text-foreground mt-0.5">{setting.value}</p>
                    </div>
                    <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">Editar</button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPanel;
