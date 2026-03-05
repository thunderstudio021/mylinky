import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="w-10 h-10 text-primary" />
            <span className="text-3xl font-bold text-foreground">FanVault</span>
          </div>
          <p className="text-muted-foreground">Sign in to your account</p>
        </div>

        <div className="bg-card border border-border/50 rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-foreground">Email</Label>
            <Input type="email" placeholder="your@email.com" className="bg-secondary border-border focus:border-primary" />
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">Password</Label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                className="bg-secondary border-border focus:border-primary pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <Button className="w-full gradient-red text-primary-foreground font-semibold h-11">
            Sign In
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">Sign Up</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
