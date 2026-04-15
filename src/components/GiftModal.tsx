import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Loader2, Gift, Copy, CheckCheck, QrCode } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface GatewayConfig {
  gateway: "appmax" | "mercadopago" | "none";
  public_key: string;
}

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  creatorName: string;
  creatorId: string;
  onConfirm: (amount: number) => void;
}

type Step = "amount" | "cpf" | "pix_waiting" | "success";

const quickAmounts = [2, 5, 10, 25, 50, 100, 500, 1000];

const formatCpf = (v: string) => {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};

const GiftModal = ({ open, onClose, creatorName, creatorId, onConfirm }: GiftModalProps) => {
  const [step, setStep] = useState<Step>("amount");
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [cpf, setCpf] = useState("");
  const [processing, setProcessing] = useState(false);
  const [pixData, setPixData] = useState<{ qrcode: string; emv: string; expiration: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [gatewayConfig, setGatewayConfig] = useState<GatewayConfig | null>(null);
  const [appmaxOrderId, setAppmaxOrderId] = useState<number | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = () => {
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  // Load active gateway on open
  useEffect(() => {
    if (!open) return;
    supabase.rpc("get_active_gateway_config").then(({ data, error }) => {
      if (!error && data) setGatewayConfig(data as GatewayConfig);
    });
  }, [open]);

  // Poll AppMax payment status after PIX is shown
  useEffect(() => {
    if (step !== "pix_waiting" || !appmaxOrderId) { stopPolling(); return; }

    pollingRef.current = setInterval(async () => {
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
          onConfirm(finalAmount);
          setStep("success");
        }
      } catch { /* retry next tick */ }
    }, 3000);

    return stopPolling;
  }, [step, appmaxOrderId]);

  useEffect(() => { if (!open) stopPolling(); }, [open]);

  const finalAmount = amount ?? (parseFloat(customAmount) || 0);

  const reset = () => {
    stopPolling();
    setStep("amount");
    setAmount(null);
    setCustomAmount("");
    setCpf("");
    setPixData(null);
    setCopied(false);
    setProcessing(false);
    setAppmaxOrderId(null);
  };

  const handleClose = () => {
    if (processing) return;
    reset();
    onClose();
  };

  const handlePayment = async () => {
    setProcessing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const isMp = gatewayConfig?.gateway === "mercadopago";
      const functionName = isMp ? "mp-checkout" : "appmax-checkout";

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${functionName}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            payment_type: "pix",
            amount: finalAmount,
            product_type: "gift",
            product_id: `gift-${creatorId}`,
            creator_id: creatorId,
            cpf: cpf.replace(/\D/g, ""),
          }),
        },
      );
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Erro no pagamento");

      if (data.order_id) setAppmaxOrderId(data.order_id);
      setPixData(data.pix);
      setStep("pix_waiting");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Erro ao processar pagamento");
    } finally {
      setProcessing(false);
    }
  };

  const handleProceed = () => {
    if (step === "amount") {
      if (finalAmount < 2 || finalAmount > 10000) {
        toast.error("Valor deve ser entre R$2 e R$10.000");
        return;
      }
      setStep("cpf");
      return;
    }
    if (step === "cpf") {
      if (cpf.replace(/\D/g, "").length !== 11) {
        toast.error("CPF inválido");
        return;
      }
      handlePayment();
    }
  };

  const handleCopy = () => {
    if (!pixData?.emv) return;
    navigator.clipboard.writeText(pixData.emv).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 transition-all";

  const title =
    step === "pix_waiting" ? "Aguardando pagamento" :
    step === "success" ? "Presente enviado!" :
    "Enviar presente";
  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-sm bg-card border border-border rounded-xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Gift className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">{title}</h3>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success */}
            {step === "success" && (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Check className="w-7 h-7 text-green-500" />
                </div>
                <p className="text-sm font-medium text-foreground">Presente enviado para {creatorName}!</p>
                <button onClick={handleClose} className="mt-2 px-6 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90">
                  Fechar
                </button>
              </div>
            )}

            {/* PIX QR */}
            {step === "pix_waiting" && pixData && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground text-center">
                  Escaneie o QR Code ou copie o código PIX para enviar R${finalAmount.toFixed(2)} para {creatorName}
                </p>
                {pixData.qrcode && (
                  <div className="flex justify-center">
                    <img
                      src={pixData.qrcode.startsWith("data:") ? pixData.qrcode : `data:image/png;base64,${pixData.qrcode}`}
                      alt="QR Code PIX" className="w-48 h-48 rounded-lg border border-border bg-white p-2"
                    />
                  </div>
                )}
                {pixData.emv && (
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
                {pixData.expiration && (
                  <p className="text-[11px] text-muted-foreground text-center">
                    Expira às {new Date(pixData.expiration).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
                <p className="text-xs text-muted-foreground text-center bg-secondary/50 rounded-lg px-3 py-2">
                  O presente será enviado automaticamente após o pagamento.
                </p>
                <button onClick={handleClose} className="w-full py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-secondary">
                  Fechar
                </button>
              </div>
            )}

            {/* Amount selection */}
            {step === "amount" && (
              <div className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground">
                  Envie um presente via PIX para <span className="font-medium text-foreground">{creatorName}</span>
                </p>

                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((val) => (
                    <button key={val} onClick={() => { setAmount(val); setCustomAmount(""); }}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        amount === val ? "border-primary/50 bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}>
                      R${val}
                    </button>
                  ))}
                </div>

                <div>
                  <label className="text-xs text-muted-foreground mb-1.5 block">Valor personalizado (R$2 – R$10.000)</label>
                  <input type="number" value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                    placeholder="Ex: 150.00" min="2" max="10000" step="0.01"
                    className={inputCls} />
                </div>

                <button onClick={handleProceed} disabled={finalAmount < 2 || finalAmount > 10000}
                  className="w-full py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <QrCode className="w-4 h-4" />
                  Continuar — R${finalAmount > 0 ? finalAmount.toFixed(2) : "0,00"}
                </button>
              </div>
            )}

            {/* CPF */}
            {step === "cpf" && (
              <div className="p-5 space-y-4">
                <p className="text-sm text-muted-foreground">Informe seu CPF para emissão do pagamento.</p>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">CPF</label>
                  <input value={cpf} onChange={e => setCpf(formatCpf(e.target.value))}
                    placeholder="000.000.000-00" inputMode="numeric" className={inputCls} autoFocus />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setStep("amount")} className="px-4 py-2.5 text-sm border border-border rounded-lg text-foreground hover:bg-secondary">
                    Voltar
                  </button>
                  <button onClick={handleProceed} disabled={processing}
                    className="flex-1 py-2.5 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2">
                    {processing ? <><Loader2 className="w-4 h-4 animate-spin" />Processando…</> : "Gerar QR Code PIX"}
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

export default GiftModal;
