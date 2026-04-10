import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ícone de verificado padrão do sistema.
 * Use este componente em todos os lugares onde o status verificado é exibido.
 */
export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <BadgeCheck className={cn("shrink-0 text-rose-500", className)} />
  );
}
