#!/usr/bin/env node
/**
 * Download all Pizza Comrades (or any parent/child ordinals collection) images locally.
 *
 * Uses the public recursive endpoint (no API key):
 *   GET https://ordinals.com/r/children/{parentInscriptionId}/{page}
 * Page is 0, 1, 2, … until "more" is false.
 *
 * Default parent is the Pizza Comrades collection cover used on Satflow (children = art).
 *
 * Usage:
 *   node scripts/download-collection.mjs
 *   node scripts/download-collection.mjs --out ./downloads/pizza-comrades
 *   node scripts/download-collection.mjs --parent YOUR_PARENT_INSCRIPTION_ID --out ./out
 *   node scripts/download-collection.mjs --manifest-only
 *
 * Docs: https://docs.ordinals.com/inscriptions/recursion (children endpoint)
 */

import fs from "fs/promises";
import path from "path";

const DEFAULT_PARENT =
  "186496deeb8203fd76d74ded3fcf13d293462edc0bb2dbbd57a2825a86e8dff4i0";

const CONTENT_URLS = (id) => [
  `https://ordinals.com/content/${encodeURIComponent(id)}`,
  `https://ord.satflow.com/content/${encodeURIComponent(id)}`,
];

function parseArgs() {
  const a = process.argv.slice(2);
  const o = {
    out: path.join(process.cwd(), "pizza-comrades-images"),
    parent: DEFAULT_PARENT,
    delayMs: 120,
    manifestOnly: false,
  };
  for (let i = 0; i < a.length; i++) {
    if (a[i] === "--out") o.out = path.resolve(a[++i]);
    else if (a[i] === "--parent") o.parent = a[++i];
    else if (a[i] === "--delay") o.delayMs = Math.max(0, parseInt(a[++i], 10) || 0);
    else if (a[i] === "--manifest-only") o.manifestOnly = true;
    else if (a[i] === "-h" || a[i] === "--help") {
      console.log("See header comment in scripts/download-collection.mjs");
      process.exit(0);
    }
  }
  return o;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} ${url}`);
  return res.json();
}

async function fetchAllChildIds(parent) {
  const all = [];
  let page = 0;
  for (;;) {
    const url = `https://ordinals.com/r/children/${encodeURIComponent(parent)}/${page}`;
    const data = await fetchJson(url);
    const ids = data.ids || [];
    for (const id of ids) all.push(id);
    const more = data.more === true;
    console.error(`Page ${page}: +${ids.length} ids (total ${all.length}, more=${more})`);
    if (!more) break;
    page += 1;
    await sleep(80);
  }
  return [...new Set(all)];
}

function safeFilename(id) {
  return id.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function downloadContent(id, destDir) {
  let lastErr;
  for (const url of CONTENT_URLS(id)) {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        lastErr = new Error(`${res.status} ${url}`);
        continue;
      }
      const buf = Buffer.from(await res.arrayBuffer());
      const ct = res.headers.get("content-type") || "";
      const ext =
        ct.includes("png") ? "png" :
        ct.includes("jpeg") || ct.includes("jpg") ? "jpg" :
        ct.includes("gif") ? "gif" :
        ct.includes("webp") ? "webp" :
        ct.includes("svg") ? "svg" :
        "bin";
      const dest = path.join(destDir, `${safeFilename(id)}.${ext}`);
      await fs.writeFile(dest, buf);
      return dest;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr || new Error(`Failed to download ${id}`);
}

async function main() {
  const opts = parseArgs();
  await fs.mkdir(opts.out, { recursive: true });

  console.error(`Parent inscription: ${opts.parent}`);
  console.error(`Fetching child ids from ordinals.com …`);

  const ids = await fetchAllChildIds(opts.parent);
  const manifest = {
    parent: opts.parent,
    source: "https://ordinals.com/r/children (public recursive API)",
    count: ids.length,
    inscriptionIds: ids,
  };
  const manifestPath = path.join(opts.out, "manifest.json");
  await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2), "utf8");
  console.error(`Wrote ${manifestPath} (${ids.length} ids)`);

  if (opts.manifestOnly) {
    console.error("Done (--manifest-only).");
    return;
  }

  let ok = 0;
  let fail = 0;
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    try {
      await downloadContent(id, opts.out);
      ok++;
      if ((i + 1) % 100 === 0) console.error(`Downloaded ${i + 1}/${ids.length}…`);
    } catch (e) {
      fail++;
      console.error(`FAIL ${id}: ${e.message}`);
    }
    await sleep(opts.delayMs);
  }
  console.error(`Finished. OK=${ok} FAIL=${fail} → ${opts.out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
