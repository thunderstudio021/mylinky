import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !username || !email || !password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      toast.error("O nome de usuário só pode conter letras, números e _");
      return;
    }

    setLoading(true);
    const result = await signup(email, password, name, username.toLowerCase());
    setLoading(false);

    if (result.success) {
      toast.success("Conta criada com sucesso!");
      navigate("/");
    } else {
      toast.error(result.error || "Erro ao criar conta");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1">FanVault</h1>
          <p className="text-sm text-muted-foreground">Crie sua conta</p>
        </div>

        <form onSubmit={handleRegister} className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Nome completo</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="João Silva"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Usuário</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="joaosilva"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground transition-colors"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Senha</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-muted-foreground pr-9 transition-colors"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Criar conta
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Já tem conta?{" "}
            <Link to="/login" className="text-foreground hover:underline">Entrar</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;
