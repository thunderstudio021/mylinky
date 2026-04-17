import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import logoImg from "@/assets/logo.png";
import { AppAvatar } from "@/components/AppAvatar";
import { LazyImage } from "@/components/LazyImage";
import {
  Menu, X, LayoutDashboard, Users, FileText, Wallet,
  ChevronRight, Search, CheckCircle, XCircle, Eye, Pencil,
  Trash2, Ban, TrendingUp, Image, Video, UserCheck,
  ArrowLeft, Save, Percent, LogOut, Heart, Gift, UserX, Unlock,
  Settings2, Upload, Palette, Globe, Users2,
  CreditCard, Link2, Plug, RefreshCw, Loader2, FlaskConical,
} from "lucide-react";
import { VerifiedBadge } from "@/components/VerifiedBadge";
import { useSiteSettings, applyPrimaryColor, hexToHsl, hslToHex, SITE_DEFAULTS } from "@/hooks/useSiteSettings";

// ─── Admin Header ───
const AdminHeader = ({ onMenuToggle }: { onMenuToggle: () => void }) => (
  <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 bg-background border-b border-border">
    <img src={logoImg} alt="Logo" className="h-7 dark:invert" />
    <button onClick={onMenuToggle} className="text-foreground p-2 hover:bg-secondary rounded-lg transition-colors">
      <Menu className="w-5 h-5" />
    </button>
  </header>
);

// ─── Sidebar Menu ───
const AdminSidebar = ({
  open, onClose, activeTab, onTabChange, onLogout,
}: {
  open: boolean; onClose: () => void;
  activeTab: string; onTabChange: (t: string) => void;
  onLogout: () => void;
}) => {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "creators", label: "Criadores", icon: UserCheck },
    { id: "users", label: "Usuários", icon: Users },
    { id: "withdrawals", label: "Saques", icon: Wallet },
    { id: "posts", label: "Publicações", icon: FileText },
    { id: "banners", label: "Banners", icon: Image },
    { id: "affiliates-admin", label: "Indicados", icon: Users2 },
    { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
    { id: "configuracoes", label: "Configurações", icon: Settings2 },
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] bg-background/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.25 }}
            className="fixed top-0 right-0 bottom-0 z-[100] w-72 bg-card border-l border-border flex flex-col"
          >
            <div className="h-14 flex items-center justify-between px-4 border-b border-border">
              <span className="text-sm font-semibold text-foreground">Painel Admin</span>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
            </div>
            <nav className="flex-1 p-3 space-y-1">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { onTabChange(t.id); onClose(); }}
                  className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    activeTab === t.id ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                  {activeTab === t.id && <ChevronRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              ))}
            </nav>
            <div className="p-3 border-t border-border">
              <button
                onClick={onLogout}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

// ─── Dashboard Tab ───
const DashboardTab = () => {
  const [stats, setStats] = useState({
    users: 0, creators: 0, posts: 0, photos: 0, videos: 0,
    pendingApps: 0, pendingWithdrawals: 0,
    totalSubscribers: 0, revenueBruto: 0, revenueLiquido: 0,
    giftsTotal: 0, followersTotal: 0,
  });
  const [monthlyData, setMonthlyData] = useState<{ month: string; valor: number }[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStats = useCallback(async () => {
    const [profilesRes, creatorsRes, postsRes, pendingAppsRes, pendingWithdrawalsRes, subsRes, giftsRes, ppvRes, recentRes, followersRes] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id, commission_rate", { count: "exact" }).eq("verified", true),
      supabase.from("posts").select("id, media_type"),
      supabase.from("creator_applications").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("withdrawal_requests").select("id", { count: "exact", head: true }).eq("status", "pending"),
      supabase.from("subscriptions").select("amount, creator_id, status, created_at"),
      supabase.from("gifts").select("amount, creator_id, created_at"),
      supabase.from("ppv_purchases").select("amount, post_id, created_at"),
      supabase.from("profiles").select("id, name, username, avatar_url, created_at, verified").order("created_at", { ascending: false }).limit(5),
      supabase.from("followers").select("id", { count: "exact", head: true }),
    ]);

    const posts = postsRes.data || [];
    const allSubs = subsRes.data || [];
    const activeSubs = allSubs.filter(s => s.status === "active");
    const gifts = giftsRes.data || [];
    const ppvs = ppvRes.data || [];
    const creators = creatorsRes.data || [];

    const commissionMap = new Map<string, number>();
    creators.forEach((c: any) => commissionMap.set(c.id, Number(c.commission_rate ?? 20)));

    const subRevenue = allSubs.reduce((s, r) => s + Number(r.amount), 0);
    const giftRevenue = gifts.reduce((s, r) => s + Number(r.amount), 0);
    const ppvRevenue = ppvs.reduce((s, r) => s + Number(r.amount), 0);
    const revenueBruto = subRevenue + giftRevenue + ppvRevenue;

    const calcPlatformCut = (items: any[], creatorKey: string) =>
      items.reduce((sum, item) => {
        const rate = commissionMap.get(item[creatorKey]) ?? 20;
        return sum + Number(item.amount) * (rate / 100);
      }, 0);

    const revenueLiquido =
      calcPlatformCut(allSubs, "creator_id") +
      calcPlatformCut(gifts, "creator_id") +
      ppvRevenue * 0.20;

    setStats({
      users: profilesRes.count || 0,
      creators: creatorsRes.count || 0,
      posts: posts.length,
      photos: posts.filter(p => p.media_type === "image" || p.media_type === "photo").length,
      videos: posts.filter(p => p.media_type === "video").length,
      pendingApps: pendingAppsRes.count || 0,
      pendingWithdrawals: pendingWithdrawalsRes.count || 0,
      totalSubscribers: activeSubs.length,
      revenueBruto,
      revenueLiquido,
      giftsTotal: gifts.length,
      followersTotal: followersRes.count || 0,
    });

    const allTransactions = [
      ...allSubs.map(s => ({ amount: Number(s.amount), created_at: (s as any).created_at })),
      ...gifts.map(g => ({ amount: Number(g.amount), created_at: (g as any).created_at })),
      ...ppvs.map(p => ({ amount: Number(p.amount), created_at: (p as any).created_at })),
    ];
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    const now = new Date();
    const months: { month: string; valor: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const total = allTransactions
        .filter(t => t.created_at && t.created_at.startsWith(key))
        .reduce((s, t) => s + t.amount, 0);
      months.push({ month: monthNames[d.getMonth()], valor: total });
    }
    setMonthlyData(months);
    setRecentUsers(recentRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);

  useEffect(() => {
    const channel = supabase
      .channel("admin-dashboard-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "subscriptions" }, () => loadStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gifts" }, () => loadStats())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ppv_purchases" }, () => loadStats())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadStats]);

  if (loading) return <LoadingState />;

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Dashboard</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Visão geral da plataforma</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="bg-card border border-border rounded-xl p-5">
          <span className="text-xs text-muted-foreground">Faturamento bruto</span>
          <p className="text-2xl font-bold text-foreground mt-1">R$ {fmt(stats.revenueBruto)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Total de assinaturas + presentes + PPV</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <span className="text-xs text-muted-foreground">Receita da plataforma</span>
          <p className="text-2xl font-bold text-foreground mt-1">R$ {fmt(stats.revenueLiquido)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Comissão individual por criador (~20%)</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <span className="text-xs text-muted-foreground">Assinantes ativos</span>
          <p className="text-2xl font-bold text-foreground mt-1">{stats.totalSubscribers}</p>
          <p className="text-[10px] text-muted-foreground mt-1">Assinaturas com status ativo</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium text-foreground mb-1">Vendas mensais</h3>
        <p className="text-xs text-muted-foreground mb-4">Últimos 6 meses</p>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(0, 0%, 92%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(0, 0%, 92%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 12%)" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(0, 0%, 48%)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(0, 0%, 48%)" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}`} />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 12%)", borderRadius: "8px", fontSize: "12px", color: "hsl(0, 0%, 92%)" }}
                formatter={(value: number) => [`R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, "Vendas"]}
                labelStyle={{ color: "hsl(0, 0%, 48%)" }}
              />
              <Area type="monotone" dataKey="valor" stroke="hsl(0, 0%, 92%)" strokeWidth={2} fill="url(#revenueGradient)" dot={{ r: 3, fill: "hsl(0, 0%, 92%)", strokeWidth: 0 }} activeDot={{ r: 5, fill: "hsl(0, 0%, 92%)", strokeWidth: 0 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard label="Usuários" value={stats.users} icon={Users} />
        <MetricCard label="Criadores" value={stats.creators} icon={UserCheck} />
        <MetricCard label="Seguidores" value={stats.followersTotal} icon={Heart} />
        <MetricCard label="Presentes" value={stats.giftsTotal} icon={Gift} />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCardSmall label="Publicações" value={stats.posts} />
        <MetricCardSmall label="Fotos" value={stats.photos} />
        <MetricCardSmall label="Vídeos" value={stats.videos} />
      </div>

      {(stats.pendingApps > 0 || stats.pendingWithdrawals > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {stats.pendingApps > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><UserCheck className="w-4 h-4 text-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">{stats.pendingApps} solicitação(ões) pendente(s)</p>
                <p className="text-xs text-muted-foreground">Criadores aguardando aprovação</p>
              </div>
            </div>
          )}
          {stats.pendingWithdrawals > 0 && (
            <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"><Wallet className="w-4 h-4 text-foreground" /></div>
              <div>
                <p className="text-sm font-medium text-foreground">{stats.pendingWithdrawals} saque(s) pendente(s)</p>
                <p className="text-xs text-muted-foreground">Aguardando análise</p>
              </div>
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">Últimos cadastros</h3>
        <div className="bg-card border border-border rounded-xl divide-y divide-border">
          {recentUsers.map(u => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3 min-w-0">
                <AppAvatar src={u.avatar_url} name={u.name ?? "U"} className="w-8 h-8 shrink-0" sizePx={64} textClassName="text-xs" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">@{u.username}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {u.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value, icon: Icon }: { label: string; value: string | number; icon: any }) => (
  <div className="bg-card border border-border rounded-xl p-4 group">
    <div className="flex items-center justify-between mb-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center"><Icon className="w-3.5 h-3.5 text-foreground" /></div>
    </div>
    <p className="text-2xl font-bold text-foreground tracking-tight">{value}</p>
  </div>
);

const MetricCardSmall = ({ label, value }: { label: string; value: string | number }) => (
  <div className="bg-card border border-border rounded-xl p-3 text-center">
    <p className="text-lg font-semibold text-foreground">{value}</p>
    <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
  </div>
);

// ─── Creators Tab (with application review detail) ───
const CreatorsTab = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [reviewing, setReviewing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);
  const [signedUrls, setSignedUrls] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    const { data: apps } = await supabase.from("creator_applications").select("*").order("created_at", { ascending: true });
    const appMap = new Map((apps || []).map(a => [a.user_id, a]));
    const allProfiles = profiles || [];
    const creatorsWithApps = allProfiles
      .filter(p => (p as any).is_creator || p.verified || appMap.has(p.id))
      .map(p => ({ ...p, application: appMap.get(p.id) || null }))
      .sort((a, b) => {
        const aPending = a.application?.status === "pending" ? 0 : 1;
        const bPending = b.application?.status === "pending" ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    setCreators(creatorsWithApps);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadSignedUrl = async (path: string) => {
    if (!path || signedUrls[path]) return;
    const { data } = await supabase.storage.from("documents").createSignedUrl(path, 600);
    if (data?.signedUrl) setSignedUrls(prev => ({ ...prev, [path]: data.signedUrl }));
  };

  const openReview = async (creator: any) => {
    setReviewing(creator);
    const app = creator.application;
    if (app) {
      await Promise.all([
        loadSignedUrl(app.document_front_url),
        loadSignedUrl(app.document_back_url),
        loadSignedUrl(app.selfie_url),
      ]);
    }
  };

  const handleApprove = async (appId: string) => {
    const { error } = await supabase.rpc("approve_creator", { _application_id: appId });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Criador aprovado!");
    setReviewing(null);
    load();
  };

  const handleReject = async (appId: string) => {
    const { error } = await supabase.rpc("reject_creator", { _application_id: appId });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Solicitação rejeitada");
    setReviewing(null);
    load();
  };

  const handleBlock = async (profileId: string, blocked: boolean) => {
    const { error } = await supabase.from("profiles").update({ blocked }).eq("id", profileId);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(blocked ? "Criador bloqueado" : "Criador desbloqueado");
    load();
  };

  const handleDelete = async (profileId: string) => {
    if (!confirm("Tem certeza que deseja excluir este criador? Esta ação não pode ser desfeita.")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", profileId);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Criador excluído");
    load();
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: editing.name, username: editing.username, email: editing.email,
      verified: editing.verified, commission_rate: editing.commission_rate,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Perfil atualizado!");
    setEditing(null);
    load();
  };

  const filtered = creators.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState />;

  // Application review detail page
  if (reviewing) {
    const app = reviewing.application;
    const formatCpf = (v: string) => {
      if (!v) return "";
      const d = v.replace(/\D/g, "");
      if (d.length !== 11) return v;
      return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9)}`;
    };
    const formatPhone = (v: string) => {
      if (!v) return "";
      const d = v.replace(/\D/g, "");
      if (d.length < 10) return v;
      return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    };

    return (
      <div>
        <button onClick={() => setReviewing(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-card border border-border rounded-xl p-5 max-w-2xl space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Análise de Solicitação</h2>

          {/* Personal Info */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dados Pessoais</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <InfoField label="Nome completo" value={app?.full_name || reviewing.name} />
              <InfoField label="CPF" value={formatCpf(app?.cpf || "")} />
              <InfoField label="Telefone" value={formatPhone(app?.phone || "")} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoField label="Email" value={reviewing.email} />
              <InfoField label="Username" value={`@${reviewing.username}`} />
            </div>
          </div>

          {/* Profile Photos */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Fotos do Perfil</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Foto de Perfil</label>
                <AppAvatar src={app?.avatar_url || reviewing.avatar_url} name={reviewing.name ?? "?"} className="w-24 h-24 border border-border" sizePx={192} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Foto de Capa</label>
                <div className="h-24 rounded-lg bg-secondary overflow-hidden border border-border">
                  {(app?.cover_url || reviewing.cover_url) ? (
                    <LazyImage src={app?.cover_url || reviewing.cover_url} alt="" className="w-full h-full object-cover" width={600} />
                  ) : <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Sem foto</div>}
                </div>
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-2">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Documentos de Verificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <DocImage label="Documento (Frente)" url={signedUrls[app?.document_front_url || ""] || ""} />
              <DocImage label="Documento (Verso)" url={signedUrls[app?.document_back_url || ""] || ""} />
              <DocImage label="Selfie com Documento" url={signedUrls[app?.selfie_url || ""] || ""} />
            </div>
          </div>

          {/* Actions */}
          {app?.status === "pending" && (
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => handleApprove(app.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Aprovar Criador
              </button>
              <button
                onClick={() => handleReject(app.id)}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Rejeitar
              </button>
            </div>
          )}
          {app?.status && app.status !== "pending" && (
            <div className={`text-sm font-medium px-3 py-2 rounded-lg ${
              app.status === "approved" ? "bg-emerald-500/10 text-emerald-400" : "bg-destructive/10 text-destructive"
            }`}>
              {app.status === "approved" ? "✓ Aprovado" : "✗ Rejeitado"}
              {app.reviewed_at && ` em ${new Date(app.reviewed_at).toLocaleDateString("pt-BR")}`}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Edit view
  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <AppAvatar src={editing.avatar_url} name={editing.name ?? "?"} className="w-12 h-12" sizePx={96} />
            <div>
              <p className="text-sm font-semibold text-foreground">{editing.name}</p>
              <p className="text-xs text-muted-foreground">@{editing.username}</p>
            </div>
          </div>
          <EditField label="Nome" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
          <EditField label="Usuário (@)" value={editing.username} onChange={v => setEditing({ ...editing, username: v })} />
          <EditField label="Email" value={editing.email} onChange={v => setEditing({ ...editing, email: v })} />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Comissão da plataforma (%)</label>
            <div className="flex items-center gap-2">
              <input type="number" min={0} max={100} value={editing.commission_rate ?? 20}
                onChange={e => setEditing({ ...editing, commission_rate: Number(e.target.value) })}
                className="w-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" />
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Verificado</label>
            <button onClick={() => setEditing({ ...editing, verified: !editing.verified })}
              className={`w-10 h-5 rounded-full transition-colors relative ${editing.verified ? "bg-emerald-500" : "bg-secondary"}`}>
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${editing.verified ? "left-5" : "left-0.5"}`} />
            </button>
          </div>
          <button onClick={handleSaveEdit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Criadores</h2>
        <span className="text-xs text-muted-foreground">{creators.length} total</span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Pesquisar criador..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? <EmptyState text="Nenhum criador encontrado" /> : filtered.map(c => (
          <div key={c.id} className={`bg-card border rounded-xl p-4 ${c.blocked ? "border-destructive/30" : "border-border"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0 cursor-pointer" onClick={() => c.application ? openReview(c) : null}>
                <AppAvatar src={c.avatar_url} name={c.name ?? "?"} className="w-10 h-10 shrink-0" sizePx={80} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                    {c.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                    {c.blocked && <Ban className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{c.username} · {c.email}</p>
                  <p className="text-xs text-muted-foreground">Comissão: {c.commission_rate ?? 20}%</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 flex-wrap justify-end">
                {c.application?.status === "pending" && (
                  <button onClick={() => openReview(c)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-lg hover:bg-amber-500/20 transition-colors">
                    <Eye className="w-3 h-3" /> Analisar
                  </button>
                )}
                <button onClick={() => setEditing(c)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleBlock(c.id, !c.blocked)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title={c.blocked ? "Desbloquear" : "Bloquear"}>
                  {c.blocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(c.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Users Tab ───
const UsersTab = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    setUsers(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleBlock = async (id: string, blocked: boolean) => {
    const { error } = await supabase.from("profiles").update({ blocked }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(blocked ? "Usuário bloqueado" : "Usuário desbloqueado");
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este usuário?")) return;
    const { error } = await supabase.from("profiles").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Usuário excluído");
    load();
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase.from("profiles").update({
      name: editing.name, username: editing.username, email: editing.email, bio: editing.bio,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Usuário atualizado!");
    setEditing(null);
    load();
  };

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState />;

  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <AppAvatar src={editing.avatar_url} name={editing.name ?? "?"} className="w-12 h-12" sizePx={96} />
            <div>
              <p className="text-sm font-semibold text-foreground">{editing.name}</p>
              <p className="text-xs text-muted-foreground">@{editing.username}</p>
            </div>
          </div>
          <EditField label="Nome" value={editing.name} onChange={v => setEditing({ ...editing, name: v })} />
          <EditField label="Usuário (@)" value={editing.username} onChange={v => setEditing({ ...editing, username: v })} />
          <EditField label="Email" value={editing.email} onChange={v => setEditing({ ...editing, email: v })} />
          <EditField label="Bio" value={editing.bio || ""} onChange={v => setEditing({ ...editing, bio: v })} />
          <button onClick={handleSaveEdit} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50">
            <Save className="w-3.5 h-3.5" /> {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Usuários</h2>
        <span className="text-xs text-muted-foreground">{users.length} total</span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Pesquisar usuário..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? <EmptyState text="Nenhum usuário encontrado" /> : filtered.map(u => (
          <div key={u.id} className={`bg-card border rounded-xl p-4 ${u.blocked ? "border-destructive/30" : "border-border"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <AppAvatar src={u.avatar_url} name={u.name ?? "?"} className="w-10 h-10 shrink-0" sizePx={80} />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                    {u.is_creator && <UserCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    {u.verified && <VerifiedBadge className="w-3.5 h-3.5" />}
                    {u.blocked && <Ban className="w-3.5 h-3.5 text-destructive shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">@{u.username} · {u.email}</p>
                  <p className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditing(u)} className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleBlock(u.id, !u.blocked)}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors" title={u.blocked ? "Desbloquear" : "Bloquear"}>
                  {u.blocked ? <Unlock className="w-3.5 h-3.5" /> : <Ban className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(u.id)}
                  className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Withdrawals Tab ───
const WithdrawalsTab = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusTab, setStatusTab] = useState<"pending" | "approved" | "rejected">("pending");
  const [typeFilter, setTypeFilter] = useState<"all" | "creator" | "referral">("all");

  const load = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("withdrawal_requests").select("*").eq("status", statusTab).order("created_at", { ascending: false });
    if (typeFilter === "creator") query = (query as any).or("requester_type.eq.creator,requester_type.is.null");
    if (typeFilter === "referral") query = (query as any).eq("requester_type", "referral");
    const { data } = await query;
    const reqs = data || [];
    const enriched = await Promise.all(
      reqs.map(async (r) => {
        const userId = r.creator_id;
        const { data: profile } = await supabase.from("profiles").select("name, username, avatar_url").eq("id", userId).single();
        return { ...r, profile };
      })
    );
    setRequests(enriched);
    setLoading(false);
  }, [statusTab, typeFilter]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, status: string) => {
    const { error } = await supabase.from("withdrawal_requests").update({ status, reviewed_at: new Date().toISOString() }).eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(status === "approved" ? "Saque aprovado!" : "Saque rejeitado");
    load();
  };

  const statusTabs = [
    { value: "pending" as const, label: "Pendentes" },
    { value: "approved" as const, label: "Aprovados" },
    { value: "rejected" as const, label: "Rejeitados" },
  ];

  const typeFilters = [
    { value: "all" as const, label: "Todos" },
    { value: "creator" as const, label: "Criadores" },
    { value: "referral" as const, label: "Indicações" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Solicitações de Saque</h2>
      <div className="flex gap-1 mb-3">
        {statusTabs.map(t => (
          <button key={t.value} onClick={() => setStatusTab(t.value)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${statusTab === t.value ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex gap-1 mb-4">
        {typeFilters.map(t => (
          <button key={t.value} onClick={() => setTypeFilter(t.value)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${typeFilter === t.value ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:text-foreground"}`}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? <LoadingState /> : requests.length === 0 ? (
        <EmptyState text={`Nenhum saque ${statusTab === "pending" ? "pendente" : statusTab === "approved" ? "aprovado" : "rejeitado"}`} />
      ) : (
        <div className="space-y-2">
          {requests.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <AppAvatar src={r.profile?.avatar_url} name={r.profile?.name ?? "?"} className="w-9 h-9 shrink-0" sizePx={72} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">{r.profile?.name}</p>
                      {r.requester_type === "referral" && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary shrink-0">Indicação</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">R$ {Number(r.amount).toFixed(2)} · {r.bank_name}</p>
                    <p className="text-xs text-muted-foreground">PIX: {r.pix_key} · {r.pix_key_holder_name}</p>
                  </div>
                </div>
                {statusTab === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleUpdate(r.id, "approved")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors">
                      <CheckCircle className="w-3 h-3" /> Aprovar
                    </button>
                    <button onClick={() => handleUpdate(r.id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors">
                      <XCircle className="w-3 h-3" /> Rejeitar
                    </button>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Solicitado em {new Date(r.created_at).toLocaleDateString("pt-BR")}
                {r.reviewed_at && ` · Revisado em ${new Date(r.reviewed_at).toLocaleDateString("pt-BR")}`}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Posts Tab ───
const PostsTab = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("posts").select("*").order("created_at", { ascending: false });
    const allPosts = data || [];
    const creatorIds = [...new Set(allPosts.map(p => p.creator_id))];
    const { data: profiles } = await supabase.from("profiles").select("id, name, username, avatar_url").in("id", creatorIds);
    const profileMap = new Map((profiles || []).map(p => [p.id, p]));
    setPosts(allPosts.map(p => ({ ...p, creator: profileMap.get(p.creator_id) })));
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta publicação?")) return;
    const { error } = await supabase.from("posts").delete().eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Publicação excluída");
    load();
  };

  const filtered = posts.filter(p =>
    !search || p.content?.toLowerCase().includes(search.toLowerCase()) ||
    p.creator?.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.creator?.username?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState />;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Publicações</h2>
        <span className="text-xs text-muted-foreground">{posts.length} total</span>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input type="text" placeholder="Pesquisar publicação..." value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <div className="space-y-2">
        {filtered.length === 0 ? <EmptyState text="Nenhuma publicação encontrada" /> : filtered.map(p => (
          <div key={p.id} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <AppAvatar src={p.creator?.avatar_url} name={p.creator?.name ?? "?"} className="w-8 h-8 shrink-0" sizePx={64} textClassName="text-xs" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs font-medium text-foreground">{p.creator?.name}</p>
                    <span className="text-xs text-muted-foreground">@{p.creator?.username}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      p.post_visibility === "free" ? "bg-secondary text-muted-foreground" :
                      p.post_visibility === "subscribers" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"
                    }`}>
                      {p.post_visibility === "free" ? "Público" : p.post_visibility === "subscribers" ? "Assinantes" : "PPV"}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/80 line-clamp-2">{p.content || "(sem texto)"}</p>
                  {p.media_url && (
                    <div className="flex items-center gap-1 mt-1">
                      {p.media_type === "image" ? <Image className="w-3 h-3 text-muted-foreground" /> : <Video className="w-3 h-3 text-muted-foreground" />}
                      <span className="text-xs text-muted-foreground">{p.media_type === "image" ? "Foto" : "Vídeo"}</span>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
              </div>
              <button onClick={() => handleDelete(p.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors shrink-0" title="Excluir">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Shared Components ───
const LoadingState = () => (
  <div className="flex items-center justify-center py-16">
    <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <p className="text-sm text-muted-foreground text-center py-12">{text}</p>
);

const EditField = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    <input type="text" value={value || ""} onChange={e => onChange(e.target.value)}
      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring" />
  </div>
);

const InfoField = ({ label, value }: { label: string; value: string }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-0.5 block">{label}</label>
    <p className="text-sm text-foreground bg-secondary border border-border rounded-lg px-3 py-2">{value || "—"}</p>
  </div>
);

const DocImage = ({ label, url }: { label: string; url: string }) => (
  <div>
    <label className="text-xs text-muted-foreground mb-1 block">{label}</label>
    <div className="h-36 rounded-lg bg-secondary border border-border overflow-hidden">
      {url ? (
        <a href={url} target="_blank" rel="noopener noreferrer">
          <LazyImage src={url} alt={label} className="w-full h-full object-cover hover:opacity-80 transition-opacity" width={400} />
        </a>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs">Carregando...</div>
      )}
    </div>
  </div>
);

// ─── Banners Tab ───
const BannersTab = () => {
  const [banners, setBanners] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [linkUrl, setLinkUrl] = useState("");
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("banners").select("*").order("position", { ascending: true });
    setBanners(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async () => {
    if (!imageFile) { toast.error("Selecione uma imagem"); return; }
    setUploading(true);
    const ext = imageFile.name.split(".").pop();
    const path = `banners/${Date.now()}.${ext}`;
    const { error: upErr } = await supabase.storage.from("media").upload(path, imageFile);
    if (upErr) { toast.error("Erro ao enviar imagem"); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("media").getPublicUrl(path);
    const maxPos = banners.length > 0 ? Math.max(...banners.map(b => b.position)) + 1 : 0;
    const { error } = await supabase.from("banners").insert({ image_url: urlData.publicUrl, link_url: linkUrl, position: maxPos });
    if (error) { toast.error("Erro ao criar banner"); } else { toast.success("Banner criado!"); setImageFile(null); setLinkUrl(""); load(); }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("banners").delete().eq("id", id);
    toast.success("Banner removido");
    load();
  };

  const handleMove = async (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= banners.length) return;
    const a = banners[index];
    const b = banners[target];
    await Promise.all([
      supabase.from("banners").update({ position: b.position }).eq("id", a.id),
      supabase.from("banners").update({ position: a.position }).eq("id", b.id),
    ]);
    load();
  };

  const toggleActive = async (id: string, active: boolean) => {
    await supabase.from("banners").update({ active: !active }).eq("id", id);
    load();
  };

  if (loading) return <LoadingState />;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Banners</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Gerencie os banners do carrossel do feed</p>
      </div>

      {/* Create banner */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-foreground">Novo banner</h3>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Imagem do banner</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-secondary file:text-foreground hover:file:bg-secondary/80"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Link de redirecionamento</label>
          <input
            type="url"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://exemplo.com"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
        <button
          onClick={handleCreate}
          disabled={uploading || !imageFile}
          className="px-4 py-2 rounded-lg text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {uploading ? "Enviando..." : "Salvar banner"}
        </button>
      </div>

      {/* Banner list */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-foreground">Banners ativos ({banners.length})</h3>
        {banners.length === 0 && <p className="text-xs text-muted-foreground">Nenhum banner cadastrado.</p>}
        {banners.map((b, i) => (
          <div key={b.id} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className="w-28 h-16 rounded-lg overflow-hidden bg-secondary shrink-0">
              <LazyImage src={b.image_url} alt="Banner" className="w-full h-full object-cover" width={224} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground truncate">{b.link_url || "Sem link"}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Posição: {i + 1}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => handleMove(i, -1)} disabled={i === 0}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30">
                <ChevronRight className="w-4 h-4 rotate-[-90deg]" />
              </button>
              <button onClick={() => handleMove(i, 1)} disabled={i === banners.length - 1}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors disabled:opacity-30">
                <ChevronRight className="w-4 h-4 rotate-90" />
              </button>
              <button onClick={() => toggleActive(b.id, b.active)}
                className={`p-1.5 rounded-lg transition-colors ${b.active ? "text-foreground hover:bg-secondary" : "text-muted-foreground hover:bg-secondary"}`}>
                <Eye className="w-4 h-4" />
              </button>
              <button onClick={() => handleDelete(b.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-secondary transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Indicados Admin Tab ────────────────────────────────────────────────────
interface ReferrerRow {
  referrer_id: string;
  referrer_name: string;
  referrer_username: string;
  referrer_avatar: string | null;
  referred: {
    id: string;
    name: string;
    username: string;
    avatar_url: string | null;
    is_creator: boolean;
    commission_rate: number;
    rel_id: string;
  }[];
  totalEarnings: number;
}

const AffiliatesAdminTab = () => {
  const [rows, setRows] = useState<ReferrerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  // Add link modal
  const [addModal, setAddModal] = useState<{ referrerId: string } | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [addResults, setAddResults] = useState<any[]>([]);
  const [addCommission, setAddCommission] = useState(10);
  // Edit commission inline
  const [editComm, setEditComm] = useState<{ relId: string; value: number } | null>(null);

  const fmt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const load = useCallback(async () => {
    setLoading(true);
    // 1. load all referral_relationships
    const { data: rels } = await (supabase as any)
      .from("referral_relationships")
      .select("id, referrer_id, referred_id, commission_rate, created_at")
      .order("created_at", { ascending: false });
    if (!rels || rels.length === 0) { setLoading(false); setRows([]); return; }

    const allIds = [...new Set([...rels.map((r: any) => r.referrer_id), ...rels.map((r: any) => r.referred_id)])];
    const { data: profiles } = await supabase.from("profiles").select("id, name, username, avatar_url, is_creator").in("id", allIds);
    const pMap = new Map((profiles || []).map((p: any) => [p.id, p]));

    // 2. load subscriptions for referred creators
    const creatorIds = (profiles || []).filter((p: any) => p.is_creator).map((p: any) => p.id);
    let subsMap = new Map<string, number>();
    if (creatorIds.length > 0) {
      const { data: subs } = await supabase.from("subscriptions").select("creator_id, amount").in("creator_id", creatorIds).eq("status", "active");
      (subs || []).forEach((s: any) => {
        subsMap.set(s.creator_id, (subsMap.get(s.creator_id) ?? 0) + Number(s.amount));
      });
    }

    // 3. group by referrer
    const grouped = new Map<string, ReferrerRow>();
    rels.forEach((rel: any) => {
      const referrer = pMap.get(rel.referrer_id);
      if (!referrer) return;
      if (!grouped.has(rel.referrer_id)) {
        grouped.set(rel.referrer_id, {
          referrer_id: rel.referrer_id,
          referrer_name: referrer.name,
          referrer_username: referrer.username,
          referrer_avatar: referrer.avatar_url,
          referred: [],
          totalEarnings: 0,
        });
      }
      const row = grouped.get(rel.referrer_id)!;
      const referred = pMap.get(rel.referred_id);
      if (referred) {
        const creatorRevenue = subsMap.get(referred.id) ?? 0;
        const earnings = creatorRevenue * (rel.commission_rate / 100);
        row.totalEarnings += earnings;
        row.referred.push({
          id: referred.id,
          name: referred.name,
          username: referred.username,
          avatar_url: referred.avatar_url,
          is_creator: referred.is_creator,
          commission_rate: rel.commission_rate,
          rel_id: rel.id,
        });
      }
    });
    setRows([...grouped.values()]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleRemoveLink = async (relId: string) => {
    await (supabase as any).from("referral_relationships").delete().eq("id", relId);
    toast.success("Vínculo removido");
    load();
  };

  const handleEditCommission = async (relId: string, rate: number) => {
    await (supabase as any).from("referral_relationships").update({ commission_rate: rate }).eq("id", relId);
    toast.success("Comissão atualizada");
    setEditComm(null);
    load();
  };

  const handleAddSearch = async (q: string) => {
    setAddSearch(q);
    if (q.length < 2) { setAddResults([]); return; }
    const { data } = await supabase.from("profiles").select("id, name, username, avatar_url").ilike("name", `%${q}%`).limit(6);
    setAddResults(data || []);
  };

  const handleAddLink = async (referrerId: string, referredId: string) => {
    if (referrerId === referredId) { toast.error("Não é possível vincular ao mesmo usuário"); return; }
    await (supabase as any).from("referral_relationships").insert({
      referrer_id: referrerId,
      referred_id: referredId,
      commission_rate: addCommission,
    });
    toast.success("Vínculo adicionado");
    setAddModal(null);
    setAddSearch("");
    setAddResults([]);
    load();
  };

  const filtered = rows.filter(r =>
    !search || r.referrer_name.toLowerCase().includes(search.toLowerCase()) || r.referrer_username.toLowerCase().includes(search.toLowerCase())
  );

  const totalRefs = rows.reduce((acc, r) => acc + r.referred.length, 0);
  const totalCreators = rows.reduce((acc, r) => acc + r.referred.filter(x => x.is_creator).length, 0);
  const totalComm = rows.reduce((acc, r) => acc + r.totalEarnings, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Indicados</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Gerencie vínculos de indicação, comissões e acompanhe ganhos</p>
      </div>

      {loading ? <LoadingState /> : (
        <>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Indicadores", value: String(rows.length) },
              { label: "Indicados totais", value: String(totalRefs) },
              { label: "Criadores ativos", value: String(totalCreators) },
            ].map(s => (
              <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{s.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-card border border-border rounded-xl p-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Comissão total gerada</p>
            <p className="text-lg font-bold text-primary">R$ {fmt(totalComm)}</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar indicador..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
            />
          </div>

          {filtered.length === 0 ? (
            <EmptyState text="Nenhum indicador encontrado" />
          ) : (
            <div className="space-y-2">
              {filtered.map(row => (
                <div key={row.referrer_id} className="bg-card border border-border rounded-xl overflow-hidden">
                  {/* Referrer header */}
                  <div
                    className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-secondary/30 transition-colors"
                    onClick={() => setExpanded(expanded === row.referrer_id ? null : row.referrer_id)}
                  >
                    <AppAvatar src={row.referrer_avatar} name={row.referrer_name} className="w-9 h-9 shrink-0" sizePx={72} textClassName="text-xs" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{row.referrer_name}</p>
                      <p className="text-xs text-muted-foreground">@{row.referrer_username} · {row.referred.length} indicado{row.referred.length !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-primary">R$ {fmt(row.totalEarnings)}</p>
                      <p className="text-[10px] text-muted-foreground">comissão</p>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setAddModal({ referrerId: row.referrer_id }); }}
                      className="shrink-0 text-xs px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                    >
                      + Adicionar
                    </button>
                  </div>

                  {/* Referred users list */}
                  {expanded === row.referrer_id && (
                    <div className="border-t border-border divide-y divide-border">
                      {row.referred.map(ref => (
                        <div key={ref.id} className="flex items-center gap-3 px-4 py-2.5">
                          <AppAvatar src={ref.avatar_url} name={ref.name} className="w-8 h-8 shrink-0" sizePx={64} textClassName="text-xs" />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-foreground truncate">{ref.name}</p>
                            <p className="text-[10px] text-muted-foreground">@{ref.username}</p>
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0 ${ref.is_creator ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                            {ref.is_creator ? "Criador" : "Usuário"}
                          </span>
                          {/* Commission edit */}
                          {editComm?.relId === ref.rel_id ? (
                            <div className="flex items-center gap-1 shrink-0">
                              <input
                                type="number"
                                min={0}
                                max={50}
                                value={editComm.value}
                                onChange={e => setEditComm({ relId: ref.rel_id, value: Number(e.target.value) })}
                                className="w-14 px-2 py-1 text-xs bg-secondary border border-border rounded text-foreground focus:outline-none"
                              />
                              <span className="text-xs text-muted-foreground">%</span>
                              <button onClick={() => handleEditCommission(ref.rel_id, editComm.value)}
                                className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors">
                                OK
                              </button>
                              <button onClick={() => setEditComm(null)} className="text-xs px-2 py-1 bg-secondary text-foreground rounded hover:bg-secondary/80 transition-colors">✕</button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setEditComm({ relId: ref.rel_id, value: ref.commission_rate })}
                              className="shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {ref.commission_rate}%
                            </button>
                          )}
                          <button
                            onClick={() => handleRemoveLink(ref.rel_id)}
                            className="shrink-0 p-1.5 text-muted-foreground hover:text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
                            title="Remover vínculo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Link Modal */}
      {addModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={() => { setAddModal(null); setAddSearch(""); setAddResults([]); }}>
          <div className="bg-card border border-border rounded-xl p-5 w-full max-w-sm space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-foreground">Adicionar vínculo de indicação</h3>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Comissão (%)</label>
              <input
                type="number"
                min={0}
                max={50}
                value={addCommission}
                onChange={e => setAddCommission(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Buscar usuário indicado</label>
              <input
                value={addSearch}
                onChange={e => handleAddSearch(e.target.value)}
                placeholder="Nome do usuário..."
                className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
              {addResults.length > 0 && (
                <div className="mt-2 bg-secondary border border-border rounded-lg overflow-hidden divide-y divide-border">
                  {addResults.map(u => (
                    <button
                      key={u.id}
                      onClick={() => handleAddLink(addModal.referrerId, u.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-card/50 transition-colors text-left"
                    >
                      <AppAvatar src={u.avatar_url} name={u.name} className="w-7 h-7 shrink-0" sizePx={56} textClassName="text-[10px]" />
                      <div>
                        <p className="text-xs font-medium text-foreground">{u.name}</p>
                        <p className="text-[10px] text-muted-foreground">@{u.username}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => { setAddModal(null); setAddSearch(""); setAddResults([]); }}
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Configurações Tab ────────────────────────────────────────────────────────
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
  </svg>
);

const ConfiguracoesTab = () => {
  const { settings, refresh } = useSiteSettings();
  const [form, setForm] = useState({ ...SITE_DEFAULTS });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setForm({ ...SITE_DEFAULTS, ...settings }); }, [settings]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `logo/logo.${ext}`;
    await supabase.storage.from("media").remove([path]);
    const { error } = await supabase.storage.from("media").upload(path, file, { upsert: true });
    if (error) { toast.error("Erro ao enviar logo"); setUploading(false); return; }
    const { data } = supabase.storage.from("media").getPublicUrl(path);
    set("logo_url", data.publicUrl + `?t=${Date.now()}`);
    setUploading(false);
    toast.success("Logo enviada!");
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await (supabase as any)
        .from("site_settings")
        .upsert({ id: (settings as any).id, ...form }, { onConflict: "id" });
      if (error) throw error;
      applyPrimaryColor(form.primary_color_light, form.primary_color_dark);
      refresh();
      toast.success("Configurações salvas!");
    } catch (err: any) {
      toast.error(err.message?.includes("does not exist")
        ? "Execute o SQL de migração no Supabase primeiro."
        : err.message || "Erro ao salvar");
    }
    setSaving(false);
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any; title: string }) => (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-muted-foreground" />
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Configurações do Site</h2>
        <p className="text-xs text-muted-foreground mt-0.5">Personalize logo, cores e redes sociais da plataforma</p>
      </div>

      {/* ── Logo ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionTitle icon={Upload} title="Logotipo" />
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-secondary border border-border flex items-center justify-center overflow-hidden shrink-0">
            {form.logo_url
              ? <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain p-2 dark:invert" />
              : <span className="text-xs text-muted-foreground">Sem logo</span>
            }
          </div>
          <div className="space-y-2">
            <input ref={logoInputRef} type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            <button
              onClick={() => logoInputRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-secondary border border-border rounded-lg hover:bg-secondary/70 transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              {uploading ? "Enviando..." : "Escolher imagem"}
            </button>
            <p className="text-xs text-muted-foreground">PNG ou SVG recomendado. Fundo transparente.</p>
          </div>
        </div>
      </div>

      {/* ── Cores Primárias ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionTitle icon={Palette} title="Cor Primária" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { label: "Modo Claro", key: "primary_color_light" },
            { label: "Modo Escuro", key: "primary_color_dark" },
          ].map(({ label, key }) => {
            const hsl = (form as any)[key] as string;
            const hex = hslToHex(hsl);
            return (
              <div key={key}>
                <label className="text-xs text-muted-foreground mb-2 block">{label}</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={hex}
                    onChange={e => {
                      const newHsl = hexToHsl(e.target.value);
                      set(key, newHsl);
                      applyPrimaryColor(
                        key === "primary_color_light" ? newHsl : form.primary_color_light,
                        key === "primary_color_dark" ? newHsl : form.primary_color_dark,
                      );
                    }}
                    className="w-10 h-10 rounded-lg border border-border cursor-pointer bg-transparent p-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{hex}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{hsl}</p>
                  </div>
                  <div className="ml-auto w-8 h-8 rounded-full border border-border" style={{ backgroundColor: hex }} />
                </div>
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">A cor é aplicada em botões, links e destaques do sistema.</p>
      </div>

      {/* ── Redes Sociais ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionTitle icon={Globe} title="Redes Sociais" />
        <p className="text-xs text-muted-foreground mb-4">Links exibidos no footer. Deixe em branco para ocultar o ícone.</p>
        <div className="space-y-3">
          {[
            { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/seuperfil" },
            { key: "tiktok_url", label: "TikTok", placeholder: "https://tiktok.com/@seuperfil" },
            { key: "twitter_url", label: "Twitter / X", placeholder: "https://twitter.com/seuperfil" },
            { key: "facebook_url", label: "Facebook", placeholder: "https://facebook.com/seuperfil" },
            { key: "youtube_url", label: "YouTube", placeholder: "https://youtube.com/@seucanal" },
            { key: "whatsapp_url", label: "WhatsApp", placeholder: "https://wa.me/5511999999999" },
          ].map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{label}</span>
              <input
                type="url"
                value={(form as any)[key]}
                onChange={e => set(key, e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/30"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Texto do Footer ── */}
      <div className="bg-card border border-border rounded-xl p-5">
        <SectionTitle icon={FileText} title="Texto do Rodapé" />
        <input
          type="text"
          value={form.footer_text}
          onChange={e => set("footer_text", e.target.value)}
          placeholder={`© ${new Date().getFullYear()} Todos os direitos reservados.`}
          className="w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-muted-foreground/30"
        />
      </div>

      {/* ── Salvar ── */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
      >
        <Save className="w-4 h-4" />
        {saving ? "Salvando..." : "Salvar configurações"}
      </button>
    </div>
  );
};

// ─── Pagamentos Tab ───
const PagamentosTab = () => {
  const { settings, refresh: refreshSettings } = useSiteSettings();
  const [mp, setMp] = useState({ enabled: false, access_token: "", public_key: "" });
  const [appmax, setAppmax] = useState({
    enabled: false, api_key: "", app_id: "", app_id_numeric: "",
    client_id: "", client_secret: "", is_sandbox: false,
    copied_webhook: false, generating: false,
    merchant_client_id: "", installation_complete: false,
    installing: false, generating_creds: false,
    install_browser_url: "", install_hash: "",
  });
  const [saving, setSaving] = useState<"mp" | "appmax" | "testmode" | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    (supabase as any).from("payment_gateways").select("*").then(({ data }: any) => {
      if (!data) return;
      const mpRow = data.find((r: any) => r.gateway === "mercadopago");
      const amRow = data.find((r: any) => r.gateway === "appmax");
      if (mpRow) setMp({ enabled: mpRow.enabled, access_token: mpRow.credentials?.access_token ?? "", public_key: mpRow.credentials?.public_key ?? "" });
      if (amRow) setAppmax(p => ({
        ...p,
        enabled: amRow.enabled,
        api_key: amRow.credentials?.api_key ?? "",
        app_id: amRow.credentials?.app_id ?? "",
        app_id_numeric: amRow.credentials?.app_id_numeric ?? "",
        client_id: amRow.credentials?.client_id ?? "",
        client_secret: amRow.credentials?.client_secret ?? "",
        is_sandbox: amRow.credentials?.is_sandbox ?? false,
        merchant_client_id: amRow.credentials?.merchant_client_id ?? "",
        installation_complete: amRow.credentials?.installation_complete ?? false,
        install_hash: amRow.credentials?.install_hash ?? "",
      }));
      setLoaded(true);
    });
  }, []);

  const toggleTestMode = async () => {
    setSaving("testmode");
    const next = !settings.payment_test_mode;
    await (supabase as any).from("site_settings").update({ payment_test_mode: next }).eq("id", (settings as any).id);
    await refreshSettings();
    setSaving(null);
    toast.success(next ? "Modo teste ativado — pagamentos simulados" : "Modo teste desativado");
  };

  const saveMp = async () => {
    setSaving("mp");
    await (supabase as any).from("payment_gateways").upsert(
      { gateway: "mercadopago", enabled: mp.enabled, credentials: { access_token: mp.access_token, public_key: mp.public_key } },
      { onConflict: "gateway" }
    );
    setSaving(null);
    toast.success("Mercado Pago salvo");
  };

  const saveAppmax = async () => {
    setSaving("appmax");
    await (supabase as any).from("payment_gateways").upsert(
      { gateway: "appmax", enabled: appmax.enabled, credentials: { api_key: appmax.api_key, app_id: appmax.app_id, app_id_numeric: appmax.app_id_numeric, client_id: appmax.client_id, client_secret: appmax.client_secret, is_sandbox: appmax.is_sandbox } },
      { onConflict: "gateway" }
    );
    setSaving(null);
    toast.success("AppMax salvo");
  };

  const fieldClass = "w-full px-3 py-2 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 font-mono";

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-2xl mx-auto">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Gateways de Pagamento</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Configure as chaves de integração. Os valores são salvos de forma segura no banco.</p>
      </div>

      {/* ── Modo Teste ── */}
      <div className={`border rounded-xl overflow-hidden transition-colors ${settings.payment_test_mode ? "border-yellow-500/40 bg-yellow-500/5" : "border-border bg-card"}`}>
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${settings.payment_test_mode ? "bg-yellow-500/15" : "bg-secondary"}`}>
              <FlaskConical className={`w-4 h-4 ${settings.payment_test_mode ? "text-yellow-400" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground flex items-center gap-2">
                Modo Teste
                {settings.payment_test_mode && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 uppercase tracking-wider">Ativo</span>
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {settings.payment_test_mode
                  ? "Todos os pagamentos são simulados — assinaturas, presentes e PPV são ativados sem cobrar."
                  : "Ative para simular pagamentos sem gateway. Use para testes antes de ir ao ar."}
              </p>
            </div>
          </div>
          <button onClick={toggleTestMode} disabled={saving === "testmode"}
            className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${settings.payment_test_mode ? "bg-yellow-400" : "bg-secondary border border-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${settings.payment_test_mode ? "left-[26px]" : "left-0.5"}`} />
          </button>
        </div>
        {settings.payment_test_mode && (
          <div className="px-5 pb-4">
            <p className="text-xs text-yellow-400/80 bg-yellow-500/10 border border-yellow-500/20 rounded-lg px-3 py-2 leading-relaxed">
              ⚠️ Desative o modo teste antes de aceitar pagamentos reais. Com ele ativo, nenhuma cobrança é realizada.
            </p>
          </div>
        )}
      </div>

      {/* Mercado Pago */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#009ee3]/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-[#009ee3]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">Mercado Pago</p>
              <p className="text-xs text-muted-foreground">PIX, cartão e boleto</p>
            </div>
          </div>
          <button onClick={() => setMp(p => ({ ...p, enabled: !p.enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${mp.enabled ? "bg-primary" : "bg-secondary border border-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${mp.enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Access Token (produção)</label>
            <input type="password" value={mp.access_token} onChange={e => setMp(p => ({ ...p, access_token: e.target.value }))}
              placeholder="APP_USR-..." className={fieldClass} autoComplete="off" />
            <p className="text-[11px] text-muted-foreground">Encontre em: Mercado Pago → Sua conta → Credenciais → Produção</p>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3 h-3" /> Public Key (produção)</label>
            <input type="text" value={mp.public_key} onChange={e => setMp(p => ({ ...p, public_key: e.target.value }))}
              placeholder="APP_USR-..." className={fieldClass} autoComplete="off" />
          </div>
          <button onClick={saveMp} disabled={saving === "mp"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving === "mp" ? <><Plug className="w-4 h-4 animate-pulse" /> Salvando…</> : <><Save className="w-4 h-4" /> Salvar Mercado Pago</>}
          </button>
        </div>
      </div>

      {/* AppMax */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">AppMax</p>
              <p className="text-xs text-muted-foreground">PIX e cartão de crédito</p>
            </div>
          </div>
          <button onClick={() => setAppmax(p => ({ ...p, enabled: !p.enabled }))}
            className={`relative w-11 h-6 rounded-full transition-colors ${appmax.enabled ? "bg-primary" : "bg-secondary border border-border"}`}>
            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${appmax.enabled ? "left-[22px]" : "left-0.5"}`} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {/* Sandbox toggle */}
          <div className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg border border-border">
            <div>
              <p className="text-xs font-medium text-foreground">Ambiente Sandbox (Teste)</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {appmax.is_sandbox ? "Sandbox: auth.sandboxappmax.com.br" : "Produção: auth.appmax.com.br"}
              </p>
            </div>
            <button onClick={() => setAppmax(p => ({ ...p, is_sandbox: !p.is_sandbox }))}
              className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${appmax.is_sandbox ? "bg-orange-500" : "bg-secondary border border-border"}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${appmax.is_sandbox ? "left-[22px]" : "left-0.5"}`} />
            </button>
          </div>

          {/* Webhook URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3 h-3" /> URL do Webhook (configure no painel AppMax)</label>
            <div className="flex gap-2">
              <input readOnly value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appmax-webhook`}
                className="flex-1 px-3 py-2 text-xs bg-secondary border border-border rounded-lg text-muted-foreground font-mono truncate" />
              <button onClick={() => {
                navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appmax-webhook`);
                setAppmax(p => ({ ...p, copied_webhook: true }));
                setTimeout(() => setAppmax(p => ({ ...p, copied_webhook: false })), 2500);
              }} className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-secondary border border-border rounded-lg hover:bg-secondary/80 whitespace-nowrap">
                {appmax.copied_webhook ? "Copiado ✓" : "Copiar"}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Cole esta URL em: AppMax → App → Configurações → URLs de Integração → Webhook de Pagamento</p>
          </div>

          {/* Client ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Client ID</label>
            <input type="text" value={appmax.client_id} onChange={e => setAppmax(p => ({ ...p, client_id: e.target.value }))}
              placeholder="ex: 778683f2796943dea9fde169996e697f" className={fieldClass} autoComplete="off" />
            <p className="text-[11px] text-muted-foreground">Recebido no e-mail de credenciais AppMax</p>
          </div>

          {/* Client Secret */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Client Secret</label>
            <input type="password" value={appmax.client_secret} onChange={e => setAppmax(p => ({ ...p, client_secret: e.target.value }))}
              placeholder="ex: a626037052fb4180a09975fefdd5a5ca" className={fieldClass} autoComplete="off" />
            <p className="text-[11px] text-muted-foreground">Recebido no e-mail de credenciais AppMax</p>
          </div>

          {/* App UUID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3 h-3" /> App UUID</label>
            <input type="text" value={appmax.app_id} onChange={e => setAppmax(p => ({ ...p, app_id: e.target.value }))}
              placeholder="ex: 634a289e-c734-4694-908b-79fb2bf37959" className={fieldClass} autoComplete="off" />
            <p className="text-[11px] text-muted-foreground">App UUID — recebido no e-mail de credenciais AppMax</p>
          </div>

          {/* App ID Numérico */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Link2 className="w-3 h-3" /> App ID Numérico</label>
            <input type="text" value={appmax.app_id_numeric} onChange={e => setAppmax(p => ({ ...p, app_id_numeric: e.target.value }))}
              placeholder="ex: 889" className={fieldClass} autoComplete="off" />
            <p className="text-[11px] text-muted-foreground">ID numérico do app (ex: 889) — recebido no e-mail. Diferente do UUID acima.</p>
          </div>

          {/* Access Token (generated) */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5"><Unlock className="w-3 h-3" /> Access Token (gerado automaticamente)</label>
            <div className="flex gap-2">
              <input readOnly value={appmax.api_key ? "••••••••••••••••••••" : "Não gerado"}
                className={`flex-1 ${fieldClass} ${appmax.api_key ? "text-green-500" : "text-muted-foreground"}`} />
              <button
                onClick={async () => {
                  if (!appmax.client_id || !appmax.client_secret) { toast.error("Preencha Client ID e Client Secret primeiro"); return; }
                  await (supabase as any).from("payment_gateways").upsert(
                    { gateway: "appmax", enabled: appmax.enabled, credentials: { api_key: appmax.api_key, app_id: appmax.app_id, client_id: appmax.client_id, client_secret: appmax.client_secret, is_sandbox: appmax.is_sandbox } },
                    { onConflict: "gateway" }
                  );
                  setAppmax(p => ({ ...p, generating: true }));
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appmax-checkout`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                      body: JSON.stringify({ action: "generate_token" }),
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || "Erro ao gerar token");
                    setAppmax(p => ({ ...p, api_key: data.access_token, generating: false }));
                    toast.success("Token gerado com sucesso!");
                  } catch (err: any) {
                    toast.error(err.message || "Erro ao gerar token");
                    setAppmax(p => ({ ...p, generating: false }));
                  }
                }}
                disabled={appmax.generating}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50 whitespace-nowrap"
              >
                {appmax.generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando…</> : <><RefreshCw className="w-3.5 h-3.5" />Gerar Token</>}
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground">Clique "Gerar Token" após preencher Client ID e Client Secret. O token expira em 1h — gere novamente se necessário.</p>
          </div>

          {/* ── Instalação AppStore ── */}
          <div className={`rounded-lg border p-4 space-y-3 ${appmax.installation_complete ? "border-green-500/30 bg-green-500/5" : "border-border bg-secondary/30"}`}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Instalação AppMax AppStore</p>
              {appmax.installation_complete
                ? <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-500 uppercase tracking-wider">Instalado</span>
                : <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary text-muted-foreground uppercase tracking-wider">Pendente</span>}
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Conecte sua conta AppMax ao app. Preencha Client ID, Client Secret e App UUID acima, salve, depois siga os passos abaixo.
            </p>

            {/* Passo 1: Autorizar */}
            <div className="space-y-2">
              <p className="text-[11px] font-medium text-foreground">Passo 1 — Iniciar instalação</p>
              <button
                onClick={async () => {
                  if (!appmax.client_id || !appmax.client_secret || !appmax.app_id) {
                    toast.error("Preencha e salve Client ID, Client Secret e App UUID primeiro");
                    return;
                  }
                  setAppmax(p => ({ ...p, installing: true, install_browser_url: "", install_hash: "" }));
                  try {
                    const { data: { session } } = await supabase.auth.getSession();
                    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appmax-install`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                      body: JSON.stringify({ action: "authorize" }),
                    });
                    const data = await res.json();
                    if (!data.ok) throw new Error(data.error || "Erro ao iniciar instalação");
                    setAppmax(p => ({ ...p, install_browser_url: data.browser_url, install_hash: data.hash, installing: false }));
                    toast.success("Link gerado! Abra no navegador e autorize.");
                  } catch (err: any) {
                    toast.error(err.message || "Erro ao iniciar instalação");
                    setAppmax(p => ({ ...p, installing: false }));
                  }
                }}
                disabled={appmax.installing}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-purple-500 text-white rounded-lg hover:bg-purple-600 disabled:opacity-50"
              >
                {appmax.installing ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando link…</> : <><RefreshCw className="w-3.5 h-3.5" />Iniciar Instalação</>}
              </button>
              {appmax.install_browser_url && (
                <div className="space-y-1.5">
                  <p className="text-[11px] text-muted-foreground">Abra este link no navegador, faça login com as credenciais AppMax do merchant e autorize:</p>
                  <div className="flex gap-2">
                    <input readOnly value={appmax.install_browser_url}
                      className="flex-1 px-3 py-2 text-[11px] bg-secondary border border-border rounded-lg text-muted-foreground font-mono truncate" />
                    <button onClick={() => { navigator.clipboard.writeText(appmax.install_browser_url); toast.success("URL copiada!"); }}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-secondary border border-border rounded-lg hover:bg-secondary/80 whitespace-nowrap">
                      Copiar
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Passo 2: Gerar credenciais */}
            {appmax.install_hash && (
              <div className="space-y-2 pt-1 border-t border-border">
                <p className="text-[11px] font-medium text-foreground">Passo 2 — Confirmar instalação</p>
                <p className="text-[11px] text-muted-foreground">Após autorizar no navegador, clique para gerar as credenciais do merchant:</p>
                <button
                  onClick={async () => {
                    setAppmax(p => ({ ...p, generating_creds: true }));
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/appmax-install`, {
                        method: "POST",
                        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` },
                        body: JSON.stringify({ action: "generate" }),
                      });
                      const data = await res.json();
                      if (!data.ok) throw new Error(data.error || "Erro ao gerar credenciais");
                      setAppmax(p => ({ ...p, merchant_client_id: data.merchant_client_id, installation_complete: true, generating_creds: false }));
                      toast.success("Instalação concluída! Credenciais do merchant salvas.");
                    } catch (err: any) {
                      toast.error(err.message || "Erro ao gerar credenciais");
                      setAppmax(p => ({ ...p, generating_creds: false }));
                    }
                  }}
                  disabled={appmax.generating_creds}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                >
                  {appmax.generating_creds ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Gerando…</> : <><CheckCircle className="w-3.5 h-3.5" />Confirmar Instalação</>}
                </button>
              </div>
            )}

            {appmax.installation_complete && appmax.merchant_client_id && (
              <p className="text-[11px] text-green-500">
                Merchant conectado — pagamentos processados via conta AppMax vinculada.
              </p>
            )}
          </div>

          <button onClick={saveAppmax} disabled={saving === "appmax"}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saving === "appmax" ? <><Plug className="w-4 h-4 animate-pulse" /> Salvando…</> : <><Save className="w-4 h-4" /> Salvar AppMax</>}
          </button>
        </div>
      </div>

      {/* Status summary */}
      {loaded && (
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Status</p>
          <div className="space-y-2">
            {[
              { label: "Mercado Pago", enabled: mp.enabled, configured: !!mp.access_token },
              { label: "AppMax", enabled: appmax.enabled, configured: !!appmax.api_key },
            ].map(g => (
              <div key={g.label} className="flex items-center justify-between">
                <span className="text-sm text-foreground">{g.label}</span>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${g.configured ? "bg-green-500/10 text-green-500" : "bg-secondary text-muted-foreground"}`}>
                    {g.configured ? "Configurado" : "Sem chaves"}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${g.enabled ? "bg-primary/10 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {g.enabled ? "Ativo" : "Inativo"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main Admin Panel ───
const AdminPanel = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard");
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const renderTab = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab />;
      case "creators": return <CreatorsTab />;
      case "users": return <UsersTab />;
      case "withdrawals": return <WithdrawalsTab />;
      case "posts": return <PostsTab />;
      case "banners": return <BannersTab />;
      case "affiliates-admin": return <AffiliatesAdminTab />;
      case "pagamentos": return <PagamentosTab />;
      case "configuracoes": return <ConfiguracoesTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onMenuToggle={() => setMenuOpen(true)} />
      <AdminSidebar open={menuOpen} onClose={() => setMenuOpen(false)} activeTab={activeTab} onTabChange={setActiveTab} onLogout={handleLogout} />
      <main className="pt-14 pb-8 px-4 md:px-6 max-w-6xl mx-auto mt-4">
        {renderTab()}
      </main>
    </div>
  );
};

export default AdminPanel;
