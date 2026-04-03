# Pizza Comrades Upsizer

**Repo:** [github.com/goldennftplatform-svg/jumbo](https://github.com/goldennftplatform-svg/jumbo)

Upsize [Pizza Comrades](https://www.satflow.com/ordinals/pizza-comrades) ordinal art in the browser — **2048–4096** px edge, **JPEG (default)** or **PNG**. Preview **512×512**. Uses **staged Lanczos** (2× steps via [pica](https://github.com/nodeca/pica)) instead of one huge resize; optional **AI enhance** (UpscalerJS / TensorFlow.js) adds a neural 2× pass for small/pixel art. **JPEG** keeps files small; **PNG** is lossless but can be huge.

**Cost:** Processing runs entirely in the visitor’s browser. No image API, no backend storage — deploy on [Vercel](https://vercel.com) free tier or any static host.

Local clone: `git clone https://github.com/goldennftplatform-svg/jumbo.git`

## Download the whole Pizza Comrades collection (images to a folder)

No API key. Ordinals exposes **child inscriptions** for a **parent** inscription (the collection cover on Satflow). The script lists every child via `https://ordinals.com/r/children/{parent}/{page}`, then downloads each file from `ordinals.com/content/...` (Satflow CDN as fallback).

```bash
# Only build manifest.json with all inscription IDs (~2.2k)
npm run collection:manifest -- --out ./pizza-comrades-images

# Download every image (takes a while; be polite to public infra)
npm run collection:download -- --out ./pizza-comrades-images
```

Override parent if needed: `node scripts/download-collection.mjs --parent <inscription_id> --out ./out`

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Host it so anyone can use it (Vercel)

**Pushing to GitHub does not create a public URL by itself.** You need a host. Vercel’s free tier is enough.

1. Sign in at [vercel.com](https://vercel.com) with **GitHub** (same account that can access this repo).
2. **Add New Project** → **Import** [goldennftplatform-svg/jumbo](https://github.com/goldennftplatform-svg/jumbo).
3. If the org doesn’t show up, click **Adjust GitHub App Permissions** and grant Vercel access to **goldennftplatform-svg** (or only the `jumbo` repo).
4. Leave **Framework Preset: Next.js**, **Root Directory: `.`**, **Environment Variables: none** → **Deploy**.
5. When the build finishes, Vercel gives you a URL like `https://jumbo-xxx.vercel.app` — that’s the tool people open in a browser. You can add a custom domain under Project → **Settings** → **Domains**.

No API keys or paid services are required for this app.

## License

MIT
