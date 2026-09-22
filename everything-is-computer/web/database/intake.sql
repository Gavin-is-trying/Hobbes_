-- Run once in the Supabase SQL editor before enabling intake on Vercel.
-- Raw payloads stay here. Only separately reviewed publication_text may enter Git.
begin;

create table public.intake_submissions (
  id uuid primary key,
  owner_id uuid not null references auth.users(id) on delete restrict,
  kind text not null check (kind in ('client', 'process')),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 420000),
  created_at timestamptz not null default now(),
  publication_text text check (length(publication_text) between 1 and 50000),
  pr_url text check (pr_url ~ '^https://github[.]com/[^/]+/[^/]+/pull/[0-9]+$'),
  check (pr_url is null or publication_text is not null)
);

create index intake_submissions_owner_kind_created on public.intake_submissions (owner_id, kind, created_at desc, id desc);

-- No direct browser access, even with a valid Auth JWT. The API verifies the
-- allowlisted user and applies owner filters before using its server-only key.
alter table public.intake_submissions enable row level security;
revoke all on table public.intake_submissions from public, anon, authenticated;
grant select, insert, update on table public.intake_submissions to service_role;

commit;
