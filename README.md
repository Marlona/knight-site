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

The API route `app/api/inquiry/route.ts` validates the payload, then hands it to
two **env-gated adapters** so the form runs with zero backend and "turns on"
with config only — no code change:

- **Storage** (`lib/server/store.ts`) — writes to a **Supabase** `inquiries`
  table when `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are set; otherwise
  logs and appends to `.data/inquiries.jsonl` (dev). Recommended store:
  Supabase gives a real, queryable database Andrea/a VA can browse, filter, and
  export in the Table Editor, generous free tier, RLS, and built-in automation
  hooks. Schema: `supabase/migrations/0001_inquiries.sql`.
- **Notifications** (`lib/server/notify.ts`) via **Resend** — a branded
  auto-response to the client (with a booking link when they opt to schedule)
  and a triage alert to the studio inbox whose subject is tagged
  `HOT / WARM / COLD` by `scoreLead()` (from the scheduling answer, budget, and
  stage). Skipped-and-logged until `RESEND_API_KEY` etc. are set.

To go live: copy `.env.example` → `.env.local`, fill in Supabase + Resend,
apply the migration. For fully decoupled automation, use a Supabase Database
Webhook → Edge Function instead of emailing from the route (noted in the
migration). Alternatives if you want something simpler to self-manage:
Airtable/Google Sheets (non-technical friendly) or an embedded form service
(Tally/Formspree) — trade control/automation for setup speed.

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
