import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(email, password);
    if (success) {
      toast.success("Login realizado com sucesso!");
      navigate("/");
    } else {
      toast.error("Email ou senha incorretos");
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-semibold text-foreground mb-1">FanVault</h1>
          <p className="text-sm text-muted-foreground">Entre na sua conta</p>
        </div>

        <form onSubmit={handleLogin} className="bg-card border border-border rounded-lg p-5 space-y-4">
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
          <button type="submit" className="w-full py-2 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
            Entrar
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Não tem conta?{" "}
            <Link to="/register" className="text-foreground hover:underline">Criar conta</Link>
          </p>

          <div className="border-t border-border pt-3">
            <p className="text-[10px] text-muted-foreground text-center mb-2">Contas de teste:</p>
            <div className="space-y-1 text-[10px] text-muted-foreground">
              <p><span className="text-foreground">Admin:</span> admin@gmail.com / admin</p>
              <p><span className="text-foreground">Criadora:</span> luna@email.com / 123456</p>
              <p><span className="text-foreground">Usuário:</span> joao@email.com / 123456</p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
