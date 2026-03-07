import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, ZoomIn, ZoomOut, Move } from "lucide-react";

interface ImageCropModalProps {
  open: boolean;
  imageUrl: string;
  aspectRatio: number; // width/height e.g. 1 for avatar, 16/5 for cover
  shape?: "circle" | "rect";
  onConfirm: (blob: Blob) => void;
  onClose: () => void;
}

const ImageCropModal = ({ open, imageUrl, aspectRatio, shape = "rect", onConfirm, onClose }: ImageCropModalProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imgLoaded, setImgLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load image
  useEffect(() => {
    if (!open || !imageUrl) return;
    setScale(1);
    setOffset({ x: 0, y: 0 });
    setImgLoaded(false);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      setImgLoaded(true);
    };
    img.src = imageUrl;
  }, [open, imageUrl]);

  // Crop area dimensions
  const getCropArea = useCallback(() => {
    const container = containerRef.current;
    if (!container) return { x: 0, y: 0, w: 300, h: 300 };
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const padding = 24;
    const maxW = cw - padding * 2;
    const maxH = ch - padding * 2;

    let w: number, h: number;
    if (maxW / maxH > aspectRatio) {
      h = maxH;
      w = h * aspectRatio;
    } else {
      w = maxW;
      h = w / aspectRatio;
    }

    return { x: (cw - w) / 2, y: (ch - h) / 2, w, h };
  }, [aspectRatio]);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(true);
    const point = "touches" in e ? e.touches[0] : e;
    setDragStart({ x: point.clientX - offset.x, y: point.clientY - offset.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!dragging) return;
    const point = "touches" in e ? e.touches[0] : e;
    setOffset({
      x: point.clientX - dragStart.x,
      y: point.clientY - dragStart.y,
    });
  }, [dragging, dragStart]);

  const handleMouseUp = () => setDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setScale(prev => Math.max(0.5, Math.min(3, prev - e.deltaY * 0.002)));
  };

  const handleConfirm = async () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;

    setSaving(true);

    const crop = getCropArea();
    const container = containerRef.current!;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Image display size (must cover crop area)
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const cropAspect = crop.w / crop.h;
    let dispW: number, dispH: number;
    if (imgAspect > cropAspect) {
      dispH = crop.h;
      dispW = dispH * imgAspect;
    } else {
      dispW = crop.w;
      dispH = dispW / imgAspect;
    }
    dispW *= scale;
    dispH *= scale;

    // Image position relative to container (centered on crop area)
    const cropCenterX = crop.x + crop.w / 2;
    const cropCenterY = crop.y + crop.h / 2;
    const imgX = cropCenterX - dispW / 2 + offset.x;
    const imgY = cropCenterY - dispH / 2 + offset.y;

    // Map crop area to image natural coordinates
    const scaleX = img.naturalWidth / dispW;
    const scaleY = img.naturalHeight / dispH;

    const sx = (crop.x - imgX) * scaleX;
    const sy = (crop.y - imgY) * scaleY;
    const sw = crop.w * scaleX;
    const sh = crop.h * scaleY;

    // Output size — high resolution
    const outW = shape === "circle" ? 800 : Math.min(1920, Math.round(sw));
    const outH = shape === "circle" ? 800 : Math.round(outW / aspectRatio);

    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d")!;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";

    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(outW / 2, outH / 2, outW / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
    }

    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);

    canvas.toBlob((blob) => {
      if (blob) onConfirm(blob);
      setSaving(false);
    }, "image/jpeg", 0.95);
  };

  // Render image in the viewport
  const getImageStyle = (): React.CSSProperties => {
    const img = imgRef.current;
    const container = containerRef.current;
    if (!img || !container) return {};

    const crop = getCropArea();
    const imgAspect = img.naturalWidth / img.naturalHeight;
    const cropAspect = crop.w / crop.h;

    let dispW: number, dispH: number;
    if (imgAspect > cropAspect) {
      dispH = crop.h;
      dispW = dispH * imgAspect;
    } else {
      dispW = crop.w;
      dispH = dispW / imgAspect;
    }

    const cropCenterX = crop.x + crop.w / 2;
    const cropCenterY = crop.y + crop.h / 2;

    return {
      width: dispW * scale,
      height: dispH * scale,
      left: cropCenterX + offset.x,
      top: cropCenterY + offset.y,
      transform: "translate(-50%, -50%)",
      position: "absolute",
    };
  };

  const cropArea = imgLoaded ? getCropArea() : { x: 0, y: 0, w: 0, h: 0 };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex flex-col bg-background"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Move className="w-3.5 h-3.5" />
              <span>Arraste para posicionar</span>
            </div>
            <button
              onClick={handleConfirm}
              disabled={saving}
              className="px-4 py-1.5 text-sm font-medium bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Confirmar"}
            </button>
          </div>

          {/* Crop viewport */}
          <div
            ref={containerRef}
            className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          >
            {/* Image */}
            {imgLoaded && imgRef.current && (
              <img
                src={imageUrl}
                alt=""
                className="absolute pointer-events-none"
                style={getImageStyle()}
                draggable={false}
              />
            )}

            {/* Dark overlay with cutout */}
            {imgLoaded && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 10 }}>
                <defs>
                  <mask id="crop-mask">
                    <rect width="100%" height="100%" fill="white" />
                    {shape === "circle" ? (
                      <circle
                        cx={cropArea.x + cropArea.w / 2}
                        cy={cropArea.y + cropArea.h / 2}
                        r={cropArea.w / 2}
                        fill="black"
                      />
                    ) : (
                      <rect
                        x={cropArea.x}
                        y={cropArea.y}
                        width={cropArea.w}
                        height={cropArea.h}
                        rx={8}
                        fill="black"
                      />
                    )}
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="hsl(0 0% 0% / 0.6)" mask="url(#crop-mask)" />
                {shape === "circle" ? (
                  <circle
                    cx={cropArea.x + cropArea.w / 2}
                    cy={cropArea.y + cropArea.h / 2}
                    r={cropArea.w / 2}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                ) : (
                  <rect
                    x={cropArea.x}
                    y={cropArea.y}
                    width={cropArea.w}
                    height={cropArea.h}
                    rx={8}
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    opacity="0.5"
                  />
                )}
              </svg>
            )}
          </div>

          {/* Zoom controls */}
          <div className="flex items-center justify-center gap-4 px-4 py-3 border-t border-border shrink-0">
            <button
              onClick={() => setScale(prev => Math.max(0.5, prev - 0.1))}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            <div className="w-32 h-1 bg-secondary rounded-full relative">
              <div
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground"
                style={{ left: `${((scale - 0.5) / 2.5) * 100}%` }}
              />
            </div>
            <button
              onClick={() => setScale(prev => Math.min(3, prev + 0.1))}
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <ZoomIn className="w-5 h-5" />
            </button>
          </div>

          <canvas ref={canvasRef} className="hidden" />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ImageCropModal;
