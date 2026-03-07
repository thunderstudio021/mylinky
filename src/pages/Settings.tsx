import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Settings = () => {
  const { user, profile, isCreator, isAdmin, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [priceMonthly, setPriceMonthly] = useState("");
  const [priceYearly, setPriceYearly] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      setPriceMonthly(profile.price_monthly > 0 ? String(profile.price_monthly) : "");
      setPriceYearly(profile.price_yearly > 0 ? String(profile.price_yearly) : "");
      setLoading(false);
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      price_monthly: parseFloat(priceMonthly) || 0,
      price_yearly: parseFloat(priceYearly) || 0,
    }).eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Valores atualizados!");
      await refreshProfile();
    }
    setSaving(false);
  };

  if (!user) return null;

  const inputClass = "w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/30";

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-lg mx-auto px-4 md:px-6">
        <div className="flex items-center gap-3 mb-6 pt-2">
          <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Configurações</h1>
        </div>

        {(isCreator || isAdmin) && (
          <div className="bg-card border border-border rounded-xl p-5 space-y-5">
            <div>
              <h2 className="text-sm font-semibold text-foreground mb-1">Valores de assinatura</h2>
              <p className="text-xs text-muted-foreground">Defina os preços para seus assinantes</p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Valor mensal (R$)</label>
                <input
                  type="number"
                  value={priceMonthly}
                  onChange={(e) => setPriceMonthly(e.target.value)}
                  placeholder="Ex: 29.90"
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Valor anual (R$)</label>
                <input
                  type="number"
                  value={priceYearly}
                  onChange={(e) => setPriceYearly(e.target.value)}
                  placeholder="Ex: 249.90"
                  min="0"
                  step="0.01"
                  className={inputClass}
                />
                {priceMonthly && priceYearly && parseFloat(priceYearly) > 0 && (
                  <p className="text-xs text-muted-foreground">
                    Equivale a R${(parseFloat(priceYearly) / 12).toFixed(2)}/mês — {Math.round((1 - (parseFloat(priceYearly) / 12) / parseFloat(priceMonthly)) * 100)}% de desconto
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        )}

        {!isCreator && !isAdmin && (
          <div className="bg-card border border-border rounded-xl p-5 text-center">
            <p className="text-sm text-muted-foreground">Configurações gerais em breve.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
