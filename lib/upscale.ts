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
  /**
   * Run neural 2× (ESRGAN-style) in the browser before final Lanczos steps.
   * Better detail on tiny/pixel art; slower and downloads ~few MB model on first use.
   */
  useAiEnhance: boolean;
};

const defaultOptions: UpscaleOptions = {
  edge: 4096,
  format: "jpeg",
  jpegQuality: 0.92,
  useAiEnhance: false,
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

type PicaLike = {
  resize: (
    from: HTMLCanvasElement,
    to: HTMLCanvasElement,
    opts?: { quality?: 0 | 1 | 2 | 3 }
  ) => Promise<unknown>;
};

/** Downscale in one step; upscale in ~2× steps (Lanczos) for cleaner results than one huge jump. */
async function picaResizeStaged(
  pica: PicaLike,
  source: HTMLCanvasElement,
  targetEdge: number,
  onProgress?: (stage: string) => void
): Promise<HTMLCanvasElement> {
  const p = pica;

  let w = source.width;
  const h = source.height;
  if (w !== h) throw new Error("Expected square canvas.");
  if (w === targetEdge) return source;

  if (w > targetEdge) {
    onProgress?.(`Resampling ${w}→${targetEdge}px…`);
    const out = document.createElement("canvas");
    out.width = targetEdge;
    out.height = targetEdge;
    const octx = out.getContext("2d", { alpha: false });
    if (!octx) throw new Error("Could not get 2D context.");
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, targetEdge, targetEdge);
    await p.resize(source, out, { quality: 3 });
    return out;
  }

  let current: HTMLCanvasElement = source;
  while (w < targetEdge) {
    const next = Math.min(w * 2, targetEdge);
    onProgress?.(`Resampling ${w}→${next}px…`);
    const out = document.createElement("canvas");
    out.width = next;
    out.height = next;
    const octx = out.getContext("2d", { alpha: false });
    if (!octx) throw new Error("Could not get 2D context.");
    octx.fillStyle = "#ffffff";
    octx.fillRect(0, 0, next, next);
    await p.resize(current, out, { quality: 3 });
    current = out;
    w = next;
  }
  return current;
}

/** Optional: neural upscale (2×) on a small square canvas, then you finish with staged pica. */
async function runAiEnhance(
  source: HTMLCanvasElement,
  onProgress?: (stage: string) => void
): Promise<HTMLCanvasElement> {
  const maxIn = 512;
  const side = source.width;
  const PicaCtor = await loadPica();
  const pica = PicaCtor();

  let input = source;
  if (side > maxIn) {
    onProgress?.(`Preparing for AI (${side}→${maxIn}px)…`);
    const small = document.createElement("canvas");
    small.width = maxIn;
    small.height = maxIn;
    const sctx = small.getContext("2d", { alpha: false });
    if (!sctx) throw new Error("Could not get 2D context.");
    sctx.fillStyle = "#ffffff";
    sctx.fillRect(0, 0, maxIn, maxIn);
    await pica.resize(source, small, { quality: 3 });
    input = small;
  }

  onProgress?.("Loading AI model (first run downloads weights)…");
  const Upscaler = (await import("upscaler")).default;
  const defaultModel = (await import("@upscalerjs/default-model")).default;
  const upscaler = new Upscaler({ model: defaultModel });
  await upscaler.ready;

  onProgress?.("AI upscaling (2×)…");
  const result = await upscaler.upscale(input);
  await upscaler.dispose();

  const dataUrl =
    typeof result === "string"
      ? result
      : (() => {
          throw new Error("Unexpected upscale output");
        })();

  const img = new Image();
  img.crossOrigin = "anonymous";
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Could not decode AI result."));
    img.src = dataUrl;
  });

  const out = document.createElement("canvas");
  out.width = img.naturalWidth;
  out.height = img.naturalHeight;
  const ctx = out.getContext("2d", { alpha: false });
  if (!ctx) throw new Error("Could not get 2D context.");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(img, 0, 0);
  return out;
}

/**
 * Square crop → optional AI 2× → staged Lanczos to target → encode.
 * JPEG: opaque white backing to avoid black output.
 */
export async function upscaleToTarget(
  image: HTMLImageElement,
  onProgress?: (stage: string) => void,
  opts: Partial<UpscaleOptions> = {}
): Promise<Blob> {
  const { edge, format, jpegQuality, useAiEnhance } = {
    ...defaultOptions,
    ...opts,
  };
  const outEdge = clampEdge(edge);

  onProgress?.("Cropping square…");
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
  const sctx = sourceCanvas.getContext("2d", { alpha: false });
  if (!sctx) throw new Error("Could not get 2D context.");
  sctx.fillStyle = "#ffffff";
  sctx.fillRect(0, 0, side, side);
  sctx.drawImage(image, sx, sy, side, side, 0, 0, side, side);

  let working: HTMLCanvasElement = sourceCanvas;

  if (useAiEnhance) {
    try {
      working = await runAiEnhance(working, onProgress);
    } catch (e) {
      console.warn("AI enhance failed, using Lanczos only:", e);
      onProgress?.("AI failed — using Lanczos only…");
      working = sourceCanvas;
    }
  }

  const outCanvas = await picaResizeStaged(
    pica,
    working,
    outEdge,
    onProgress
  );

  onProgress?.(format === "jpeg" ? "Encoding JPEG…" : "Encoding PNG…");

  const mime = format === "jpeg" ? "image/jpeg" : "image/png";

  const encodeCanvas =
    format === "jpeg" ? flattenOpaqueWhite(outCanvas) : outCanvas;

  return new Promise((resolve, reject) => {
    encodeCanvas.toBlob(
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

function flattenOpaqueWhite(source: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext("2d", { alpha: false });
  if (!ctx) return source;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.drawImage(source, 0, 0);
  return c;
}

export function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const finish = () => {
        URL.revokeObjectURL(url);
        resolve(img);
      };
      const p = img.decode?.();
      if (p && typeof p.then === "function") {
        p.then(finish).catch(finish);
      } else {
        finish();
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not load image."));
    };
    img.src = url;
  });
}
