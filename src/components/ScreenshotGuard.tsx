import { useEffect, useState } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Renders a full-screen black overlay with the site logo and
 * "Esse conteúdo é protegido" in the following scenarios:
 *
 *  • Desktop: PrintScreen key or Cmd+Shift+3/4/5 (macOS)
 *  • Any platform: screen-recording / tab-switch (visibilitychange → hidden)
 *  • iOS / Android long-press save is blocked via CSS (-webkit-touch-callout: none)
 *
 * Note: native iOS/Android power-button screenshots cannot be intercepted
 * by web browsers — that is an OS-level limitation of all web apps.
 */
export const ScreenshotGuard = () => {
  const { settings } = useSiteSettings();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const show = () => {
      setVisible(true);
      clearTimeout(timer);
      timer = setTimeout(() => setVisible(false), 3000);
    };

    // Desktop: PrintScreen key
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === "PrintScreen" ||
        // macOS screenshot shortcuts
        (e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key))
      ) {
        e.preventDefault();
        // Clear clipboard so the captured image is wiped
        navigator.clipboard.writeText("").catch(() => {});
        show();
      }
    };

    // Screen recording / tab switch to background
    const onVisibility = () => {
      if (document.visibilityState === "hidden") show();
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center gap-4 select-none"
      onContextMenu={(e) => e.preventDefault()}
    >
      {settings.logo_url ? (
        <img
          src={settings.logo_url}
          alt=""
          className="h-10 w-auto object-contain"
          style={{ filter: "brightness(0) invert(1)" }}
        />
      ) : (
        <span className="text-white font-bold text-2xl tracking-tight">
          mylinky<span className="text-accent">.</span>
        </span>
      )}
      <p className="text-white font-bold text-center text-base leading-snug">
        Esse conteúdo é<br />protegido
      </p>
    </div>
  );
};
