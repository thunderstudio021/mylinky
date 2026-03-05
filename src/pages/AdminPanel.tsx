import { motion } from "framer-motion";
import { useState } from "react";
import { Shield, Users, DollarSign, Settings, CheckCircle, XCircle, Clock, BarChart3, CreditCard, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const pendingCreators = [
  { name: "Carolina Mendes", username: "carolmendes", cpf: "***.***.***-12", category: "Fitness", price: 29.90, status: "pending" },
  { name: "Thiago Alves", username: "thiagoalves", cpf: "***.***.***-45", category: "Music", price: 19.90, status: "pending" },
  { name: "Beatriz Lima", username: "bialima", cpf: "***.***.***-78", category: "Photography", price: 39.90, status: "pending" },
];

const creatorsList = [
  { name: "Luna Dark", username: "lunadark", subscribers: 1247, earnings: 28450, commission: 20 },
  { name: "Marcus Vibe", username: "marcusvibe", subscribers: 892, earnings: 18200, commission: 15 },
  { name: "Aria Rose", username: "ariarose", subscribers: 654, earnings: 12800, commission: 20 },
  { name: "Jake Steel", username: "jakesteel", subscribers: 2103, earnings: 45600, commission: 10 },
];

const adminStats = [
  { title: "Total Revenue", value: "R$342,800", change: "+18% this month", icon: DollarSign },
  { title: "Active Creators", value: "156", change: "+12 this month", icon: Users },
  { title: "Pending Approvals", value: "3", icon: Clock },
  { title: "Fraud Alerts", value: "2", icon: AlertTriangle },
];

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">Admin Panel</h1>
          </div>
          <p className="text-muted-foreground">Manage creators, finances, and platform settings</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {adminStats.map((stat, i) => (
            <StatsCard key={stat.title} {...stat} index={i} />
          ))}
        </div>

        <Tabs defaultValue="approvals" className="space-y-6">
          <TabsList className="bg-card border border-border/50">
            <TabsTrigger value="approvals" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Approvals</TabsTrigger>
            <TabsTrigger value="creators" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Creators</TabsTrigger>
            <TabsTrigger value="gateway" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Gateway</TabsTrigger>
            <TabsTrigger value="settings" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Settings</TabsTrigger>
          </TabsList>

          {/* Approvals */}
          <TabsContent value="approvals" className="space-y-4">
            {pendingCreators.map((creator, i) => (
              <motion.div
                key={creator.username}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border/50 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full gradient-red flex items-center justify-center text-primary-foreground font-bold">{creator.name[0]}</div>
                  <div>
                    <p className="font-semibold text-foreground">{creator.name}</p>
                    <p className="text-sm text-muted-foreground">@{creator.username} · {creator.category} · R${creator.price}/mo</p>
                    <p className="text-xs text-muted-foreground mt-0.5">CPF: {creator.cpf}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="gradient-red text-primary-foreground font-semibold">
                    <CheckCircle className="w-4 h-4 mr-1" /> Approve
                  </Button>
                  <Button size="sm" variant="outline" className="border-border hover:bg-secondary">
                    <Clock className="w-4 h-4 mr-1" /> Re-verify
                  </Button>
                  <Button size="sm" variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                    <XCircle className="w-4 h-4 mr-1" /> Reject
                  </Button>
                </div>
              </motion.div>
            ))}
          </TabsContent>

          {/* Creators Management */}
          <TabsContent value="creators">
            <div className="bg-card border border-border/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Creator</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Subscribers</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Earnings</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Commission</th>
                      <th className="text-left p-4 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {creatorsList.map((c) => (
                      <tr key={c.username} className="border-b border-border/30 hover:bg-secondary/30 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full gradient-red flex items-center justify-center text-primary-foreground text-xs font-bold">{c.name[0]}</div>
                            <div>
                              <p className="text-sm font-medium text-foreground">{c.name}</p>
                              <p className="text-xs text-muted-foreground">@{c.username}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-foreground">{c.subscribers.toLocaleString()}</td>
                        <td className="p-4 text-sm text-foreground">R${c.earnings.toLocaleString()}</td>
                        <td className="p-4 text-sm text-primary font-semibold">{c.commission}%</td>
                        <td className="p-4">
                          <Button size="sm" variant="outline" className="text-xs border-border hover:bg-secondary">Edit</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          {/* Gateway */}
          <TabsContent value="gateway">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: "Stripe", active: true, fee: "2.9%" },
                { name: "Mercado Pago", active: false, fee: "3.5%" },
                { name: "Pagar.me", active: false, fee: "2.5%" },
                { name: "Asaas", active: true, fee: "1.99%" },
              ].map((gw) => (
                <div key={gw.name} className="bg-card border border-border/50 rounded-xl p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-semibold text-foreground">{gw.name}</p>
                      <p className="text-sm text-muted-foreground">Fee: {gw.fee}</p>
                    </div>
                  </div>
                  <Button size="sm" variant={gw.active ? "default" : "outline"} className={gw.active ? "gradient-red text-primary-foreground" : "border-border"}>
                    {gw.active ? "Active" : "Enable"}
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Settings */}
          <TabsContent value="settings">
            <div className="bg-card border border-border/50 rounded-xl p-6 space-y-6">
              <h3 className="font-semibold text-foreground flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" /> Platform Settings
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { label: "Default Commission", value: "20%" },
                  { label: "Minimum Withdrawal", value: "R$50.00" },
                  { label: "Withdrawal Processing", value: "3 business days" },
                  { label: "Withdrawal Fee", value: "R$3.50" },
                ].map((setting) => (
                  <div key={setting.label} className="bg-secondary/50 rounded-lg p-4 flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{setting.label}</p>
                      <p className="font-semibold text-foreground mt-0.5">{setting.value}</p>
                    </div>
                    <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground text-xs">Edit</Button>
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
