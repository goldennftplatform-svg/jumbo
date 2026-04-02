"use client";

import { useCallback, useState, type DragEvent } from "react";
import { TARGET, fileToImage, upscaleToTarget } from "@/lib/upscale";

type Status = "idle" | "working" | "done" | "error";

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [hint, setHint] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);

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
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-4 py-10 sm:px-6">
      <header className="mb-10 text-center">
        <p className="font-display text-4xl tracking-[0.2em] text-comrade-red sm:text-5xl">
          PIZZA COMRADES
        </p>
        <h1 className="mt-2 font-display text-2xl text-comrade-cheese/90 sm:text-3xl">
          UPSIZER
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-comrade-crust/90">
          Square-crop + Lanczos upscale to{" "}
          <span className="text-comrade-cheese">{TARGET}×{TARGET}</span> px — better
          pixels for memes, prints, and propaganda. Runs entirely in your browser;
          nothing is uploaded to a server.
        </p>
        <a
          href="https://www.satflow.com/ordinals/pizza-comrades"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm text-comrade-red underline decoration-comrade-red/50 underline-offset-4 hover:text-comrade-cheese"
        >
          View collection on Satflow →
        </a>
      </header>

      <section
        className={`relative rounded-2xl border bg-black/40 p-8 shadow-pizza backdrop-blur-sm transition-colors ${
          dragOver
            ? "border-comrade-red border-solid"
            : "border-comrade-red/30"
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
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          <label className="group cursor-pointer">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onFile}
              disabled={status === "working"}
            />
            <span className="inline-flex items-center justify-center rounded-xl border-2 border-dashed border-comrade-crust/50 bg-comrade-red/10 px-8 py-6 text-center text-sm transition group-hover:border-comrade-red group-hover:bg-comrade-red/20">
              {status === "working" ? (
                <span className="text-comrade-cheese">{progress || "Working…"}</span>
              ) : (
                <>
                  <span className="block font-display text-xl text-comrade-cheese">
                    DROP OR CLICK
                  </span>
                  <span className="mt-1 block text-xs text-comrade-crust/80">
                    Your ordinal screenshot or saved asset
                  </span>
                </>
              )}
            </span>
          </label>
        </div>

        {hint && (
          <p className="mt-4 text-center text-sm text-amber-400/90" role="alert">
            {hint}
          </p>
        )}

        {previewUrl && status === "done" && (
          <div className="mt-8 space-y-4">
            <p className="text-center text-xs uppercase tracking-widest text-comrade-crust">
              Output · {TARGET}×{TARGET} PNG
            </p>
            <div className="overflow-hidden rounded-lg border border-comrade-crust/20 bg-black/60 p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt={`Upscaled preview ${TARGET} by ${TARGET}`}
                className="mx-auto max-h-[min(60vh,512px)] w-auto object-contain"
              />
            </div>
            <div className="flex justify-center gap-4">
              <button
                type="button"
                onClick={download}
                className="rounded-lg bg-comrade-red px-6 py-3 font-display text-lg tracking-wider text-white shadow-lg transition hover:bg-red-700"
              >
                DOWNLOAD PNG
              </button>
            </div>
          </div>
        )}
      </section>

      <section className="mt-12 rounded-xl border border-white/5 bg-white/[0.03] p-6 text-xs leading-relaxed text-comrade-crust/85">
        <h2 className="mb-3 font-display text-lg text-comrade-cheese/90">
          How to get the source image
        </h2>
        <ul className="list-inside list-disc space-y-2">
          <li>
            Save the image from your wallet, explorer, or{" "}
            <a
              className="text-comrade-red underline underline-offset-2"
              href="https://www.satflow.com/ordinals/pizza-comrades"
              target="_blank"
              rel="noopener noreferrer"
            >
              Satflow
            </a>{" "}
            listing page (right-click → save).
          </li>
          <li>
            Direct image URLs often block cross-origin fetch in the browser — uploading
            the file avoids that.
          </li>
          <li>
            On-chain renditions are often small; this tool resamples to{" "}
            {TARGET}×{TARGET} for sharper sharing and editing — not new detail from
            thin air, but a clean, large canvas.
          </li>
        </ul>
      </section>

      <footer className="mt-auto pt-16 text-center text-[10px] text-comrade-crust/50">
        Not affiliated with Pizza Comrades or Satflow. MIT — deploy free on{" "}
        <a
          className="underline"
          href="https://vercel.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          Vercel
        </a>
        .
      </footer>
    </main>
  );
}
