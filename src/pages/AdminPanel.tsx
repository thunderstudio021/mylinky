import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, XCircle, Clock, Shield } from "lucide-react";

const AdminPanel = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"pending" | "approved" | "rejected">("pending");

  const loadApplications = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("creator_applications")
      .select("*")
      .eq("status", tab)
      .order("created_at", { ascending: false });

    const apps = data || [];
    const enriched = await Promise.all(
      apps.map(async (app) => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("name, username, email, avatar_url")
          .eq("id", app.user_id)
          .single();
        return { ...app, profile };
      })
    );
    setApplications(enriched);
    setLoading(false);
  };

  useEffect(() => {
    loadApplications();
  }, [tab]);

  const handleApprove = async (appId: string, userId: string) => {
    const { error: appError } = await supabase
      .from("creator_applications")
      .update({ status: "approved", reviewed_at: new Date().toISOString() })
      .eq("id", appId);
    if (appError) { toast.error("Erro ao aprovar"); return; }
    await supabase.from("profiles").update({ verified: true }).eq("id", userId);
    toast.success("Criador aprovado com sucesso!");
    loadApplications();
  };

  const handleReject = async (appId: string) => {
    const { error } = await supabase
      .from("creator_applications")
      .update({ status: "rejected", reviewed_at: new Date().toISOString() })
      .eq("id", appId);
    if (error) { toast.error("Erro ao rejeitar"); return; }
    toast.success("Solicitação rejeitada");
    loadApplications();
  };

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-20 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Shield className="w-5 h-5 text-foreground" />
            <h1 className="text-xl font-semibold text-foreground">Painel Admin</h1>
          </div>
          <p className="text-sm text-muted-foreground">Gerencie solicitações de criadores</p>
        </div>

        <div className="flex gap-1 mb-6 border-b border-border">
          {([
            { value: "pending", label: "Pendentes", icon: Clock },
            { value: "approved", label: "Aprovados", icon: CheckCircle },
            { value: "rejected", label: "Rejeitados", icon: XCircle },
          ] as const).map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px ${
                tab === t.value
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground text-center py-12">Carregando...</p>
          ) : applications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-12">
              Nenhuma solicitação {tab === "pending" ? "pendente" : tab === "approved" ? "aprovada" : "rejeitada"}.
            </p>
          ) : (
            applications.map((app) => (
              <div key={app.id} className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-foreground font-semibold">
                      {app.profile?.name?.[0] || "U"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{app.profile?.name}</p>
                      <p className="text-xs text-muted-foreground">@{app.profile?.username} · {app.profile?.email}</p>
                    </div>
                  </div>
                  {tab === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApprove(app.id, app.user_id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-md hover:bg-foreground/90 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium border border-border rounded-md text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Rejeitar
                      </button>
                    </div>
                  )}
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Solicitado em {new Date(app.created_at).toLocaleDateString("pt-BR")}
                  {app.reviewed_at && ` · Revisado em ${new Date(app.reviewed_at).toLocaleDateString("pt-BR")}`}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
