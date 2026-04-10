/**
 * Converte URL do Supabase Storage para URL otimizada com transformação de imagem.
 * Requer Supabase Pro. Em planos gratuitos, retorna a URL original como fallback.
 */
export function getOptimizedUrl(
  url: string | null | undefined,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: "cover" | "contain" | "fill";
  } = {}
): string | null {
  if (!url) return null;

  // Só transforma URLs do Supabase Storage
  if (!url.includes("/storage/v1/object/public/")) return url;

  const { width, height, quality = 75, resize = "cover" } = options;
  const transformed = url.replace(
    "/storage/v1/object/public/",
    "/storage/v1/render/image/public/"
  );

  const params = new URLSearchParams();
  if (width) params.set("width", width.toString());
  if (height) params.set("height", height.toString());
  params.set("quality", quality.toString());
  params.set("resize", resize);

  return `${transformed}?${params.toString()}`;
}
