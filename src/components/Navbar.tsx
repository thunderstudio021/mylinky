import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Compass, Bell, User, Menu, X, BarChart3, Shield, LogIn } from "lucide-react";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Início" },
    { path: "/explore", icon: Compass, label: "Explorar" },
    { path: "/notifications", icon: Bell, label: "Avisos" },
    { path: "/profile", icon: User, label: "Perfil" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-14 items-center justify-between px-6 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="text-lg font-semibold tracking-tight text-foreground">
          FanVault
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
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
          <Link to="/dashboard">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md">
              <BarChart3 className="w-4 h-4" />
            </button>
          </Link>
          <Link to="/admin">
            <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-md">
              <Shield className="w-4 h-4" />
            </button>
          </Link>
          <Link to="/login">
            <button className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors">
              <LogIn className="w-3.5 h-3.5" />
              Entrar
            </button>
          </Link>
        </div>
      </nav>

      {/* Mobile top */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-12 flex items-center justify-between px-4 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="text-base font-semibold text-foreground">FanVault</Link>
        <button onClick={() => setMobileOpen(!mobileOpen)} className="text-foreground">
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="md:hidden fixed top-12 left-0 right-0 z-40 bg-card border-b border-border p-3 space-y-1"
          >
            {[
              { path: "/dashboard", icon: BarChart3, label: "Painel do Criador" },
              { path: "/admin", icon: Shield, label: "Admin" },
              { path: "/login", icon: LogIn, label: "Entrar" },
            ].map((item) => (
              <Link key={item.path} to={item.path} onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 p-2.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
                <item.icon className="w-4 h-4" /> {item.label}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile bottom */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-t border-border">
        <div className="flex items-center justify-around py-1.5">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 py-1 px-3">
              <item.icon className={`w-5 h-5 ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${isActive(item.path) ? "text-foreground" : "text-muted-foreground"}`}>{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navbar;
