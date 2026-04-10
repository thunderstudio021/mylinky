import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import logoImg from "@/assets/logo.png";

function useIsDark() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains("dark"),
  );
  useEffect(() => {
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains("dark")),
    );
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });
    return () => obs.disconnect();
  }, []);
  return dark;
}

interface SiteLogoProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Resolves the correct logo based on the active theme:
 *   dark  → logo_dark_url  → logo_url (inverted)  → static asset (inverted)
 *   light → logo_url        → static asset
 */
export function SiteLogo({ className, style }: SiteLogoProps) {
  const { settings } = useSiteSettings();
  const isDark = useIsDark();

  if (isDark) {
    if (settings.logo_dark_url)
      return <img src={settings.logo_dark_url} alt="Logo" className={className} style={style} />;
    if (settings.logo_url)
      return (
        <img
          src={settings.logo_url}
          alt="Logo"
          className={className}
          style={{ filter: "invert(1)", ...style }}
        />
      );
    return (
      <img
        src={logoImg}
        alt="Logo"
        className={className}
        style={{ filter: "invert(1)", ...style }}
      />
    );
  }

  if (settings.logo_url)
    return <img src={settings.logo_url} alt="Logo" className={className} style={style} />;
  return <img src={logoImg} alt="Logo" className={className} style={style} />;
}
