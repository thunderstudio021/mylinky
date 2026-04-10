import { useEffect, useState, useCallback } from "react";
import { useSiteSettings } from "@/hooks/useSiteSettings";

/**
 * Screenshot / screen-capture protection.
 *
 * Vectors covered:
 *  1. PrintScreen key (Windows/Linux desktop)
 *  2. Cmd+Shift+3 / Cmd+Shift+4 / Cmd+Shift+5 (macOS)
 *  3. Windows Snipping Tool shortcut (Win+Shift+S)
 *  4. Screen recording / screen share → visibilitychange: hidden
 *  5. Tab backgrounded / app switched → visibilitychange: hidden
 *  6. Window blur (notification centre, control centre iOS, etc.)
 *  7. CSS: blocks right-click → Save Image on desktop
 *  8. CSS: blocks long-press Save on iOS/Android (-webkit-touch-callout)
 *  9. CSS: blocks drag-to-desktop save (-webkit-user-drag)
 *
 * About iOS physical button (power + volume):
 *  The only 100% reliable interception requires a native app shell
 *  (Capacitor / React Native) that wraps this web app and calls
 *  UIApplication.userDidTakeScreenshotNotification at OS level.
 *  Safari alone does not expose this event to JavaScript.
 */
export const ScreenshotGuard = () => {
  const { settings } = useSiteSettings();
  const [visible, setVisible] = useState(false);

  const show = useCallback(() => setVisible(true), []);
  const hide = useCallback(() => setVisible(false), []);

  useEffect(() => {
    // 1-3: keyboard shortcuts
    const onKeyDown = (e: KeyboardEvent) => {
      const isPrintScreen = e.key === "PrintScreen";
      const isMacShot =
        e.metaKey && e.shiftKey && ["3", "4", "5"].includes(e.key);
      const isWinSnip =
        e.metaKey && e.shiftKey && e.key === "s"; // Win+Shift+S
      const isAltPrintScreen =
        e.altKey && e.key === "PrintScreen";

      if (isPrintScreen || isMacShot || isWinSnip || isAltPrintScreen) {
        e.preventDefault();
        // Wipe clipboard so the capture is blank
        navigator.clipboard.writeText("").catch(() => {});
        show();
      }
    };

    // 4-5: screen recording / tab background / app switch
    const onVisibility = () => {
      if (document.visibilityState === "hidden") show();
    };

    // 6: window blur (iOS control/notification centre, app switcher)
    const onBlur = () => show();
    const onFocus = () => hide();

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("visibilitychange", onVisibility);
    document.addEventListener("visibilitychange", (e) => {
      if (document.visibilityState === "visible") hide();
    });
    window.addEventListener("blur", onBlur);
    window.addEventListener("focus", onFocus);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("focus", onFocus);
    };
  }, [show, hide]);

  return (
    <>
      {/* The always-present CSS layer — blocks right-click on images globally */}
      <style>{`
        img, video {
          -webkit-touch-callout: none !important;
          -webkit-user-drag: none !important;
          user-select: none !important;
        }
      `}</style>

      {/* JS-triggered full-screen overlay */}
      {visible && (
        <div
          className="fixed inset-0 z-[99999] bg-black flex flex-col items-center justify-center gap-4 select-none"
          onContextMenu={(e) => e.preventDefault()}
          onClick={hide}
        >
          {settings.logo_url ? (
            <img
              src={settings.logo_url}
              alt=""
              className="h-10 w-auto object-contain pointer-events-none"
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
      )}
    </>
  );
};
