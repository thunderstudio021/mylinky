import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import logoImg from "@/assets/logo.png";
import {
  Menu, X, LayoutDashboard, Users, FileText, Wallet,
  ChevronRight, Search, CheckCircle, XCircle, Eye, Pencil,
  Trash2, Ban, Shield, TrendingUp, Image, Video, UserCheck,
  ArrowLeft, Save, Percent, LogOut,
} from "lucide-react";

// ─── Admin Header ───
const AdminHeader = ({ onMenuToggle }: { onMenuToggle: () => void }) => (
  <header className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-between px-4 md:px-6 bg-background border-b border-border">
    <img src={logoImg} alt="Logo" className="h-7" />
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
    { id: "creators", label: "Criadores", icon: Users },
    { id: "withdrawals", label: "Saques", icon: Wallet },
    { id: "posts", label: "Publicações", icon: FileText },
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
  const [stats, setStats] = useState({ users: 0, creators: 0, posts: 0, photos: 0, videos: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [profilesRes, creatorsRes, postsRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }).eq("verified", true),
        supabase.from("posts").select("id, media_type"),
      ]);
      const posts = postsRes.data || [];
      setStats({
        users: profilesRes.count || 0,
        creators: creatorsRes.count || 0,
        posts: posts.length,
        photos: posts.filter(p => p.media_type === "image").length,
        videos: posts.filter(p => p.media_type === "video").length,
      });
      setLoading(false);
    };
    load();
  }, []);

  const cards = [
    { label: "Usuários", value: stats.users, icon: Users, color: "text-blue-400" },
    { label: "Criadores", value: stats.creators, icon: UserCheck, color: "text-emerald-400" },
    { label: "Publicações", value: stats.posts, icon: FileText, color: "text-purple-400" },
    { label: "Fotos", value: stats.photos, icon: Image, color: "text-amber-400" },
    { label: "Vídeos", value: stats.videos, icon: Video, color: "text-rose-400" },
  ];

  if (loading) return <LoadingState />;

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => (
          <div key={c.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{c.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

// ─── Creators Tab ───
const CreatorsTab = () => {
  const [creators, setCreators] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    // Get all profiles + their applications
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    const { data: apps } = await supabase
      .from("creator_applications")
      .select("*")
      .order("created_at", { ascending: true });

    const appMap = new Map((apps || []).map(a => [a.user_id, a]));

    // Combine: show creators (verified) + pending applicants
    const allProfiles = profiles || [];
    const creatorsWithApps = allProfiles
      .filter(p => p.verified || appMap.has(p.id))
      .map(p => ({
        ...p,
        application: appMap.get(p.id) || null,
      }))
      .sort((a, b) => {
        // Pending first, then by creation date
        const aPending = a.application?.status === "pending" ? 0 : 1;
        const bPending = b.application?.status === "pending" ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      });

    setCreators(creatorsWithApps);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApprove = async (appId: string) => {
    const { error } = await supabase.rpc("approve_creator", { _application_id: appId });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Criador aprovado!");
    load();
  };

  const handleReject = async (appId: string) => {
    const { error } = await supabase.rpc("reject_creator", { _application_id: appId });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Solicitação rejeitada");
    load();
  };

  const handleSaveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({
        name: editing.name,
        username: editing.username,
        email: editing.email,
        verified: editing.verified,
        commission_rate: editing.commission_rate,
      })
      .eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar: " + error.message); return; }
    toast.success("Perfil atualizado!");
    setEditing(null);
    load();
  };

  const filtered = creators.filter(c =>
    !search ||
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.username?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <LoadingState />;

  // Edit view
  if (editing) {
    return (
      <div>
        <button onClick={() => setEditing(null)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <div className="bg-card border border-border rounded-xl p-5 space-y-4 max-w-lg">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold overflow-hidden">
              {editing.avatar_url ? (
                <img src={editing.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                editing.name?.[0] || "U"
              )}
            </div>
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
              <input
                type="number"
                min={0} max={100}
                value={editing.commission_rate ?? 20}
                onChange={e => setEditing({ ...editing, commission_rate: Number(e.target.value) })}
                className="w-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
              />
              <Percent className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-muted-foreground">Verificado</label>
            <button
              onClick={() => setEditing({ ...editing, verified: !editing.verified })}
              className={`w-10 h-5 rounded-full transition-colors relative ${editing.verified ? "bg-emerald-500" : "bg-secondary"}`}
            >
              <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${editing.verified ? "left-5" : "left-0.5"}`} />
            </button>
          </div>

          <button
            onClick={handleSaveEdit}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Salvando..." : "Salvar alterações"}
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
        <input
          type="text"
          placeholder="Pesquisar criador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState text="Nenhum criador encontrado" />
        ) : (
          filtered.map(c => (
            <div key={c.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold shrink-0 overflow-hidden">
                    {c.avatar_url ? (
                      <img src={c.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      c.name?.[0] || "U"
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{c.name}</p>
                      {c.verified && (
                        <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">@{c.username} · {c.email}</p>
                    <p className="text-xs text-muted-foreground">Comissão: {c.commission_rate ?? 20}%</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {c.application?.status === "pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(c.application.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Aceitar
                      </button>
                      <button
                        onClick={() => handleReject(c.application.id)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                      >
                        <XCircle className="w-3 h-3" /> Rejeitar
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setEditing(c)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-secondary rounded-lg transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

// ─── Withdrawals Tab ───
const WithdrawalsTab = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });

    const reqs = data || [];
    const enriched = await Promise.all(
      reqs.map(async (r) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, username, avatar_url")
          .eq("id", r.creator_id)
          .single();
        return { ...r, profile };
      })
    );
    setRequests(enriched);
    setLoading(false);
  }, [tab]);

  useEffect(() => { load(); }, [load]);

  const handleUpdate = async (id: string, status: string) => {
    const { error } = await supabase
      .from("withdrawal_requests")
      .update({ status, reviewed_at: new Date().toISOString() })
      .eq("id", id);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success(status === "approved" ? "Saque aprovado!" : "Saque rejeitado");
    load();
  };

  const statusTabs = [
    { value: "pending" as const, label: "Pendentes" },
    { value: "approved" as const, label: "Aprovados" },
    { value: "rejected" as const, label: "Rejeitados" },
  ];

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-4">Solicitações de Saque</h2>
      <div className="flex gap-1 mb-4">
        {statusTabs.map(t => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
              tab === t.value ? "bg-secondary text-foreground font-medium" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? <LoadingState /> : requests.length === 0 ? (
        <EmptyState text={`Nenhum saque ${tab === "pending" ? "pendente" : tab === "approved" ? "aprovado" : "rejeitado"}`} />
      ) : (
        <div className="space-y-2">
          {requests.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold shrink-0 overflow-hidden">
                    {r.profile?.avatar_url ? (
                      <img src={r.profile.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      r.profile?.name?.[0] || "U"
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.profile?.name}</p>
                    <p className="text-xs text-muted-foreground">R$ {Number(r.amount).toFixed(2)} · {r.bank_name}</p>
                    <p className="text-xs text-muted-foreground">PIX: {r.pix_key} · {r.pix_key_holder_name}</p>
                  </div>
                </div>
                {tab === "pending" && (
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleUpdate(r.id, "approved")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-emerald-500/10 text-emerald-400 rounded-lg hover:bg-emerald-500/20 transition-colors"
                    >
                      <CheckCircle className="w-3 h-3" /> Aprovar
                    </button>
                    <button
                      onClick={() => handleUpdate(r.id, "rejected")}
                      className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
                    >
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
    const { data } = await supabase
      .from("posts")
      .select("*")
      .order("created_at", { ascending: false });

    const allPosts = data || [];
    const creatorIds = [...new Set(allPosts.map(p => p.creator_id))];
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, username, avatar_url")
      .in("id", creatorIds);

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
    !search ||
    p.content?.toLowerCase().includes(search.toLowerCase()) ||
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
        <input
          type="text"
          placeholder="Pesquisar publicação..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-card border border-border rounded-lg pl-9 pr-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <EmptyState text="Nenhuma publicação encontrada" />
        ) : (
          filtered.map(p => (
            <div key={p.id} className="bg-card border border-border rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-foreground text-xs font-semibold shrink-0 overflow-hidden">
                    {p.creator?.avatar_url ? (
                      <img src={p.creator.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      p.creator?.name?.[0] || "U"
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-medium text-foreground">{p.creator?.name}</p>
                      <span className="text-xs text-muted-foreground">@{p.creator?.username}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        p.post_visibility === "free" ? "bg-secondary text-muted-foreground" :
                        p.post_visibility === "subscribers" ? "bg-blue-500/10 text-blue-400" :
                        "bg-amber-500/10 text-amber-400"
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
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
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
    <input
      type="text"
      value={value || ""}
      onChange={e => onChange(e.target.value)}
      className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring"
    />
  </div>
);

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
      case "withdrawals": return <WithdrawalsTab />;
      case "posts": return <PostsTab />;
      default: return <DashboardTab />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onMenuToggle={() => setMenuOpen(true)} />
      <AdminSidebar
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={handleLogout}
      />
      <main className="pt-14 pb-8 px-4 md:px-6 max-w-6xl mx-auto mt-4">
        {renderTab()}
      </main>
    </div>
  );
};

export default AdminPanel;
