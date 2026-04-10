import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/imageUtils";

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  /** Classes aplicadas ao wrapper (tamanho, border-radius, etc.) */
  className?: string;
  /** Largura alvo para otimização Supabase (px) */
  width?: number;
  /** Altura alvo para otimização Supabase (px) */
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
  style?: React.CSSProperties;
  draggable?: boolean;
  objectFit?: "cover" | "contain" | "fill";
}

export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  quality,
  resize,
  style,
  draggable,
  objectFit = "cover",
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimized = getOptimizedUrl(src, { width, height, quality, resize });
  const original = src ?? null;

  useEffect(() => {
    setLoaded(false);
    setActiveSrc(optimized);
  }, [src]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [activeSrc]);

  if (!activeSrc) {
    return <div className={cn("bg-secondary animate-pulse", className)} style={style} />;
  }

  return (
    // Wrapper relativo para que o skeleton absolute funcione em qualquer contexto
    <div className={cn("relative overflow-hidden", className)} style={style}>
      {!loaded && (
        <div className="absolute inset-0 bg-secondary animate-pulse" />
      )}
      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={draggable}
        className={cn(
          "w-full h-full transition-opacity duration-300",
          objectFit === "cover" ? "object-cover" : objectFit === "contain" ? "object-contain" : "object-fill",
          loaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (activeSrc !== original && original) {
            setActiveSrc(original);
          } else {
            setLoaded(true);
          }
        }}
      />
    </div>
  );
}
