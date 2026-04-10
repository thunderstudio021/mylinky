import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLocation } from "react-router-dom";
import logoImg from "@/assets/logo.png";
import { Youtube, Twitter, Facebook, MessageCircle } from "lucide-react";
import { useEffect, useState } from "react";

// ─── TikTok SVG (not in lucide-react) ────────────────────────────────────────
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.28 6.28 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.2 8.2 0 004.79 1.53V6.77a4.85 4.85 0 01-1.02-.08z" />
  </svg>
);

// ─── Instagram SVG (Lucide version is deprecated) ────────────────────────────
const InstagramIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const HIDDEN_PATHS = ["/login", "/register", "/admin-panel"];

function useIsDark() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains("dark"));
  useEffect(() => {
    const obs = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return dark;
}

export default function Footer() {
  const { settings } = useSiteSettings();
  const location = useLocation();
  const isDark = useIsDark();

  if (HIDDEN_PATHS.includes(location.pathname)) return null;

  const socials = [
    { url: settings.instagram_url, icon: InstagramIcon, label: "Instagram" },
    { url: settings.tiktok_url,    icon: TikTokIcon,    label: "TikTok" },
    { url: settings.twitter_url,   icon: Twitter,       label: "Twitter/X" },
    { url: settings.facebook_url,  icon: Facebook,      label: "Facebook" },
    { url: settings.youtube_url,   icon: Youtube,       label: "YouTube" },
    { url: settings.whatsapp_url,  icon: MessageCircle, label: "WhatsApp" },
  ].filter(s => !!s.url);

  if (socials.length === 0 && !settings.footer_text) return null;

  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-background py-6 px-4">
      <div className="max-w-5xl mx-auto flex flex-col items-center gap-4">
        {/* Logo — uses dark logo if available in dark mode, otherwise falls back */}
        {isDark
          ? (settings.logo_dark_url
              ? <img src={settings.logo_dark_url} alt="Logo" className="h-6 object-contain opacity-60" />
              : settings.logo_url
                ? <img src={settings.logo_url} alt="Logo" className="h-6 object-contain opacity-60 invert" />
                : <img src={logoImg} alt="Logo" className="h-6 invert opacity-60" />)
          : (settings.logo_url
              ? <img src={settings.logo_url} alt="Logo" className="h-6 object-contain opacity-60" />
              : <img src={logoImg} alt="Logo" className="h-6 opacity-60" />)
        }

        {/* Social icons */}
        {socials.length > 0 && (
          <div className="flex items-center gap-5">
            {socials.map(({ url, icon: Icon, label }) => (
              <a
                key={label}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={label}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon className="w-[18px] h-[18px]" />
              </a>
            ))}
          </div>
        )}

        {/* Footer text / copyright */}
        <p className="text-xs text-muted-foreground text-center">
          {settings.footer_text || `© ${year} Todos os direitos reservados.`}
        </p>
      </div>
    </footer>
  );
}
