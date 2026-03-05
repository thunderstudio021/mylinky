import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, Compass, Bell, User, Menu, X, LogIn, LogOut,
  Search, MessageCircle, UserPlus2, Link2, Users2, UserCheck,
  Wallet, Heart, Settings, HelpCircle, ArrowLeft, Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isCreator } = useAuth();

  const bottomItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/explore", icon: Compass, label: "Descobrir" },
    { path: "/search", icon: Search, label: "Pesquisar" },
    { path: "/notifications", icon: Bell, label: "Avisos" },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
          FanVault
        </Link>
        <div className="flex items-center gap-1">
          {bottomItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive(item.path) ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
              }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
              <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-medium">
                {user.name[0]}
              </div>
              <span className="hidden lg:inline">{user.name.split(" ")[0]}</span>
            </button>
          ) : (
            <Link to="/login">
              <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
                <LogIn className="w-3.5 h-3.5" /> Entrar
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="text-base font-semibold text-foreground">FanVault</Link>
        {user ? (
          <button onClick={() => setMenuOpen(true)} className="text-foreground">
            <Menu className="w-5 h-5" />
          </button>
        ) : (
          <Link to="/login" className="text-sm font-medium text-foreground">Entrar</Link>
        )}
      </div>

      {/* Mobile bottom bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-1.5">
          {bottomItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 py-1 px-3">
              <item.icon className={`w-5 h-5 ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
            </Link>
          ))}
          <button onClick={() => setMenuOpen(true)} className="flex flex-col items-center gap-0.5 py-1 px-3">
            <User className={`w-5 h-5 text-muted-foreground`} />
            <span className="text-[10px] text-muted-foreground">Menu</span>
          </button>
        </div>
      </nav>

      {/* Fullscreen Menu Overlay */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, x: "100%" }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed inset-0 z-[100] bg-background overflow-y-auto"
          >
            {/* Menu Header */}
            <div className="flex items-center justify-between px-4 h-12 md:h-14 border-b border-border">
              <button onClick={() => setMenuOpen(false)} className="text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <div className="w-5" />
            </div>

            <div className="px-4 py-4 space-y-1">
              {/* Main nav */}
              <MenuItem icon={Home} label="Início" path="/" active={isActive("/")} onClick={() => { navigate("/"); setMenuOpen(false); }} />
              <MenuItem icon={MessageCircle} label="Chat" path="/chat" onClick={() => { navigate("/chat"); setMenuOpen(false); }} />
              <MenuItem icon={Compass} label="Descobrir" path="/explore" active={isActive("/explore")} onClick={() => { navigate("/explore"); setMenuOpen(false); }} />
              <MenuItem icon={Search} label="Pesquisar" path="/search" onClick={() => { navigate("/search"); setMenuOpen(false); }} />
              <MenuItem icon={UserPlus2} label="Seja um criador" path="/become-creator" onClick={() => { navigate("/become-creator"); setMenuOpen(false); }} />

              <div className="border-t border-border my-3" />
              <p className="text-xs font-semibold text-foreground px-3 py-2">Colaborações</p>
              <MenuItem icon={Link2} label="Indicação" path="/referral" onClick={() => { navigate("/referral"); setMenuOpen(false); }} />
              <MenuItem icon={Users2} label="Afiliações" path="/affiliates" onClick={() => { navigate("/affiliates"); setMenuOpen(false); }} />
              <MenuItem icon={UserCheck} label="Produtores" path="/producers" onClick={() => { navigate("/producers"); setMenuOpen(false); }} />

              {/* Financial - only for creators */}
              {isCreator && (
                <>
                  <div className="border-t border-border my-3" />
                  <p className="text-xs font-semibold text-foreground px-3 py-2">Financeiro</p>
                  <MenuItem icon={Wallet} label="Carteira Digital" path="/dashboard" active={isActive("/dashboard")} onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} />
                </>
              )}

              {/* Admin - only for admin */}
              {isAdmin && (
                <>
                  <div className="border-t border-border my-3" />
                  <p className="text-xs font-semibold text-foreground px-3 py-2">Administração</p>
                  <MenuItem icon={Shield} label="Painel Admin" path="/admin" active={isActive("/admin")} onClick={() => { navigate("/admin"); setMenuOpen(false); }} />
                </>
              )}

              <div className="border-t border-border my-3" />
              <p className="text-xs font-semibold text-foreground px-3 py-2">Sua conta</p>
              <MenuItem icon={Heart} label="Assinaturas" path="/subscriptions" onClick={() => { navigate("/subscriptions"); setMenuOpen(false); }} />
              <MenuItem icon={Settings} label="Configurações" path="/settings" onClick={() => { navigate("/settings"); setMenuOpen(false); }} />
              <MenuItem icon={HelpCircle} label="Suporte" path="/support" onClick={() => { navigate("/support"); setMenuOpen(false); }} />

              {user && (
                <>
                  <div className="border-t border-border my-3" />
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                    <LogOut className="w-5 h-5" />
                    Sair
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

const MenuItem = ({ icon: Icon, label, active, onClick }: {
  icon: any; label: string; path: string; active?: boolean; onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
      active ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
    }`}
  >
    <Icon className="w-5 h-5" />
    {label}
  </button>
);

export default Navbar;
