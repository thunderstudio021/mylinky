import { useState, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Eye, EyeOff, Lock, DollarSign, User } from "lucide-react";
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

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Profile fields
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [bio, setBio] = useState("");
  const [category, setCategory] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (profile) {
      setPriceMonthly(profile.price_monthly > 0 ? String(profile.price_monthly) : "");
      setPriceYearly(profile.price_yearly > 0 ? String(profile.price_yearly) : "");
      setName(profile.name || "");
      setUsername(profile.username || "");
      setBio(profile.bio || "");
      setCategory(profile.category || "");
      setLoading(false);
    }
  }, [profile]);

  const handleSavePrices = async () => {
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

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    const { error } = await supabase.from("profiles").update({
      name: name.trim(),
      bio: bio.trim(),
      category: category.trim(),
    }).eq("id", user.id);

    if (error) {
      toast.error("Erro ao salvar");
    } else {
      toast.success("Perfil atualizado!");
      await refreshProfile();
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não coincidem");
      return;
    }

    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      toast.error("Erro ao alterar senha: " + error.message);
    } else {
      toast.success("Senha alterada com sucesso!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setChangingPassword(false);
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

        <div className="space-y-4">
          {/* Profile Info */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Informações pessoais</h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome</label>
                <input value={name} onChange={e => setName(e.target.value)} placeholder="Seu nome" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Usuário</label>
                <input value={username} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input value={user.email || ""} disabled className={`${inputClass} opacity-60 cursor-not-allowed`} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)} placeholder="Sobre você..." rows={3} className={`${inputClass} resize-none`} />
              </div>
              {(isCreator || isAdmin) && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Categoria</label>
                  <input value={category} onChange={e => setCategory(e.target.value)} placeholder="Ex: Fitness, Lifestyle..." className={inputClass} />
                </div>
              )}
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {savingProfile ? "Salvando..." : "Salvar perfil"}
            </button>
          </div>

          {/* Subscription Prices (creators only) */}
          {(isCreator || isAdmin) && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-foreground">Valores de assinatura</h2>
              </div>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Valor mensal (R$)</label>
                  <input type="number" value={priceMonthly} onChange={e => setPriceMonthly(e.target.value)} placeholder="Ex: 29.90" min="0" step="0.01" className={inputClass} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Valor anual (R$)</label>
                  <input type="number" value={priceYearly} onChange={e => setPriceYearly(e.target.value)} placeholder="Ex: 249.90" min="0" step="0.01" className={inputClass} />
                  {priceMonthly && priceYearly && parseFloat(priceYearly) > 0 && parseFloat(priceMonthly) > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Equivale a R${(parseFloat(priceYearly) / 12).toFixed(2)}/mês — {Math.round((1 - (parseFloat(priceYearly) / 12) / parseFloat(priceMonthly)) * 100)}% de desconto
                    </p>
                  )}
                </div>
              </div>

              <button
                onClick={handleSavePrices}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {saving ? "Salvando..." : "Salvar valores"}
              </button>
            </div>
          )}

          {/* Change Password */}
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Alterar senha</h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nova senha</label>
                <div className="relative">
                  <input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Confirmar nova senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className={inputClass}
                />
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={changingPassword || !newPassword || !confirmPassword}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {changingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
              {changingPassword ? "Alterando..." : "Alterar senha"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
