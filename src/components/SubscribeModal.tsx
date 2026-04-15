import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CreditCard, QrCode, Check, Loader2, Copy, CheckCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  creatorName: string;
  creatorId: string;
  priceMonthly: number;
  priceYearly: number;
  onConfirm: (plan: "monthly" | "yearly", method: "pix" | "credit_card") => Promise<void>;
}

type Step = "select" | "cpf" | "card" | "pix_waiting" | "card_waiting" | "success";

interface GatewayConfig {
  gateway: "appmax" | "mercadopago" | "none";
  public_key: string;
}

const formatCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const loadMpSdk = (): Promise<void> =>
  new Promise((resolve) => {
    if ((window as any).MercadoPago) { resolve(); return; }
    const existing = document.getElementById("mp-sdk-v2") as HTMLScriptElement | null;
    if (existing) { existing.addEventListener("load", () => resolve(), { once: true }); return; }
    const s = document.createElement("script");
    s.id = "mp-sdk-v2";
    s.src = "https://sdk.mercadopago.com/js/v2";
    s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });

const SubscribeModal = ({
  open, onClose, creatorName, creatorId,
  priceMonthly, priceYearly, onConfirm,
}: SubscribeModalProps) => {
  const { user } = useAuth();
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [method, setMethod] = useState<"pix" | "credit_card">("pix");
  const [step, setStep] = useState<Step>("select");
  const [cpf, setCpf] = useState("");
  const [card, setCard] = useState({ number: "", holder: "", cvv: "", month: "", year: "", installments: "1" });
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ qrcode: string; emv: string; expiration: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [activePlan, setActivePlan] = useState<"monthly" | "yearly">("monthly");
  const [activeMethod, setActiveMethod] = useState<"pix" | "credit_card">("pix");
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(null);
  const [pollTimeout, setPollTimeout] = useState(false);
  const [appmaxOrderId, setAppmaxOrderId] = useState<number | null>(null);

  const price = plan === "monthly" ? priceMonthly : priceYearly;

  // ── Load active gateway config on open ────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    supabase.rpc("get_active_gateway_config").then(({ data, error }) => {
      if (!error && data) {
        setGatewayConfig(data as GatewayConfig);
        if ((data as GatewayConfig).gateway === "mercadopago") loadMpSdk().catch(() => {});
      }
    });
  }, [open]);

  // ── Polling: detect when webhook activates subscription ───────────────────
  // Runs for both PIX (pix_waiting) and credit card (card_waiting)
  const pollingRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeoutRef  = useRef<ReturnType<typeof setTimeout>  | null>(null);

  const stopPolling = () => {
    if (pollingRef.current)  { clearInterval(pollingRef.current);  pollingRef.current  = null; }
    if (timeoutRef.current)  { clearTimeout(timeoutRef.current);   timeoutRef.current  = null; }
  };

  useEffect(() => {
    const isWaiting = step === "pix_waiting" || step === "card_waiting";
    if (!isWaiting || !user) { stopPolling(); return; }

    setPollTimeout(false);

    pollingRef.current = setInterval(async () => {
      const isAppmax = gatewayConfig?.gateway === "appmax" || (!gatewayConfig && appmaxOrderId);

      if (isAppmax && appmaxOrderId) {
        // Direct AppMax API check — no webhook needed
        try {
          const { data: { session } } = await supabase.auth.getSession();
          const res = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appmax-checkout`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
              body: JSON.stringify({ action: "check_payment", order_id: appmaxOrderId }),
            },
          );
          const result = await res.json();
          if (result.paid && result.activated) {
            stopPolling();
            try { await onConfirm(activePlan, activeMethod); } catch { /* already active */ }
            setStep("success");
          }
        } catch { /* network error, retry next interval */ }
      } else {
        // Mercado Pago or fallback — poll subscriptions table (webhook activates it)
        const { data } = await supabase
          .from("subscriptions")
          .select("id")
          .eq("subscriber_id", user.id)
          .eq("creator_id", creatorId)
          .eq("status", "active")
          .gt("expires_at", new Date().toISOString())
          .maybeSingle();

        if (data) {
          stopPolling();
          try { await onConfirm(activePlan, activeMethod); } catch { /* already active */ }
          setStep("success");
        }
      }
    }, 3000);

    // 90-second timeout for PIX, 60 seconds for credit card
    const timeoutMs = step === "pix_waiting" ? 90_000 : 60_000;
    timeoutRef.current = setTimeout(() => {
      stopPolling();
      setPollTimeout(true);
    }, timeoutMs);

    return stopPolling;
  }, [step, user, creatorId, activePlan, activeMethod, onConfirm]);

  useEffect(() => { if (!open) stopPolling(); }, [open]);

  const reset = () => {
    stopPolling();
    setStep("select");
    setCpf("");
    setCard({ number: "", holder: "", cvv: "", month: "", year: "", installments: "1" });
    setPixData(null);
    setCopied(false);
    setProcessing(false);
    setPollTimeout(false);
    setAppmaxOrderId(null);
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const tokenizeMpCard = async (publicKey: string) => {
    await loadMpSdk();
    const mp = new (window as any).MercadoPago(publicKey, { locale: "pt-BR" });
    const result = await mp.createCardToken({
      cardNumber: card.number.replace(/\s/g, ""),
      cardholderName: card.holder,
      cardExpirationMonth: card.month,
      cardExpirationYear: card.year,
      securityCode: card.cvv,
      identificationType: "CPF",
      identificationNumber: cpf.replace(/\D/g, ""),
    });
    if (result.error) throw new Error(result.cause?.[0]?.description || "Erro ao validar cartão");
    return { token: result.id, payment_method_id: result.payment_method_id };
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const gateway = gatewayConfig?.gateway ?? "appmax";
      const isMp = gateway === "mercadopago";
      const functionName = isMp ? "mp-checkout" : "appmax-checkout";

      let bodyExtra: Record<string, unknown> = {};
      if (method === "credit_card") {
        if (isMp) {
          const { token, payment_method_id } = await tokenizeMpCard(gatewayConfig!.public_key);
          bodyExtra = { card_token: token, payment_method_id, installments: parseInt(card.installments) || 1 };
        } else {
          bodyExtra = {
            card: {
              number: card.number.replace(/\s/g, ""),
              holder: card.holder,
              cvv: card.cvv,
              month: parseInt(card.month),
              year: parseInt(card.year),
              installments: parseInt(card.installments),
            },
          };
        }
      }

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            payment_type: method,
            amount: price,
            product_type: "subscription",
            product_id: `${plan}-${creatorId}`,
            creator_id: creatorId,
            cpf: cpf.replace(/\D/g, ""),
            plan,
            ...bodyExtra,
          }),
        },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erro no pagamento");

      setActivePlan(plan);
      setActiveMethod(method);

      // Store AppMax order_id for direct payment status polling
      if (data.order_id) setAppmaxOrderId(data.order_id);

      if (method === "pix") {
        setPixData(data.pix);
        setStep("pix_waiting");
        // Polling starts via useEffect
      } else {
        // Credit card: gateway accepted payment → poll for webhook confirmation
        // This ensures the webhook is source of truth for subscription activation
        if (!data.credit_card?.approved) {
          const detail = data.credit_card?.status_detail || data.credit_card?.status || "recusado";
          throw new Error(`Cartão recusado: ${detail}`);
        }
        setStep("card_waiting");
        // Polling starts via useEffect
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  const handleProceed = async () => {
    if (step === "select") { setStep("cpf"); return; }
    if (step === "cpf") {
      if (cpf.replace(/\D/g, "").length !== 11) { toast.error("CPF inválido"); return; }
      if (method === "credit_card") { setStep("card"); return; }
      await handlePayment();
    }
    if (step === "card") await handlePayment();
  };

  const handleCopy = () => {
    if (!pixData?.emv) return;
    navigator.clipboard.writeText(pixData.emv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all";

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">
                {step === "pix_waiting"  ? "Aguardando pagamento" :
                 step === "card_waiting" ? "Confirmando pagamento" :
                 step === "success"      ? "Assinatura ativada"   :
                 `Assinar ${creatorName}`}
              </h3>
              <button onClick={handleClose} disabled={processing}
                className="text-muted-foreground hover:text-foreground disabled:opacity-40">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Success ── */}
            {step === "success" && (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-sm font-medium text-foreground">Assinatura ativada!</p>
                <p className="text-xs text-muted-foreground text-center">
                  Você já tem acesso ao conteúdo exclusivo de {creatorName}.
                </p>
                <button onClick={handleClose}
                  className="mt-2 px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                  Continuar
                </button>
              </div>
            )}

            {/* ── PIX waiting ── */}
            {step === "pix_waiting" && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground text-center">
                  Escaneie o QR Code ou copie o código PIX para pagar
                </p>
                {pixData?.qrcode && (
                  <div className="flex justify-center">
                    <img
                      src={pixData.qrcode.startsWith("data:") ? pixData.qrcode : `data:image/png;base64,${pixData.qrcode}`}
                      alt="QR Code PIX" className="w-48 h-48 rounded-lg border border-border bg-white p-2"
                    />
                  </div>
                )}
                {pixData?.emv && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">Copia e Cola</p>
                    <div className="flex gap-2">
                      <input readOnly value={pixData.emv}
                        className="flex-1 px-3 py-2 text-xs bg-secondary border border-border rounded-lg text-muted-foreground font-mono truncate" />
                      <button onClick={handleCopy}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 whitespace-nowrap">
                        {copied ? <><CheckCheck className="w-3.5 h-3.5" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
                      </button>
                    </div>
                  </div>
                )}
                {pixData?.expiration && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Expira às {new Date(pixData.expiration).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                {!pollTimeout ? (
                  <div className="flex items-center justify-center gap-2 bg-secondary/50 rounded-lg px-3 py-2.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground">Aguardando confirmação do pagamento…</p>
                  </div>
                ) : (
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-2.5 text-center">
                    <p className="text-xs text-orange-500 font-medium">Tempo esgotado</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Se pagou, o acesso será liberado automaticamente em breve. Verifique em "Minhas Assinaturas".
                    </p>
                  </div>
                )}
                <button onClick={handleClose}
                  className="w-full py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-secondary">
                  Fechar (verificar depois)
                </button>
              </div>
            )}

            {/* ── Card waiting (polling for webhook) ── */}
            {step === "card_waiting" && (
              <div className="p-8 flex flex-col items-center gap-4">
                {!pollTimeout ? (
                  <>
                    <Loader2 className="w-10 h-10 animate-spin text-primary" />
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Confirmando pagamento…</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Cartão aprovado. Aguardando confirmação do gateway.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-14 h-14 rounded-full bg-yellow-500/10 flex items-center justify-center">
                      <Check className="w-7 h-7 text-yellow-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-foreground">Pagamento aprovado</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        O acesso será liberado em instantes. Verifique em "Minhas Assinaturas".
                      </p>
                    </div>
                    <button onClick={handleClose}
                      className="px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                      Fechar
                    </button>
                  </>
                )}
              </div>
            )}

            {/* ── Plan + method select ── */}
            {step === "select" && (
              <div className="p-5 space-y-5">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Plano</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { value: "monthly" as const, label: "Mensal", p: priceMonthly, desc: "1 mês de acesso" },
                      { value: "yearly"  as const, label: "Anual",  p: priceYearly,  desc: "1 ano de acesso" },
                    ]).map(opt => (
                      <button key={opt.value} onClick={() => setPlan(opt.value)} disabled={opt.p <= 0}
                        className={`p-3 rounded-lg border text-left transition-colors ${plan === opt.value ? "border-primary/50 bg-primary/5" : "border-border hover:bg-secondary/50"} ${opt.p <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}>
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opt.p > 0 ? `R$${Number(opt.p).toFixed(2)}` : "Indisponível"}
                        </p>
                        <p className="text-[10px] text-muted-foreground/70">{opt.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Forma de pagamento</p>
                  <div className="space-y-1.5">
                    {([
                      { value: "pix"         as const, icon: QrCode,     label: "PIX",              desc: "Pagamento instantâneo" },
                      { value: "credit_card" as const, icon: CreditCard, label: "Cartão de Crédito", desc: "Visa, Mastercard, Elo" },
                    ]).map(opt => (
                      <button key={opt.value} onClick={() => setMethod(opt.value)}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg border transition-colors ${method === opt.value ? "border-primary/50 bg-primary/5" : "border-border hover:bg-secondary/50"}`}>
                        <opt.icon className="w-5 h-5 text-muted-foreground" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{opt.label}</p>
                          <p className="text-[11px] text-muted-foreground">{opt.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {price > 0 ? (
                  <button onClick={handleProceed}
                    className="w-full py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                    Continuar — R${Number(price).toFixed(2)}
                  </button>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    Criador ainda não configurou os valores.
                  </p>
                )}
              </div>
            )}

            {/* ── CPF ── */}
            {step === "cpf" && (
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Informe seu CPF para emissão do pagamento.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">CPF</label>
                  <input value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00" inputMode="numeric" className={inputCls} autoFocus />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep("select")}
                    className="px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
                    Voltar
                  </button>
                  <button onClick={handleProceed} disabled={processing}
                    className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Processando…</> : "Confirmar"}
                  </button>
                </div>
              </div>
            )}

            {/* ── Card form ── */}
            {step === "card" && (
              <div className="p-5 space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Número do cartão</label>
                  <input value={card.number}
                    onChange={e => setCard(c => ({ ...c, number: e.target.value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim().slice(0, 19) }))}
                    placeholder="0000 0000 0000 0000" inputMode="numeric" className={inputCls} autoFocus />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Nome no cartão</label>
                  <input value={card.holder}
                    onChange={e => setCard(c => ({ ...c, holder: e.target.value.toUpperCase() }))}
                    placeholder="NOME COMPLETO" className={inputCls} />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Mês</label>
                    <input value={card.month}
                      onChange={e => setCard(c => ({ ...c, month: e.target.value.replace(/\D/g, "").slice(0, 2) }))}
                      placeholder="MM" inputMode="numeric" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Ano</label>
                    <input value={card.year}
                      onChange={e => setCard(c => ({ ...c, year: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="AAAA" inputMode="numeric" className={inputCls} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">CVV</label>
                    <input value={card.cvv}
                      onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))}
                      placeholder="123" inputMode="numeric" type="password" className={inputCls} />
                  </div>
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={() => setStep("cpf")}
                    className="px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
                    Voltar
                  </button>
                  <button onClick={handleProceed} disabled={processing}
                    className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {processing
                      ? <><Loader2 className="w-4 h-4 animate-spin" />Processando…</>
                      : `Pagar R$${Number(price).toFixed(2)}`}
                  </button>
                </div>
              </div>
            )}

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscribeModal;
