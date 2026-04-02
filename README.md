# Pizza Comrades Upsizer

**Repo:** [github.com/goldennftplatform-svg/jumbo](https://github.com/goldennftplatform-svg/jumbo)

Upsize [Pizza Comrades](https://www.satflow.com/ordinals/pizza-comrades) ordinal art to **1028×1028** PNG in the browser. Uses [pica](https://github.com/nodeca/pica) (Lanczos-style resampling) for a cleaner upscale than raw canvas stretching.

**Cost:** Processing runs entirely in the visitor’s browser. No image API, no backend storage — deploy on [Vercel](https://vercel.com) free tier or any static host.

Local clone: `git clone https://github.com/goldennftplatform-svg/jumbo.git`

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy (Vercel)

1. Import [goldennftplatform-svg/jumbo](https://github.com/goldennftplatform-svg/jumbo) in Vercel (Framework Preset: Next.js).
2. Deploy — no env vars required.

## License

MIT
