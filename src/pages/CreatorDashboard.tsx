import { useState, useEffect, useCallback } from "react";
import { DollarSign, Users, TrendingUp, Wallet, ArrowUpRight, ArrowDownRight, Send, Loader2, Clock, X as XIcon, Gift } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";

const CreatorDashboard = () => {
  const { user, profile } = useAuth();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [pixKey, setPixKey] = useState("");
  const [holderName, setHolderName] = useState("");
  const [bankName, setBankName] = useState("");
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [revenueBruto, setRevenueBruto] = useState(0);
  const [revenueLiquido, setRevenueLiquido] = useState(0);
  const [commissionRate, setCommissionRate] = useState(20);
  const [totalWithdrawn, setTotalWithdrawn] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);

  const loadFinancials = useCallback(async () => {
    if (!user) return;

    const [subsRes, giftsRes, ppvPostsRes, profileRes, withdrawRes] = await Promise.all([
      supabase.from("subscriptions").select("amount, created_at, plan, subscriber_id").eq("creator_id", user.id),
      supabase.from("gifts").select("amount, created_at, sender_id").eq("creator_id", user.id),
      supabase.from("posts").select("id").eq("creator_id", user.id),
      supabase.from("profiles").select("commission_rate").eq("id", user.id).single(),
      supabase.from("withdrawal_requests").select("amount, status").eq("creator_id", user.id).eq("status", "approved"),
    ]);

    const rate = Number((profileRes.data as any)?.commission_rate ?? 20);
    setCommissionRate(rate);

    const subs = subsRes.data || [];
    const gifts = giftsRes.data || [];

    const subTotal = subs.reduce((s, r) => s + Number(r.amount), 0);
    const giftTotal = gifts.reduce((s, r) => s + Number(r.amount), 0);

    // PPV purchases for this creator's posts
    const postIds = (ppvPostsRes.data || []).map(p => p.id);
    let ppvPurchases: any[] = [];
    if (postIds.length > 0) {
      const { data } = await supabase
        .from("ppv_purchases")
        .select("amount, created_at, buyer_id")
        .in("post_id", postIds);
      ppvPurchases = data || [];
    }
    const ppvTotal = ppvPurchases.reduce((s, r) => s + Number(r.amount), 0);

    const bruto = subTotal + giftTotal + ppvTotal;
    const liquido = bruto * (1 - rate / 100);
    const withdrawn = (withdrawRes.data || []).reduce((s, r) => s + Number(r.amount), 0);

    setRevenueBruto(bruto);
    setRevenueLiquido(liquido);
    setTotalWithdrawn(withdrawn);

    // Build transaction history
    const allTx = [
      ...subs.map(s => ({ type: "Assinatura" as const, amount: Number(s.amount), date: s.created_at, detail: s.plan === "yearly" ? "Plano anual" : "Plano mensal" })),
      ...gifts.map(g => ({ type: "Presente" as const, amount: Number(g.amount), date: g.created_at, detail: "" })),
      ...ppvPurchases.map(p => ({ type: "PPV" as const, amount: Number(p.amount), date: p.created_at, detail: "" })),
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setTransactions(allTx);
  }, [user]);

  const loadWithdrawals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false });
    setWithdrawals(data || []);
  }, [user]);

  useEffect(() => {
    const init = async () => {
      await Promise.all([loadFinancials(), loadWithdrawals()]);
      setLoading(false);
    };
    init();
  }, [loadFinancials, loadWithdrawals]);

  // Realtime: listen for new subscriptions, gifts, ppv_purchases
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("wallet-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "subscriptions", filter: `creator_id=eq.${user.id}` }, () => {
        loadFinancials();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gifts", filter: `creator_id=eq.${user.id}` }, () => {
        loadFinancials();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ppv_purchases" }, () => {
        loadFinancials();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, loadFinancials]);

  const availableBalance = revenueLiquido - totalWithdrawn;

  const handleWithdraw = async () => {
    const val = parseFloat(amount);
    if (!val || val < 100) {
      toast.error("O valor mínimo para saque é R$100,00");
      return;
    }
    if (val > availableBalance) {
      toast.error("Saldo insuficiente");
      return;
    }
    if (!pixKey.trim() || !holderName.trim() || !bankName.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("withdrawal_requests").insert({
      creator_id: user!.id,
      amount: val,
      pix_key: pixKey,
      pix_key_holder_name: holderName,
      bank_name: bankName,
    });
    if (error) {
      toast.error("Erro ao solicitar saque");
    } else {
      toast.success("Solicitação de saque enviada! Aprovação em até 24h.");
      setWithdrawOpen(false);
      setPixKey("");
      setHolderName("");
      setBankName("");
      setAmount("");
      loadWithdrawals();
    }
    setSubmitting(false);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const statusLabel = (s: string) => {
    if (s === "pending") return { text: "Pendente", cls: "text-yellow-500 bg-yellow-500/10" };
    if (s === "approved") return { text: "Aprovado", cls: "text-green-500 bg-green-500/10" };
    return { text: "Rejeitado", cls: "text-red-500 bg-red-500/10" };
  };

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6">
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-foreground">Carteira Digital</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus ganhos e solicite saques</p>
        </div>

        {/* Balance cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo disponível</p>
            </div>
            <p className="text-2xl font-bold text-foreground">R$ {fmt(Math.max(availableBalance, 0))}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-5">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Saldo pendente</p>
            </div>
            <p className="text-2xl font-bold text-muted-foreground">R$ {fmt(0)}</p>
          </div>
        </div>

        {/* Revenue breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <DollarSign className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Venda bruta</p>
            </div>
            <p className="text-lg font-semibold text-foreground">R$ {fmt(revenueBruto)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Venda líquida ({100 - commissionRate}%)</p>
            </div>
            <p className="text-lg font-semibold text-foreground">R$ {fmt(revenueLiquido)}</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Users className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">Assinantes</p>
            </div>
            <p className="text-lg font-semibold text-foreground">{profile?.subscribers_count || 0}</p>
          </div>
        </div>

        {/* Withdraw button */}
        <button
          onClick={() => setWithdrawOpen(true)}
          className="w-full sm:w-auto mb-6 flex items-center justify-center gap-2 px-6 py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
        >
          <Send className="w-4 h-4" />
          Solicitar saque via PIX
        </button>

        {/* Withdrawal history */}
        <div className="bg-card border border-border rounded-lg p-5">
          <div className="flex items-center gap-2 mb-4">
            <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-medium text-foreground">Solicitações de saque</h3>
          </div>
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-6">Carregando...</p>
          ) : withdrawals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma solicitação de saque ainda.</p>
          ) : (
            <div className="space-y-1">
              {withdrawals.map((w) => {
                const st = statusLabel(w.status);
                return (
                  <div key={w.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-medium text-foreground">R$ {fmt(Number(w.amount))}</p>
                      <p className="text-[11px] text-muted-foreground">
                        PIX: {w.pix_key} · {new Date(w.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${st.cls}`}>{st.text}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Withdraw Modal */}
      <AnimatePresence>
        {withdrawOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => !submitting && setWithdrawOpen(false)} />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <h3 className="text-base font-semibold text-foreground">Solicitar saque</h3>
                <button onClick={() => !submitting && setWithdrawOpen(false)} className="text-muted-foreground hover:text-foreground"><XIcon className="w-5 h-5" /></button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor do saque (mínimo R$100,00)</label>
                  <input
                    type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                    placeholder="Ex: 100.00" min="100" step="0.01"
                    className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Chave PIX</label>
                  <input
                    type="text" value={pixKey} onChange={(e) => setPixKey(e.target.value)}
                    placeholder="CPF, e-mail, telefone ou chave aleatória"
                    className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Nome do titular</label>
                  <input
                    type="text" value={holderName} onChange={(e) => setHolderName(e.target.value)}
                    placeholder="Nome completo"
                    className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Banco</label>
                  <input
                    type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                    placeholder="Ex: Nubank, Itaú, Bradesco"
                    className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground">A solicitação será analisada e aprovada em até 24 horas.</p>
                <button
                  onClick={handleWithdraw}
                  disabled={submitting}
                  className="w-full py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</> : <>Solicitar saque</>}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CreatorDashboard;
