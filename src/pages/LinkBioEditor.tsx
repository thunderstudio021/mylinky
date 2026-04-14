import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Upload, Plus, Trash2, ExternalLink,
  Copy, CheckCheck, Loader2, Eye, AlertTriangle, ChevronUp, ChevronDown, ImageIcon,
} from "lucide-react";

const SUPABASE_FUNCTIONS_URL = "https://tefijammwrzsemqyxtud.supabase.co/functions/v1";
const SUPABASE_ANON_KEY = "sb_publishable_WaNVDptVIVhy1kPnhi0l_w_YPt-1fA5";

const uploadToB2 = async (file: File, fileName: string): Promise<string> => {
  const mimeType = file.type || "application/octet-stream";
  const res = await fetch(`${SUPABASE_FUNCTIONS_URL}/b2-upload-url`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, "Content-Type": mimeType, "x-file-name": fileName },
    body: file,
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error || "Erro no upload");
  return data.publicUrl;
};

const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

const SOCIAL_FIELDS = [
  { key: "instagram_url", label: "Instagram", placeholder: "https://instagram.com/seu_perfil" },
  { key: "tiktok_url",    label: "TikTok",    placeholder: "https://tiktok.com/@seu_perfil" },
  { key: "twitter_url",   label: "X (Twitter)", placeholder: "https://x.com/seu_perfil" },
  { key: "facebook_url",  label: "Facebook",  placeholder: "https://facebook.com/seu_perfil" },
  { key: "whatsapp_url",  label: "WhatsApp",  placeholder: "https://wa.me/5511999999999" },
];

const defaultSettings = {
  bg_image_url: "",
  display_name: "",
  bio: "",
  card_color: "#7c3aed",
  profile_link_title: "Meu perfil",
  profile_link_icon_url: "",
  instagram_url: "",
  tiktok_url: "",
  twitter_url: "",
  facebook_url: "",
  whatsapp_url: "",
};

interface LinkItem {
  id?: string;
  title: string;
  url: string;
  icon_url: string;
  position: number;
  is_sensitive: boolean;
  is_active: boolean;
  isNew?: boolean;
}

// ─── Small icon upload button ──────────────────────────────────────────────────
const IconUploadBtn = ({
  currentUrl,
  faviconUrl,
  uploading,
  onUpload,
}: {
  currentUrl: string;
  faviconUrl?: string;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const preview = currentUrl || faviconUrl || "";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 border border-border rounded-lg text-muted-foreground hover:bg-secondary transition-colors shrink-0"
      >
        {uploading
          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
          : <ImageIcon className="w-3.5 h-3.5" />
        }
        {currentUrl ? "Trocar ícone" : "Ícone"}
      </button>
      {preview && (
        <img
          src={preview}
          alt=""
          className="w-6 h-6 rounded-sm object-contain border border-border"
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
        />
      )}
      <input ref={inputRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp"
        onChange={onUpload} className="hidden" />
    </div>
  );
};

const LinkBioEditor = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const bgInputRef = useRef<HTMLInputElement>(null);

  const [settings, setSettings] = useState(defaultSettings);
  const [links, setLinks] = useState<LinkItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);
  const [uploadingProfileIcon, setUploadingProfileIcon] = useState(false);
  const [uploadingLinkIcon, setUploadingLinkIcon] = useState<number | null>(null);
  const [bgPreview, setBgPreview] = useState("");
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const bioUrl = `${window.location.origin}/bio/${profile?.username || ""}`;
  const profileUrl = `${window.location.origin}/${profile?.username || ""}`;

  // ── Load existing settings ────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase.from("link_bio_settings").select("*").eq("creator_id", user.id).maybeSingle(),
        supabase.from("link_bio_links").select("*").eq("creator_id", user.id).order("position"),
      ]);
      if (s) {
        setSettings({
          bg_image_url: s.bg_image_url || "",
          display_name: s.display_name || "",
          bio: s.bio || "",
          card_color: s.card_color || "#7c3aed",
          profile_link_title: s.profile_link_title || "Meu perfil",
          profile_link_icon_url: s.profile_link_icon_url || "",
          instagram_url: s.instagram_url || "",
          tiktok_url: s.tiktok_url || "",
          twitter_url: s.twitter_url || "",
          facebook_url: s.facebook_url || "",
          whatsapp_url: s.whatsapp_url || "",
        });
        setBgPreview(s.bg_image_url || "");
      } else {
        setSettings(prev => ({ ...prev, display_name: profile?.name || "" }));
      }
      setLinks((l || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        icon_url: item.icon_url || "",
        position: item.position,
        is_sensitive: item.is_sensitive,
        is_active: item.is_active,
      })));
      setLoaded(true);
    };
    load();
  }, [user, profile]);

  // ── Upload background ─────────────────────────────────────────────────────
  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingBg(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `linkbio/${user.id}/bg.${ext}`;
      const url = await uploadToB2(file, fileName);
      setSettings(s => ({ ...s, bg_image_url: url }));
      setBgPreview(url);
      toast.success("Foto de fundo atualizada");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingBg(false);
      e.target.value = "";
    }
  };

  // ── Upload profile link icon ──────────────────────────────────────────────
  const handleProfileIconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingProfileIcon(true);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `linkbio/${user.id}/profile-icon.${ext}`;
      const url = await uploadToB2(file, fileName);
      setSettings(s => ({ ...s, profile_link_icon_url: url }));
      toast.success("Ícone atualizado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingProfileIcon(false);
      e.target.value = "";
    }
  };

  // ── Upload icon for a custom link ─────────────────────────────────────────
  const handleLinkIconUpload = async (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingLinkIcon(idx);
    try {
      const ext = file.name.split(".").pop() || "png";
      const fileName = `linkbio/${user.id}/link-icon-${idx}-${Date.now()}.${ext}`;
      const url = await uploadToB2(file, fileName);
      updateLink(idx, "icon_url", url);
      toast.success("Ícone do link atualizado");
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setUploadingLinkIcon(null);
      e.target.value = "";
    }
  };

  // ── Links management ──────────────────────────────────────────────────────
  const addLink = () => {
    setLinks(prev => [...prev, {
      title: "", url: "", icon_url: "", position: prev.length,
      is_sensitive: false, is_active: true, isNew: true,
    }]);
  };

  const updateLink = (idx: number, field: keyof LinkItem, value: any) => {
    setLinks(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const removeLink = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx).map((l, i) => ({ ...l, position: i })));
  };

  const moveLink = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= links.length) return;
    setLinks(prev => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr.map((l, i) => ({ ...l, position: i }));
    });
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error: sErr } = await supabase.from("link_bio_settings").upsert({
        creator_id: user.id,
        ...settings,
        updated_at: new Date().toISOString(),
      }, { onConflict: "creator_id" });
      if (sErr) throw sErr;

      await supabase.from("link_bio_links").delete().eq("creator_id", user.id);
      if (links.length > 0) {
        const { error: lErr } = await supabase.from("link_bio_links").insert(
          links.filter(l => l.title.trim() && l.url.trim()).map((l, i) => ({
            creator_id: user.id,
            title: l.title.trim(),
            url: l.url.trim(),
            icon_url: l.icon_url || "",
            position: i,
            is_sensitive: l.is_sensitive,
            is_active: l.is_active,
          }))
        );
        if (lErr) throw lErr;
      }
      toast.success("LinkBio salvo com sucesso!");
    } catch (err: any) {
      toast.error(err.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }, [user, settings, links]);

  const handleCopy = () => {
    navigator.clipboard.writeText(bioUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  const inputCls = "w-full px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/40";

  if (!loaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-14">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-14 md:pt-[72px] pb-24 md:pb-10">
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">LinkBio</h1>
          <div className="flex items-center gap-2">
            <a href={bioUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground border border-border rounded-lg hover:bg-secondary transition-colors">
              <Eye className="w-3.5 h-3.5" /> Visualizar
            </a>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-50 transition-colors">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Salvar
            </button>
          </div>
        </div>

        {/* Copy link */}
        <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg border border-border">
          <span className="flex-1 text-xs text-muted-foreground truncate">{bioUrl}</span>
          <button onClick={handleCopy} className="flex items-center gap-1 text-xs font-medium text-foreground shrink-0">
            {copied ? <><CheckCheck className="w-3.5 h-3.5 text-green-500" />Copiado</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}
          </button>
        </div>

        {/* Background image */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Foto de fundo</p>
          <div
            onClick={() => bgInputRef.current?.click()}
            className="relative w-full h-40 rounded-xl border-2 border-dashed border-border overflow-hidden cursor-pointer hover:border-foreground/30 transition-colors flex items-center justify-center bg-secondary"
          >
            {bgPreview ? (
              <>
                <img src={bgPreview} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex items-center gap-1.5 text-white text-xs font-medium">
                    <Upload className="w-4 h-4" /> Trocar foto
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                {uploadingBg ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                <span className="text-xs">{uploadingBg ? "Enviando..." : "Clique para fazer upload"}</span>
              </div>
            )}
          </div>
          <input ref={bgInputRef} type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
        </div>

        {/* Name & Bio */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Identidade</p>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Nome de exibição</label>
            <input value={settings.display_name} onChange={e => setSettings(s => ({ ...s, display_name: e.target.value }))}
              placeholder={profile?.name || "Seu nome"} className={inputCls} />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">Biografia</label>
            <textarea value={settings.bio} onChange={e => setSettings(s => ({ ...s, bio: e.target.value }))}
              placeholder="Escreva uma breve descrição sobre você..."
              rows={3} className={`${inputCls} resize-none`} />
          </div>
        </div>

        {/* Card color */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cor dos links</p>
          <div className="flex items-center gap-3">
            <input type="color" value={settings.card_color}
              onChange={e => setSettings(s => ({ ...s, card_color: e.target.value }))}
              className="w-10 h-10 rounded-lg cursor-pointer border border-border bg-transparent p-0.5" />
            <div className="flex-1 h-10 rounded-lg border border-border" style={{ backgroundColor: settings.card_color }} />
            <span className="text-xs text-muted-foreground font-mono">{settings.card_color}</span>
          </div>
        </div>

        {/* Social links */}
        <div className="space-y-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Redes sociais</p>
          {SOCIAL_FIELDS.map(f => (
            <div key={f.key} className="space-y-1">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              <input
                value={(settings as any)[f.key]}
                onChange={e => setSettings(s => ({ ...s, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                className={inputCls}
              />
            </div>
          ))}
        </div>

        {/* Links */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Links</p>
            <button onClick={addLink}
              className="flex items-center gap-1 text-xs font-medium text-foreground hover:text-muted-foreground transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar
            </button>
          </div>

          {/* Fixed profile link — editable name + icon */}
          <div className="border border-border rounded-xl p-3 space-y-2.5 bg-card">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-foreground">Link do perfil</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">Fixo</span>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Título</label>
              <input
                value={settings.profile_link_title}
                onChange={e => setSettings(s => ({ ...s, profile_link_title: e.target.value }))}
                placeholder="Meu perfil"
                className={inputCls}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">URL (automática)</label>
              <div className="px-3 py-2.5 text-xs text-muted-foreground bg-secondary border border-border rounded-lg truncate">
                {profileUrl}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground">Ícone (PNG ou SVG)</label>
              <IconUploadBtn
                currentUrl={settings.profile_link_icon_url}
                faviconUrl={getFavicon(profileUrl) || ""}
                uploading={uploadingProfileIcon}
                onUpload={handleProfileIconUpload}
              />
            </div>
          </div>

          {/* Editable links */}
          {links.map((link, idx) => (
            <div key={idx} className="border border-border rounded-xl p-3 space-y-2.5 bg-card">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button onClick={() => moveLink(idx, -1)} disabled={idx === 0}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => moveLink(idx, 1)} disabled={idx === links.length - 1}
                    className="p-1 text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors">
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="flex items-center gap-2 ml-auto">
                  <button onClick={() => updateLink(idx, "is_active", !link.is_active)}
                    className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                      link.is_active ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground"
                    }`}>
                    {link.is_active ? "Ativo" : "Oculto"}
                  </button>
                  <button onClick={() => removeLink(idx)}
                    className="p-1 text-muted-foreground hover:text-destructive transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <input value={link.title} onChange={e => updateLink(idx, "title", e.target.value)}
                placeholder="Título do link" className={inputCls} />
              <input value={link.url} onChange={e => updateLink(idx, "url", e.target.value)}
                placeholder="https://..." type="url" className={inputCls} />

              {/* Icon upload */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground">Ícone (PNG ou SVG)</label>
                <IconUploadBtn
                  currentUrl={link.icon_url}
                  faviconUrl={link.url ? getFavicon(link.url) || "" : ""}
                  uploading={uploadingLinkIcon === idx}
                  onUpload={e => handleLinkIconUpload(idx, e)}
                />
              </div>

              {/* Sensitivity toggle */}
              <button onClick={() => updateLink(idx, "is_sensitive", !link.is_sensitive)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                  link.is_sensitive
                    ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                    : "border-border text-muted-foreground hover:bg-secondary"
                }`}>
                <AlertTriangle className="w-3.5 h-3.5" />
                {link.is_sensitive ? "Conteúdo sensível ativado" : "Conteúdo sensível"}
              </button>
            </div>
          ))}

          {links.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              Nenhum link adicionado ainda. Clique em "Adicionar" para começar.
            </p>
          )}
        </div>

        {/* Save button bottom */}
        <button onClick={handleSave} disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium bg-foreground text-background rounded-xl hover:bg-foreground/90 disabled:opacity-50 transition-colors">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {saving ? "Salvando..." : "Salvar LinkBio"}
        </button>
      </div>
    </div>
  );
};

export default LinkBioEditor;
