import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, Compass, User, Menu, X, LogIn, LogOut,
  Search, MessageCircle, UserPlus2, Link2, Users2, UserCheck,
  Wallet, Heart, Settings, HelpCircle, ArrowLeft, Shield,
  Bell, Plus, Camera, Video, FileText, BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin, isCreator } = useAuth();

  const notificationCount = 3; // mock

  const bottomItems = [
    { path: "/", icon: Home },
    { path: "/explore", icon: Compass },
    ...(isCreator ? [{ path: "#create", icon: Plus, isCreate: true }] : []),
    { path: "/search", icon: Search },
  ];

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const createOptions = [
    { icon: Camera, label: "Foto", action: () => { setCreateOpen(false); navigate("/dashboard?tab=create&type=photo"); } },
    { icon: Video, label: "Vídeo", action: () => { setCreateOpen(false); navigate("/dashboard?tab=create&type=video"); } },
    { icon: FileText, label: "Texto", action: () => { setCreateOpen(false); navigate("/dashboard?tab=create&type=text"); } },
    { icon: BarChart3, label: "Enquete", action: () => { setCreateOpen(false); navigate("/dashboard?tab=create&type=poll"); } },
  ];

  const NotificationBell = ({ className = "" }: { className?: string }) => (
    <button className={`relative ${className}`}>
      <Bell className="w-5 h-5" />
      {notificationCount > 0 && (
        <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
          +{Math.min(notificationCount, 9)}
        </span>
      )}
    </button>
  );

  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
          FanVault
        </Link>
        <div className="flex items-center gap-1">
          {[
            { path: "/", icon: Home, label: "Início" },
            { path: "/explore", icon: Compass, label: "Descobrir" },
            { path: "/search", icon: Search, label: "Pesquisar" },
          ].map((item) => (
            <Link key={item.path} to={item.path}>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                isActive(item.path) ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"
              }`}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </Link>
          ))}
          {isCreator && (
            <button
              onClick={() => setCreateOpen(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <Plus className="w-4 h-4" />
              Criar
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <NotificationBell className="text-muted-foreground hover:text-foreground transition-colors" />
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
        <div className="flex items-center gap-3">
          <NotificationBell className="text-muted-foreground hover:text-foreground transition-colors" />
          {user ? (
            <button onClick={() => setMenuOpen(true)} className="text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          ) : (
            <Link to="/login" className="text-sm font-medium text-foreground">Entrar</Link>
          )}
        </div>
      </div>

      {/* Mobile bottom bar — icons only */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-2">
          {bottomItems.map((item) => {
            if ((item as any).isCreate) {
              return (
                <button
                  key="create"
                  onClick={() => setCreateOpen(true)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background -mt-5 shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </button>
              );
            }
            return (
              <Link key={item.path} to={item.path} className="flex items-center justify-center p-2">
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`} />
              </Link>
            );
          })}
          <button onClick={() => setMenuOpen(true)} className="flex items-center justify-center p-2">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </nav>

      {/* Create Post Modal */}
      <AnimatePresence>
        {createOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-end md:items-center justify-center"
          >
            <div className="absolute inset-0 bg-black/60" onClick={() => setCreateOpen(false)} />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full max-w-sm mx-4 mb-20 md:mb-0 bg-card border border-border rounded-xl p-5"
            >
              <p className="text-sm font-semibold text-foreground mb-4">Criar publicação</p>
              <div className="grid grid-cols-2 gap-2">
                {createOptions.map((opt) => (
                  <button
                    key={opt.label}
                    onClick={opt.action}
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                  >
                    <opt.icon className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-foreground">{opt.label}</span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setCreateOpen(false)}
                className="w-full mt-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
            <div className="flex items-center justify-between px-4 h-12 md:h-14 border-b border-border">
              <button onClick={() => setMenuOpen(false)} className="text-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <span className="text-sm font-semibold text-foreground">Menu</span>
              <div className="w-5" />
            </div>

            <div className="px-4 py-4 space-y-1">
              <MenuItem icon={Home} label="Início" onClick={() => { navigate("/"); setMenuOpen(false); }} active={isActive("/")} />
              <MenuItem icon={MessageCircle} label="Chat" onClick={() => { navigate("/chat"); setMenuOpen(false); }} />
              <MenuItem icon={Compass} label="Descobrir" onClick={() => { navigate("/explore"); setMenuOpen(false); }} active={isActive("/explore")} />
              <MenuItem icon={Search} label="Pesquisar" onClick={() => { navigate("/search"); setMenuOpen(false); }} />
              <MenuItem icon={UserPlus2} label="Seja um criador" onClick={() => { navigate("/become-creator"); setMenuOpen(false); }} />

              <div className="border-t border-border my-3" />
              <p className="text-xs font-semibold text-foreground px-3 py-2">Colaborações</p>
              <MenuItem icon={Link2} label="Indicação" onClick={() => { navigate("/referral"); setMenuOpen(false); }} />
              <MenuItem icon={Users2} label="Afiliações" onClick={() => { navigate("/affiliates"); setMenuOpen(false); }} />
              <MenuItem icon={UserCheck} label="Produtores" onClick={() => { navigate("/producers"); setMenuOpen(false); }} />

              {isCreator && (
                <>
                  <div className="border-t border-border my-3" />
                  <p className="text-xs font-semibold text-foreground px-3 py-2">Financeiro</p>
                  <MenuItem icon={Wallet} label="Carteira Digital" onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} active={isActive("/dashboard")} />
                </>
              )}

              {isAdmin && (
                <>
                  <div className="border-t border-border my-3" />
                  <p className="text-xs font-semibold text-foreground px-3 py-2">Administração</p>
                  <MenuItem icon={Shield} label="Painel Admin" onClick={() => { navigate("/admin"); setMenuOpen(false); }} active={isActive("/admin")} />
                </>
              )}

              <div className="border-t border-border my-3" />
              <p className="text-xs font-semibold text-foreground px-3 py-2">Sua conta</p>
              <MenuItem icon={Heart} label="Assinaturas" onClick={() => { navigate("/subscriptions"); setMenuOpen(false); }} />
              <MenuItem icon={Settings} label="Configurações" onClick={() => { navigate("/settings"); setMenuOpen(false); }} />
              <MenuItem icon={HelpCircle} label="Suporte" onClick={() => { navigate("/support"); setMenuOpen(false); }} />

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
  icon: any; label: string; active?: boolean; onClick: () => void;
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
