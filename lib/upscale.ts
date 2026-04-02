import type Pica from "pica";

/** Sensible max edge for in-browser canvas + encode (8192+ often breaks or yields unusable files). */
export const MAX_EDGE = 4096;

export const EDGE_OPTIONS = [2048, 3072, 4096] as const;
export type EdgeOption = (typeof EDGE_OPTIONS)[number];

export type ExportFormat = "jpeg" | "png";

export type UpscaleOptions = {
  edge: number;
  format: ExportFormat;
  /** JPEG quality 0–1; ignored for PNG */
  jpegQuality: number;
};

const defaultOptions: UpscaleOptions = {
  edge: 4096,
  format: "jpeg",
  jpegQuality: 0.92,
};

export async function loadPica(): Promise<typeof Pica> {
  const mod = await import("pica");
  return mod.default;
}

function clampEdge(n: number): number {
  const e = Math.floor(n);
  if (e < 256) return 256;
  if (e > MAX_EDGE) return MAX_EDGE;
  return e;
}

/**
 * Square crop + Lanczos resize, then encode (JPEG default = small, viewable files).
 */
export async function upscaleToTarget(
  image: HTMLImageElement,
  onProgress?: (stage: string) => void,
  opts: Partial<UpscaleOptions> = {}
): Promise<Blob> {
  const { edge, format, jpegQuality } = { ...defaultOptions, ...opts };
  const outEdge = clampEdge(edge);

  onProgress?.("Resampling…");
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
  outCanvas.width = outEdge;
  outCanvas.height = outEdge;

  await pica.resize(sourceCanvas, outCanvas, { quality: 3 });

  onProgress?.(format === "jpeg" ? "Encoding JPEG…" : "Encoding PNG…");

  const mime = format === "jpeg" ? "image/jpeg" : "image/png";

  return new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else
          reject(
            new Error(
              format === "png"
                ? "PNG encode failed (try JPEG — huge PNGs often fail in the browser)."
                : "Could not encode image."
            )
          );
      },
      mime,
      format === "jpeg" ? jpegQuality : undefined
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
