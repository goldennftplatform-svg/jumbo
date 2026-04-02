"use client";

import { useCallback, useEffect, useState, type DragEvent } from "react";
import { TARGET, fileToImage, upscaleToTarget } from "@/lib/upscale";

const LS_BLOCKSCRIPT = "pc-blockscript";
/** Preview frame: fixed 512×512 so the UI stays compact; file export is still TARGET×TARGET. */
const PREVIEW = 512;

type Status = "idle" | "working" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [hint, setHint] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [blockscript, setBlockscript] = useState(false);

  useEffect(() => {
    try {
      setBlockscript(localStorage.getItem(LS_BLOCKSCRIPT) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const setBlockscriptPersist = useCallback((value: boolean) => {
    setBlockscript(value);
    try {
      localStorage.setItem(LS_BLOCKSCRIPT, value ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const resetOutput = useCallback(() => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
  }, [previewUrl]);

  const runUpscale = useCallback(
    async (img: HTMLImageElement) => {
      setStatus("working");
      setHint(null);
      resetOutput();
      try {
        const blob = await upscaleToTarget(img, setProgress);
        const url = URL.createObjectURL(blob);
        setPreviewUrl(url);
        setStatus("done");
      } catch (e) {
        setStatus("error");
        setHint(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setProgress("");
      }
    },
    [resetOutput]
  );

  const onFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      e.target.value = "";
      if (!f || !f.type.startsWith("image/")) {
        setHint("Use a PNG, JPG, WebP, or GIF.");
        setStatus("error");
        return;
      }
      try {
        const img = await fileToImage(f);
        await runUpscale(img);
      } catch (err) {
        setStatus("error");
        setHint(err instanceof Error ? err.message : "Could not load image.");
      }
    },
    [runUpscale]
  );

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      if (!f.type.startsWith("image/")) {
        setHint("Not an image file.");
        setStatus("error");
        return;
      }
      try {
        const img = await fileToImage(f);
        await runUpscale(img);
      } catch (err) {
        setStatus("error");
        setHint(err instanceof Error ? err.message : "Could not load image.");
      }
    },
    [runUpscale]
  );

  const download = useCallback(() => {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `pizza-comrades-${TARGET}x${TARGET}.png`;
    a.click();
  }, [previewUrl]);

  return (
    <div className={blockscript ? "blockscript-theme min-h-screen" : "min-h-screen"}>
      <main className="mx-auto flex min-h-screen max-w-2xl flex-col px-5 py-10 sm:px-8">
        <div className="mb-8 flex items-start justify-between gap-4 border-b border-zinc-800 pb-6">
          <div>
            <h1 className="font-display-pc text-2xl tracking-wide text-zinc-100 sm:text-3xl">
              Pizza Comrades Upsizer
            </h1>
            <p className="mt-1 text-xs text-zinc-500">
              Export {TARGET}×{TARGET} px · preview {PREVIEW}×{PREVIEW}
            </p>
          </div>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-zinc-500">
            <span>Blockscript</span>
            <button
              type="button"
              role="switch"
              aria-checked={blockscript}
              onClick={() => setBlockscriptPersist(!blockscript)}
              className={`relative h-7 w-12 rounded-full border transition ${
                blockscript
                  ? "border-comrade-red/60 bg-zinc-800"
                  : "border-zinc-700 bg-zinc-900"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-zinc-300 transition-all ${
                  blockscript ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        <section
          className={`rounded-lg border transition-colors ${
            dragOver ? "border-comrade-red/50 bg-zinc-900/50" : "border-zinc-800 bg-zinc-900/30"
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <label className="block cursor-pointer p-8">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFile}
              disabled={status === "working"}
            />
            {status === "working" ? (
              <p className="text-center text-sm text-zinc-400">{progress || "Processing…"}</p>
            ) : (
              <p className="text-center text-sm text-zinc-400">
                <span className="font-display-pc text-zinc-200">Drop image or click</span>
                <span className="mt-2 block text-xs">Square crop · Lanczos upscale</span>
              </p>
            )}
          </label>

          {hint && (
            <p className="border-t border-zinc-800 px-8 py-3 text-center text-sm text-amber-500/90" role="alert">
              {hint}
            </p>
          )}

          {previewUrl && status === "done" && (
            <div className="space-y-3 border-t border-zinc-800 p-6">
              <p className="text-center text-sm text-zinc-500">
                Preview ({PREVIEW}×{PREVIEW}) · file is {TARGET}×{TARGET}
              </p>
              <div className="mx-auto flex aspect-square w-full max-h-[512px] max-w-[512px] items-center justify-center bg-zinc-950 ring-1 ring-zinc-800">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                  width={PREVIEW}
                  height={PREVIEW}
                />
              </div>
              <div className="flex justify-center pt-2">
                <button
                  type="button"
                  onClick={download}
                  className="font-display-pc rounded-lg bg-comrade-red px-8 py-2.5 text-sm tracking-wide text-white transition hover:bg-red-700"
                >
                  Download PNG
                </button>
              </div>
            </div>
          )}
        </section>

        <p className="mt-4 text-center text-xs text-zinc-600">
          <a
            href="https://www.satflow.com/ordinals/pizza-comrades"
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-700 underline-offset-2 hover:text-zinc-400"
          >
            Satflow · Pizza Comrades
          </a>
        </p>

        <footer className="mt-auto pt-16 text-center text-[10px] text-zinc-600">
          Not affiliated with Pizza Comrades or Satflow. MIT.
        </footer>
      </main>
    </div>
  );
}
