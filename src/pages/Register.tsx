import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logoImg from "@/assets/logo.png";

const steps = [
  { title: "Dados pessoais", subtitle: "Como você se chama?" },
  { title: "Seu email", subtitle: "Vamos confirmar seu email" },
  { title: "Crie sua senha", subtitle: "Proteja sua conta" },
];

const Register = () => {
  const [step, setStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [name, setName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [confirmEmail, setConfirmEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const formatWhatsapp = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  const canAdvance = () => {
    if (step === 0) return name.trim().length >= 2 && whatsapp.replace(/\D/g, "").length >= 10;
    if (step === 1) return email.trim().length > 0 && email === confirmEmail;
    if (step === 2) return password.length >= 6 && password === confirmPassword;
    return false;
  };

  const handleNext = () => {
    if (step === 0) {
      if (name.trim().length < 2) { toast.error("Informe seu nome completo"); return; }
      if (whatsapp.replace(/\D/g, "").length < 10) { toast.error("WhatsApp inválido"); return; }
    }
    if (step === 1) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast.error("Email inválido"); return; }
      if (email !== confirmEmail) { toast.error("Os emails não coincidem"); return; }
    }
    if (step === 2) {
      if (password.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
      if (password !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
      handleRegister();
      return;
    }
    setStep(step + 1);
  };

  const handleRegister = async () => {
    setLoading(true);
    const username = name.trim().toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9._]/g, "") + "_" + Math.random().toString(36).slice(2, 6);
    const result = await signup(email, password, name.trim(), username, whatsapp.replace(/\D/g, ""));
    setLoading(false);

    if (result.success) {
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } else {
      toast.error(result.error || "Erro ao criar conta");
    }
  };

  const inputClass = "w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/30 transition-all";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <img src={logoImg} alt="Logo" className="h-10 mx-auto mb-2" />
        </div>

        {/* Progress */}
        <div className="flex items-center gap-1 mb-6 px-1">
          {steps.map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden bg-secondary">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  i <= step ? "bg-foreground" : "bg-transparent"
                }`}
                style={{ width: i < step ? "100%" : i === step ? "50%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-xl p-5">
          {/* Step header */}
          <div className="mb-5">
            <p className="text-xs text-muted-foreground mb-0.5">Passo {step + 1} de 3</p>
            <h2 className="text-lg font-semibold text-foreground">{steps[step].title}</h2>
            <p className="text-sm text-muted-foreground">{steps[step].subtitle}</p>
          </div>

          {/* Step 1: Name + WhatsApp */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="João Silva"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">WhatsApp</label>
                <input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(formatWhatsapp(e.target.value))}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  className={inputClass}
                />
              </div>
            </div>
          )}

          {/* Step 2: Email + Confirm */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass}
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Confirmar email</label>
                <input
                  type="email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className={inputClass}
                />
                {confirmEmail && email !== confirmEmail && (
                  <p className="text-xs text-destructive">Os emails não coincidem</p>
                )}
              </div>
            </div>
          )}

          {/* Step 3: Password + Confirm */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Senha</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className={`${inputClass} pr-9`}
                    autoFocus
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Confirmar senha</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a senha"
                    className={`${inputClass} pr-9`}
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-xs text-destructive">As senhas não coincidem</p>
                )}
              </div>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-secondary transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={!canAdvance() || loading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : step === 2 ? (
                <>
                  <Check className="w-4 h-4" />
                  Criar conta
                </>
              ) : (
                <>
                  Continuar
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-4">
            Já tem conta?{" "}
            <Link to="/login" className="text-foreground hover:underline">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
