/**
 * Client-side media compressor.
 * - Images: Canvas API resize (max 1920px) + JPEG 0.82
 * - Videos: FFmpeg.wasm single-threaded (loaded from CDN on demand)
 */

// ─── Image ────────────────────────────────────────────────────────────────────

export async function compressImage(
  file: File,
  maxWidth = 1920,
  quality = 0.82
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = w > maxWidth ? maxWidth / w : 1;
      const canvasW = Math.round(w * scale);
      const canvasH = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvasW, canvasH);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
          const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          });
          resolve(compressed);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

// ─── Video ────────────────────────────────────────────────────────────────────

type ProgressCallback = (progress: number) => void;

let ffmpegInstance: any = null;

async function getFFmpeg(onProgress?: ProgressCallback) {
  if (ffmpegInstance) return ffmpegInstance;

  // Dynamic import keeps FFmpeg out of the initial bundle
  const { FFmpeg } = await import("@ffmpeg/ffmpeg");
  const { toBlobURL } = await import("@ffmpeg/util");

  const ff = new FFmpeg();

  if (onProgress) {
    ff.on("progress", ({ progress }: { progress: number }) => {
      onProgress(Math.min(Math.round(progress * 100), 99));
    });
  }

  // Load single-threaded core from CDN (no SharedArrayBuffer required)
  const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
  await ff.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
  });

  ffmpegInstance = ff;
  return ff;
}

export async function compressVideo(
  file: File,
  onProgress?: ProgressCallback
): Promise<File> {
  const { fetchFile } = await import("@ffmpeg/util");

  const ff = await getFFmpeg(onProgress);

  const inputName = `input_${Date.now()}.${file.name.split(".").pop() || "mp4"}`;
  const outputName = `output_${Date.now()}.mp4`;

  await ff.writeFile(inputName, await fetchFile(file));

  // CRF 28: good quality / smaller size. Scale to max 1280px wide, keep aspect ratio.
  // -preset fast: balance encode speed vs compression
  await ff.exec([
    "-i", inputName,
    "-vf", "scale='min(1280,iw)':-2",
    "-c:v", "libx264",
    "-crf", "28",
    "-preset", "fast",
    "-c:a", "aac",
    "-b:a", "128k",
    "-movflags", "+faststart",
    "-y",
    outputName,
  ]);

  const data = await ff.readFile(outputName);
  await ff.deleteFile(inputName);
  await ff.deleteFile(outputName);

  const blob = new Blob([data], { type: "video/mp4" });
  const compressed = new File([blob], file.name.replace(/\.[^.]+$/, ".mp4"), {
    type: "video/mp4",
    lastModified: Date.now(),
  });

  onProgress?.(100);
  return compressed;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
