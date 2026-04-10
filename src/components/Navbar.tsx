import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  Home, Compass, User, Menu, X, LogIn, LogOut,
  Search, MessageCircle, UserPlus2, Link2, Users2,
  Wallet, Heart, Settings, HelpCircle, ArrowLeft, Shield, Pencil,
  Bell, Plus, Sun, Moon } from
"lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import CreatePostModal from "@/components/CreatePostModal";
import NotificationPanel, { useUnreadNotifications } from "@/components/NotificationPanel";
import { useTheme } from "@/hooks/useTheme";
import { SiteLogo } from "@/components/SiteLogo";
import { AppAvatar } from "@/components/AppAvatar";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout, isAdmin, isCreator } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const notificationCount = useUnreadNotifications();

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const isAdminPage = location.pathname === "/admin-panel";
  if (isAuthPage || isAdminPage) return null;


  const canCreate = isCreator || isAdmin;
  const bottomItems = [
  { path: "/", icon: Home },
  { path: "/explore", icon: Compass },
  ...(canCreate ? [{ path: "#create", icon: Plus, isCreate: true }] : []),
  { path: "/search", icon: Search }];


  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate("/");
  };


  const NotificationBell = ({ className = "" }: {className?: string;}) =>
  <button className={`relative ${className}`} onClick={() => user && setNotifOpen(true)}>
      <Bell className="w-5 h-5" />
      {notificationCount > 0 &&
    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-destructive text-destructive-foreground text-[10px] font-semibold rounded-full">
          {Math.min(notificationCount, 99)}
        </span>
    }
    </button>;


  return (
    <>
      {/* Desktop top bar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center">
          <SiteLogo className="h-7 object-contain" />
        </Link>
        <div className="flex items-center gap-1">
          {[
          { path: "/", icon: Home, label: "Início" },
          { path: "/explore", icon: Compass, label: "Descobrir" },
          { path: "/search", icon: Search, label: "Pesquisar" }].
          map((item) =>
          <Link key={item.path} to={item.path}>
              <button className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
            isActive(item.path) ? "text-foreground bg-secondary" : "text-muted-foreground hover:text-foreground"}`
            }>
                <item.icon className="w-4 h-4" />
                {item.label}
              </button>
            </Link>
          )}
          {canCreate &&
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
            
              <Plus className="w-4 h-4" />
              Criar
            </button>
          }
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="relative text-muted-foreground hover:text-foreground transition-colors">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <NotificationBell className="text-muted-foreground hover:text-foreground transition-colors" />
          {user ?
          <button onClick={() => setMenuOpen(true)} className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground transition-colors">
              <AppAvatar src={profile?.avatar_url} name={profile?.name ?? "U"} className="w-7 h-7" sizePx={56} textClassName="text-xs font-medium" />
              <span className="hidden lg:inline">{profile?.name?.split(" ")[0] || "Usuário"}</span>
            </button> :

          <Link to="/login">
              <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium text-background rounded-md transition-colors bg-primary">
                <LogIn className="w-3.5 h-3.5" /> Entrar
              </button>
            </Link>
          }
        </div>
      </nav>

      {/* Mobile top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center"><SiteLogo className="h-6 object-contain" /></Link>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="relative text-muted-foreground hover:text-foreground transition-colors">
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <NotificationBell className="text-muted-foreground hover:text-foreground transition-colors" />
          {!user &&
          <Link to="/login" className="text-sm font-medium text-foreground">Entrar</Link>
          }
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
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-foreground text-background -mt-5 shadow-lg">
                  
                  <Plus className="w-5 h-5" />
                </button>);

            }
            return (
              <Link key={item.path} to={item.path} className="flex items-center justify-center p-2">
                <item.icon className={`w-5 h-5 ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`} />
              </Link>);

          })}
          <button onClick={() => user ? setMenuOpen(true) : navigate("/login")} className="flex items-center justify-center p-2">
            <User className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </nav>

      {/* Create Post Modal */}
      <CreatePostModal open={createOpen} onClose={() => setCreateOpen(false)} />

      {/* Notification Panel */}
      <NotificationPanel open={notifOpen} onClose={() => setNotifOpen(false)} />

      {/* Mobile Menu — backdrop + slide-in drawer */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm"
              onClick={() => setMenuOpen(false)}
            />

            {/* Drawer panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32, mass: 0.9 }}
              className="fixed top-0 right-0 bottom-0 z-[100] w-full max-w-[320px] bg-card border-l border-border overflow-y-auto shadow-2xl"
            >
              <div className="flex items-center justify-between px-4 h-14 border-b border-border">
                <span className="text-sm font-semibold text-foreground">Menu</span>
                <button onClick={() => setMenuOpen(false)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="px-3 py-4 space-y-0.5">
                {/* User profile header */}
                {user && (
                  <>
                    <button
                      onClick={() => { navigate(`/${profile?.username || ""}`); setMenuOpen(false); }}
                      className="flex items-center gap-3 w-full px-3 py-3 rounded-lg hover:bg-secondary transition-colors mb-1"
                    >
                      <AppAvatar src={profile?.avatar_url} name={profile?.name ?? "U"} className="w-11 h-11 shrink-0" sizePx={88} textClassName="text-lg" />
                      <div className="text-left min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{profile?.name || "Usuário"}</p>
                        <p className="text-xs text-muted-foreground truncate">@{profile?.username || ""}</p>
                      </div>
                    </button>
                    <div className="border-t border-border my-2" />
                  </>
                )}

                <MenuItem icon={Home} label="Início" onClick={() => { navigate("/"); setMenuOpen(false); }} active={isActive("/")} />
                <MenuItem icon={MessageCircle} label="Chat" onClick={() => { navigate("/chat"); setMenuOpen(false); }} />
                <MenuItem icon={Compass} label="Descobrir" onClick={() => { navigate("/explore"); setMenuOpen(false); }} active={isActive("/explore")} />
                <MenuItem icon={Search} label="Pesquisar" onClick={() => { navigate("/search"); setMenuOpen(false); }} />
                {!isCreator && !isAdmin && user && (
                  <MenuItem icon={UserPlus2} label="Seja um criador" onClick={() => { navigate("/become-creator"); setMenuOpen(false); }} />
                )}

                <div className="border-t border-border my-2" />
                <p className="text-[11px] font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">Colaborações</p>
                <MenuItem icon={Link2} label="Indicação" onClick={() => { navigate("/referral"); setMenuOpen(false); }} />

                {(isCreator || isAdmin) && (
                  <>
                    <div className="border-t border-border my-2" />
                    <p className="text-[11px] font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">Financeiro</p>
                    <MenuItem icon={Wallet} label="Carteira Digital" onClick={() => { navigate("/dashboard"); setMenuOpen(false); }} active={isActive("/dashboard")} />
                  </>
                )}

                {isAdmin && (
                  <>
                    <div className="border-t border-border my-2" />
                    <p className="text-[11px] font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">Administração</p>
                    <MenuItem icon={Shield} label="Painel Admin" onClick={() => { navigate("/admin-panel"); setMenuOpen(false); }} active={isActive("/admin-panel")} />
                  </>
                )}

                <div className="border-t border-border my-2" />
                <p className="text-[11px] font-semibold text-muted-foreground px-3 py-1.5 uppercase tracking-wider">Sua conta</p>
                <MenuItem icon={Heart} label="Assinaturas" onClick={() => { navigate("/subscriptions"); setMenuOpen(false); }} />
                <MenuItem icon={Settings} label="Configurações" onClick={() => { navigate("/settings"); setMenuOpen(false); }} />
                <MenuItem icon={HelpCircle} label="Suporte" onClick={() => { navigate("/support"); setMenuOpen(false); }} />

                {user && (
                  <>
                    <div className="border-t border-border my-2" />
                    <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                      <LogOut className="w-5 h-5" />
                      Sair
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>);

};

const MenuItem = ({ icon: Icon, label, active, onClick

}: {icon: any;label: string;active?: boolean;onClick: () => void;}) =>
<button
  onClick={onClick}
  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
  active ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`
  }>
  
    <Icon className="w-5 h-5" />
    {label}
  </button>;


export default Navbar;