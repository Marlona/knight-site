-- Knight & Ember inquiries.
-- Apply with the Supabase CLI (`supabase db push`) or paste into the SQL editor.

create table if not exists public.inquiries (
  id                    uuid primary key default gen_random_uuid(),
  created_at            timestamptz not null default now(),
  name                  text not null,
  email                 text not null,
  phone                 text,
  services              text[] not null default '{}',
  audience              text[] not null default '{}',
  stage                 text,
  budget                text,
  timeline              text,
  schedule_consultation text,
  lead_tier             text,               -- hot | warm | cold
  status                text not null default 'new',  -- new | contacted | won | archived
  payload               jsonb not null      -- full submission
);

create index if not exists inquiries_created_at_idx on public.inquiries (created_at desc);
create index if not exists inquiries_lead_tier_idx on public.inquiries (lead_tier);

-- RLS on. The server writes with the service-role key (bypasses RLS); no
-- anon/public access to rows. If you later add a public anon insert path,
-- add an explicit insert-only policy here.
alter table public.inquiries enable row level security;

-- OPTIONAL — fully decoupled automation instead of emailing from the API route:
-- create a Database Webhook (Database → Webhooks) on INSERT that POSTs each new
-- row to a Supabase Edge Function, which sends the Resend emails / routes leads.
-- This lets you change automations without redeploying the site.
