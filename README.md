# TradeMint

A premium trading journal — log trades, review performance, and build discipline.
Built with Next.js 16 (App Router), TypeScript, Tailwind v4, shadcn/ui, Supabase, TanStack Table/Query, Recharts, and TradingView Lightweight Charts.

## Features

- **Auth** — email + Google, forgot/reset password, protected routes (Supabase SSR + middleware)
- **Dashboard** — KPIs, equity curve, P&L calendar heatmap, recent trades, top strategies, mistakes
- **Journal** — powerful TanStack table (sort/filter/search/columns/bulk actions), CSV import & export
- **Trade details** — price chart, screenshots, timeline, metrics, journal, AI-review placeholder
- **Analytics** — equity, drawdown, R-distribution, win/loss, weekday/hour/strategy/monthly breakdowns
- **Calendar, Strategies, Playbook, Notes (markdown), Tags, Reports (print-to-PDF), Settings**
- Command palette (⌘K), keyboard shortcuts (N / D / J), dark & light themes

## Local development

```bash
npm install
cp .env.example .env.local   # fill in your Supabase values
npm run dev
```

### Environment variables

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Publishable/anon key |
| `NEXT_PUBLIC_SITE_URL` | recommended | Public base URL for auth redirects (falls back to `VERCEL_URL` in prod) |

### Supabase setup

The database schema, RLS policies and storage buckets are managed via migrations
(already applied to the linked project). In the Supabase dashboard:

1. **Authentication → URL Configuration**: set the Site URL and add `<your-url>/**` to redirect URLs.
2. *(optional)* Enable the **Google** provider.
3. For quick local testing you can disable email confirmation under **Auth → Providers → Email**.

Once signed in, use **Load demo data** on the empty dashboard to seed sample trades.

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel (framework auto-detected as Next.js).
2. Add the environment variables above in **Project → Settings → Environment Variables**
   (all environments). `NEXT_PUBLIC_*` vars must be present at build time.
3. Set `NEXT_PUBLIC_SITE_URL` to your production URL, and add that URL (with `/**`)
   to Supabase's allowed redirect URLs.
4. Deploy. Build command `next build` and output are the Vercel defaults.

## Scripts

```bash
npm run dev     # start dev server
npm run build   # production build
npm run start   # run the production build
npm run lint    # eslint
```
