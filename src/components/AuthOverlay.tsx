import { Link } from "react-router-dom";
import { LogIn } from "lucide-react";

const AuthOverlay = () => (
  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/60 backdrop-blur-md rounded-lg">
    <p className="text-sm font-medium text-foreground mb-3">Faça login para ver o conteúdo</p>
    <div className="flex gap-2">
      <Link
        to="/login"
        className="flex items-center gap-2 px-5 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors"
      >
        <LogIn className="w-4 h-4" />
        Entrar
      </Link>
      <Link
        to="/register"
        className="px-5 py-2 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-secondary transition-colors"
      >
        Criar conta
      </Link>
    </div>
  </div>
);

export default AuthOverlay;
