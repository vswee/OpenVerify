create extension if not exists pgcrypto;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique,
  account_id uuid references public.accounts(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null check (role in ('super_admin', 'admin', 'reviewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.deployments (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references public.accounts(id) on delete cascade,
  name text not null,
  description text not null default '',
  public_key text not null unique,
  secret_key_hash text not null,
  webhook_url text not null,
  webhook_secret text not null,
  success_redirect_url text not null,
  pending_redirect_url text not null,
  failure_redirect_url text not null,
  allowed_origins jsonb not null default '[]'::jsonb,
  branding jsonb not null default '{}'::jsonb,
  status text not null default 'active' check (status in ('active', 'paused', 'archived')),
  test_mode boolean not null default true,
  requester_name text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification_sessions (
  id text primary key,
  deployment_id uuid references public.deployments(id) on delete cascade,
  account_id uuid references public.accounts(id) on delete cascade,
  external_reference text not null,
  status text not null check (
    status in (
      'created',
      'started',
      'consented',
      'id_uploaded',
      'selfie_uploaded',
      'processing',
      'verified',
      'needs_review',
      'rejected',
      'resubmission_requested',
      'expired',
      'cancelled',
      'error'
    )
  ),
  subject_name text not null,
  subject_email text not null,
  subject_phone text not null default '',
  purpose text not null default 'onboarding',
  requester_name text not null default '',
  consented_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  expires_at timestamptz not null,
  ip_address text,
  user_agent text,
  geo_result jsonb,
  score numeric not null default 0,
  score_breakdown jsonb not null default '{}'::jsonb,
  decision_reason text not null default '',
  risk_flags jsonb not null default '[]'::jsonb,
  verification_token_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.verification_assets (
  id uuid primary key default gen_random_uuid(),
  verification_session_id text not null references public.verification_sessions(id) on delete cascade,
  asset_type text not null check (asset_type in ('id_front', 'selfie', 'id_portrait_crop', 'processed_debug')),
  r2_bucket text not null,
  r2_key text not null,
  mime_type text,
  size_bytes bigint,
  checksum text,
  source text not null default 'upload',
  created_at timestamptz not null default now()
);

create table if not exists public.verification_extracted_data (
  id uuid primary key default gen_random_uuid(),
  verification_session_id text not null references public.verification_sessions(id) on delete cascade,
  card_version text,
  full_name text,
  id_number text,
  date_of_birth text,
  address_text text,
  ocr_confidence numeric,
  layout_confidence numeric,
  raw_ocr jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.electoral_register_matches (
  id uuid primary key default gen_random_uuid(),
  verification_session_id text not null references public.verification_sessions(id) on delete cascade,
  matched boolean not null default false,
  matched_record_id text,
  name_score numeric,
  address_score numeric,
  registered_address text,
  registered_lat numeric,
  registered_lon numeric,
  distance_from_ip_km numeric,
  raw_match jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.face_match_results (
  id uuid primary key default gen_random_uuid(),
  verification_session_id text not null references public.verification_sessions(id) on delete cascade,
  match_score numeric,
  provider text,
  raw_result jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.manual_reviews (
  id uuid primary key default gen_random_uuid(),
  verification_session_id text not null references public.verification_sessions(id) on delete cascade,
  reviewer_id uuid references public.profiles(id) on delete set null,
  previous_status text,
  new_status text not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  verification_session_id text not null references public.verification_sessions(id) on delete cascade,
  deployment_id uuid references public.deployments(id) on delete cascade,
  event_type text not null,
  payload jsonb not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'retrying', 'exhausted')),
  attempt_count integer not null default 0,
  last_attempt_at timestamptz,
  next_attempt_at timestamptz,
  last_response_status integer,
  last_response_body text,
  created_at timestamptz not null default now()
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id) on delete set null,
  account_id uuid references public.accounts(id) on delete cascade,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists deployments_account_id_idx on public.deployments(account_id);
create index if not exists deployments_public_key_idx on public.deployments(public_key);
create index if not exists profiles_account_id_idx on public.profiles(account_id);
create index if not exists verification_sessions_deployment_id_idx on public.verification_sessions(deployment_id);
create index if not exists verification_sessions_account_id_idx on public.verification_sessions(account_id);
create index if not exists verification_assets_session_id_idx on public.verification_assets(verification_session_id);
create index if not exists verification_extracted_data_session_id_idx on public.verification_extracted_data(verification_session_id);
create index if not exists electoral_register_matches_session_id_idx on public.electoral_register_matches(verification_session_id);
create index if not exists face_match_results_session_id_idx on public.face_match_results(verification_session_id);
create index if not exists manual_reviews_session_id_idx on public.manual_reviews(verification_session_id);
create index if not exists webhook_events_session_id_idx on public.webhook_events(verification_session_id);
create index if not exists webhook_events_deployment_id_idx on public.webhook_events(deployment_id);
create index if not exists audit_logs_account_id_idx on public.audit_logs(account_id);

drop trigger if exists touch_accounts_updated_at on public.accounts;
create trigger touch_accounts_updated_at
before update on public.accounts
for each row execute function public.touch_updated_at();

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_deployments_updated_at on public.deployments;
create trigger touch_deployments_updated_at
before update on public.deployments
for each row execute function public.touch_updated_at();

drop trigger if exists touch_verification_sessions_updated_at on public.verification_sessions;
create trigger touch_verification_sessions_updated_at
before update on public.verification_sessions
for each row execute function public.touch_updated_at();

alter table public.accounts enable row level security;
alter table public.profiles enable row level security;
alter table public.deployments enable row level security;
alter table public.verification_sessions enable row level security;
alter table public.verification_assets enable row level security;
alter table public.verification_extracted_data enable row level security;
alter table public.electoral_register_matches enable row level security;
alter table public.face_match_results enable row level security;
alter table public.manual_reviews enable row level security;
alter table public.webhook_events enable row level security;
alter table public.audit_logs enable row level security;
