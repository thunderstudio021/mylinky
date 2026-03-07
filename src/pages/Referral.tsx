import { useState } from "react";
import { ArrowLeft, Copy, Check, Link2, Users, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Referral = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/register?ref=${profile?.username || user?.id?.slice(0, 8)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success("Link copiado!");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Indicação</h1>
        </div>

        <div className="space-y-4">
          {/* Explanation */}
          <div className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Link2 className="w-5 h-5 text-foreground" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">Como funciona?</h2>
                <p className="text-xs text-muted-foreground">Ganhe comissão indicando criadores</p>
              </div>
            </div>
            <div className="space-y-3 mt-4">
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">1</span>
                <p className="text-sm text-muted-foreground">Compartilhe seu link de indicação com outras pessoas</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">2</span>
                <p className="text-sm text-muted-foreground">Quando alguém se cadastrar pelo seu link e se tornar criador</p>
              </div>
              <div className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-foreground shrink-0">3</span>
                <p className="text-sm text-muted-foreground">Você ganha <span className="text-foreground font-semibold">5% de comissão</span> sobre todas as vendas desse criador</p>
              </div>
            </div>
          </div>

          {/* Referral Link */}
          <div className="bg-card border border-border rounded-xl p-5">
            <label className="text-xs font-medium text-muted-foreground mb-2 block">Seu link de indicação</label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-foreground truncate">
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className="shrink-0 p-2.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Stats placeholder */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <Users className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">0</p>
              <p className="text-xs text-muted-foreground">Indicados</p>
            </div>
            <div className="bg-card border border-border rounded-xl p-4 text-center">
              <TrendingUp className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">R$ 0,00</p>
              <p className="text-xs text-muted-foreground">Comissão total</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Referral;
