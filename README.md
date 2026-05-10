# VV Admin V2 — Cloudflare Online Showroom

Includes dashboard, dealer settings, homepage intro video upload, add/edit vehicles, portrait teaser upload, landscape walkaround upload, landscape inspect clip uploads, auto-save after uploads, publish toggle, and remove from stock.

Create `.env.local` in the root:

NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_PUBLISHABLE_KEY

CLOUDFLARE_ACCOUNT_ID=YOUR_CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_STREAM_TOKEN=YOUR_CLOUDFLARE_STREAM_API_TOKEN

Then:
npm install
npm run dev
