import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CreditCard, QrCode, Check, Loader2 } from "lucide-react";

interface SubscribeModalProps {
  open: boolean;
  onClose: () => void;
  creatorName: string;
  priceMonthly: number;
  priceYearly: number;
  onConfirm: (plan: "monthly" | "yearly", method: "pix" | "credit_card") => void;
}

const SubscribeModal = ({ open, onClose, creatorName, priceMonthly, priceYearly, onConfirm }: SubscribeModalProps) => {
  const [plan, setPlan] = useState<"monthly" | "yearly">("monthly");
  const [method, setMethod] = useState<"pix" | "credit_card">("pix");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const price = plan === "monthly" ? priceMonthly : priceYearly;

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 3000));
    setProcessing(false);
    setSuccess(true);
    onConfirm(plan, method);
    setTimeout(() => {
      setSuccess(false);
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    if (processing) return;
    setSuccess(false);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[999] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Assinar {creatorName}</h3>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {success ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="w-7 h-7 text-green-500" /></div>
                <p className="text-sm font-medium text-foreground">Assinatura ativada!</p>
              </div>
            ) : (
              <div className="p-5 space-y-5">
                {/* Plan selection */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Plano</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: "monthly" as const, label: "Mensal", price: priceMonthly },
                      { value: "yearly" as const, label: "Anual", price: priceYearly },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setPlan(opt.value)}
                        disabled={opt.price <= 0}
                        className={`p-3 rounded-lg border text-left transition-colors ${
                          plan === opt.value ? "border-foreground/40 bg-secondary" : "border-border hover:bg-secondary/50"
                        } ${opt.price <= 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <p className="text-sm font-medium text-foreground">{opt.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {opt.price > 0 ? `R$${Number(opt.price).toFixed(2)}` : "Não disponível"}
                        </p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment method */}
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Forma de pagamento</p>
                  <div className="space-y-1.5">
                    {[
                      { value: "pix" as const, label: "PIX", icon: QrCode, desc: "Pagamento instantâneo" },
                      { value: "credit_card" as const, label: "Cartão de Crédito", icon: CreditCard, desc: "Visa, Mastercard, Elo" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setMethod(opt.value)}
                        className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg border transition-colors ${
                          method === opt.value ? "border-foreground/40 bg-secondary" : "border-border hover:bg-secondary/50"
                        }`}
                      >
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
                  <button
                    onClick={handleConfirm}
                    disabled={processing}
                    className="w-full py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                    ) : (
                      <>Assinar por R${Number(price).toFixed(2)}</>
                    )}
                  </button>
                ) : (
                  <p className="text-center text-xs text-muted-foreground py-2">
                    Este criador ainda não configurou os valores de assinatura.
                  </p>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscribeModal;
