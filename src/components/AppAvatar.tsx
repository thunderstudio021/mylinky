import { cn } from "@/lib/utils";
import { LazyImage } from "./LazyImage";

interface AppAvatarProps {
  src?: string | null;
  name?: string | null;
  /** Classes de tamanho, ex: "w-10 h-10" */
  className?: string;
  /** Tamanho em px para otimização da imagem (padrão: 96) */
  sizePx?: number;
  textClassName?: string;
}

/**
 * Avatar padrão do sistema com lazy loading, skeleton e fallback de letra.
 * Substitui o padrão manual de avatar em todo o app.
 */
export function AppAvatar({ src, name, className, sizePx = 96, textClassName }: AppAvatarProps) {
  const initial = name ? name[0].toUpperCase() : "?";

  return (
    <div
      className={cn(
        "relative rounded-full bg-secondary flex items-center justify-center overflow-hidden shrink-0",
        className
      )}
    >
      {src ? (
        <LazyImage
          src={src}
          alt={name ?? ""}
          width={sizePx}
          height={sizePx}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className={cn("text-foreground font-semibold select-none", textClassName)}>
          {initial}
        </span>
      )}
    </div>
  );
}
