import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, CreditCard, QrCode, Check, Loader2, DollarSign } from "lucide-react";

interface PaymentModalProps {
  open: boolean;
  onClose: () => void;
  amount: number;
  onConfirm: (method: "pix" | "credit_card") => void;
}

const PaymentModal = ({ open, onClose, amount, onConfirm }: PaymentModalProps) => {
  const [method, setMethod] = useState<"pix" | "credit_card">("pix");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleConfirm = async () => {
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 3000));
    setProcessing(false);
    setSuccess(true);
    onConfirm(method);
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
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[120] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="relative w-full max-w-sm mx-4 bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Desbloquear conteúdo</h3>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {success ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="w-7 h-7 text-green-500" /></div>
                <p className="text-sm font-medium text-foreground">Conteúdo desbloqueado!</p>
              </div>
            ) : (
              <div className="p-5 space-y-5">
                <div className="text-center py-2">
                  <p className="text-2xl font-bold text-foreground">R${Number(amount).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Valor único para desbloquear</p>
                </div>

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

                <button
                  onClick={handleConfirm}
                  disabled={processing}
                  className="w-full py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando...</>
                  ) : (
                    <>Pagar R${Number(amount).toFixed(2)}</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PaymentModal;
