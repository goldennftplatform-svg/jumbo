# Pizza Comrades Upsizer (`supersize`)

Upsize [Pizza Comrades](https://www.satflow.com/ordinals/pizza-comrades) ordinal art to **1028×1028** PNG in the browser. Uses [pica](https://github.com/nodeca/pica) (Lanczos-style resampling) for a cleaner upscale than raw canvas stretching.

**Cost:** Processing runs entirely in the visitor’s browser. No image API, no backend storage — deploy on [Vercel](https://vercel.com) free tier or any static host.

## Push to GitHub (new repo `supersize`)

Use the same GitHub PAT you use elsewhere. In PowerShell from this folder:

```powershell
$env:GITHUB_TOKEN = "ghp_YOUR_TOKEN_HERE"
git init
git add -A
git commit -m "Initial commit"
git branch -M main
.\scripts\push-to-github.ps1
```

The script creates `https://github.com/<you>/supersize` if it does not exist, then pushes `main`. Do not commit the token; only set `$env:GITHUB_TOKEN` for that session.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Push this repo to GitHub.
2. Import the repo in Vercel (Framework Preset: Next.js).
3. Deploy — no env vars required.

## License

MIT
