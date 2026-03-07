import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, Check, Loader2, Gift } from "lucide-react";

interface GiftModalProps {
  open: boolean;
  onClose: () => void;
  creatorName: string;
  onConfirm: (amount: number) => void;
}

const quickAmounts = [2, 5, 10, 25, 50, 100, 500, 1000];

const GiftModal = ({ open, onClose, creatorName, onConfirm }: GiftModalProps) => {
  const [amount, setAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const finalAmount = amount ?? (parseFloat(customAmount) || 0);

  const handleConfirm = async () => {
    if (finalAmount < 2 || finalAmount > 10000) return;
    setProcessing(true);
    await new Promise((r) => setTimeout(r, 3000));
    setProcessing(false);
    setSuccess(true);
    onConfirm(finalAmount);
    setTimeout(() => {
      setSuccess(false);
      setAmount(null);
      setCustomAmount("");
      onClose();
    }, 1500);
  };

  const handleClose = () => {
    if (processing) return;
    setSuccess(false);
    setAmount(null);
    setCustomAmount("");
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
                <Gift className="w-4 h-4 text-muted-foreground" />
                <h3 className="text-base font-semibold text-foreground">Enviar presente</h3>
              </div>
              <button onClick={handleClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>

            {success ? (
              <div className="p-8 flex flex-col items-center gap-3">
                <div className="w-14 h-14 rounded-full bg-green-500/10 flex items-center justify-center"><Check className="w-7 h-7 text-green-500" /></div>
                <p className="text-sm font-medium text-foreground">Presente enviado para {creatorName}!</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <p className="text-xs text-muted-foreground">Envie um presente via PIX para <span className="font-medium text-foreground">{creatorName}</span></p>

                {/* Quick amounts */}
                <div className="grid grid-cols-4 gap-2">
                  {quickAmounts.map((val) => (
                    <button
                      key={val}
                      onClick={() => { setAmount(val); setCustomAmount(""); }}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        amount === val ? "border-foreground/40 bg-secondary text-foreground" : "border-border text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                      }`}
                    >
                      R${val}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Valor personalizado (R$2 - R$10.000)</label>
                  <input
                    type="number"
                    value={customAmount}
                    onChange={(e) => { setCustomAmount(e.target.value); setAmount(null); }}
                    placeholder="Ex: 150.00"
                    min="2"
                    max="10000"
                    step="0.01"
                    className="w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/30"
                  />
                </div>

                <button
                  onClick={handleConfirm}
                  disabled={processing || finalAmount < 2 || finalAmount > 10000}
                  className="w-full py-3 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Processando PIX...</>
                  ) : (
                    <>Enviar R${finalAmount > 0 ? finalAmount.toFixed(2) : "0,00"} via PIX</>
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

export default GiftModal;
