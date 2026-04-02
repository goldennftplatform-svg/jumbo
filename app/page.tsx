"use client";

import { useCallback, useEffect, useState, type DragEvent } from "react";
import { TARGET, fileToImage, upscaleToTarget } from "@/lib/upscale";

const LS_BLOCKSCRIPT = "pc-blockscript";

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
        setHint("Drop a PNG, JPG, WebP, or GIF.");
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
        setHint("That file isn’t an image — try PNG, JPG, or WebP.");
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
      <main className="relative mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-8 sm:px-6 sm:py-10">
        {/* Top bar: theme + font toggle */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-comrade-gold/90">
            <span className="inline-block h-2 w-2 rounded-full bg-comrade-red shadow-[0_0_12px_rgba(196,30,58,0.8)]" />
            Bitcoin ordinals · Pizza Comrades
          </div>
          <label className="flex cursor-pointer select-none items-center gap-3 self-end sm:self-auto">
            <span className="text-right text-[11px] leading-tight text-comrade-crust/90">
              <span className="block text-comrade-cheese/90">Blockscript</span>
              <span className="text-[10px] text-comrade-crust/70">
                local font if installed
              </span>
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={blockscript}
              onClick={() => setBlockscriptPersist(!blockscript)}
              className={`relative h-8 w-14 shrink-0 rounded-full border-2 transition ${
                blockscript
                  ? "border-comrade-gold bg-comrade-red/40 shadow-[0_0_16px_rgba(201,162,39,0.25)]"
                  : "border-comrade-crust/40 bg-black/50"
              }`}
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-comrade-cheese shadow transition-all ${
                  blockscript ? "left-7" : "left-0.5"
                }`}
              />
            </button>
          </label>
        </div>

        {/* Emblem + title */}
        <header className="mb-10 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            <div className="relative flex h-28 w-28 items-center justify-center rounded-full border-4 border-comrade-gold/80 bg-gradient-to-b from-comrade-sauce/90 to-comrade-dark shadow-[0_0_0_3px_rgba(18,7,9,0.9),0_12px_40px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-2 rounded-full border border-comrade-gold/30" />
              <span className="font-display-pc relative text-5xl leading-none text-comrade-cheese drop-shadow-md">
                🍕
              </span>
              <span className="absolute -right-1 -top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-comrade-gold bg-comrade-red text-sm font-bold text-white shadow-lg">
                ₿
              </span>
            </div>
          </div>

          <p className="font-display-pc text-4xl tracking-[0.12em] text-comrade-red drop-shadow-[0_2px_24px_rgba(196,30,58,0.45)] sm:text-5xl sm:tracking-[0.18em]">
            PIZZA COMRADES
          </p>
          <h1 className="font-display-pc mt-1 text-3xl tracking-[0.25em] text-comrade-gold sm:text-4xl">
            UPSIZER
          </h1>
          <p className="mx-auto mt-5 max-w-xl border-y border-comrade-red/20 py-3 text-sm leading-relaxed text-comrade-cheese/85">
            Square-crop + Lanczos upscale to{" "}
            <span className="font-mono text-comrade-gold">{TARGET}×{TARGET}</span> px — for
            memes, prints, and propaganda. Runs in your browser; nothing is uploaded.
          </p>
          <a
            href="https://www.satflow.com/ordinals/pizza-comrades"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-2 rounded-full border border-comrade-gold/40 bg-black/30 px-4 py-2 text-xs text-comrade-crust transition hover:border-comrade-gold hover:text-comrade-cheese"
          >
            <span className="text-comrade-red">◆</span> View collection on Satflow
          </a>
        </header>

        <section
          className={`relative overflow-hidden rounded-2xl border-4 border-double border-comrade-gold/50 bg-gradient-to-b from-black/70 to-comrade-dark/95 p-1 shadow-[0_0_60px_rgba(196,30,58,0.2),inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-sm transition-colors ${
            dragOver ? "border-comrade-gold ring-2 ring-comrade-red/60" : ""
          }`}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDragOver(false);
            }
          }}
          onDragOver={(e) => e.preventDefault()}
          onDrop={onDrop}
        >
          <div className="pointer-events-none absolute -right-8 -top-8 text-[120px] opacity-[0.06]">
            🍕
          </div>
          <div className="rounded-xl border border-comrade-red/20 bg-black/40 p-6 sm:p-8">
            <div className="flex flex-col items-center gap-6">
              <label className="group w-full max-w-md cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={onFile}
                  disabled={status === "working"}
                />
                <span
                  className={`flex min-h-[140px] flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
                    dragOver
                      ? "border-comrade-gold bg-comrade-red/25"
                      : "border-comrade-crust/45 bg-comrade-red/10 group-hover:border-comrade-red group-hover:bg-comrade-red/15"
                  }`}
                >
                  {status === "working" ? (
                    <span className="text-comrade-cheese">{progress || "Cooking…"}</span>
                  ) : (
                    <>
                      <span className="font-display-pc text-2xl text-comrade-cheese sm:text-3xl">
                        DROP OR CLICK
                      </span>
                      <span className="mt-2 text-xs text-comrade-crust/85">
                        Ordinal art, screenshot, or saved file from your machine
                      </span>
                    </>
                  )}
                </span>
              </label>
            </div>

            {hint && (
              <p className="mt-4 text-center text-sm text-amber-400/95" role="alert">
                {hint}
              </p>
            )}

            {previewUrl && status === "done" && (
              <div className="mt-8 space-y-4">
                <p className="text-center text-[10px] uppercase tracking-[0.4em] text-comrade-gold/80">
                  Output · {TARGET}×{TARGET} PNG
                </p>
                <div className="overflow-hidden rounded-lg border-2 border-comrade-gold/25 bg-black/70 p-2 shadow-inner">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`Upscaled preview ${TARGET} by ${TARGET}`}
                    className="mx-auto max-h-[min(60vh,512px)] w-auto object-contain"
                  />
                </div>
                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={download}
                    className="font-display-pc rounded-lg bg-gradient-to-b from-comrade-red to-comrade-sauce px-10 py-3.5 text-xl tracking-wider text-white shadow-[0_4px_24px_rgba(196,30,58,0.45)] transition hover:brightness-110"
                  >
                    DOWNLOAD PNG
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        <section className="mt-10 rounded-xl border border-comrade-gold/15 bg-black/35 p-6 text-xs leading-relaxed text-comrade-crust/90">
          <h2 className="font-display-pc mb-4 text-lg tracking-wide text-comrade-cheese">
            How to get the source image
          </h2>
          <ul className="list-inside list-disc space-y-2 marker:text-comrade-red">
            <li>
              Save from your wallet, explorer, or{" "}
              <a
                className="text-comrade-gold underline underline-offset-2 hover:text-comrade-cheese"
                href="https://www.satflow.com/ordinals/pizza-comrades"
                target="_blank"
                rel="noopener noreferrer"
              >
                Satflow
              </a>{" "}
              (right-click → save image).
            </li>
            <li>
              Pasting remote URLs often fails (CORS) — uploading the file is reliable.
            </li>
            <li>
              On-chain images are often small; this tool resamples to {TARGET}×{TARGET} for a
              clean large canvas (not magic new detail).
            </li>
          </ul>
        </section>

        <footer className="mt-auto pt-14 text-center text-[10px] text-comrade-crust/45">
          Not affiliated with Pizza Comrades or Satflow. MIT.
        </footer>
      </main>
    </div>
  );
}
