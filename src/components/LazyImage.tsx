import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { getOptimizedUrl } from "@/lib/imageUtils";

interface LazyImageProps {
  src: string | null | undefined;
  alt: string;
  className?: string;
  /** Largura alvo para otimização Supabase (px) */
  width?: number;
  /** Altura alvo para otimização Supabase (px) */
  height?: number;
  quality?: number;
  resize?: "cover" | "contain" | "fill";
  style?: React.CSSProperties;
  draggable?: boolean;
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
}: LazyImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [activeSrc, setActiveSrc] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const optimized = getOptimizedUrl(src, { width, height, quality, resize });
  const original = src ?? null;

  useEffect(() => {
    setLoaded(false);
    setActiveSrc(optimized);
  }, [src]);

  // Se a imagem já estava em cache o browser dispara onLoad antes do mount
  useEffect(() => {
    if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [activeSrc]);

  if (!activeSrc) return <div className={cn("bg-secondary animate-pulse", className)} style={style} />;

  return (
    <>
      {/* Skeleton enquanto carrega */}
      {!loaded && (
        <div className={cn("absolute inset-0 bg-secondary animate-pulse")} />
      )}
      <img
        ref={imgRef}
        src={activeSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        draggable={draggable}
        className={cn(
          "transition-opacity duration-300",
          loaded ? "opacity-100" : "opacity-0",
          className
        )}
        style={style}
        onLoad={() => setLoaded(true)}
        onError={() => {
          // Fallback para URL original se a transformação falhar (plano gratuito)
          if (activeSrc !== original && original) {
            setActiveSrc(original);
          } else {
            setLoaded(true);
          }
        }}
      />
    </>
  );
}
