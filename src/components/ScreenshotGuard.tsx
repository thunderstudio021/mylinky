import { useEffect, useRef } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Screenshot protection.
 *
 * The overlay is ALWAYS in the DOM (display:none) and toggled via direct
 * DOM manipulation — zero React re-render delay, so iOS can capture it
 * before the framebuffer is flushed to the screenshot.
 *
 * Triggers:
 *   • window blur  ← iOS briefly blurs the webview when power+volume fires
 *   • visibilitychange hidden  ← screen recording / app switch
 *   • keydown PrintScreen / Cmd+Shift+3-5 / Win+Shift+S  ← desktop
 */
export const ScreenshotGuard = () => {
  const { settings } = useSiteSettings();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = overlayRef.current;
    if (!el) return;

    // Direct DOM toggle — no React state, no render cycle, instant
    const show = () => { el.style.display = "flex"; };
    const hide = () => { el.style.display = "none"; };

    // iOS / Android: blur fires when power+volume steals focus
    window.addEventListener("blur", show);
    window.addEventListener("focus", hide);

    // Screen recording, app switch, tab background
    const onVisibility = () => {
      document.visibilityState === "hidden" ? show() : hide();
    };
    document.addEventListener("visibilitychange", onVisibility);

    // Desktop keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      const isShot =
        e.key === "PrintScreen" ||
        e.key === "Snapshot" ||
        (e.altKey && e.key === "PrintScreen") ||
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key)) ||
        (e.metaKey && e.shiftKey && e.key.toLowerCase() === "s");

      if (isShot) {
        e.preventDefault();
        navigator.clipboard.writeText("").catch(() => {});
        show();
        setTimeout(hide, 3000);
      }
    };
    document.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("blur", show);
      window.removeEventListener("focus", hide);
      document.removeEventListener("visibilitychange", onVisibility);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const logoStyle: React.CSSProperties = {
    height: 40,
    width: "auto",
    objectFit: "contain",
    filter: "brightness(0) invert(1)",
    pointerEvents: "none",
  };

  return (
    <>
      {/* CSS: block long-press save (iOS) + drag save (desktop) on all media */}
      <style>{`
        img, video {
          -webkit-touch-callout: none !important;
          -webkit-user-drag: none !important;
          user-select: none !important;
          -webkit-user-select: none !important;
        }
      `}</style>

      {/* Overlay — in DOM from the start, toggled instantly via style.display */}
      <div
        ref={overlayRef}
        onContextMenu={(e) => e.preventDefault()}
        style={{
          display: "none",
          position: "fixed",
          inset: 0,
          zIndex: 999999,
          background: "black",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          userSelect: "none",
        }}
      >
        {settings.logo_dark_url ? (
          <img src={settings.logo_dark_url} alt="" style={{ ...logoStyle, filter: "none" }} />
        ) : settings.logo_url ? (
          <img src={settings.logo_url} alt="" style={logoStyle} />
        ) : (
          <span style={{ color: "white", fontWeight: 700, fontSize: 24, letterSpacing: "-0.5px" }}>
            mylinky<span style={{ color: "hsl(var(--accent))" }}>.</span>
          </span>
        )}
        <p style={{ color: "white", fontWeight: 700, textAlign: "center", fontSize: 15, lineHeight: 1.4, margin: 0 }}>
          Esse conteúdo é<br />protegido
        </p>
      </div>
    </>
  );
};
