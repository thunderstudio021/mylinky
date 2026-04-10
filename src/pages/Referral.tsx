import { useState, useEffect } from "react";
import { ArrowLeft, Copy, Check, Link2, Users, TrendingUp, DollarSign, Wallet, Clock, CheckCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AppAvatar } from "@/components/AppAvatar";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

interface ReferredUser {
  id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  is_creator: boolean;
  created_at: string;
  commission_rate: number;
}

interface MonthData {
  month: string;
  comissao: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  bank_name: string;
  pix_key: string;
  pix_key_holder_name: string;
  status: string;
  created_at: string;
  reviewed_at: string | null;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MONTHS_PT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

const Referral = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [referred, setReferred]   = useState<ReferredUser[]>([]);
  const [chartData, setChartData] = useState<MonthData[]>([]);
  const [totalCommission, setTotalCommission] = useState(0);
  const [loading, setLoading] = useState(true);

  // Wallet
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixHolder, setPixHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [submittingWithdraw, setSubmittingWithdraw] = useState(false);

  const referralLink = `${window.location.origin}/register?ref=${profile?.username || user?.id?.slice(0, 8)}`;

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);

      const { data: rels } = await (supabase as any)
        .from("referral_relationships")
        .select("referred_id, commission_rate, created_at")
        .eq("referrer_id", user.id);

      if (!rels || rels.length === 0) { setLoading(false); return; }

      const ids: string[] = rels.map((r: any) => r.referred_id);
      const relMap = new Map<string, any>(rels.map((r: any) => [r.referred_id, r]));

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, username, avatar_url, is_creator, created_at")
        .in("id", ids);

      const enriched: ReferredUser[] = (profiles || []).map((p: any) => ({
        ...p,
        commission_rate: relMap.get(p.id)?.commission_rate ?? 10,
      }));
      setReferred(enriched);

      const creatorIds = enriched.filter(r => r.is_creator).map(r => r.id);
      const commissionRateOf = (id: string) =>
        enriched.find(r => r.id === id)?.commission_rate ?? 10;

      if (creatorIds.length > 0) {
        const { data: subs } = await supabase
          .from("subscriptions")
          .select("creator_id, amount, created_at")
          .in("creator_id", creatorIds)
          .eq("status", "active");

        const now = new Date();
        const months: MonthData[] = Array.from({ length: 6 }, (_, i) => {
          const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
          return { month: MONTHS_PT[d.getMonth()], comissao: 0, _year: d.getFullYear(), _month: d.getMonth() } as any;
        });

        let total = 0;
        (subs || []).forEach((s: any) => {
          const d = new Date(s.created_at);
          const rate = commissionRateOf(s.creator_id) / 100;
          const commission = Number(s.amount) * rate;
          total += commission;
          const slot = months.find((m: any) => m._year === d.getFullYear() && m._month === d.getMonth());
          if (slot) (slot as any).comissao += commission;
        });

        months.forEach((m: any) => { m.comissao = parseFloat(m.comissao.toFixed(2)); });
        setChartData(months);
        setTotalCommission(total);
      }

      setLoading(false);
    };

    const loadWithdrawals = async () => {
      const { data } = await supabase
        .from("withdrawal_requests")
        .select("id, amount, bank_name, pix_key, pix_key_holder_name, status, created_at, reviewed_at")
        .eq("creator_id", user.id)
        .eq("requester_type", "referral")
        .order("created_at", { ascending: false });
      setWithdrawals((data || []) as WithdrawalRequest[]);
    };

    load();
    loadWithdrawals();
  }, [user]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  const approvedWithdrawals = withdrawals.filter(w => w.status === "approved");
  const totalWithdrawn = approvedWithdrawals.reduce((acc, w) => acc + Number(w.amount), 0);
  const availableBalance = Math.max(0, totalCommission - totalWithdrawn);

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawAmount);
    if (!amount || amount < 50) { toast.error("Valor mínimo para saque é R$ 50,00"); return; }
    if (amount > availableBalance) { toast.error("Saldo insuficiente"); return; }
    if (!pixKey.trim()) { toast.error("Informe a chave PIX"); return; }
    if (!pixHolder.trim()) { toast.error("Informe o nome do titular"); return; }
    if (!bankName.trim()) { toast.error("Informe o banco"); return; }

    setSubmittingWithdraw(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      creator_id: user!.id,
      amount,
      pix_key: pixKey.trim(),
      pix_key_holder_name: pixHolder.trim(),
      bank_name: bankName.trim(),
      status: "pending",
      requester_type: "referral",
    });
    setSubmittingWithdraw(false);

    if (error) { toast.error("Erro ao solicitar saque: " + error.message); return; }
    toast.success("Solicitação enviada! Será processada em até 3 dias úteis.");
    setShowWithdrawForm(false);
    setWithdrawAmount("");
    setPixKey("");
    setPixHolder("");
    setBankName("");
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("id, amount, bank_name, pix_key, pix_key_holder_name, status, created_at, reviewed_at")
      .eq("creator_id", user!.id)
      .eq("requester_type", "referral")
      .order("created_at", { ascending: false });
    setWithdrawals((data || []) as WithdrawalRequest[]);
  };

  const creatorsReferred = referred.filter(r => r.is_creator);

  const statusIcon = (s: string) => {
    if (s === "approved") return <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />;
    if (s === "rejected") return <XCircle className="w-3.5 h-3.5 text-destructive" />;
    return <Clock className="w-3.5 h-3.5 text-amber-400" />;
  };
  const statusLabel = (s: string) => s === "approved" ? "Aprovado" : s === "rejected" ? "Rejeitado" : "Pendente";

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-24 md:pb-8">
      <div className="max-w-lg mx-auto px-4 md:px-6">

        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-foreground">Indicação</h1>
            <p className="text-xs text-muted-foreground">Ganhe comissão indicando criadores</p>
          </div>
        </div>

        <div className="space-y-4">

          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Link2 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Como funciona</h2>
            </div>
            <div className="space-y-3">
              {[
                { n: "1", text: "Compartilhe seu link de indicação com outras pessoas" },
                { n: "2", text: "A pessoa se cadastra e vira criadora de conteúdo na plataforma" },
                { n: "3", text: "Você passa a ganhar uma comissão sobre os ganhos mensais dela automaticamente" },
              ].map(({ n, text }) => (
                <div key={n} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary shrink-0 mt-0.5">
                    {n}
                  </span>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">
              Seu link de indicação
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-xs text-foreground truncate font-mono">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copiado" : "Copiar"}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Users,      label: "Indicados",       value: String(referred.length) },
              { icon: TrendingUp, label: "Criadores ativos", value: String(creatorsReferred.length) },
              { icon: DollarSign, label: "Comissão",         value: `R$ ${fmt(totalCommission)}` },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="bg-card border border-border rounded-xl p-4 flex flex-col items-center text-center gap-1">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <p className="text-lg font-bold text-foreground leading-none">{value}</p>
                <p className="text-[10px] text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>

          {!loading && creatorsReferred.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Comissão mensal</h3>
                  <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
                </div>
                <span className="text-sm font-bold text-primary">R$ {fmt(totalCommission)}</span>
              </div>
              <ResponsiveContainer width="100%" height={160}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                  <defs>
                    <linearGradient id="refGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="hsl(var(--primary))" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={v => `R$${v}`} />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                    formatter={(v: number) => [`R$ ${fmt(v)}`, "Comissão"]}
                  />
                  <Area type="monotone" dataKey="comissao" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#refGrad)"
                    dot={{ fill: "hsl(var(--primary))", r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Carteira Digital */}
          {!loading && totalCommission > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Carteira de Indicação</h3>
                </div>
                <p className="text-xs text-muted-foreground">Gerencie seus ganhos de comissão</p>
              </div>
              <div className="grid grid-cols-3 divide-x divide-border border-b border-border">
                {[
                  { label: "Total ganho",  value: `R$ ${fmt(totalCommission)}`,   color: "text-foreground" },
                  { label: "Sacado",       value: `R$ ${fmt(totalWithdrawn)}`,     color: "text-muted-foreground" },
                  { label: "Disponível",   value: `R$ ${fmt(availableBalance)}`,   color: "text-primary" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="px-4 py-3 text-center">
                    <p className={`text-base font-bold ${color}`}>{value}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
                  </div>
                ))}
              </div>
              <div className="p-5">
                {!showWithdrawForm ? (
                  <button
                    onClick={() => setShowWithdrawForm(true)}
                    disabled={availableBalance < 50}
                    className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Solicitar Saque
                  </button>
                ) : (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-foreground">Dados para transferência PIX</h4>
                    <div className="space-y-2">
                      <input value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} type="number" min="50" max={availableBalance}
                        placeholder={`Valor (mín. R$ 50,00 · disponível R$ ${fmt(availableBalance)})`}
                        className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                      <input value={bankName} onChange={e => setBankName(e.target.value)} placeholder="Banco (ex: Nubank, Itaú...)"
                        className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                      <input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="Chave PIX (CPF, email, telefone ou aleatória)"
                        className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                      <input value={pixHolder} onChange={e => setPixHolder(e.target.value)} placeholder="Nome completo do titular da conta"
                        className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30" />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setShowWithdrawForm(false)}
                        className="flex-1 py-2 text-sm text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
                        Cancelar
                      </button>
                      <button onClick={handleWithdrawSubmit} disabled={submittingWithdraw}
                        className="flex-1 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
                        {submittingWithdraw ? "Enviando..." : "Confirmar"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Histórico de saques */}
          {!loading && withdrawals.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Histórico de saques</h3>
              </div>
              <div className="divide-y divide-border">
                {withdrawals.map(w => (
                  <div key={w.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                      {statusIcon(w.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">R$ {fmt(Number(w.amount))}</p>
                      <p className="text-xs text-muted-foreground">{w.bank_name} · PIX: {w.pix_key}</p>
                      <p className="text-xs text-muted-foreground">{new Date(w.created_at).toLocaleDateString("pt-BR")}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      w.status === "approved" ? "bg-emerald-500/10 text-emerald-400"
                      : w.status === "rejected" ? "bg-destructive/10 text-destructive"
                      : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {statusLabel(w.status)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Seus indicados */}
          {!loading && referred.length > 0 && (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Seus indicados</h3>
              </div>
              <div className="divide-y divide-border">
                {referred.map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <AppAvatar src={r.avatar_url} name={r.name} className="w-9 h-9 shrink-0" sizePx={72} textClassName="text-xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{r.name}</p>
                      <p className="text-xs text-muted-foreground">@{r.username}</p>
                    </div>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full shrink-0 ${
                      r.is_creator ? "text-primary bg-primary/10" : "text-muted-foreground bg-secondary"
                    }`}>
                      {r.is_creator ? "Criador" : "Usuário"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          )}

          {!loading && referred.length === 0 && (
            <div className="bg-card border border-border rounded-xl p-10 text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Nenhum indicado ainda</p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Compartilhe seu link e comece a ganhar comissão quando alguém virar criador.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Referral;
