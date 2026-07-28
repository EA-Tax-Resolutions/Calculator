# Deployment

This application is a standalone Next.js site with no server-side data dependencies (no database, no
API keys, no environment secrets required). It can be deployed anywhere that runs Next.js, but Vercel
is the primary target.

## Local installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Opens at http://localhost:3000.

> **Windows note:** if your project folder path contains a special shell character (like `&`),
> `npm run <script>` may fail with a "not recognized as an internal or external command" error due to
> a Windows `npm.cmd` batch-file quoting issue — not a problem with this codebase. Workaround: invoke
> the underlying binary directly, e.g. `node ./node_modules/next/dist/bin/next dev`.

## Testing

```bash
npm test            # unit + integration tests (Vitest)
npm run test:e2e    # end-to-end tests (Playwright; builds and starts its own server on port 3100)
npm run typecheck   # TypeScript strict-mode check
npm run lint        # ESLint
```

## Production build

```bash
npm run build
npm run start        # serves the production build, default port 3000
```

## Deploying to Vercel

1. Push this repository to GitHub (or GitLab/Bitbucket).
2. In the Vercel dashboard, "Add New Project" and import the repository. Vercel auto-detects the
   Next.js framework from `vercel.json`/`package.json` — no configuration changes are needed.
3. No environment variables are required for the default build. If you want to enable anonymous
   analytics (disabled by default), set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` in the Vercel project's
   environment variables — but note the analytics hook (`src/lib/analytics.ts`) is a no-op stub as
   shipped; wire it to an actual privacy-respecting provider before relying on it.
4. Deploy. Vercel will run `npm install` and `npm run build` automatically.

## Custom domain: calculator.eataxresolutions.com

1. In the Vercel project settings, go to "Domains" and add `calculator.eataxresolutions.com`.
2. Vercel will show a DNS record to add (typically a `CNAME` pointing to `cname.vercel-dns.com`, or an
   `A` record if using an apex domain — for a subdomain, `CNAME` is standard).
3. In whatever DNS provider hosts `eataxresolutions.com` (check the domain's registrar or the
   Squarespace domain panel if the domain is managed there), add the `CNAME` record for the
   `calculator` subdomain as instructed by Vercel.
4. Wait for DNS propagation (usually minutes to a few hours) and Vercel will automatically issue an
   SSL certificate once the domain resolves correctly.
5. Update `metadataBase`/canonical URLs in `src/app/layout.tsx` and the `BASE_URL` constant in
   `src/app/sitemap.ts` if the final production domain differs from
   `https://calculator.eataxresolutions.com`.

## Linking from Squarespace (no Squarespace changes required to update the calculator)

The calculator is entirely independent of Squarespace. To link to it from the main site:

1. In the Squarespace site editor, add a navigation link or button pointing to
   `https://calculator.eataxresolutions.com`.
2. That's it — updating the calculator (pushing new commits, which auto-deploy via Vercel) never
   requires touching Squarespace again, since Squarespace only holds a link to the external URL.

## Netlify (optional alternative)

1. Connect the repository in the Netlify dashboard.
2. Build command: `npm run build`. Publish directory: `.next` (Netlify's Next.js runtime plugin
   handles the rest automatically — install the "Next.js Runtime" plugin if not auto-detected).
3. No environment variables required by default.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `NEXT_PUBLIC_ANALYTICS_ENABLED` | No | Set to `true` to enable the (stub, no-op-by-default) anonymous analytics hooks. |

## Production verification checklist

- [ ] `npm run build` completes with zero errors.
- [ ] Homepage, `/methodology`, `/privacy`, `/terms` all load without console errors.
- [ ] The IRM worked example (tax $5,000, due 2022-04-15, filed 2022-07-13, payments $2,000 on
      2022-06-01 and $3,000 on 2022-07-13) produces failure-to-file $685.00 and failure-to-pay $65.00.
- [ ] `robots.txt` and `sitemap.xml` resolve correctly at the production domain.
- [ ] The Calendly link opens in a new tab.
- [ ] Mobile viewport shows no horizontal overflow.
- [ ] Print produces a clean, disclaimer-inclusive printout (the `.no-print` class hides action
      buttons in the print stylesheet).
