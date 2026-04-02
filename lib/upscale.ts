import type Pica from "pica";

/** Output edge length (px). Was 1028; 2× that for heavier upscales. */
export const TARGET = 2056;

export async function loadPica(): Promise<typeof Pica> {
  const mod = await import("pica");
  return mod.default;
}

/**
 * Draw image onto a square canvas (cover crop to square), then Lanczos-resize to TARGET×TARGET.
 */
export async function upscaleToTarget(
  image: HTMLImageElement,
  onProgress?: (stage: string) => void
): Promise<Blob> {
  onProgress?.("Sharpening knives (Lanczos)…");
  const PicaCtor = await loadPica();
  const pica = PicaCtor();

  const w = image.naturalWidth;
  const h = image.naturalHeight;
  if (!w || !h) {
    throw new Error("Image has no dimensions.");
  }

  const side = Math.min(w, h);
  const sx = (w - side) / 2;
  const sy = (h - side) / 2;

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = side;
  sourceCanvas.height = side;
  const sctx = sourceCanvas.getContext("2d");
  if (!sctx) throw new Error("Could not get 2D context.");
  sctx.drawImage(image, sx, sy, side, side, 0, 0, side, side);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = TARGET;
  outCanvas.height = TARGET;

  await pica.resize(sourceCanvas, outCanvas, { quality: 3 });

  onProgress?.("Serving hot…");

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Could not encode PNG."));
      },
      "image/png",
      1
    );
  });
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    img.src = url;
  });
}
