import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, Search, PlusCircle, Bell, User, Menu, X, Flame, Settings, LogOut, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();

  const navItems = [
    { path: "/", icon: Home, label: "Home" },
    { path: "/explore", icon: Search, label: "Explore" },
    { path: "/create", icon: PlusCircle, label: "Create" },
    { path: "/notifications", icon: Bell, label: "Alerts" },
    { path: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* Desktop Top Navbar */}
      <nav className="hidden md:flex fixed top-0 left-0 right-0 z-50 h-16 items-center justify-between px-6 glass border-b border-border/30">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="w-7 h-7 text-primary" />
          <span className="text-xl font-bold text-foreground">FanVault</span>
        </Link>

        <div className="flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`gap-2 transition-all duration-200 ${
                  isActive(item.path)
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </Button>
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/dashboard">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <BarChart3 className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/admin">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="gradient-red text-primary-foreground font-semibold px-5">
              Login
            </Button>
          </Link>
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/30">
        <div className="flex items-center justify-around py-2">
          {navItems.map((item) => (
            <Link key={item.path} to={item.path} className="flex flex-col items-center gap-0.5 py-1 px-3">
              <item.icon className={`w-5 h-5 transition-colors ${isActive(item.path) ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] ${isActive(item.path) ? "text-primary font-medium" : "text-muted-foreground"}`}>
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 glass border-b border-border/30">
        <Link to="/" className="flex items-center gap-2">
          <Flame className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold">FanVault</span>
        </Link>
        <button onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="md:hidden fixed top-14 left-0 right-0 z-40 glass border-b border-border/30 p-4 space-y-2"
          >
            <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
              <BarChart3 className="w-5 h-5 text-muted-foreground" /> <span>Dashboard</span>
            </Link>
            <Link to="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
              <Settings className="w-5 h-5 text-muted-foreground" /> <span>Admin</span>
            </Link>
            <Link to="/login" onClick={() => setMobileOpen(false)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors">
              <LogOut className="w-5 h-5 text-muted-foreground" /> <span>Login</span>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Navbar;
