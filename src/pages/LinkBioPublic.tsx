import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ExternalLink, AlertTriangle, ShieldAlert } from "lucide-react";
import { SiteLogo } from "@/components/SiteLogo";

// ─── Favicon helper (Google S2 service) ──────────────────────────────────────
const getFavicon = (url: string) => {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
  } catch {
    return null;
  }
};

// ─── Link icon (custom upload or favicon fallback) ───────────────────────────
const LinkIcon = ({ iconUrl, href }: { iconUrl?: string; href: string }) => {
  const src = iconUrl || getFavicon(href) || "";
  if (!src) return null;
  return (
    <img
      src={src}
      alt=""
      className="w-5 h-5 rounded-sm object-contain shrink-0"
      onError={e => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
};

// ─── Sensitivity modal — sem menção a adulto ──────────────────────────────────
const SensitiveModal = ({ url, onClose }: { url: string; onClose: () => void }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="w-full max-w-xs bg-zinc-900 border border-zinc-700 rounded-2xl p-6 text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6 text-zinc-300" />
        </div>
      </div>
      <h3 className="text-base font-semibold text-white">Conteúdo sensível</h3>
      <p className="text-sm text-zinc-400 leading-relaxed">
        Este link contém conteúdo sensível. Deseja continuar?
      </p>
      <div className="flex gap-2 pt-1">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 text-sm text-zinc-300 border border-zinc-700 rounded-xl hover:bg-zinc-800 transition-colors"
        >
          Cancelar
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          onClick={onClose}
          className="flex-1 py-2.5 text-sm font-medium bg-white text-black rounded-xl hover:bg-zinc-100 transition-colors flex items-center justify-center gap-1.5"
        >
          Continuar <ExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>
    </div>
  </div>
);

// ─── Social icons ─────────────────────────────────────────────────────────────
const SOCIAL_PATHS: Record<string, string> = {
  instagram: "M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z",
  tiktok: "M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.16 8.16 0 004.77 1.52V6.74a4.85 4.85 0 01-1-.05z",
  twitter: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.732-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
  facebook: "M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z",
  whatsapp: "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z",
};

const SocialBtn = ({ type, url }: { type: string; url: string }) => {
  const path = SOCIAL_PATHS[type];
  if (!path) return null;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer"
      className="w-11 h-11 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-all active:scale-95">
      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d={path} /></svg>
    </a>
  );
};

// ─── Link button (uniform size, icon left, arrow right) ───────────────────────
const LinkButton = ({
  title, href, iconUrl, isSensitive, cardColor, onClick,
}: {
  title: string;
  href: string;
  iconUrl?: string;
  isSensitive?: boolean;
  cardColor: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className="flex items-center w-full px-5 rounded-2xl font-medium text-sm text-white transition-all hover:opacity-90 active:scale-[0.98] shadow-lg gap-3"
    style={{ backgroundColor: cardColor, height: "52px" }}
  >
    <LinkIcon iconUrl={iconUrl} href={href} />
    <span className="flex-1 text-left truncate">{title}</span>
    <ExternalLink className="w-4 h-4 opacity-50 shrink-0" />
  </button>
);

// ─── Main ─────────────────────────────────────────────────────────────────────
const LinkBioPublic = () => {
  const { username } = useParams<{ username: string }>();
  const [settings, setSettings] = useState<any>(null);
  const [links, setLinks] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sensitiveUrl, setSensitiveUrl] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: prof } = await supabase
        .from("profiles").select("id, name, username, avatar_url, bio")
        .eq("username", username || "").maybeSingle();
      if (!prof) { setLoading(false); return; }
      setProfile(prof);
      const [{ data: s }, { data: l }] = await Promise.all([
        supabase.from("link_bio_settings").select("*").eq("creator_id", prof.id).maybeSingle(),
        supabase.from("link_bio_links").select("*").eq("creator_id", prof.id).eq("is_active", true).order("position"),
      ]);
      setSettings(s || {});
      setLinks(l || []);
      setLoading(false);
    };
    load();
  }, [username]);

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-black text-white gap-3">
        <SiteLogo forceDark className="h-7 mb-4 opacity-60" />
        <p className="text-base font-semibold">Página não encontrada</p>
        <Link to="/" className="text-sm text-zinc-400 hover:text-white transition-colors">Voltar ao início</Link>
      </div>
    );
  }

  const displayName       = settings?.display_name || profile.name;
  const bio               = settings?.bio || profile.bio || "";
  const bgImage           = settings?.bg_image_url || profile.avatar_url || "";
  const cardColor         = settings?.card_color || "#7c3aed";
  const profileUrl        = `${window.location.origin}/${profile.username}`;
  const profileLinkTitle  = settings?.profile_link_title || "Meu perfil";
  const profileLinkIcon   = settings?.profile_link_icon_url || "";

  const socials = [
    { type: "instagram", url: settings?.instagram_url },
    { type: "tiktok",    url: settings?.tiktok_url },
    { type: "twitter",   url: settings?.twitter_url },
    { type: "facebook",  url: settings?.facebook_url },
    { type: "whatsapp",  url: settings?.whatsapp_url },
  ].filter(s => !!s.url);

  return (
    <div className="relative min-h-screen w-full flex flex-col bg-black overflow-x-hidden">

      {/* Background */}
      <div className="fixed inset-0 z-0">
        {bgImage
          ? <img src={bgImage} alt="" className="w-full h-full object-cover object-top" />
          : <div className="w-full h-full bg-gradient-to-br from-zinc-800 to-black" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-end min-h-screen pb-10 px-5 pt-48">

        <h1 className="text-3xl font-bold text-white text-center tracking-tight mb-1 drop-shadow-md">
          {displayName}
        </h1>

        {bio && (
          <p className="text-sm text-white/70 text-center mb-5 leading-relaxed max-w-xs drop-shadow">
            {bio}
          </p>
        )}

        {socials.length > 0 && (
          <div className="flex items-center gap-3 mb-7">
            {socials.map(s => <SocialBtn key={s.type} type={s.type} url={s.url} />)}
          </div>
        )}

        {/* Links */}
        <div className="w-full max-w-sm space-y-3">

          {/* Fixed profile link */}
          <LinkButton
            title={profileLinkTitle}
            href={profileUrl}
            iconUrl={profileLinkIcon || getFavicon(profileUrl) || ""}
            cardColor={cardColor}
            onClick={() => window.open(profileUrl, "_blank", "noopener,noreferrer")}
          />

          {/* Custom links */}
          {links.map(link => (
            <LinkButton
              key={link.id}
              title={link.title}
              href={link.url}
              iconUrl={link.icon_url || ""}
              isSensitive={link.is_sensitive}
              cardColor={cardColor}
              onClick={() => {
                if (link.is_sensitive) setSensitiveUrl(link.url);
                else window.open(link.url, "_blank", "noopener,noreferrer");
              }}
            />
          ))}
        </div>

        {/* Footer — logo clicável */}
        <Link to="/" className="mt-10 opacity-30 hover:opacity-60 transition-opacity">
          <SiteLogo forceDark className="h-4 w-auto object-contain" />
        </Link>
      </div>

      {sensitiveUrl && (
        <SensitiveModal url={sensitiveUrl} onClose={() => setSensitiveUrl(null)} />
      )}
    </div>
  );
};

export default LinkBioPublic;
