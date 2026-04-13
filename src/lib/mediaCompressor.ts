/**
 * Client-side image compressor via Canvas API.
 * Videos are uploaded directly with XHR progress tracking in CreatePostModal.
 */

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
      const scale   = w > maxWidth ? maxWidth / w : 1;
      const canvasW = Math.round(w * scale);
      const canvasH = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width  = canvasW;
      canvas.height = canvasH;
      canvas.getContext("2d")!.drawImage(img, 0, 0, canvasW, canvasH);

      canvas.toBlob(
        (blob) => {
          if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
          resolve(new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), {
            type: "image/jpeg",
            lastModified: Date.now(),
          }));
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("Image load failed")); };
    img.src = url;
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024)           return `${bytes} B`;
  if (bytes < 1024 * 1024)   return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
