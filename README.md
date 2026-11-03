# Knight & Ember — Andrea Knight

Cinematic scroll-driven portfolio for Andrea Knight, founder of **Knight &
Ember**, a hospitality-focused interior design studio: interior design,
property management, Airbnb co-hosting, and short-term rental strategy.

The page is an interactive luxury documentary in four chapters — *The
Visionary*, *The Designer*, *The Host*, *The Operator* — each driven by a
scroll-scrubbed cinematic sequence, in the oversized-editorial idiom of
Awwwards-winning sites.

## Stack

- **Next.js 15** (App Router) · React 19 · TypeScript · **Tailwind CSS v4**
- **GSAP + ScrollTrigger + SplitText** — scroll timelines, pinned chapters, letter reveals
- **Lenis** — smooth scrolling (driven by the GSAP ticker)
- **Motion** — pointer micro-interactions (hover cards, magnetic buttons)
- **Three.js / React Three Fiber** — the wireframe "blueprint room" that assembles in the Services section (dynamically imported, demand frameloop)

## Commands

```bash
npm run dev                  # dev server
npm run build && npm start   # production build + serve
npm run verify               # Playwright scroll-and-screenshot harness (against a running server)
npm run media:placeholders   # regenerate procedural placeholder sequences/stills
npm run media:frames         # extract sequences from mp4s in media/source/
```

## Inquiry form

A full intake form lives at **`/inquiry`** (linked from the final CTA and the
footer). All options, types, validation, conditional-section logic, and lead
scoring are in **`lib/inquiry.ts`**; the UI is in `components/inquiry/`. Two
sections reveal conditionally based on the services selected — a coaching /
Airbnb-setup block and a design / property-management block. It includes a
"schedule a consultation?" qualifier, a required acknowledgment, and a hidden
honeypot for spam.

### Where submissions live + automations

The API route `app/api/inquiry/route.ts` validates the payload, then emails it
(`lib/server/notify.ts`) and hands it to an **env-gated store**
(`lib/server/store.ts`). Everything is config-only — the form runs with zero
backend and "turns on" real delivery via env vars, no code change.

#### Email capture (current setup — via Resend)

Each inquiry emails **Andrea a formatted alert** with the full submission and a
`HOT/WARM/COLD` triage tag (`scoreLead()`), and sends the visitor a branded
confirmation. This is the primary way leads are captured — no database
required. One-time setup:

1. Create a [Resend](https://resend.com) account → **API key**.
2. Set these as Cloudflare Worker secrets (or `.env.local` in dev):
   - `RESEND_API_KEY`
   - `INQUIRY_FROM_EMAIL` — the sender, e.g. `Knight & Ember <hello@theandreaknight.com>`
   - `INQUIRY_OWNER_EMAIL` — where lead alerts go (Andrea's inbox)
   - `CONSULT_BOOKING_URL` — *optional*; adds a "Book your consultation" button
     to the confirmation when the visitor opts to schedule.

   ```bash
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put INQUIRY_FROM_EMAIL
   npx wrangler secret put INQUIRY_OWNER_EMAIL
   ```

**Resend domain nuance:** the **owner alert** works with minimal setup (it goes
to your own inbox). The **client auto-response** goes to arbitrary visitor
addresses, which Resend only allows once you **verify a sending domain**
(`theandreaknight.com`). Until then the auto-response is best-effort — if it's
rejected the submission still succeeds and the owner alert still sends.

**No lead is lost:** every submission is also logged as a single
`[inquiry:lead] {…full JSON…}` line, recoverable from **Cloudflare Workers
Logs** (observability is enabled in `wrangler.jsonc`) even if an email send
fails. The visitor always sees the thank-you.

> If you previously set `GOOGLE_SHEETS_WEBHOOK_URL` / `SHEETS_SHARED_SECRET` on
> the Worker, **delete those secrets** (`npx wrangler secret delete
> GOOGLE_SHEETS_WEBHOOK_URL`) so submissions don't attempt the retired Sheets
> path first.

#### Adding a database later (optional)

`store.ts` already supports env-gated stores if you want a searchable archive
beyond email + logs:

- **Cloudflare D1** — the natural free next step on this stack (a native binding,
  no external service, no idle-pause). Ask to wire the adapter when ready.
- **Supabase** — set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (schema:
  `supabase/migrations/0001_inquiries.sql`). Note: free Supabase projects pause
  after ~7 days idle.
- **Google Sheets** — still supported via `GOOGLE_SHEETS_WEBHOOK_URL` +
  `SHEETS_SHARED_SECRET` and `google-apps-script/Code.gs` if you prefer it.

## How the cinematic sequences work

Each chapter scrubs an image sequence on a `<canvas>` (Apple product-page
style — `<video>.currentTime` scrubbing is keyframe-quantized and janky).

- `public/sequences/<name>/manifest.json` describes ~96 WebP frames in two
  rungs (desktop 1536×864, mobile 768×432) plus a poster.
- `components/canvas/SequenceCanvas.tsx` streams frames in bisection order
  (ends → midpoints) via `createImageBitmap`, so a half-loaded sequence scrubs
  coarsely instead of stalling. Frames load off the critical path; the hero
  poster is the LCP image.
- `prefers-reduced-motion` gets posters and simple fades — no pins, no Lenis.

### Swapping in real footage

The committed sequences and stills are **AI-generated via Higgsfield**
(Seedance 2.0 clips with Andrea's photos as identity references; interior
stills via Nano Banana Pro). To swap in new footage:

```bash
# drop 16:9 mp4s named visionary.mp4 / designer.mp4 / host.mp4 / operator.mp4 into:
mkdir -p media/source
npm run media:frames    # regenerates public/sequences/* from the mp4s
```

No code changes needed — components only read the manifests. The same applies
to showcase/before-after stills: overwrite the files under
`public/images/projects/` and `public/images/before-after/` (paths are listed
in `lib/content.ts`).

If working from an environment whose egress can't reach the media host,
commit the download URLs to `media/request.json` instead — the
`media-sync` GitHub Actions workflow downloads them, runs the extraction,
and commits the derived assets back to the branch.

## Content TODOs (client to confirm)

All copy lives in **`lib/content.ts`** — every item below is marked
`TODO client-confirm` there:

- **Stats**: `94% Occupancy` and `8+ Years Experience` are placeholder values.
- **Projects**: the six showcase case studies (names, locations, results) are
  illustrative samples for layout — replace with real projects, photography,
  and results before launch.
- **Testimonial attributions** are placeholders.
- **Footer**: social links point to `#`; email/phone are placeholders.
- **CTA**: `Schedule a Consultation` points to a placeholder email address.

## Verification

`npm run verify` drives the production site headlessly at 1440×900 and
390×844, scrolls through 18 stops covering every section's enter/mid/exit
states, screenshots each to `verify-output/`, fails on any console error, and
asserts the hero canvas painted frames and the stats reached final values.

Last audit (production build with AI footage, Lighthouse 12): desktop
**100 perf / 96 a11y / 100 bp / 100 seo**, mobile **93 perf / 95 a11y /
100 bp / 100 seo**, LCP 0.6s desktop / 2.7s mobile, CLS 0.

## Deploy — Cloudflare Workers (OpenNext)

Configured for Cloudflare Workers via the OpenNext adapter
(`@opennextjs/cloudflare`), keeping Next's Node.js runtime so `/api/inquiry`
works unchanged. Config: `wrangler.jsonc` + `open-next.config.ts`.

**Dashboard (Git-connected, auto-deploys on every push):**
1. Cloudflare dashboard → **Workers & Pages → Create → Workers → Import a
   repository** → authorize GitHub → pick `Marlona/knight-site` (branch `main`).
2. Build settings:
   - Build command: `npx opennextjs-cloudflare build`
   - Deploy command: `npx wrangler deploy`
3. **Settings → Variables and Secrets:**
   - `GOOGLE_SHEETS_WEBHOOK_URL` (text) = the Apps Script `/exec` URL
   - `SHEETS_SHARED_SECRET` (secret) = the shared secret
4. Deploy → open the `*.workers.dev` URL. Add a custom domain under the Worker's
   **Settings → Domains & Routes**.

**CLI alternative:** `npx wrangler login` → `npm run deploy`; set the secret with
`npx wrangler secret put SHEETS_SHARED_SECRET`.

Local Workers preview: `npm run preview` (put the two env vars in `.dev.vars`).

## Mobile sequence memory and recovery

The previous sequence loader eagerly fetched and retained every decoded frame.
The production hero manifest has 193 mobile frames at 900 × 1600: 1,111,680,000
bytes (1.035 GiB) of RGBA pixel storage, before canvas/decoder/browser overhead.
The canvas DPR cap did not limit decoded image memory. A mobile WebKit production
sample requested all 193 frames and retained 115,200,000 bytes from only 20 allowed
frames. This confirms the excessive retention mechanism; a physical iPhone crash
log is still required to conclusively attribute the reported Safari termination.

`lib/sequences.ts` now shares a 48 MiB reservation budget and two in-flight jobs
across all visible sequences. It loads the target and its immediate neighbors,
closes evicted frames, keeps the nearest available image during scrubbing, and
holds reservations until canceled decodes settle. Offscreen/background sections
release their frames and canvas buffers. Posters are independent of manifest
loading. Reduced motion and unavailable decoding retain posters.

The 48 MiB cap covers decoded frames and pending-frame reservations, not total
browser memory, canvas buffers, compressed responses, or decoder scratch space.
Mobile WebKit regression testing recorded a 17,280,000-byte decoded-frame peak
(16.48 MiB), versus 115,200,000 bytes in the capped baseline sample. A simulated
four-section load peaked at 43.95 MiB, including pending reservations.

Run `npm test` for budget/cancellation/failure/HTTP fallback regressions. Run
`npm run cf-typegen`, `npm run lint`, `npm run build`, and
`npx tsc -p tsconfig.worker.json --noEmit` for app and Worker checks. Generated
Worker runtime types are intentionally excluded from the browser TypeScript
project to avoid overriding DOM types.

After building OpenNext, run `npx wrangler dev --port 8787`, then:

```sh
node scripts/verify.mjs http://localhost:8787
BROWSER=webkit node scripts/verify.mjs http://localhost:8787
node scripts/verify-memory.mjs http://localhost:8787
```

The installed OpenNext adapter currently rejects Next 15.5.21 under its support
policy. Local validation used `npx opennextjs-cloudflare build
--dangerouslyUseUnsupportedNextVersion`. This override is not added to the default
build scripts. Upgrade Next/OpenNext in a separately validated maintenance change;
do not treat the override as a lasting support solution.

### Maintenance page and release operations

`custom-worker.ts` wraps the generated OpenNext handler. HTML GET/HEAD requests
receive a standalone branded 503 page when the handler throws or returns 5xx.
API requests, RSC responses, assets and normal 404s retain their original behavior.
The page requires no JavaScript or external resources; it provides public email,
phone and retry links, `Retry-After: 300`, and `Cache-Control: no-store`.
`app/error.tsx` and `app/global-error.tsx` cover recoverable React render errors.
Failures after streaming headers have already been sent may not become HTTP 5xx;
those use client recovery when possible. Browser process crashes, DNS failures,
and a complete Cloudflare outage cannot be intercepted by this wrapper.

`MAINTENANCE_MODE` is `"false"` in Wrangler configuration. To preview it without
changing production, run:

```sh
npx wrangler dev --port 8788 --inspector-port 9230 --var MAINTENANCE_MODE:true
curl -I -H 'Accept: text/html' http://localhost:8788/
```

For planned maintenance, set the deployed Worker's runtime variable
`MAINTENANCE_MODE` to `"true"`; restore `"false"` when finished. Source deployments
restore the configuration value. Static assets run through the wrapper first,
then delegate to OpenNext, so HTML cannot bypass the maintenance switch.

Before deployment, record `wrangler deployments list` and retain the prior
version for `wrangler rollback <version-id>`. Validate the version preview before
promoting, then verify homepage, inquiry page, mobile animation, and normal 404s.
The production baseline inspected on 2026-11-03 was commit
`01ef70545e5d874c0ef82a94432a0eaabecffc28`, Cloudflare version `14436971-8de5-4d56-aa21-84320b6cf4d2`.
Cloudflare's dashboard reported its Git integration disconnected; direct Wrangler
deployment requires the account containing `theandreaknight.com`.

Physical-device acceptance remains: on the affected iPhone Safari, open the site,
scroll the entire page repeatedly in both directions, rotate, background/resume,
open Inquiry and return, and confirm no Safari reload/termination. Automated
WebKit checks do not substitute for that device test.
