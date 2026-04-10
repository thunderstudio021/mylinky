import { createContext, useContext, useEffect, useState, useCallback, createElement } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SiteSettings {
  logo_url: string | null;
  logo_dark_url: string | null;
  primary_color_light: string;
  primary_color_dark: string;
  instagram_url: string;
  tiktok_url: string;
  twitter_url: string;
  facebook_url: string;
  youtube_url: string;
  whatsapp_url: string;
  footer_text: string;
}

export const SITE_DEFAULTS: SiteSettings = {
  logo_url: null,
  logo_dark_url: null,
  primary_color_light: "358 74% 59%",
  primary_color_dark: "358 74% 59%",
  instagram_url: "",
  tiktok_url: "",
  twitter_url: "",
  facebook_url: "",
  youtube_url: "",
  whatsapp_url: "",
  footer_text: "",
};

export function applyPrimaryColor(light: string, dark: string) {
  const root = document.documentElement;
  const isDark = root.classList.contains("dark");
  const color = isDark ? dark : light;
  root.style.setProperty("--primary", color);
  root.style.setProperty("--accent", color);
  root.style.setProperty("--ring", color);
  // Cache for re-application on theme switch
  root.dataset.primaryLight = light;
  root.dataset.primaryDark = dark;
}

// ─── Hex ↔ HSL helpers (for color picker) ───────────────────────────────────

export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslToHex(hsl: string): string {
  const parts = hsl.replace(/%/g, "").split(" ").map(Number);
  const [h, s, l] = [parts[0] / 360, parts[1] / 100, parts[2] / 100];
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return `#${[r, g, b].map(v => Math.round(v * 255).toString(16).padStart(2, "0")).join("")}`;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const SiteSettingsContext = createContext<{
  settings: SiteSettings;
  loading: boolean;
  refresh: () => void;
}>({ settings: SITE_DEFAULTS, loading: true, refresh: () => {} });

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(SITE_DEFAULTS);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await (supabase as any)
        .from("site_settings")
        .select("*")
        .maybeSingle();
      if (data) {
        const s: SiteSettings = { ...SITE_DEFAULTS, ...data };
        setSettings(s);
        applyPrimaryColor(s.primary_color_light, s.primary_color_dark);
      }
    } catch {
      // Table not yet created — use defaults silently
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();

    // Re-apply correct color when user switches dark/light theme
    const observer = new MutationObserver(() => {
      const root = document.documentElement;
      const light = root.dataset.primaryLight;
      const dark = root.dataset.primaryDark;
      if (light && dark) applyPrimaryColor(light, dark);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => observer.disconnect();
  }, [load]);

  return createElement(
    SiteSettingsContext.Provider,
    { value: { settings, loading, refresh: load } },
    children
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
