# Pizza Comrades Upsizer (`supersize`)

Upsize [Pizza Comrades](https://www.satflow.com/ordinals/pizza-comrades) ordinal art to **1028×1028** PNG in the browser. Uses [pica](https://github.com/nodeca/pica) (Lanczos-style resampling) for a cleaner upscale than raw canvas stretching.

**Cost:** Processing runs entirely in the visitor’s browser. No image API, no backend storage — deploy on [Vercel](https://vercel.com) free tier or any static host.

## Push to GitHub (repo name `supersize`)

Use the same Personal Access Token as your other projects. In PowerShell, from this repo’s root:

```powershell
cd C:\Users\PreSafu\Desktop\supersize   # or your path
$env:GITHUB_TOKEN = "ghp_YOUR_TOKEN_HERE"
.\scripts\push-to-github.ps1
```

The script creates `https://github.com/<you>/supersize` if it does not exist, then pushes the current branch (usually `main`). Set `$env:GITHUB_TOKEN` only for that session — never commit the token.

If you are starting from a zip with no `.git` folder: `git init`, `git add -A`, `git commit -m "Initial commit"`, `git branch -M main`, then run the script above.

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
