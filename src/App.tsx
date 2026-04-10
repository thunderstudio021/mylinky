import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SiteSettingsProvider } from "@/hooks/useSiteSettings";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { ScreenshotGuard } from "./components/ScreenshotGuard";
import Index from "./pages/Index";
import Explore from "./pages/Explore";
import Search from "./pages/Search";
import CreatorProfile from "./pages/CreatorProfile";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CreatorDashboard from "./pages/CreatorDashboard";
import AdminPanel from "./pages/AdminPanel";
import BecomeCreator from "./pages/BecomeCreator";
import Settings from "./pages/Settings";
import Chat from "./pages/Chat";
import Referral from "./pages/Referral";
import Affiliates from "./pages/Affiliates";
import Subscriptions from "./pages/Subscriptions";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AdminRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAdmin, loading } = useAuth();
  if (loading) return null;
  return isAdmin ? <>{children}</> : <Navigate to="/" replace />;
};

const CreatorRoute = ({ children }: { children: React.ReactNode }) => {
  const { isCreator, isAdmin, loading } = useAuth();
  if (loading) return null;
  return (isCreator || isAdmin) ? <>{children}</> : <Navigate to="/" replace />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <>
    <Navbar />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/explore" element={<Explore />} />
      <Route path="/search" element={<Search />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/become-creator" element={<AuthRoute><BecomeCreator /></AuthRoute>} />
      <Route path="/dashboard" element={<CreatorRoute><CreatorDashboard /></CreatorRoute>} />
      <Route path="/admin-panel" element={<AdminRoute><AdminPanel /></AdminRoute>} />
      <Route path="/chat" element={<AuthRoute><Chat /></AuthRoute>} />
      <Route path="/chat/:userId" element={<AuthRoute><Chat /></AuthRoute>} />
      <Route path="/settings" element={<AuthRoute><Settings /></AuthRoute>} />
      <Route path="/referral" element={<AuthRoute><Referral /></AuthRoute>} />
      <Route path="/affiliates" element={<AuthRoute><Affiliates /></AuthRoute>} />
      <Route path="/subscriptions" element={<AuthRoute><Subscriptions /></AuthRoute>} />
      <Route path="/support" element={<SupportRedirect />} />
      <Route path="/:username" element={<CreatorProfile />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
    <Footer />
  </>
);

const SupportRedirect = () => {
  window.location.href = "https://wa.me/5521966555534";
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <SiteSettingsProvider>
            <AppRoutes />
            <ScreenshotGuard />
          </SiteSettingsProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
